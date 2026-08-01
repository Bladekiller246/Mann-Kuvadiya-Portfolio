/* ════════════════════════════════════════════════════════════════
   KVD-4400 · compatibility-mode proxy
   A Cloudflare Worker that fetches a page server-side, drops the
   headers that forbid framing, and rewrites its links so navigation
   stays inside the frame.

   Deploy: see README.md in this folder. Nothing here is imported by
   the site — the site only ever holds the deployed URL, in IE_WORKER
   (win98.js §6c2). With that constant empty the site never calls this
   and falls back to public CORS proxies.

   ── why this exists ─────────────────────────────────────────────
   X-Frame-Options and frame-ancestors are instructions to a browser
   about framing. A server fetching a page is not a browser and not a
   frame, so the headers never apply to it. Strip them on the way back
   out and the browser has nothing left to refuse.

   ── why it lives on its own origin ──────────────────────────────
   This must be deployed somewhere that is NOT the origin serving the
   portfolio. Everything it returns becomes same-origin with whatever
   serves it, and the frame runs with allow-same-origin. On its own
   *.workers.dev subdomain that means proxied pages are same-origin
   with the proxy — isolated, and unable to touch the portfolio. Move
   it to a path on the portfolio's own domain and every page it serves
   becomes first-party to the portfolio, free to read and rewrite it.
   That is strictly worse than not having a proxy at all.

   ── what this is not ────────────────────────────────────────────
   Tier 1: HTML documents and the links between them. Images, CSS and
   scripts are left to resolve against <base> and load from the real
   site, which keeps this at one request per page instead of one per
   asset. Static pages arrive whole; anything that runs as an
   application does not, because its own XHR is still cross-origin to
   a document no longer on its origin. Making those work means
   rewriting every subresource URL too, which multiplies requests by a
   factor of the page's asset count — measure the quota before
   reaching for it.

   ── the gate is a lock, not a wall ──────────────────────────────
   The embedder check reads Referer and Sec-Fetch-Site, both of which
   anyone can set by hand. It stops drive-by scanning and casual
   reuse; it does not stop a person who wants through. The things
   actually holding the line are the rate limiter, DENY_HOSTS, the
   refusal to carry credentials, and the fact that this is on a
   throwaway subdomain rather than a domain with your name on it.
   ════════════════════════════════════════════════════════════════ */

/* Origins allowed to embed this. Override in production without
   editing code by setting the EMBEDDERS variable in wrangler.toml or
   the dashboard, comma-separated. */
const EMBEDDERS = [
  'https://bladekiller246.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

/* Never carried, whatever the referer says. Sign-in, mail and money:
   places where a visitor typing a real credential into a page served
   by someone else's server is a genuine harm rather than a curiosity.
   Add to this list freely; it costs nothing to be over-broad. */
const DENY_HOSTS = [
  'accounts.google.com', 'myaccount.google.com', 'mail.google.com',
  'login.microsoftonline.com', 'login.live.com', 'outlook.com',
  'appleid.apple.com', 'icloud.com', 'id.atlassian.com',
  'paypal.com', 'stripe.com', 'checkout.stripe.com', 'venmo.com',
  'coinbase.com', 'binance.com', 'chase.com', 'wellsfargo.com',
  'bankofamerica.com', 'hdfcbank.com', 'icicibank.com', 'sbi.co.in',
  'onlinesbi.sbi', 'netbanking.hdfcbank.com', 'axisbank.com',
];

const MAX_BYTES = 25 * 1024 * 1024;

/* Sent to the target instead of the visitor's own headers. No cookies,
   no Authorization, no Referer — the logged-out view of a page, every
   time, with nothing of the visitor in it. */
const OUT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
};

/* Dropped from every response. The first three are the point of the
   exercise; the rest would either isolate the frame again, plant
   state under this origin, or outlive the request. */
const STRIP_HEADERS = [
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
  'permissions-policy', 'feature-policy',
  'set-cookie', 'set-cookie2',
  'strict-transport-security', 'clear-site-data',
  'report-to', 'nel',
  'content-encoding', 'content-length',   // the body is re-streamed
];

