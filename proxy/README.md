# Compatibility-mode proxy

A Cloudflare Worker that fetches a page server-side, drops the headers that
forbid framing, and rewrites its links so navigation stays inside the frame.
The KVD-4400's Internet Explorer uses it for sites that refuse to be framed.

**Nothing in the site imports this.** The site holds one string —
`IE_WORKER` in `win98.js` §6c2 — and while that is empty the proxy is never
called and IE falls back to public CORS proxies. Deploying this is optional
and reversible: blank the constant and you are back where you started.

## Deploy

```sh
npm install -g wrangler     # once
wrangler login              # once
cd proxy
wrangler deploy
```

Wrangler prints the URL — `https://kvd-compat-proxy.<your-subdomain>.workers.dev`.
Put it in `win98.js`:

```js
const IE_WORKER = 'https://kvd-compat-proxy.<your-subdomain>.workers.dev';
```

Then set `EMBEDDERS` in [wrangler.toml](wrangler.toml) to the origin actually
serving the portfolio and deploy again. Until that matches, the proxy answers
your frame with *"Not open to callers"* — which is the gate working.

Free tier is 100,000 requests/day. Tier-1 rewriting costs one request per
page, so that is roughly 100,000 page views rather than 100,000 assets.

## Check it worked

```sh
# no referer: refused, and that is the point
curl -si "https://kvd-compat-proxy.<sub>.workers.dev/?url=https://github.com" | head -1

# as the site: 200, and no framing headers survive
curl -si -H "Referer: https://<your-site>/" \
  "https://kvd-compat-proxy.<sub>.workers.dev/?url=https://github.com" \
  | grep -iE "^(HTTP|x-frame-options|content-security-policy)"

# the SSRF guard
curl -s -H "Referer: https://<your-site>/" \
  "https://kvd-compat-proxy.<sub>.workers.dev/?url=http://169.254.169.254/" | grep -o "not a public address"
```

Then open IE in the tube and type `github.com`. The status bar should read
*"fetched through the proxy"* and the zone *Compatibility zone*.

## What it will and won't do

Tier 1: HTML documents and the links between them. Images, CSS and scripts are
left to `<base>` and load from the real site — one request per page instead of
one per asset. Static pages arrive whole. Applications do not, because their
own XHR is still cross-origin to a document no longer on their origin.
Wikipedia and GitHub read fine; Gmail never will.

`POST` is refused. Redirects are followed and rewritten so they stay inside.
Password fields are replaced with a disabled box before the HTML ever reaches
the browser — a visitor cannot hand a real credential to a page your server is
serving. No cookies, no `Authorization`, no `Referer` reach the target: it is
always the logged-out view.

## DENY, frame-ancestors, and clickjacking

**`X-Frame-Options: DENY` is not a harder case than `SAMEORIGIN`.** Both are
instructions a browser follows when it is about to put a document in a frame.
This worker is not a browser and is not framing anything — it makes a plain
GET, and the header arrives as a string in a response it is free to drop. By
the time a browser sees the HTML there is no directive left to obey, so
`DENY`, `SAMEORIGIN` and `ALLOW-FROM` all end up in the same place: gone, in
`STRIP_HEADERS`.

**`frame-ancestors` is the same story, in a different header.** It is stripped
alongside `X-Frame-Options`, in both its enforcing and report-only forms. The
`<meta>` route needs no defending — the CSP spec says `frame-ancestors` is
ignored when delivered by `<meta>` — but the rewriter removes CSP metas anyway,
because a `script-src` in one would forbid the injected bridge from running.

**Clickjacking is the objection worth taking seriously**, and it has a real
answer rather than a shrug. Three things, in order of how much work they do:

1. **The proxy re-states the policy on its own terms.** Every response leaves
   here with `Content-Security-Policy: frame-ancestors 'self' <EMBEDDERS>`. So
   a stranger who spoofs a `Referer` past the gate and fetches a proxied page
   *still cannot embed the result in a page of their own* — the browser
   refuses, exactly as it would have for the real site. Stripping the site's
   header moved who decides; it did not delete the protection. (`X-Frame-Options`
   cannot express this — `ALLOW-FROM` is dead in every browser — which is why
   the policy goes back as CSP only.)
2. **There is no session in the frame to hijack.** Classic clickjacking spends
   the victim's *own* authenticated session: the framed page carries their
   cookies, so a disguised click acts as them. Nothing here carries a
   credential. The fetch is `credentials: omit`, `Set-Cookie` is dropped, and
   the document ends up on the worker's origin — which holds no cookie for the
   site it is showing. A click inside a proxied page acts as nobody.
3. **The frame cannot reach out of itself.** The sandbox has no
   `allow-top-navigation`, so a proxied page cannot steer the tube, and no
   `allow-same-origin` on the fallback `srcdoc` path. Password fields are
   disabled during the rewrite and `POST` is refused, so the overlay-and-
   harvest shape of the attack has nothing to submit to.

What is genuinely left: **JavaScript framebusters**. A page that checks
`if (self !== top)` and blanks itself needs no header at all. `top` is
`[LegacyUnforgeable]` in the HTML spec, so a script cannot lie about it, and
defeating these reliably means rewriting the page's JavaScript — which tier 1
does not do. They are rare now, precisely because the headers replaced them.
When one bites, the page comes up blank and **New window** is the answer.

The other practical limit is nothing to do with framing: sites behind a WAF
often serve a challenge page to a datacenter IP, so what arrives is
Cloudflare's interstitial rather than the site. Also unfixable from here.

## Read this before deploying it publicly

**It must not live on the portfolio's own origin.** Everything it returns
becomes same-origin with whatever serves it. On its own `workers.dev`
subdomain that means proxied pages are isolated from the portfolio. On a path
of your own domain, every page it serves becomes first-party to the portfolio
and can read and rewrite it — worse than having no proxy at all. `workers_dev`
is `true` in `wrangler.toml` for that reason; don't add a custom route on your
apex domain.

**The embedder gate is a lock, not a wall.** It reads `Referer` and
`Sec-Fetch-Site`, both of which anyone can set with `curl -H`. It stops
drive-by scanning and casual reuse. It does not stop someone who wants
through. What actually holds the line is the per-IP rate limit, `DENY_HOSTS`,
the refusal to carry credentials, and the fact that this is a throwaway
subdomain rather than a domain with your name on it.

**You are re-serving other people's pages** and stripping a policy they set on
purpose. Private amusement is one risk posture. Linked from a CV, on
infrastructure in your name, is another. `X-Robots-Tag: noindex` and
`Cache-Control: no-store` are set on everything so nothing it serves gets
indexed or kept, but that is hygiene, not permission.

Tighten `DENY_HOSTS` freely — it costs nothing to be over-broad, and every
host on it is one fewer place a stranger can point your server at.
