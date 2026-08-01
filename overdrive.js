/* ═══════════════════════════════════════════════════════════
   KVD//OVERDRIVE — the operating system behind the admin door

   Owns the tube from the moment credentials clear until EJECT. It is
   deliberately not another Windows 98: that shell is a reproduction and
   has to be faithful, this one is invented and only has to be coherent.

   Structure is one object — PANELS — so a new screen is one entry, the
   same bargain APPS makes in win98.js §2.

   §1 boot   §2 panels   §3 shell   §4 lifecycle
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  let host = null;      // the .od root
  let ctx = null;       // { onExit, audio, burst, setWarp }
  let timers = [];
  let clock = null;
  let at = null;        // current panel id

  const after = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
  const stopTimers = () => { timers.forEach(clearTimeout); timers = []; };


  /* ═══ 1 · BOOT ═════════════════════════════════════════
     Short and unfriendly. The Windows boot is long because the joke is
     the waiting; this one is a machine that was already running and has
     merely decided to talk to you. */

  const BOOT = [
    '<b>KVD//OVERDRIVE</b>  rev 9.1.4  ·  restricted segment',
    '',
    'handshake ......................... <u>ACCEPTED</u>',
    'operator ..................... <b>GONE_GAMBLING</b>',
    'clearance ......................... <u>TIER-0</u>',
    '',
    'mounting /dev/vault ............... <u>OK</u>',
    'thermal envelope .................. <u>NOMINAL</u>',
    'uplink ............................ <i>NONE — AIR-GAPPED</i>',
    'watchdog .......................... <i>DISARMED BY OPERATOR</i>',
    '',
    'the segment has been idle 412 days.',
    '<b>welcome back.</b>',
  ];


  /* ═══ 2 · PANELS ═══════════════════════════════════════
     ✎ Contents live here. Add an entry, get a rail button and a screen.
     `code` is the rail's index number — cosmetic, but a HUD without
     reference numbers on everything does not read as a HUD. */

  const PANELS = {
    overview: { code: '01', name: 'Overview', live: true, body: overviewPanel },

    operator: {
      code: '02', name: 'Operator', body: `
        <h1 class="od__h">OPERATOR<br><b>RECORD</b></h1>
        <p class="od__sub">Identity · standing · last known</p>

        <dl class="od__grid">
          <div class="od__cell"><dt>Handle</dt><dd>GONE_GAMBLING</dd></div>
          <div class="od__cell od__cell--hot"><dt>Standing</dt><dd>GOOD</dd></div>
          <div class="od__cell"><dt>Sector</dt><dd>MUMBAI</dd></div>
          <div class="od__cell od__cell--cool"><dt>Session</dt><dd id="odSess">00:00</dd></div>
        </dl>

        <ul class="od__list">
          <li><b>01</b><span>Terminal, ground floor — KVD-4400</span><em>held</em></li>
          <li><b>02</b><span>Guest segment, read-only</span><em>public</em></li>
          <li><b>03</b><span>This segment</span><em>tier-0</em></li>
        </ul>` },

    recon:    { code: '03', name: 'Recon',    live: true, body: reconPanel },
    segment:  { code: '04', name: 'Segment',  live: true, body: segmentPanel },
    /* A function, not a const string: PANELS is an object literal and
       evaluates the moment it is reached, so a `const` declared further
       down would be in its dead zone and take the whole module with it.
       The others are function declarations and hoist; this one has to
       be too. */
    findings: { code: '05', name: 'Findings', body: findingsPanel },
    console:  { code: '06', name: 'Console',  live: true, body: consolePanel },

    /* The one panel with nothing invented on it. Everything here was
       actually recorded by journal.js while somebody used the guest
       segment — which is why it is `live`: it has to be rebuilt at the
       moment it is opened, not baked into the shell at boot. */
    watch: { code: '07', name: 'Watch', live: true, body: watchPanel },
  };


  /* ── the presence ──────────────────────────────────────
     Something that was paying attention while you were gone, speaking
     from what journal.js actually recorded. No model, no cleverness —
     templated lines over real numbers, picked by what happened.

     The whole effect rests on it being *specific*. "Activity detected"
     is a screensaver; "they spent nineteen minutes in Minesweeper and
     never opened the browser" is somebody watching. */
  function presence(s) {
    const say = [];

    if (!s || !s.visits) {
      return 'Nobody has been through since you left. The room has been exactly as you set it.';
    }

    say.push(s.visits === 1
      ? 'One guest, once.'
      : `${s.visits} guests through that door.`);

    const top = s.apps && s.apps[0];
    if (top && top.ms > 20000) {
      say.push(`The last one spent ${dur(top.ms).replace(/<[^>]+>/g, '')} in ${top.label}. I watched all of it.`);
    } else if (s.apps && s.apps.length) {
      say.push('They opened things and closed them again without settling.');
    } else {
      say.push('They opened nothing at all. Just looked.');
    }

    const out = (s.seen || []).filter(x => !x.local).length;
    if (out) say.push(`${out} address${out === 1 ? '' : 'es'} pointed outside the station. I let them through.`);

    if (s.admin.denied) {
      say.push(`This door was tried ${s.admin.denied} time${s.admin.denied === 1 ? '' : 's'} and refused every one.`);
    } else if (s.admin.attempts > 1) {
      say.push('They found this door more than once.');
    }

    return say.join(' ');
  }

  function overviewPanel() {
    const s = window.JOURNAL?.summary();
    const seg = window.SEGMENT?.get() || {};
    const hidden = (seg.hide || []).length;

    return `
      <h1 class="od__h">RESTRICTED<br><b>SEGMENT</b></h1>
      <p class="od__sub">Tier-0 · operator session · air-gapped</p>

      <div class="od__voice"><p>${presence(s)}</p></div>

      <dl class="od__grid">
        <div class="od__cell od__cell--hot"><dt>Guest sessions</dt><dd>${s ? s.visits : 0}</dd></div>
        <div class="od__cell"><dt>Time observed</dt><dd>${dur(s ? s.totalMs : 0)}</dd></div>
        <div class="od__cell ${s && s.admin.attempts ? 'od__cell--hot' : ''}">
          <dt>Attempts on this door</dt><dd>${s ? s.admin.attempts : 0}</dd></div>
        <div class="od__cell od__cell--cool"><dt>Icons withheld</dt><dd>${hidden}</dd></div>
      </dl>

      <p>This is the half of the station that does not get a guest session.
         Everything through the GUEST door is a reproduction of 1998 and behaves
         itself. Nothing in here has to.</p>`;
  }


  /* ── recon ─────────────────────────────────────────────
     A header report on any address, which is the one piece of real
     tooling in this shell. It has to go through the worker: the browser
     deliberately exposes none of this to script — that is the whole
     reason a page cannot tell a blocked frame from a working one — and
     a public CORS proxy strips the very headers worth reading.

     Empty IE_WORKER means no server, and the panel says so rather than
     inventing a verdict. */
  function reconPanel() {
    if (!ctx?.proxy) {
      return `
        <h1 class="od__h">RECON</h1>
        <p class="od__sub">Security header report · needs a server</p>
        <p>Reading another site's response headers cannot be done from a page.
           The browser hides them from script on purpose, which is exactly why a
           framed site cannot be told apart from a blocked one, and a public CORS
           proxy drops them before they reach you.</p>
        <p class="od__locked">No proxy deployed</p>
        <p class="od__note">Deploy <b>proxy/worker.js</b>, put its URL in
           <b>IE_WORKER</b> in win98.js, and this panel starts answering.</p>`;
    }

    return `
      <h1 class="od__h">RECON</h1>
      <p class="od__sub">Security header report · read-only</p>

      <form class="od__form" id="odScanForm">
        <input class="od__in" id="odScan" spellcheck="false" autocomplete="off"
               placeholder="github.com" aria-label="Address to inspect">
        <button class="od__go" type="submit">SCAN</button>
      </form>

      <div id="odScanOut"></div>
      <p class="od__note">One GET through your own proxy, nothing stored, no
         credentials sent. It reports what the server said — it does not test,
         probe or attack anything.</p>`;
  }

  const HEADER_NOTE = {
    'x-frame-options': 'Refuses framing outright. Blunt, and superseded by CSP.',
    'content-security-policy': 'The modern control. frame-ancestors lives here.',
    'strict-transport-security': 'Forces https on every later visit.',
    'x-content-type-options': 'Stops the browser guessing a file is script.',
    'referrer-policy': 'Decides how much of the URL leaves with a click.',
    'permissions-policy': 'Camera, mic, geolocation and the rest.',
    'cross-origin-opener-policy': 'Cuts a popup off from its opener.',
    'cross-origin-resource-policy': 'Decides who may embed this as a resource.',
    'access-control-allow-origin': 'Present means it is readable cross-origin.',
    'server': 'Naming the software is free intelligence for an attacker.',
    'x-powered-by': 'As above, and never useful to a visitor.',
  };

  async function runScan(root) {
    const input = $('#odScan', root);
    const out = $('#odScanOut', root);
    let url = input.value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    out.innerHTML = `<p class="od__sub">Reading ${esc(url)}&hellip;</p>`;
    ctx?.audio?.key?.();

    let data;
    try {
      const res = await fetch(
        ctx.proxy.replace(/\/+$/, '') + '/inspect?url=' + encodeURIComponent(url));
      data = await res.json();
    } catch (err) {
      out.innerHTML = `<p class="od__locked">The proxy did not answer</p>`;
      return;
    }

    if (data.error) {
      out.innerHTML = `<p class="od__locked">${esc(data.error)}</p>`;
      return;
    }

    const f = data.framing;
    const rows = Object.entries(data.headers).map(([h, v]) => {
      const want = !['access-control-allow-origin', 'server', 'x-powered-by'].includes(h);
      const good = want ? !!v : !v;
      return `<li class="od__row ${good ? 'is-ok' : 'is-bad'}">
          <b>${good ? '&check;' : '&times;'}</b>
          <span><u>${esc(h)}</u>${v ? `<code>${esc(v.slice(0, 120))}</code>`
            : '<code class="od__absent">absent</code>'}
          <em>${HEADER_NOTE[h] || ''}</em></span>
        </li>`;
    }).join('');

    out.innerHTML = `
      <dl class="od__grid">
        <div class="od__cell"><dt>Status</dt><dd>${data.status}</dd></div>
        <div class="od__cell"><dt>Answered in</dt><dd>${data.ms}<small>ms</small></dd></div>
        <div class="od__cell ${f.framable ? 'od__cell--cool' : 'od__cell--hot'}">
          <dt>Framable</dt><dd>${f.framable ? 'YES' : 'NO'}</dd></div>
      </dl>
      ${f.frameAncestors
        ? `<p class="od__note">frame-ancestors: <b>${esc(f.frameAncestors)}</b></p>` : ''}
      <ul class="od__rows">${rows}</ul>`;
  }


  /* ── segment ───────────────────────────────────────────
     The operator deciding what the next visitor walks into. Everything
     here writes to segment.js and is read by win98.js as the guest
     desktop is built. */
  function segmentPanel() {
    const seg = window.SEGMENT?.get() || { hide: [], arcade: true, note: '' };
    const apps = ctx?.apps || [];

    const icons = apps.map(a => {
      const off = (seg.hide || []).includes(a.id);
      return `<button class="od__chip ${off ? 'is-off' : ''}" data-hide="${esc(a.id)}">
          <b>${off ? '&times;' : '&check;'}</b>${esc(a.name)}</button>`;
    }).join('');

    return `
      <h1 class="od__h">SEGMENT</h1>
      <p class="od__sub">What the guest is allowed to find</p>

      <p class="od__sub" style="margin-bottom:.6rem">Desktop icons</p>
      <div class="od__chips">${icons || '<span class="od__note">No desktop yet.</span>'}</div>

      <hr class="od__rule">

      <p class="od__sub" style="margin-bottom:.6rem">The arcade</p>
      <button class="od__chip ${seg.arcade === false ? 'is-off' : ''}" id="odArcade">
        <b>${seg.arcade === false ? '&times;' : '&check;'}</b>
        ${seg.arcade === false ? 'Sealed' : 'Open'}</button>
      <p class="od__note">Sealed cabinets still open and still say why. A game
         that vanishes is a bug report; one that says it was sealed is a story.</p>

      <hr class="od__rule">

      <p class="od__sub" style="margin-bottom:.6rem">Leave something behind</p>
      <textarea class="od__area" id="odNote" rows="4"
        placeholder="Opens by itself on the next guest's desktop.">${esc(seg.note || '')}</textarea>
      <button class="od__go" id="odNoteSave">LEAVE IT</button>
      <span class="od__note" id="odNoteMsg"></span>`;
  }


  /* ── console ───────────────────────────────────────────
     Operator powers over the tube itself. These are the controls that
     do not belong on the fascia — a visitor has no business degaussing
     anything, but the operator does. */
  function consolePanel() {
    const masks = ['none', 'dot', 'grille'];
    const now = document.body.dataset.mask || 'none';
    return `
      <h1 class="od__h">CONSOLE</h1>
      <p class="od__sub">Direct control of the tube</p>

      <div class="od__chips">
        <button class="od__chip" data-cmd="degauss"><b>&#9678;</b>Degauss</button>
        <button class="od__chip" data-cmd="burst"><b>&#9776;</b>Interference</button>
        <button class="od__chip" data-cmd="power"><b>&#9211;</b>Cut power</button>
      </div>

      <hr class="od__rule">
      <p class="od__sub" style="margin-bottom:.6rem">Phosphor mask</p>
      <div class="od__chips">
        ${masks.map(m => `<button class="od__chip ${m === now ? '' : 'is-off'}"
            data-mask="${m}"><b>${m === now ? '&check;' : '&middot;'}</b>${m}</button>`).join('')}
      </div>

      <hr class="od__rule">
      <p class="od__note">Degauss fires the real coil routine — the geometry
         swells and rings down, and the synth that plays on every cold start
         plays here too. Cutting power drops the whole set to standby, guest
         segment and all.</p>`;
  }


  /* ── findings ──────────────────────────────────────────
     The DVWA assessment as a report rather than a card. Sealed records
     that are worth having been sealed. */
  function findingsPanel() { return `
    <h1 class="od__h">FINDING<br><b>001</b></h1>
    <p class="od__sub">Unrestricted file upload &rarr; remote code execution</p>

    <dl class="od__grid">
      <div class="od__cell od__cell--hot"><dt>Severity</dt><dd>CRITICAL</dd></div>
      <div class="od__cell"><dt>Target</dt><dd>DVWA</dd></div>
      <div class="od__cell od__cell--cool"><dt>Status</dt><dd>PUBLISHED</dd></div>
      <div class="od__cell"><dt>Date</dt><dd>APR<small> 2026</small></dd></div>
    </dl>

    <p class="od__sub" style="margin-bottom:.6rem">Root cause</p>
    <p>The upload handler validates neither the file extension, the declared
       MIME type, nor the file's own signature, and writes into a directory
       inside the web root where the server will execute what it finds.</p>

    <p class="od__sub" style="margin-bottom:.6rem">Impact</p>
    <p>A benign PHP shell uploaded through the form returned system-level
       command execution. From there: the database credentials in configuration,
       and whatever the web server can reach on the internal network.</p>

    <p class="od__sub" style="margin-bottom:.6rem">Remediation</p>
    <ul class="od__list">
      <li><b>01</b><span>Allow-list extensions; never deny-list them</span><em>control</em></li>
      <li><b>02</b><span>Verify magic bytes against the claimed type</span><em>control</em></li>
      <li><b>03</b><span>Disable execution in upload directories</span><em>defence</em></li>
      <li><b>04</b><span>Rename to a UUID so paths cannot be guessed</span><em>defence</em></li>
    </ul>

    <hr class="od__rule">
    <p class="od__note">Full write-up, reproduction steps and proof of concept:
       github.com/Bladekiller246/dvwa-file-upload-Vulnerability-</p>`; }

  /* ── the watch panel ───────────────────────────────────── */

  const pad2 = n => String(n).padStart(2, '0');

  function dur(ms) {
    if (!ms) return '0<small>s</small>';
    const s = Math.round(ms / 1000);
    if (s < 60) return s + '<small>s</small>';
    const m = Math.floor(s / 60);
    if (m < 60) return m + '<small>m </small>' + pad2(s % 60) + '<small>s</small>';
    return Math.floor(m / 60) + '<small>h </small>' + pad2(m % 60) + '<small>m</small>';
  }

  const when = t => {
    const d = new Date(t);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  };

  const esc = s => String(s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function watchPanel() {
    const j = window.JOURNAL;
    const s = j ? j.summary() : null;

    if (!s || !s.events) {
      return `
        <h1 class="od__h">WATCH</h1>
        <p class="od__sub">Nobody has been through yet</p>
        <p class="od__note">The guest segment has not been opened on this
           machine, so there is nothing to report. Take the GUEST door, move
           around, come back.</p>`;
    }

    const a = s.admin;
    const apps = s.apps.length
      ? s.apps.map(x => `<li><b>${dur(x.ms)}</b><span>${esc(x.label)}</span>
           <em>${x.count}&times;</em></li>`).join('')
      : '<li><b>&mdash;</b><span>No applications opened</span><em>none</em></li>';

    const seen = s.seen.length
      ? s.seen.map(x => `<li><b>${when(x.t)}</b><span>${esc(x.label)}</span>
           <em>${x.local ? 'station' : 'outbound'}</em></li>`).join('')
      : '<li><b>&mdash;</b><span>Nothing typed into the browser</span><em>none</em></li>';

    /* The door line is the only one that changes tone with its own
       value — no attempts is a shrug, attempts is an accusation. */
    const door = a.attempts === 0
      ? `<p>Nobody tried this door. The guest went through the session without
            once reaching for the other one.</p>`
      : `<p>This door was tried <b style="color:var(--od-hot)">${a.attempts}</b>
            time${a.attempts === 1 ? '' : 's'} &mdash;
            ${a.denied} refused, ${a.granted} let through.
            Last attempt at ${when(a.lastTry)}.</p>`;

    return `
      <h1 class="od__h">WATCH</h1>
      <p class="od__sub">What the guest segment did &middot; recorded locally</p>

      <dl class="od__grid">
        <div class="od__cell od__cell--hot"><dt>Sessions</dt><dd>${s.visits}</dd></div>
        <div class="od__cell"><dt>Total time in guest</dt><dd>${dur(s.totalMs)}</dd></div>
        <div class="od__cell"><dt>Last session</dt><dd>${dur(s.lastMs)}</dd></div>
        <div class="od__cell ${a.attempts ? 'od__cell--hot' : ''}">
          <dt>Attempts on this door</dt><dd>${a.attempts}</dd></div>
      </dl>

      ${door}
      <hr class="od__rule">

      <p class="od__sub" style="margin-bottom:.6rem">Applications, longest first</p>
      <ul class="od__list">${apps}</ul>

      <p class="od__sub" style="margin:1.6rem 0 .6rem">Addresses entered</p>
      <ul class="od__list">${seen}</ul>

      <hr class="od__rule">
      <p class="od__note">Held in this browser's own storage and nowhere else.
         There is no server on the other end of this site to send it to, and
         nothing here opens a socket &mdash; it survives a reload and dies with
         the browser's site data.</p>
      <p><button class="od__tab od__eject" id="odWipe" style="display:inline-grid">
         <i>&#9587;</i><span>Erase the journal</span></button></p>`;
  }

  const TICKER =
    'SEGMENT AIR-GAPPED · NO UPLINK · <b>WATCHDOG DISARMED BY OPERATOR</b> · ' +
    'ALL READOUTS LOCAL · GUEST SEGMENT UNAFFECTED · ' +
    'THERMAL NOMINAL · <b>412 DAYS SINCE LAST SESSION</b> · ';


  /* ═══ 3 · SHELL ════════════════════════════════════════ */

  function chrome() {
    const rail = Object.entries(PANELS).map(([id, p]) =>
      `<button class="od__tab" data-panel="${id}"><i>${p.code}</i><span>${p.name}</span></button>`
    ).join('');

    // a `live` panel is left empty here and built when it is opened —
    // it reports on a session that is still happening
    const screens = Object.entries(PANELS).map(([id, p]) =>
      `<section class="od__panel" data-screen="${id}" hidden>${
        typeof p.body === 'function' ? '' : p.body}</section>`
    ).join('');

    return `
      <div class="od__bar">
        <span class="od__mark"><b>KVD</b>//OVERDRIVE</span>
        <span class="od__pill od__pill--live">TIER-0</span>
        <span class="od__pill">AIR-GAPPED</span>
        <span class="od__pill od__pill--warn">WATCHDOG OFF</span>
        <time id="odClock">--:--:--</time>
      </div>

      <div class="od__body">
        <nav class="od__rail" aria-label="Segments">
          ${rail}
          <button class="od__tab od__eject" id="odEject"><i>&#9664;</i><span>Eject</span></button>
        </nav>
        <div class="od__stage">${screens}</div>
      </div>

      <div class="od__ticker" aria-hidden="true"><span>${TICKER + TICKER}</span></div>`;
  }

  function select(id) {
    if (!host || at === id) return;
    at = id;

    const p = PANELS[id];
    const screen = host.querySelector(`[data-screen="${id}"]`);
    if (p && typeof p.body === 'function' && screen) {
      screen.innerHTML = p.body();
      wire(id, screen);
    }

    host.querySelectorAll('[data-screen]').forEach(s => {
      s.hidden = s.dataset.screen !== id;
    });
    host.querySelectorAll('[data-panel]').forEach(b => {
      b.classList.toggle('is-on', b.dataset.panel === id);
    });
    ctx?.audio?.key?.();
  }

  /* Every live panel's controls, in one place. Panels are rebuilt from
     scratch on each open, so listeners are attached here rather than
     delegated — nothing survives long enough to leak. */
  function wire(id, root) {
    const rebuild = () => { at = null; select(id); };

    // WATCH
    const wipe = $('#odWipe', root);
    if (wipe) wipe.addEventListener('click', () => {
      window.JOURNAL?.clear();
      ctx?.audio?.click?.(true);
      rebuild();
    });

    // RECON
    const form = $('#odScanForm', root);
    if (form) {
      form.addEventListener('submit', e => { e.preventDefault(); runScan(root); });
      $('#odScan', root)?.addEventListener('keydown', e => e.stopPropagation());
    }

    // SEGMENT
    root.querySelectorAll('[data-hide]').forEach(b =>
      b.addEventListener('click', () => {
        window.SEGMENT?.toggleHidden(b.dataset.hide);
        ctx?.audio?.key?.();
        rebuild();
      }));

    const arc = $('#odArcade', root);
    if (arc) arc.addEventListener('click', () => {
      window.SEGMENT?.set({ arcade: !window.SEGMENT.arcadeOpen() });
      ctx?.audio?.key?.();
      rebuild();
    });

    const save = $('#odNoteSave', root);
    if (save) save.addEventListener('click', () => {
      const box = $('#odNote', root);
      window.SEGMENT?.set({ note: box.value });
      ctx?.audio?.click?.(false);
      const msg = $('#odNoteMsg', root);
      if (msg) msg.textContent = box.value.trim()
        ? ' left on the desktop for whoever comes next.'
        : ' cleared — nothing will be waiting.';
    });
    $('#odNote', root)?.addEventListener('keydown', e => e.stopPropagation());

    // CONSOLE
    root.querySelectorAll('[data-cmd]').forEach(b =>
      b.addEventListener('click', () => {
        const k = b.dataset.cmd;
        if (k === 'degauss') window.KVD?.degauss?.();
        else if (k === 'burst') ctx?.burst?.(420);
        else if (k === 'power') document.querySelector('#power')?.click();
      }));

    root.querySelectorAll('[data-mask]').forEach(b =>
      b.addEventListener('click', () => {
        const names = window.KVD?.maskNames || ['none', 'dot', 'grille'];
        window.KVD?.setMask?.(names.indexOf(b.dataset.mask));
        ctx?.audio?.key?.();
        rebuild();
      }));
  }

  /* Wall clock in the bar, and how long this operator session has run. */
  function runClock() {
    const started = Date.now();

    clock = setInterval(() => {
      const t = $('#odClock', host);
      if (t) t.textContent = new Date().toTimeString().slice(0, 8);

      const s = $('#odSess', host);
      if (s) {
        const secs = Math.floor((Date.now() - started) / 1000);
        s.textContent = pad2(Math.floor(secs / 60)) + ':' + pad2(secs % 60);
      }
    }, 1000);
  }


  /* ═══ 4 · LIFECYCLE ════════════════════════════════════ */

  function build() {
    host = $('#od');
    host.innerHTML = `
      <div class="od__boot" id="odBoot"><pre id="odBootLog"></pre></div>
      <div class="od__shell" id="odShell" hidden></div>`;
  }

  function shell() {
    const sh = $('#odShell', host);
    sh.innerHTML = chrome();
    sh.hidden = false;
    $('#odBoot', host).hidden = true;

    sh.querySelectorAll('[data-panel]').forEach(b =>
      b.addEventListener('click', () => select(b.dataset.panel)));
    $('#odEject', host).addEventListener('click', eject);

    select(Object.keys(PANELS)[0]);
    runClock();
    ctx?.burst?.(240);
  }

  function start(opts) {
    ctx = opts || {};
    build();
    host.hidden = false;
    document.body.classList.add('is-overdrive');

    // the bend eases off the way it does for Windows: small UI type has
    // to survive the displacement, and this shell is nothing but small
    // UI type
    ctx.setWarp?.(26);

    const log = $('#odBootLog', host);
    if (calm.matches) { log.innerHTML = BOOT.join('\n'); after(300, shell); return; }

    let i = 0;
    const tick = () => {
      log.innerHTML = BOOT.slice(0, ++i).join('\n');
      if (i < BOOT.length) {
        ctx.audio?.tick?.();
        after(BOOT[i - 1] === '' ? 50 : 70 + Math.random() * 90, tick);
      } else {
        after(820, shell);
      }
    };
    after(200, tick);
  }

  function stop() {
    stopTimers();
    clearInterval(clock); clock = null;
    at = null;
    document.body.classList.remove('is-overdrive');
    if (host) { host.hidden = true; host.innerHTML = ''; }
  }

  function eject() {
    ctx?.audio?.click?.(true);
    const exit = ctx?.onExit;
    stop();
    exit?.();
  }

  window.OVERDRIVE = { start, stop, PANELS };
})();