export default {
  async fetch(req, env) {
    /* Everything this worker emits gets the same framing policy, so it
       is set in one place rather than at ten return statements.
       Re-wrapping makes the headers mutable — HTMLRewriter's response
       is not — and passing `res.body` straight through keeps it a
       stream. See frameAncestors() for what this is defending. */
    const res = await route(req, env);
    const out = new Response(res.body, res);
    out.headers.set('content-security-policy', frameAncestors(env));
    return out;
  },
};

async function route(req, env) {
  const here = new URL(req.url);

  if (here.pathname === '/robots.txt')
    return new Response('User-agent: *\nDisallow: /\n',
      { headers: { 'content-type': 'text/plain; charset=utf-8' } });

  /* ── /inspect ────────────────────────────────────────────
     Reports a site's security headers instead of its body. This has to
     be server-side: the whole reason the browser cannot tell a blocked
     frame from a working one is that it exposes none of this to script,
     and a CORS proxy strips the very headers worth reading. Here they
     arrive intact, before anything is dropped.

     Read-only, same gate and same deny list as everything else. */
  if (here.pathname === '/inspect') return inspect(req, here, env);

  const raw = here.searchParams.get('url');
  if (!raw) return notice(400, 'Nothing to fetch',
    'This is the compatibility-mode proxy for a portfolio. It takes one ' +
    'parameter, <b>?url=</b>, and it is not a general-purpose proxy.');

  if (!embedderOk(req, here, env)) return notice(403, 'Not open to callers',
    'This proxy only answers for the site it was built for.');

  if (req.method !== 'GET' && req.method !== 'HEAD')
    return notice(405, 'Compatibility mode cannot post',
      'Only GET travels through here. A form that posts needs the real site — ' +
      'use <b>New window</b> in the toolbar.');

  let dest;
  try { dest = new URL(raw); }
  catch { return notice(400, 'That is not an address', esc(raw)); }

  const refused = unreachable(dest, here);
  if (refused) return notice(403, refused, esc(dest.hostname));

  // best-effort; absent unless the binding in wrangler.toml is live
  if (env.RATE_LIMITER) {
    const key = req.headers.get('cf-connecting-ip') || 'anon';
    const { success } = await env.RATE_LIMITER.limit({ key });
    if (!success) return notice(429, 'Too many requests',
      'This proxy is rate-limited per address. Wait a minute.');
  }

  let res;
  try {
    res = await fetch(dest.toString(), {
      method: 'GET',
      headers: OUT_HEADERS,
      redirect: 'manual',       // rewritten below, so redirects stay inside
    });
  } catch (err) {
    return notice(502, 'The site did not answer', esc(String(err.message || err)));
  }

  const to = res.headers.get('location');
  if (res.status >= 300 && res.status < 400 && to) {
    let next;
    try { next = new URL(to, dest); } catch { return notice(502, 'Bad redirect', esc(to)); }
    return unreachable(next, here)
      ? notice(403, 'It redirected somewhere this proxy will not go', esc(next.hostname))
      : Response.redirect(proxied(here, next), 302);
  }

  const len = Number(res.headers.get('content-length') || 0);
  if (len > MAX_BYTES) return notice(413, 'That page is too large',
    Math.round(len / 1048576) + ' MB, and the ceiling is ' + (MAX_BYTES / 1048576) + ' MB.');

  // constructing a Response with a body on these throws
  const bodyless = [101, 204, 205, 304].includes(res.status);
  const out = new Response(bodyless ? null : res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: cleaned(res.headers),
  });

  const type = (res.headers.get('content-type') || '').toLowerCase();
  if (!/text\/html|application\/xhtml/.test(type)) return out;   // passthrough, headers stripped
  return rewriter(here, dest).transform(out);
}

/* ── /inspect ──────────────────────────────────────────────────── */

/* The headers worth having an opinion about, and what their absence
   means. `want:false` marks a header whose *presence* is the finding. */
const WATCHED = [
  ['x-frame-options',                'Framing',            true],
  ['content-security-policy',        'CSP',                true],
  ['strict-transport-security',      'HSTS',               true],
  ['x-content-type-options',         'MIME sniffing',      true],
  ['referrer-policy',                'Referrer',           true],
  ['permissions-policy',             'Permissions',        true],
  ['cross-origin-opener-policy',     'COOP',               true],
  ['cross-origin-resource-policy',   'CORP',               true],
  ['access-control-allow-origin',    'CORS',               false],
  ['server',                         'Server banner',      false],
  ['x-powered-by',                   'Stack banner',       false],
];

