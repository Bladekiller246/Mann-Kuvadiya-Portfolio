/* ═══════════════════════════════════════════════════════════
   KVD-4400 — access gate → guest session → Windows 98 shell

   §1 icons      §2 apps        §3 gate + admin login
   §4 OS boot    §5 splash      §6 window manager
   §7 desktop    §8 start menu  §9 shutdown
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;

  const gate    = $('#gate');
  const login   = $('#login');
  const osboot  = $('#osboot');
  const osLog   = $('#osbootLog');
  const splash  = $('#splash');
  const w98     = $('#w98');
  const desk    = $('#w98Desk');
  const winLayer= $('#w98Wins');
  const taskbar = $('#w98Tasks');
  const startBtn= $('#w98Start');
  const menu    = $('#w98Menu');
  const clockEl = $('#w98Clock');

  let timers = [];
  const after = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
  const stopTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const kvd = () => window.KVD || {};
  // run after the current event's default action has played out
  const defer = fn => requestAnimationFrame(() => requestAnimationFrame(fn));

  /* ── §1 · ICONS ─────────────────────────────────────────
     Flat pixel shapes, crisp-edged, in the system palette. */

  const svg = (b, s = 32) =>
    `<svg viewBox="0 0 32 32" width="${s}" height="${s}" shape-rendering="crispEdges" aria-hidden="true">${b}</svg>`;

  const I = {
    computer: svg(`<rect x="3" y="6" width="26" height="17" fill="#c0c0c0" stroke="#000"/>
      <rect x="5" y="8" width="22" height="13" fill="#008080"/>
      <rect x="5" y="8" width="22" height="4" fill="#0c6b6b"/>
      <rect x="12" y="23" width="8" height="3" fill="#9a9a9a" stroke="#000"/>
      <rect x="7" y="26" width="18" height="3" fill="#c0c0c0" stroke="#000"/>`),

    folder: svg(`<path d="M2 8h10l2 3h16v17H2z" fill="#c98f00" stroke="#000"/>
      <path d="M2 13h28v15H2z" fill="#ffd75e" stroke="#000"/>`),

    doc: svg(`<path d="M8 3h11l6 6v20H8z" fill="#fff" stroke="#000"/>
      <path d="M19 3v6h6" fill="#dcdcdc" stroke="#000"/>
      <g stroke="#8a8a8a"><path d="M11 14h12M11 17h12M11 20h12M11 23h8"/></g>`),

    bin: svg(`<path d="M13 4h6v3h-6z" fill="#cfd3d6" stroke="#000"/>
      <rect x="7" y="7" width="18" height="3" fill="#d8dcdf" stroke="#000"/>
      <path d="M9 10h14l-1.5 19h-11z" fill="#b6babd" stroke="#000"/>
      <path d="M16 13l3 5h-6z" fill="#2e9b3f"/><path d="M13 22l3-5 2 3z" fill="#37b34a"/>
      <path d="M19 22l-3 5-2-3z" fill="#37b34a"/>`),

    chip: svg(`<rect x="9" y="9" width="14" height="14" fill="#2a2a2a" stroke="#000"/>
      <rect x="12" y="12" width="8" height="8" fill="#585858"/>
      <g fill="#c0c0c0" stroke="#000"><rect x="6" y="12" width="3" height="2"/>
      <rect x="6" y="18" width="3" height="2"/><rect x="23" y="12" width="3" height="2"/>
      <rect x="23" y="18" width="3" height="2"/><rect x="12" y="6" width="2" height="3"/>
      <rect x="18" y="6" width="2" height="3"/><rect x="12" y="23" width="2" height="3"/>
      <rect x="18" y="23" width="2" height="3"/></g>`),

    mail: svg(`<rect x="3" y="8" width="26" height="17" fill="#fff" stroke="#000"/>
      <path d="M3 8l13 10L29 8" fill="none" stroke="#000"/>`),

    drive: svg(`<rect x="3" y="11" width="26" height="11" fill="#c0c0c0" stroke="#000"/>
      <rect x="5" y="13" width="14" height="7" fill="#9a9a9a"/>
      <circle cx="25" cy="19" r="1.5" fill="#2e9b3f"/>`),

    floppy: svg(`<rect x="5" y="5" width="22" height="22" fill="#2b2b2b" stroke="#000"/>
      <rect x="10" y="5" width="12" height="9" fill="#c0c0c0" stroke="#000"/>
      <rect x="13" y="6" width="4" height="7" fill="#6a6a6a"/>
      <rect x="9" y="17" width="14" height="10" fill="#dcdcdc" stroke="#000"/>`),

    cd: svg(`<circle cx="16" cy="16" r="12" fill="#d8d8d8" stroke="#000"/>
      <circle cx="16" cy="16" r="9" fill="#b9c9d6"/>
      <circle cx="16" cy="16" r="3" fill="#fff" stroke="#000"/>`),

    help: svg(`<circle cx="16" cy="16" r="12" fill="#1a4fbf" stroke="#000"/>
      <text x="16" y="23" font-family="Tahoma,sans-serif" font-size="17" font-weight="700"
        fill="#fff" text-anchor="middle" shape-rendering="auto">?</text>`),

    run: svg(`<rect x="4" y="7" width="24" height="18" fill="#c0c0c0" stroke="#000"/>
      <rect x="4" y="7" width="24" height="4" fill="#000080"/>
      <rect x="7" y="14" width="18" height="8" fill="#fff" stroke="#808080"/>
      <path d="M9 18h9" stroke="#000"/>`),

    power: svg(`<circle cx="16" cy="16" r="11" fill="#c0c0c0" stroke="#000"/>
      <path d="M16 8v9" stroke="#c00" stroke-width="3"/>
      <path d="M10 12a8 8 0 1 0 12 0" fill="none" stroke="#000" stroke-width="2"/>`),

    key: svg(`<circle cx="11" cy="16" r="6" fill="none" stroke="#b8860b" stroke-width="3"/>
      <path d="M16 16h12M24 16v5M20 16v4" stroke="#b8860b" stroke-width="3"/>`),

    gear: svg(`<circle cx="16" cy="16" r="8" fill="#9a9a9a" stroke="#000"/>
      <circle cx="16" cy="16" r="3" fill="#dcdcdc" stroke="#000"/>
      <g fill="#9a9a9a" stroke="#000"><rect x="14" y="3" width="4" height="5"/>
      <rect x="14" y="24" width="4" height="5"/><rect x="3" y="14" width="5" height="4"/>
      <rect x="24" y="14" width="5" height="4"/></g>`),

    find: svg(`<circle cx="14" cy="14" r="8" fill="#bfe0f5" stroke="#000" stroke-width="2"/>
      <path d="M20 20l7 7" stroke="#000" stroke-width="3"/>`),

    mine: svg(`<rect x="3" y="3" width="26" height="26" fill="#c0c0c0" stroke="#000"/>
      <circle cx="16" cy="17" r="7" fill="#000"/>
      <path d="M16 6v5M9 10l3 3M23 10l-3 3" stroke="#000" stroke-width="2"/>
      <circle cx="13" cy="14" r="2" fill="#fff"/>`),

    speaker: svg(`<path d="M4 12h5l6-5v18l-6-5H4z" fill="#000"/>
      <path d="M20 10a8 8 0 0 1 0 12M24 7a13 13 0 0 1 0 18" fill="none" stroke="#000" stroke-width="2"/>`),
  };

  /* ── §2 · APPS ──────────────────────────────────────────
     ✎ Window contents live here. Same portfolio material as the
     terminal channels, wearing a different shell. */

  const ABOUT_TEXT = [
    "I'm an engineering student who got pulled into this by a radio and a",
    'soldering iron, and never really left. Most of what I build sits on',
    'the seam between a physical device and the person trying to understand',
    'it - firmware on one end, a legible interface on the other.',
    '',
    'Right now I spend my time on satellite ground-station software,',
    'geospatial data pipelines, and the unglamorous plumbing that keeps',
    'telemetry flowing when the pass is only eleven minutes long.',
    '',
    'Based in Mumbai, IN (UTC+5:30). Currently open to internships.',
    '',
    '-- this file is editable, and nothing is saved anywhere.',
  ].join('\n');

  const APPS = {
    mycomputer: { title: 'My Computer', icon: 'computer', w: 430, h: 260, body: `
      <div class="w98list">
        ${item('floppy', '3½ Floppy (A:)')}
        ${item('drive', '(C:)')}
        ${item('cd', '(D:)')}
        ${item('gear', 'Control Panel')}
        ${item('chip', 'Dial-Up Networking')}
      </div>`,
      status: ['5 object(s)', '1.44 MB free'] },

    about: { title: 'About Me.txt - Notepad', label: 'About Me.txt', icon: 'doc',
      w: 470, h: 310, menubar: true, pane: true, flush: true,
      body: '<textarea class="w98edit" spellcheck="false" aria-label="About Me.txt">'
        + ABOUT_TEXT + '</textarea>' },

    projects: { title: 'Projects', icon: 'folder', w: 420, h: 250, body: `
      <div class="w98list">
        ${item('doc', 'SomaiyaSAT.prj', 'proj1')}
        ${item('doc', 'Climate Atlas.prj', 'proj2')}
        ${item('doc', 'WX-Relay.prj', 'proj3')}
        ${item('doc', 'Untitled.prj', 'proj4')}
      </div>`,
      status: ['4 object(s)', '  '] },

    proj1: { title: 'SomaiyaSAT Ground Station', icon: 'doc', w: 430, h: 250, pane: true, body: `
      <h4>SomaiyaSAT Ground Station — 2025</h4>
      <p>Web console for a student CubeSat program: live pass prediction, decoded
         telemetry, and a command queue that survives a dropped link.</p>
      <p><b>Built with:</b> Next.js, Python, WebSocket, SGP4<br>
         <b>Status:</b> Live</p>` },
    proj2: { title: 'Climate Atlas', icon: 'doc', w: 430, h: 250, pane: true, body: `
      <h4>Climate Atlas — 2025</h4>
      <p>Geospatial dashboard over four decades of station data. PostGIS on the
         back, tiled vector rendering on the front, no loading spinner longer
         than a heartbeat.</p>
      <p><b>Built with:</b> PostGIS, FastAPI, MapLibre<br>
         <b>Status:</b> Live</p>` },
    proj3: { title: 'WX-Relay', icon: 'doc', w: 430, h: 250, pane: true, body: `
      <h4>WX-Relay — 2024</h4>
      <p>Solar-powered weather node that reports over LoRa. Sleeps at 40 µA,
         wakes on the quarter hour, and has not needed a battery swap since the
         day it went up.</p>
      <p><b>Built with:</b> ESP32, LoRa, C++<br>
         <b>Status:</b> Archived</p>` },
    proj4: { title: 'Untitled.prj', icon: 'doc', w: 400, h: 210, pane: true, body: `
      <h4>Untitled — in fabrication</h4>
      <p>Placeholder slot. Swap in whatever you're mid-way through; the desktop
         reads better with something unfinished on it.</p>` },

    skills: { title: 'Device Manager', icon: 'chip', w: 400, h: 300, pane: true, body: `
      <ul class="w98tree">
        <li><b>${I.computer.replace('32" height="32', '16" height="16')} KVD-4400</b>
          <ul>
            <li>Embedded — C, C++, ESP32, STM32, FreeRTOS</li>
            <li>Web — TypeScript, React, Next.js, Tailwind</li>
            <li>Data — Python, pandas, PostgreSQL, PostGIS</li>
            <li>Radio — GNU Radio, SDR, LoRa, packet decode</li>
            <li>Infrastructure — Docker, Linux, Git, CI</li>
            <li>Rust — driver loading, 61% complete</li>
          </ul>
        </li>
      </ul>` },

    contact: { title: 'Contact', icon: 'mail', w: 400, h: 220, pane: true, body: `
      <p>The station listens on all of these. Mail gets the fastest reply.</p>
      <dl class="w98fields">
        <dt>Mail</dt><dd><a href="mailto:mannkuvadiya2006@gmail.com">mannkuvadiya2006@gmail.com</a></dd>
        <dt>GitHub</dt><dd><a href="#">github.com/…</a></dd>
        <dt>LinkedIn</dt><dd><a href="#">linkedin.com/in/…</a></dd>
        <dt>Résumé</dt><dd><a href="#">resume.pdf</a></dd>
      </dl>` },

    bin: { title: 'Recycle Bin', icon: 'bin', w: 360, h: 190, body:
      `<p style="padding:16px;text-align:center;color:#555">This folder is empty.</p>`,
      status: ['0 object(s)', '0 bytes'] },

    help: { title: 'Help', icon: 'help', w: 400, h: 250, pane: true, body: `
      <h4>Using this desktop</h4>
      <p>• <b>Double-click</b> an icon to open it (or press Enter when it's focused).<br>
         • Drag a window by its title bar.<br>
         • Use the taskbar buttons to switch between open windows.<br>
         • <b>Start ▸ Shut Down</b> returns you to the terminal.<br>
         • <b>Esc</b> closes the front window.</p>
      <p>You reached this session as GUEST. Admin access is not available.</p>` },

    run: { title: 'Run', icon: 'run', w: 395, h: 205, body: `
      <p>Type the name of a program, folder, or document, and Windows will
         open it for you.</p>
      <div class="w98row"><label for="runIn">Open:</label>
        <input class="w98input" id="runIn" spellcheck="false" autocomplete="off"></div>
      <p class="w98out" data-out></p>
      <div class="w98btns"><button class="w98btn" data-go>OK</button>
        <button class="w98btn" data-cancel>Cancel</button></div>`,
      init: initRun },

    display: { title: 'Display Properties', icon: 'gear', w: 335, h: 350, body: `
      <div class="w98mon"><i data-preview></i></div>
      <h4>Background</h4>
      <div class="w98swatches" data-swatches></div>
      <p style="margin-top:10px;color:#404040">Pick a desktop colour.
         It applies straight away.</p>`,
      init: initDisplay },

    mines: { title: 'Minesweeper', icon: 'mine', w: 252, h: 335, body: `
      <div class="ms">
        <div class="ms__head">
          <span class="ms__lcd" data-lcd="mines">010</span>
          <button class="ms__face" data-face aria-label="New game">:)</button>
          <span class="ms__lcd" data-lcd="time">000</span>
        </div>
        <div class="ms__grid" data-grid></div>
        <p class="ms__msg" data-msg></p>
      </div>`,
      init: initMines },
  };

  function item(icon, label, opens) {
    return `<button class="w98item" ${opens ? `data-open="${opens}"` : ''}>${I[icon]}<span>${label}</span></button>`;
  }

  /* desktop layout, in order */
  const DESKTOP = ['mycomputer', 'about', 'projects', 'skills', 'contact', 'mines', 'bin'];

  /* ── §3 · GATE + ADMIN LOGIN ────────────────────────────
     The login is inert: it never sends anything anywhere and it
     always refuses. Nothing is stored or transmitted. */

  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  function openGate() {
    stopTimers();
    body.classList.add('is-alt');
    hide(login); hide(osboot); hide(splash); hide(w98);
    show(gate);
    kvd().burst?.(340);
    defer(() => $('#gateAdmin').focus({ preventScroll: true }));
  }

  function backToTerminal() {
    stopTimers();
    [gate, login, osboot, splash, w98].forEach(hide);
    body.classList.remove('is-alt', 'is-win98');
    hideCtx();
    kvd().restoreWarp?.();
    kvd().burst?.(380);
    closeMenu();
    document.querySelector('#tab-comms')?.focus({ preventScroll: true });
  }

  document.addEventListener('kvd:gate', openGate);
  $('#gateBack').addEventListener('click', backToTerminal);

  $('#gateAdmin').addEventListener('click', () => {
    hide(gate); show(login);
    $('#loginMsg').textContent = '';
    $('#loginMsg').classList.remove('is-deny');
    $('#luser').value = ''; $('#lpass').value = '';
    defer(() => $('#luser').focus({ preventScroll: true }));
  });

  $('#loginCancel').addEventListener('click', () => { hide(login); show(gate); $('#gateAdmin').focus(); });

  let attempts = 0;
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('#loginMsg');
    const go = $('#loginGo');
    go.disabled = true;
    msg.classList.remove('is-deny');
    msg.textContent = 'AUTHENTICATING…';
    setTimeout(() => {
      attempts++;
      msg.classList.add('is-deny');
      msg.textContent = `ACCESS DENIED — credentials rejected (attempt ${attempts})`;
      $('#lpass').value = '';
      go.disabled = false;
      kvd().burst?.(260);
      $('#lpass').focus({ preventScroll: true });
    }, 900);
  });

  $('#gateGuest').addEventListener('click', () => { ensureAudio(); startGuest(); });

  /* ── STARTUP CHIME ──────────────────────────────────────
     Synthesised, not sampled: a rising D-major figure over a warm pad.
     The real Windows 98 sound is Microsoft's copyrighted asset and is not
     shipped here — this is an original stand-in with the same shape.
     The AudioContext is created on the GUEST click so autoplay policy
     lets it through; playChime() then just schedules notes. */

  let ac = null;
  let muted = false;
  try { muted = localStorage.getItem('kvd-mute') === '1'; } catch (_) {}

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!ac) ac = new AC();
      if (ac.state === 'suspended') ac.resume();
    } catch (_) { ac = null; }
  }

  function playChime() {
    if (!ac || muted || calm.matches) return;
    const t0 = ac.currentTime + 0.06;
    const out = ac.createGain();
    out.gain.value = 0.85;
    out.connect(ac.destination);

    // pad underneath
    const pad = ac.createGain();
    pad.gain.setValueAtTime(0.0001, t0);
    pad.gain.linearRampToValueAtTime(0.075, t0 + 0.7);
    pad.gain.linearRampToValueAtTime(0.0001, t0 + 3.5);
    pad.connect(out);
    [146.83, 220.00].forEach(hz => {
      const o = ac.createOscillator();
      o.type = 'sine'; o.frequency.value = hz;
      o.connect(pad); o.start(t0); o.stop(t0 + 3.6);
    });

    // rising figure, two slightly detuned voices per note for body
    [[0, 293.66], [0.30, 440.00], [0.60, 587.33], [1.00, 880.00]].forEach(pair => {
      const dt = pair[0], hz = pair[1];
      [0, 2.2].forEach(detune => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'triangle';
        o.frequency.value = hz + detune;
        const s0 = t0 + dt;
        g.gain.setValueAtTime(0.0001, s0);
        g.gain.linearRampToValueAtTime(0.15, s0 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0008, s0 + 2.1);
        o.connect(g); g.connect(out);
        o.start(s0); o.stop(s0 + 2.2);
      });
    });
  }

  /* ── §4 · OS BOOT ───────────────────────────────────────── */

  const OS_LINES = [
    '<i>KVD-DOS 7.10 — guest loader</i>',
    '',
    'HIMEM is testing extended memory ... <b>done</b>',
    'C:\\&gt; guest /nopass',
    '   session profile ....... <b>GUEST</b>',
    '   permissions ........... <b>READ-ONLY</b>',
    '   home ................ A:\\PORTFOLIO',
    '',
    'C:\\&gt; win',
    'Starting Windows 98 ...',
  ];

  function startGuest() {
    stopTimers();
    hide(gate); hide(login);
    body.classList.add('is-alt');

    if (calm.matches) { showSplash(); return; }

    osLog.innerHTML = '';
    show(osboot);
    kvd().burst?.(300);

    let i = 0;
    const tick = () => {
      osLog.innerHTML = OS_LINES.slice(0, ++i).join('\n');
      if (i < OS_LINES.length) after(OS_LINES[i - 1] === '' ? 40 : 90 + Math.random() * 120, tick);
      else after(700, showSplash);
    };
    after(160, tick);
  }

  /* ── §5 · SPLASH ────────────────────────────────────────── */

  function showSplash() {
    hide(osboot);
    // the tube switches to colour here, and the bend eases off so the
    // desktop's pointer targets stay honest
    body.classList.add('is-win98');
    kvd().setWarpScale?.(30);   // low enough that 12px UI text stays crisp
    show(splash);
    kvd().burst?.(280);
    playChime();
    after(calm.matches ? 400 : 2400, showDesktop);
  }

  /* ── §6 · WINDOW MANAGER ────────────────────────────────── */

  let zTop = 20;
  let cascade = 0;
  const open = new Map();          // id -> { win, task }

  function focusWin(id) {
    open.forEach((rec, key) => {
      const on = key === id;
      rec.win.classList.toggle('is-blur', !on);
      rec.task.classList.toggle('is-on', on);
    });
    const rec = open.get(id);
    if (rec) rec.win.style.zIndex = ++zTop;
  }

  function openApp(id) {
    const app = APPS[id];
    if (!app) return;
    if (open.has(id)) {
      const rec = open.get(id);
      rec.win.hidden = false;
      focusWin(id);
      return;
    }

    const win = document.createElement('div');
    win.className = 'w98win';

    // Never larger than the tube it lives in — a 460px window on a phone
    // hung 70px off the right edge.
    const bounds = winLayer.getBoundingClientRect();
    const w = Math.max(170, Math.min(app.w, bounds.width - 16));
    const h = Math.max(110, Math.min(app.h, bounds.height - 16));
    win.style.width = w + 'px';
    win.style.height = h + 'px';

    // cascade, wrapping before it walks off the desktop
    const step = 24;
    const startX = Math.min(96, bounds.width * 0.12);   // clear of the icon column
    const maxSteps = Math.max(1, Math.floor((bounds.height - h - 40) / step));
    const n = cascade++ % Math.max(1, Math.min(6, maxSteps));
    const left = Math.max(8, Math.min(startX + n * step, bounds.width - w - 8));
    const top = Math.max(8, Math.min(20 + n * step, bounds.height - h - 8));
    win.style.left = left + 'px';
    win.style.top = top + 'px';
    win.style.zIndex = ++zTop;

    win.innerHTML = `
      <div class="w98title">
        ${I[app.icon].replace('width="32" height="32"', 'width="14" height="14"')}
        <b>${app.title}</b>
        <button class="w98tbtn" data-act="min" aria-label="Minimize">_</button>
        <button class="w98tbtn" data-act="max" aria-label="Maximize">□</button>
        <button class="w98tbtn" data-act="close" aria-label="Close">✕</button>
      </div>
      ${app.menubar ? `<div class="w98menubar"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>S</u>earch</span><span><u>H</u>elp</span></div>` : ''}
      <div class="w98body${app.pane ? ' pane' : ''}"${app.flush ? ' style="padding:0"' : ''}>${app.body}</div>
      ${app.status ? `<div class="w98status">${app.status.map(t => `<i>${t}</i>`).join('')}</div>` : ''}`;

    winLayer.appendChild(win);

    const task = document.createElement('button');
    task.className = 'w98task';
    task.innerHTML = `${I[app.icon].replace('width="32" height="32"', 'width="13" height="13"')}<span>${app.title}</span>`;
    taskbar.appendChild(task);

    open.set(id, { win, task });

    task.addEventListener('click', () => {
      if (win.hidden) { win.hidden = false; focusWin(id); }
      else if (task.classList.contains('is-on')) win.hidden = true;
      else focusWin(id);
    });

    win.addEventListener('pointerdown', () => focusWin(id));

    win.querySelector('[data-act="close"]').addEventListener('click', e => {
      e.stopPropagation(); closeApp(id);
    });
    win.querySelector('[data-act="min"]').addEventListener('click', e => {
      e.stopPropagation(); win.hidden = true; task.classList.remove('is-on');
    });
    win.querySelector('[data-act="max"]').addEventListener('click', e => {
      e.stopPropagation(); toggleMax(win);
    });

    win.querySelector('.w98title').addEventListener('dblclick', () => toggleMax(win));

    dragify(win);
    resizify(win);
    app.init?.(win, id);

    win.querySelectorAll('[data-open]').forEach(b => {
      b.addEventListener('dblclick', () => openApp(b.dataset.open));
      b.addEventListener('keydown', ev => { if (ev.key === 'Enter') openApp(b.dataset.open); });
    });
    win.querySelectorAll('.w98item').forEach(b => {
      b.addEventListener('click', () => {
        win.querySelectorAll('.w98item').forEach(o => o.classList.remove('is-sel'));
        b.classList.add('is-sel');
      });
    });

    focusWin(id);
  }

  function closeApp(id) {
    const rec = open.get(id);
    if (!rec) return;
    rec.win._cleanup?.();          // stop any interval the app started
    rec.win.remove(); rec.task.remove();
    open.delete(id);
    const last = [...open.keys()].pop();
    if (last) focusWin(last);
  }

  function toggleMax(win) {
    if (win.dataset.prev) {
      const p = JSON.parse(win.dataset.prev);
      Object.assign(win.style, p);
      delete win.dataset.prev;
    } else {
      win.dataset.prev = JSON.stringify({
        left: win.style.left, top: win.style.top,
        width: win.style.width, height: win.style.height,
      });
      Object.assign(win.style, { left: '0px', top: '0px', width: '100%', height: '100%' });
    }
    win.classList.toggle('is-max', !!win.dataset.prev);
  }

  /* drag the bottom-right grip to resize */
  function resizify(win) {
    const grip = document.createElement('div');
    grip.className = 'w98grip';
    win.appendChild(grip);

    let sx = 0, sy = 0, sw = 0, sh = 0, on = false;

    grip.addEventListener('pointerdown', e => {
      if (win.dataset.prev) return;
      on = true;
      sx = e.clientX; sy = e.clientY;
      sw = win.offsetWidth; sh = win.offsetHeight;
      grip.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    grip.addEventListener('pointermove', e => {
      if (!on) return;
      const b = winLayer.getBoundingClientRect();
      const maxW = b.width - win.offsetLeft - 4;
      const maxH = b.height - win.offsetTop - 4;
      win.style.width  = Math.max(180, Math.min(sw + (e.clientX - sx), maxW)) + 'px';
      win.style.height = Math.max(110, Math.min(sh + (e.clientY - sy), maxH)) + 'px';
    });
    const end = e => {
      if (!on) return;
      on = false;
      try { grip.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  }

  function dragify(win) {
    const bar = win.querySelector('.w98title');
    let dx = 0, dy = 0, dragging = false;

    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.w98tbtn')) return;
      if (win.dataset.prev) return;              // don't drag while maximised
      dragging = true;
      const r = win.getBoundingClientRect();
      const p = winLayer.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      win._p = p;
    });

    bar.addEventListener('pointermove', e => {
      if (!dragging) return;
      const p = win._p;
      let x = e.clientX - p.left - dx;
      let y = e.clientY - p.top - dy;
      // keep a grabbable strip on screen in every direction
      x = Math.max(-win.offsetWidth + 70, Math.min(x, p.width - 70));
      y = Math.max(0, Math.min(y, p.height - 24));
      win.style.left = x + 'px';
      win.style.top = y + 'px';
    });

    const end = e => {
      if (!dragging) return;
      dragging = false;
      try { bar.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  }

  /* ── §6b · APP LOGIC ────────────────────────────────────── */

  /* Run: a small command map, so the box actually does something */
  const RUN_CMDS = {
    notepad: 'about', 'about me.txt': 'about', 'about.txt': 'about',
    explorer: 'projects', projects: 'projects',
    winmine: 'mines', minesweeper: 'mines', mines: 'mines',
    control: 'display', 'control panel': 'display', display: 'display',
    devmgr: 'skills', 'device manager': 'skills',
    mail: 'contact', contact: 'contact',
    help: 'help', 'my computer': 'mycomputer', sol: 'mines',
  };

  function initRun(win) {
    const input = win.querySelector('.w98input');
    const out = win.querySelector('[data-out]');

    const go = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return;
      const target = RUN_CMDS[q];
      if (target) {
        out.textContent = '';
        openApp(target);
      } else {
        out.innerHTML = '<b>Cannot find the file ' + esc(input.value.trim()) +
          '.</b><br>Make sure the path and filename are correct.';
      }
    };

    win.querySelector('[data-go]').addEventListener('click', go);
    win.querySelector('[data-cancel]').addEventListener('click', () => closeApp('run'));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    defer(() => input.focus());
  }

  const esc = t => t.replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Display Properties: recolours the desktop for real */
  const WALLS = ['#008080', '#000000', '#3a6ea5', '#808080', '#004040',
                 '#5c5c8a', '#7f0000', '#404080', '#008040', '#c0c0c0'];

  function initDisplay(win) {
    const box = win.querySelector('[data-swatches]');
    const prev = win.querySelector('[data-preview]');
    const current = () => w98.style.getPropertyValue('--desk') || '#008080';

    box.innerHTML = WALLS.map(c =>
      '<button style="background:' + c + '" data-c="' + c + '" aria-pressed="' +
      (c === current() ? 'true' : 'false') + '" aria-label="' + c + '"></button>').join('');
    prev.style.background = current();

    box.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        w98.style.setProperty('--desk', b.dataset.c);
        prev.style.background = b.dataset.c;
        box.querySelectorAll('button').forEach(o =>
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      });
    });
  }

  /* Minesweeper: 9x9, 10 mines, first click is always safe */
  function initMines(win) {
    const N = 9, TOTAL = 10;
    const grid = win.querySelector('[data-grid]');
    const lcdM = win.querySelector('[data-lcd="mines"]');
    const lcdT = win.querySelector('[data-lcd="time"]');
    const face = win.querySelector('[data-face]');
    const msg  = win.querySelector('[data-msg]');

    let mine, shown, flag, started, over, secs, tick = 0;
    const pad3 = n => String(Math.max(0, Math.min(999, n))).padStart(3, '0');

    const nbrs = i => {
      const r = Math.floor(i / N), c = i % N, out = [];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push(nr * N + nc);
        }
      return out;
    };
    const near = i => nbrs(i).filter(j => mine[j]).length;

    function reset() {
      mine = new Array(N * N).fill(false);
      shown = new Array(N * N).fill(false);
      flag = new Array(N * N).fill(false);
      started = false; over = false; secs = 0;
      clearInterval(tick); tick = 0;
      lcdT.textContent = pad3(0);
      msg.textContent = '';
      face.textContent = ':)';
      render();
    }

    function seed(safe) {
      const banned = new Set([safe].concat(nbrs(safe)));
      let placed = 0;
      while (placed < TOTAL) {
        const i = Math.floor(Math.random() * N * N);
        if (mine[i] || banned.has(i)) continue;
        mine[i] = true; placed++;
      }
    }

    function reveal(i) {
      if (shown[i] || flag[i]) return;
      shown[i] = true;
      if (mine[i]) { lose(); return; }
      if (near(i) === 0) nbrs(i).forEach(reveal);
    }

    function lose() {
      over = true;
      clearInterval(tick);
      face.textContent = ':(';
      msg.textContent = 'Boom. Click the face to retry.';
      mine.forEach((m, i) => { if (m) shown[i] = true; });
    }

    function checkWin() {
      const safe = shown.filter((v, i) => v && !mine[i]).length;
      if (safe !== N * N - TOTAL) return;
      over = true;
      clearInterval(tick);
      face.textContent = 'B)';
      msg.textContent = 'Cleared in ' + secs + 's.';
      flag = mine.slice();
    }

    function render() {
      lcdM.textContent = pad3(TOTAL - flag.filter(Boolean).length);
      grid.innerHTML = shown.map((open, i) => {
        if (!open) {
          return '<button class="ms__c" data-i="' + i + '">' +
                 (flag[i] ? '&#9873;' : '') + '</button>';
        }
        if (mine[i]) return '<button class="ms__c is-open is-mine" data-i="' + i + '">*</button>';
        const n = near(i);
        return '<button class="ms__c is-open" data-i="' + i + '" data-n="' + n + '">' +
               (n || '') + '</button>';
      }).join('');
    }

    function startClock() {
      if (started) return;
      started = true;
      tick = setInterval(() => { secs++; lcdT.textContent = pad3(secs); }, 1000);
    }

    grid.addEventListener('contextmenu', e => e.preventDefault());

    grid.addEventListener('pointerdown', e => {
      const cell = e.target.closest('.ms__c');
      if (!cell || over) return;
      const i = +cell.dataset.i;

      if (e.button === 2) {                     // right click toggles a flag
        if (!shown[i]) { flag[i] = !flag[i]; render(); }
        return;
      }
      if (e.button !== 0) return;
      if (flag[i]) return;
      if (!started) { seed(i); startClock(); }
      reveal(i);
      if (!over) checkWin();
      render();
    });

    face.addEventListener('click', reset);
    win._cleanup = () => clearInterval(tick);
    reset();
  }

  /* ── §6c · DESKTOP CONTEXT MENU ──────────────────────────── */

  let ctxEl = null;
  let iconOrder = null;

  function buildCtx() {
    ctxEl = document.createElement('div');
    ctxEl.className = 'w98ctx';
    ctxEl.hidden = true;
    ctxEl.innerHTML =
      '<button data-a="sort">Arrange Icons by Name</button>' +
      '<button data-a="reset">Line up Icons</button>' +
      '<button data-a="refresh">Refresh</button>' +
      '<hr><button disabled>New</button><hr>' +
      '<button data-a="props">Properties</button>';
    w98.appendChild(ctxEl);

    ctxEl.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      hideCtx();
      const a = b.dataset.a;
      if (a === 'sort') {
        iconOrder = DESKTOP.slice().sort((x, y) =>
          (APPS[x].label || APPS[x].title).localeCompare(APPS[y].label || APPS[y].title));
        renderIcons();
      } else if (a === 'reset') {
        iconOrder = null; renderIcons();
      } else if (a === 'refresh') {
        renderIcons(); kvd().burst?.(200);
      } else if (a === 'props') {
        openApp('display');
      }
    });
  }

  function showCtx(x, y) {
    ctxEl.hidden = false;
    const b = w98.getBoundingClientRect();
    const r = ctxEl.getBoundingClientRect();
    ctxEl.style.left = Math.min(x - b.left, b.width - r.width - 6) + 'px';
    ctxEl.style.top = Math.min(y - b.top, b.height - r.height - 46) + 'px';
  }
  function hideCtx() { if (ctxEl) ctxEl.hidden = true; }

  /* ── §7 · DESKTOP ───────────────────────────────────────── */

  let deskBuilt = false;

  function buildDesktop() {
    if (deskBuilt) return;
    deskBuilt = true;

    renderIcons();
    buildCtx();

    desk.addEventListener('contextmenu', e => {
      if (e.target !== desk && !e.target.closest('.w98icon')) return;
      e.preventDefault();
      showCtx(e.clientX, e.clientY);
    });
    w98.addEventListener('pointerdown', e => {
      if (!ctxEl || ctxEl.hidden) return;
      if (!e.target.closest('.w98ctx')) hideCtx();
    });
    // clicking bare desktop clears selection and dismisses the menu
    desk.addEventListener('pointerdown', e => {
      if (e.target === desk) {
        desk.querySelectorAll('.w98icon').forEach(o => o.classList.remove('is-sel'));
        closeMenu();
      }
    });

    buildMenu();
    buildSpeaker();
    tickClock();
    setInterval(tickClock, 15000);
  }

  function renderIcons() {
    const list = iconOrder || DESKTOP;
    desk.innerHTML = list.map(id =>
      `<button class="w98icon" data-app="${id}">${I[APPS[id].icon]}` +
      `<span>${APPS[id].label || APPS[id].title}</span></button>`
    ).join('');

    desk.querySelectorAll('.w98icon').forEach(b => {
      b.addEventListener('click', () => {
        desk.querySelectorAll('.w98icon').forEach(o => o.classList.remove('is-sel'));
        b.classList.add('is-sel');
      });
      b.addEventListener('dblclick', () => openApp(b.dataset.app));
      b.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openApp(b.dataset.app); }
      });
    });
  }

  function tickClock() {
    if (!clockEl) return;
    clockEl.textContent = new Date()
      .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      .replace(/\s/g, ' ');
  }

  function buildSpeaker() {
    const tray = clockEl?.parentElement;
    if (!tray || tray.querySelector('.w98spk')) return;
    const b = document.createElement('button');
    b.className = 'w98spk';
    b.innerHTML = I.speaker.replace('width="32" height="32"', 'width="15" height="15"');
    b.setAttribute('aria-pressed', muted ? 'true' : 'false');
    b.title = muted ? 'Sound off' : 'Sound on';
    b.addEventListener('click', () => {
      muted = !muted;
      b.setAttribute('aria-pressed', muted ? 'true' : 'false');
      b.title = muted ? 'Sound off' : 'Sound on';
      try { localStorage.setItem('kvd-mute', muted ? '1' : '0'); } catch (_) {}
      if (!muted) { ensureAudio(); playChime(); }
    });
    tray.insertBefore(b, clockEl);
  }

  function showDesktop() {
    hide(splash);
    buildDesktop();
    show(w98);
    kvd().burst?.(240);
    const first = desk.querySelector('.w98icon');
    if (first) first.focus({ preventScroll: true });
  }

  /* ── §8 · START MENU ────────────────────────────────────── */

  const MENU = [
    { label: 'Programs',   icon: 'folder',   act: () => openApp('projects') },
    { label: 'Documents',  icon: 'doc',      act: () => openApp('about') },
    { label: 'Minesweeper', icon: 'mine',    act: () => openApp('mines') },
    { label: 'Settings',   icon: 'gear',     act: () => openApp('display') },
    { label: 'Find',       icon: 'find',     act: () => openApp('skills') },
    { label: 'Help',       icon: 'help',     act: () => openApp('help') },
    { label: 'Run...',     icon: 'run',      act: () => openApp('run') },
    { rule: true },
    { label: 'Log Off Guest…', icon: 'key',   act: openGate },
    { label: 'Shut Down…',     icon: 'power', act: backToTerminal },
  ];

  function buildMenu() {
    menu.innerHTML = `
      <div class="w98menu__rail"><b>Windows<em>98</em></b></div>
      <div class="w98menu__items">
        ${MENU.map((m, i) => m.rule
          ? `<div class="w98mi w98mi--rule"></div>`
          : `<button class="w98mi" data-i="${i}">${I[m.icon].replace('width="32" height="32"', 'width="20" height="20"')}${m.label}</button>`
        ).join('')}
      </div>`;

    menu.querySelectorAll('.w98mi[data-i]').forEach(b => {
      b.addEventListener('click', () => {
        closeMenu();
        MENU[+b.dataset.i].act();
      });
    });
  }

  function openMenu() { menu.hidden = false; startBtn.setAttribute('aria-expanded', 'true'); }
  function closeMenu() { menu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }

  startBtn.addEventListener('click', e => {
    e.stopPropagation();
    menu.hidden ? openMenu() : closeMenu();
  });
  document.addEventListener('pointerdown', e => {
    if (menu.hidden) return;
    if (e.target.closest('#w98Menu') || e.target.closest('#w98Start')) return;
    closeMenu();
  });

  /* ── §9 · KEYS ──────────────────────────────────────────── */

  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!menu.hidden) { closeMenu(); return; }
    if (!w98.hidden && open.size) {
      const top = [...open.entries()]
        .sort((a, b) => (+a[1].win.style.zIndex) - (+b[1].win.style.zIndex)).pop();
      if (top) closeApp(top[0]);
      return;
    }
    if (!login.hidden) { hide(login); show(gate); $('#gateAdmin').focus(); return; }
    if (!gate.hidden) backToTerminal();
  });
})();
