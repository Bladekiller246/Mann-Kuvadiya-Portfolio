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
    overview: {
      code: '01', name: 'Overview', body: `
        <h1 class="od__h">RESTRICTED<br><b>SEGMENT</b></h1>
        <p class="od__sub">Tier-0 · operator session · air-gapped</p>

        <dl class="od__grid">
          <div class="od__cell od__cell--hot"><dt>Clearance</dt><dd>TIER-0</dd></div>
          <div class="od__cell"><dt>Segment uptime</dt><dd>412<small> D</small></dd></div>
          <div class="od__cell od__cell--cool"><dt>Uplink</dt><dd>NONE</dd></div>
          <div class="od__cell"><dt>Watchdog</dt><dd>OFF</dd></div>
        </dl>

        <p>This is the half of the station that does not get a guest session.
           Everything through the GUEST door is a reproduction of 1998 and
           behaves itself. Nothing in here has to.</p>
        <hr class="od__rule">
        <p class="od__note">Contents pending. The shell, the rail and the panel
           system are live — screens get filled as they are specified.</p>` },

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

    vault: {
      code: '03', name: 'Vault', body: `
        <h1 class="od__h">THE<br><b>VAULT</b></h1>
        <p class="od__sub">Sealed records · operator eyes</p>

        <ul class="od__list">
          <li><b>▓▓</b><span>Entry withheld</span><em>sealed</em></li>
          <li><b>▓▓</b><span>Entry withheld</span><em>sealed</em></li>
          <li><b>▓▓</b><span>Entry withheld</span><em>sealed</em></li>
          <li><b>▓▓</b><span>Entry withheld</span><em>sealed</em></li>
        </ul>
        <p class="od__locked">Contents not yet written</p>
        <hr class="od__rule">
        <p class="od__note">A vault with nothing in it is still a vault. Say what
           goes here and the seals come off.</p>` },

    /* The one panel with nothing invented on it. Everything here was
       actually recorded by journal.js while somebody used the guest
       segment — which is why it is `live`: it has to be rebuilt at the
       moment it is opened, not baked into the shell at boot. */
    watch: { code: '04', name: 'Watch', live: true, body: watchPanel },
  };

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
      const wipe = $('#odWipe', screen);
      if (wipe) wipe.addEventListener('click', () => {
        window.JOURNAL?.clear();
        ctx?.audio?.click?.(true);
        at = null;              // force the rebuild
        select(id);
      });
    }

    host.querySelectorAll('[data-screen]').forEach(s => {
      s.hidden = s.dataset.screen !== id;
    });
    host.querySelectorAll('[data-panel]').forEach(b => {
      b.classList.toggle('is-on', b.dataset.panel === id);
    });
    ctx?.audio?.key?.();
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