async function inspect(req, here, env) {
  if (!embedderOk(req, here, env))
    return json({ error: 'not open to callers' }, 403);

  const raw = here.searchParams.get('url');
  let dest;
  try { dest = new URL(raw); } catch { return json({ error: 'bad address' }, 400); }

  const refused = unreachable(dest, here);
  if (refused) return json({ error: refused }, 403);

  if (env.RATE_LIMITER) {
    const key = req.headers.get('cf-connecting-ip') || 'anon';
    const { success } = await env.RATE_LIMITER.limit({ key });
    if (!success) return json({ error: 'rate limited' }, 429);
  }

  let res;
  const t0 = Date.now();
  try {
    // GET, not HEAD: plenty of sites answer HEAD differently, or not at
    // all, and a header report that does not match a real page load is
    // worse than none
    res = await fetch(dest.toString(), { method: 'GET', headers: OUT_HEADERS, redirect: 'follow' });
  } catch (err) {
    return json({ error: String(err.message || err) }, 502);
  }

  const found = {};
  WATCHED.forEach(([h]) => { found[h] = res.headers.get(h); });

  // does it forbid *us* specifically, or everyone
  const csp = found['content-security-policy'] || '';
  const fa  = (csp.match(/frame-ancestors([^;]*)/i) || [])[1] || '';

  return json({
    url: dest.toString(),
    status: res.status,
    ms: Date.now() - t0,
    type: res.headers.get('content-type') || '',
    headers: found,
    framing: {
      xfo: found['x-frame-options'] || null,
      frameAncestors: fa.trim() || null,
      // the question the browser will not answer for you
      framable: !found['x-frame-options'] && !fa.trim(),
    },
  });
}

const json = (obj, status = 200) => new Response(JSON.stringify(obj, null, 2), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex, nofollow',
  },
});


/* ── the gate ──────────────────────────────────────────────────── */

const embedders = env => (env.EMBEDDERS ? env.EMBEDDERS.split(',') : EMBEDDERS)
  .map(s => s.trim()).filter(Boolean);

/* Put back, on our own terms, the defence that was stripped on the way
   through — and this is the answer to the clickjacking objection.

   Stripping a site's frame-ancestors does not delete the protection, it
   moves who decides. This proxy re-states it as: only the portfolio may
   frame what comes out of here, plus 'self' for the nested iframes the
   rewriter points back at this origin. So a stranger who spoofs a
   Referer past the gate and fetches a proxied page still cannot embed
   the result in a page of their own — the browser refuses, exactly as
   it would have for the real site.

   X-Frame-Options cannot express this. ALLOW-FROM was never implemented
   by Chrome and is dead everywhere; DENY and SAMEORIGIN would both lock
   out the portfolio, which is on a different origin by design. So the
   header goes out as CSP only, which every browser that matters honours
   for frame-ancestors. */
const frameAncestors = env => "frame-ancestors 'self' " + embedders(env).join(' ');

function embedderOk(req, here, env) {
  const allowed = embedders(env);
  const ref = req.headers.get('referer') || '';
  let from = '';
  try { from = ref ? new URL(ref).origin : ''; } catch { from = ''; }

  if (from === here.origin) return true;          // a link clicked inside a proxied page
  if (allowed.includes(from)) return true;        // the site's frame, referrerpolicy="origin"

  // a proxied page that suppresses its own referer still navigates
  // same-origin, and that is the only thing this accepts without one
  return !ref && req.headers.get('sec-fetch-site') === 'same-origin';
}

/* Addresses this will not fetch, whatever asked for them. */
function unreachable(dest, here) {
  if (!/^https?:$/.test(dest.protocol)) return 'Only http and https travel through here';

  const h = dest.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === here.hostname) return 'That address is this proxy';
  if (h === 'localhost' || /\.(localhost|local|internal|home|lan)$/.test(h))
    return 'That is not a public address';
  if (h === '::1' || h.startsWith('fd') || h.startsWith('fe80:'))
    return 'That is not a public address';

  const ip = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ip) {
    const [a, b] = [Number(ip[1]), Number(ip[2])];
    if (a === 0 || a === 10 || a === 127 ||
        (a === 169 && b === 254) ||          // link-local, and the metadata endpoint
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127) ||
        a >= 224)
      return 'That is not a public address';
  }

  if (DENY_HOSTS.some(d => h === d || h.endsWith('.' + d)))
    return 'This proxy does not carry that site';

  return '';
}

/* ── rewriting ─────────────────────────────────────────────────── */

const proxied = (here, url) =>
  here.origin + '/?url=' + encodeURIComponent(url.toString());

function cleaned(headers) {
  const h = new Headers(headers);
  STRIP_HEADERS.forEach(k => h.delete(k));
  h.set('x-robots-tag', 'noindex, nofollow, noarchive');
  h.set('cache-control', 'no-store');   // don't keep other people's pages here
  return h;
}

/* Injected at the top of <head>. <base> keeps every URL we do NOT
   rewrite — images, stylesheets, scripts — pointing at the real site,
   and the script tells the parent where the frame actually is, since
   the parent is cross-origin to this and cannot read location itself. */
function injection(here, dest) {
  return `<base href="${esc(dest.toString())}">
<script>(function(){
  var real = function (h) {
    try {
      var u = new URL(h, location.href);
      return u.origin === location.origin ? (u.searchParams.get('url') || h) : h;
    } catch (e) { return h; }
  };
  var post = function (m) { m.kvdIE = 1; try { parent.postMessage(m, '*'); } catch (e) {} };
  var tell = function () { post({ at: real(location.href), title: document.title || '' }); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', tell);
  else tell();
  addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) post({ hover: real(a.href) });
  }, true);
  addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest('a[href]')) post({ hover: '' });
  }, true);
})();<\/script>`;
}

function rewriter(here, dest) {
  let injected = false;
  const inject = el => {
    if (injected) return;
    injected = true;
    el.prepend(injection(here, dest), { html: true });
  };

  /* Only navigations are rewritten. Anything else stays on the real
     origin via <base>, which is what keeps this at one request a page. */
  const relink = (el, attr) => {
    const v = el.getAttribute(attr);
    if (!v || /^\s*(#|javascript:|mailto:|tel:|data:|blob:|about:)/i.test(v)) return;
    let abs;
    try { abs = new URL(v, dest); } catch { return; }
    if (!/^https?:$/.test(abs.protocol)) return;
    el.setAttribute(attr, proxied(here, abs));
  };

  return new HTMLRewriter()
    .on('head', { element: inject })
    .on('body', { element: inject })   // in case the page never opened a head
    .on('base', { element: el => el.remove() })          // ours, not theirs
    .on('a', { element: el => relink(el, 'href') })
    .on('area', { element: el => relink(el, 'href') })
    .on('form', { element: el => relink(el, 'action') })
    .on('iframe', { element: el => relink(el, 'src') })
    .on('frame', { element: el => relink(el, 'src') })
    .on('meta', {
      element(el) {
        const k = (el.getAttribute('http-equiv') || '').toLowerCase();
        // a CSP meta would forbid the injected script; a refresh would
        // jump the frame off the proxy and straight into a refusal
        if (k === 'content-security-policy') el.remove();
        else if (k === 'refresh') el.remove();
      },
    })
    .on('input', {
      element(el) {
        if ((el.getAttribute('type') || '').toLowerCase() !== 'password') return;
        // nothing to type into means nothing to send: a visitor cannot
        // hand a real credential to a page served by this server
        el.replace(
          '<input type="text" disabled value="disabled by the proxy" title="' +
          'Compatibility mode will not carry a password. Open the site properly." ' +
          'style="font:inherit;color:#8b0000;background:#ffecec;border:1px solid #8b0000;padding:2px">',
          { html: true });
      },
    });
}

/* ── in-world error pages ──────────────────────────────────────── */

const esc = t => String(t).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function notice(status, title, detail) {
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:14px 16px;background:#fff;color:#000;
             font:13px/1.5 'MS Sans Serif',Tahoma,sans-serif">
  <h2 style="font-size:15px;margin:0 0 6px">${esc(title)}</h2>
  <hr style="border:0;border-top:1px solid #808080;border-bottom:1px solid #fff">
  <p>${detail}</p>
  <p style="color:#555;font-size:11px">Compatibility-mode proxy &middot; ${status}</p>
</body></html>`;
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
