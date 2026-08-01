/* ═══════════════════════════════════════════════════════════
   KVD-4400 — terminal firmware

   §1 barrel warp map    §2 interference canvas
   §3 cold-start         §4 boot sequence   §5 typewriter
   §6 channel tuning     §7 power           §8 phosphor
   §9 telemetry          §10 spectrum
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm  = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  const body     = document.body;
  const glass    = $('#glass');
  const boot     = $('#boot');
  const bootLog  = $('#bootLog');
  const bootHint = $('#bootHint');
  const standby  = $('#standby');
  const scroll   = $('#scroll');
  const tabs     = $$('.chan');
  const panels   = tabs.map(t => $('#' + t.dataset.target));

  let powered = true;
  let timers = [];
  let coldDone = false;
  let redrawStill = null;

  const after = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  /* ── §1 · BARREL WARP MAP ───────────────────────────────
     feDisplacementMap reads x-offset from R and y-offset from G:
       out(x,y) = src( x + S*(R-.5), y + S*(G-.5) )
     A barrel lens samples inward as radius grows, which pushes the
     image outward — straight lines bow, exactly like a real tube.
     S must match the `scale` on the filter in index.html. */

  // Bend strength. Raising this also widens the safe area the content
  // needs — see setSafeArea() below. Tuned to a late-model near-flat
  // computer tube: present, but nothing like a 70s TV.
  const WARP_K = 0.022;
  const WARP_S = 120;     // px, == feDisplacementMap scale
  const warpMap = $('#warpMap');

  // feImage in an HTML-element filter is unreliable in WebKit; the page is
  // designed to stand up without the bend, so opt out rather than risk a
  // blank layer.
  const isWebKit = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
  const canWarp  = !isWebKit && 'SVGFEDisplacementMapElement' in window;

  function buildWarpMap() {
    if (!canWarp) return;
    const W = glass.clientWidth, H = glass.clientHeight;
    if (!W || !H) return;

    // Resolution matters: at 160 the upscaled map's own interpolation
    // visibly shredded 1-2px rules and small text near the tube edges.
    const MW = 420, MH = Math.max(2, Math.round(MW * H / W));
    const c = document.createElement('canvas');
    c.width = MW; c.height = MH;
    const g = c.getContext('2d');
    const img = g.createImageData(MW, MH);
    const d = img.data;

    for (let j = 0; j < MH; j++) {
      const v = ((j + 0.5) / MH) * 2 - 1;
      for (let i = 0; i < MW; i++) {
        const u = ((i + 0.5) / MW) * 2 - 1;
        const f = 1 / (1 + WARP_K * (u * u + v * v));
        const dx = (u * f - u) * (W / 2);
        const dy = (v * f - v) * (H / 2);
        const k = (j * MW + i) * 4;
        d[k]     = clamp(Math.round(127.5 + 255 * dx / WARP_S), 0, 255);
        d[k + 1] = clamp(Math.round(127.5 + 255 * dy / WARP_S), 0, 255);
        d[k + 2] = 0;
        d[k + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    const url = c.toDataURL();
    warpMap.setAttribute('href', url);
    warpMap.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
    warpMap.setAttribute('x', 0);
    warpMap.setAttribute('y', 0);
    warpMap.setAttribute('width', W);
    warpMap.setAttribute('height', H);
    body.classList.add('is-warped');
  }

  /* ── §1b · SAFE AREA ────────────────────────────────────
     Measured against the real clip path, not guessed as a percentage.

     Two effects push content off a curved tube and they compound: the
     barrel filter displaces it outward, and only then does #tubeShape
     cut the corners away. Their ratio moves with the viewport's aspect
     and with the bend strength — which OS mode drops to a quarter — so
     one fixed percentage was clipping the taskbar and a maximised title
     bar at every size. Sampling the path costs a few hundred point
     tests on resize and is right by construction.

       --warp-x / --warp-y   largest centred rectangle that fits, as an
                             equal pixel margin on both axes
       --edge-x              horizontal inset for anything pinned to the
                             very top or bottom edge, where the corner
                             bites hardest: taskbar, statusline, the
                             title bar of a maximised window */

  const SVGNS = 'http://www.w3.org/2000/svg';
  let probe = null, probePt = null;
  let warpScale = WARP_S;          // live feDisplacementMap scale

  function buildProbe() {
    if (probe) return;
    const src = $('#tubeShape path');
    const host = $('.defs');
    if (!src || !host) return;
    probe = document.createElementNS(SVGNS, 'path');
    probe.setAttribute('d', src.getAttribute('d'));
    host.appendChild(probe);        // .defs is 0x0 with overflow hidden
    probePt = host.createSVGPoint();
  }

  /* Does a point laid out at (xn,yn) survive the bend and the clip?
     The map encodes displacement for scale WARP_S, so a live scale of
     30 bends a quarter as hard — fold that into K. */
  function lands(xn, yn) {
    if (!probe) return true;
    let vx = xn, vy = yn;
    if (canWarp) {
      const k = WARP_K * (warpScale / WARP_S);
      const u = 2 * xn - 1, v = 2 * yn - 1;
      const f = 1 / (1 + k * (u * u + v * v));
      vx -= u * (f - 1) / 2;
      vy -= v * (f - 1) / 2;
    }
    probePt.x = vx; probePt.y = vy;
    return probe.isPointInFill(probePt);
  }

  const SAFE_STEP = 0.0015;
  const SAFE_MAX  = 0.16;
  /* How near the top and bottom edge "pinned" content actually gets, in
     px — a title bar's text, a taskbar button. Measured in pixels and
     not fractions because that is what the chrome is built in, and
     because the last few rows are a trap: the barrel pushes a point at
     y=1px clean off the top of the tube, so no x is safe there and a
     fractional band would find none and clamp to the ceiling. Nothing
     legible lives that close anyway. */
  const EDGE_PX = [6, 12, 20, 28];

  function setSafeArea() {
    const W = glass.clientWidth, H = glass.clientHeight;
    if (!W || !H) return;
    buildProbe();

    let inset = canWarp ? 0.046 : 0.026;      // fallback if the probe failed

    if (probe) {
      const ratio = W / H;                    // keeps the margin square in px
      for (let s = 0; s < SAFE_MAX; s += SAFE_STEP) {
        const iy = s * ratio;
        if (iy > 0.45) break;
        if (lands(s, iy) && lands(1 - s, iy) &&
            lands(s, 1 - iy) && lands(1 - s, 1 - iy)) { inset = s; break; }
      }
    }

    let edge = inset;
    if (probe) {
      const bands = [];
      EDGE_PX.forEach(d => { bands.push(d / H, 1 - d / H); });
      bands.forEach(yn => {
        for (let x = edge; x < SAFE_MAX; x += SAFE_STEP) {
          if (lands(x, yn)) { edge = x; return; }
        }
        // no x lands at this height — it is off the tube outright, so
        // there is nothing to widen for. Leave edge where it is.
      });
    }

    const marginPx = Math.ceil(inset * W);
    glass.style.setProperty('--warp-x', marginPx + 'px');
    glass.style.setProperty('--warp-y', marginPx + 'px');
    glass.style.setProperty('--edge-x', Math.ceil(edge * W) + 'px');
  }

  /* ── §2 · INTERFERENCE ──────────────────────────────────
     Monochrome analogue snow: wavy striations dragged sideways by a
     failing horizontal sync, mixed with hard random speckle. Rendered
     chunky at low resolution then blown up. Covers every channel change
     and the hand-off out of the boot sequence. */

  const tv = $('#tv');
  const tvx = tv.getContext('2d', { alpha: true });

  let TW = 0, TH = 0;
  let mode = 'off';            // 'burst' | 'off'
  let modeStart = 0;
  let burstMs = 420;
  let cleared = false;

  const SLEN = 1024;
  const stripe = new Float32Array(SLEN);
  for (let i = 0; i < SLEN; i++) {
    const a = Math.sin(i * 0.42) * 0.5 + 0.5;
    const b = Math.sin(i * 0.171 + 1.7) * 0.5 + 0.5;
    stripe[i] = Math.pow(a * b, 1.35);
  }
  const samp = s => stripe[(((s | 0) % SLEN) + SLEN) % SLEN];

  let noiseCv = null, noiseCtx = null, noiseImg = null, NW = 0, NH = 0;

  function drawBurst(t, alpha) {
    if (!noiseCv) return;
    for (let y = 0; y < NH; y++) {
      const wob = Math.sin(y * 0.13 + t * 4.1) * 17
                + Math.sin(y * 0.41 - t * 7.3) * 8
                + Math.sin(y * 0.047 + t * 1.3) * 26;
      const tear = ((y * 7 + (t * 90 | 0)) % 97) < 6 ? 13 : 0;
      const base = wob + tear;
      const row = y * NW * 4;
      for (let x = 0; x < NW; x++) {
        const snow = Math.random();
        // striation carries the sync tear; snow supplies the grain
        const lum = clamp(samp(x + base) * 168 * (0.45 + snow * 0.95) + snow * 96, 0, 255);
        const k = row + x * 4;
        noiseImg.data[k]     = lum;
        noiseImg.data[k + 1] = lum;
        noiseImg.data[k + 2] = Math.min(255, lum * 1.13);   // cool cast: B&W tubes ran blue
        noiseImg.data[k + 3] = 255;
      }
    }
    noiseCtx.putImageData(noiseImg, 0, 0);

    tvx.clearRect(0, 0, TW, TH);
    tvx.globalAlpha = alpha;
    tvx.imageSmoothingEnabled = false;
    tvx.drawImage(noiseCv, 0, 0, TW, TH);
    tvx.imageSmoothingEnabled = true;
    tvx.globalAlpha = 1;
  }

  function sizeTv() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const W = glass.clientWidth, H = glass.clientHeight;
    if (!W || !H) return;
    TW = Math.round(W * dpr); TH = Math.round(H * dpr);
    tv.width = TW; tv.height = TH;
    cleared = false;

    NW = 200; NH = Math.max(8, Math.round(NW * H / W));
    noiseCv = document.createElement('canvas');
    noiseCv.width = NW; noiseCv.height = NH;
    noiseCtx = noiseCv.getContext('2d');
    noiseImg = noiseCtx.createImageData(NW, NH);
  }

  function tvFrame(now) {
    requestAnimationFrame(tvFrame);

    if (mode === 'off') {
      if (!cleared) { tvx.clearRect(0, 0, TW, TH); cleared = true; }
      return;
    }

    // hold at full strength long enough to cover the swap underneath,
    // then decay off
    const age = now - modeStart;
    const hold = burstMs * 0.35;
    const a = age <= hold ? 1 : clamp(1 - (age - hold) / (burstMs - hold), 0, 1);
    if (a <= 0) { setMode('off'); return; }
    drawBurst(now / 1000, a);
  }

  function setMode(m) { mode = m; modeStart = performance.now(); cleared = false; }

  function burst(ms) {
    if (calm.matches) return;
    burstMs = ms;
    setMode('burst');
  }

  /* ── §3 · COLD START ────────────────────────────────────
     Terminal boot: POST lines, then a load meter, then the portfolio.
     ~3.5s end to end, or instant on prefers-reduced-motion. */

  function coldStart() {
    if (calm.matches) { endCold(true); return; }
    runBoot();
  }

  function endCold(instant) {
    if (coldDone) return;
    coldDone = true;
    clearTimers();
    body.classList.remove('is-cold');
    boot.hidden = true;
    bootHint.hidden = true;
    window.removeEventListener('keydown', skip);
    window.removeEventListener('pointerdown', skip);
    typeThesis(instant);
  }

  function skip(e) {
    if (e.type === 'keydown' && (e.metaKey || e.ctrlKey || e.altKey)) return;
    setMode('off');
    endCold(true);
  }
  window.addEventListener('keydown', skip);
  window.addEventListener('pointerdown', skip);

  /* ── §4 · BOOT SEQUENCE ─────────────────────────────────── */

  const POST = [
    '<i>KVD-4400 DATA DISPLAY TERMINAL</i>',
    '<i>firmware 4.4.1 · phosphor P1 · 640×200</i>',
    '',
    'POST ......................... <b>PASS</b>',
    'RAM  64K ..................... <b>OK</b>',
    'CRT  deflection coil ......... <b>OK</b>',
    'high voltage 21.5 kV ......... <b>NOMINAL</b>',
    'convergence .................. <b>ALIGNED</b>',
    'antenna az/el ................ <b>TRACKING</b>',
    'carrier detect 437.505 MHz ... <b>LOCK</b>',
    '',
    'mounting /dev/portfolio',
  ];

  // percentage waypoints and how long each one holds — uneven on purpose,
  // a real loader stalls
  const RAMP = [
    [9, 60], [18, 45], [24, 90], [32, 40], [35, 200],
    [47, 50], [56, 45], [62, 70], [69, 150],
    [80, 45], [87, 55], [94, 115], [98, 80], [100, 190],
  ];

  const BAR_W = 26;
  const meter = pct => {
    const on = Math.round((pct / 100) * BAR_W);
    return '  [<b>' + '█'.repeat(on) + '</b><i>' + '░'.repeat(BAR_W - on) + '</i>] '
         + String(pct).padStart(3) + '%';
  };

  const render = (lines, cursor) =>
    lines.join('\n') + (cursor ? '<u>█</u>' : '');

  function runBoot() {
    const shown = [];
    let i = 0;

    const line = () => {
      shown.push(POST[i]);
      i++;
      if (POST[i - 1] !== '') audio.key();       // a line landing
      bootLog.innerHTML = render(shown, true);
      if (i < POST.length) after(POST[i - 1] === '' ? 28 : 85 + Math.random() * 55, line);
      else after(180, () => ramp(0));
    };

    const ramp = k => {
      if (k >= RAMP.length) return finish();
      const [pct, hold] = RAMP[k];
      bootLog.innerHTML = render(shown.concat(meter(pct)), false);
      after(hold, () => ramp(k + 1));
    };

    const finish = () => {
      bootLog.innerHTML = render(
        shown.concat(meter(100), '', '<b>SIGNAL ACQUIRED — tuning CH1</b>'), true);
      audio.beep(1046, 0.09);                    // POST passed
      after(340, () => { burst(460); endCold(false); });
    };

    after(140, line);
  }

  /* ── §5 · TYPEWRITER ────────────────────────────────────── */

  const thesis = $('[data-type]');
  const thesisText = thesis ? thesis.textContent.trim() : '';
  if (thesis) thesis.textContent = '';

  function typeThesis(instant) {
    if (!thesis) return;
    if (instant || calm.matches) { thesis.textContent = thesisText; return; }
    let i = 0;
    const step = () => {
      thesis.textContent = thesisText.slice(0, ++i);
      audio.key();
      if (i < thesisText.length) setTimeout(step, 26 + Math.random() * 34);
    };
    setTimeout(step, 180);
  }

  /* ── §6 · CHANNEL TUNING ────────────────────────────────
     Progressive enhancement: panels start visible in markup, so a JS
     failure leaves a plain scrolling page. */

  panels.forEach((p, i) => { if (i > 0) p.hidden = true; });
  let current = 0;

  function select(i) {
    tabs[current].classList.remove('is-on');
    tabs[current].setAttribute('aria-selected', 'false');
    tabs[current].tabIndex = -1;
    panels[current].hidden = true;

    current = i;

    tabs[i].classList.add('is-on');
    tabs[i].setAttribute('aria-selected', 'true');
    tabs[i].tabIndex = 0;
    panels[i].hidden = false;
    $('#slCh').textContent = 'CH' + (i + 1) + ' ' + tabs[i].querySelector('span').textContent;
  }

  function tune(next) {
    if (next === current || next < 0 || next >= tabs.length || !powered) return;
    // the gate and the OS own the tube — no channel change, and no
    // static burst either, which read as "something happened"
    if (body.classList.contains('is-alt')) return;

    if (!calm.matches) {
      body.classList.add('is-glitch');
      setTimeout(() => body.classList.remove('is-glitch'), 340);
      burst(400);
    }

    select(next);
    scroll.scrollTop = 0;
    if (redrawStill) redrawStill();

    // ARIA tabs pattern: focus stays on the tab, never moves into the panel
    tabs[current].focus({ preventScroll: true });
    history.replaceState(null, '', '#' + tabs[current].dataset.target.replace('ch-', ''));
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => tune(i)));

  $('.channels').addEventListener('keydown', e => {
    const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in map) { e.preventDefault(); tune((current + map[e.key] + tabs.length) % tabs.length); }
    else if (e.key === 'Home') { e.preventDefault(); tune(0); }
    else if (e.key === 'End')  { e.preventDefault(); tune(tabs.length - 1); }
  });

  // number keys change channel, like the set's remote
  window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
    if (body.classList.contains('is-alt')) return;   // gate / OS owns the tube
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= tabs.length) tune(n - 1);
  });

  /* ── §11 · ACCESS GATE TRIGGER ──────────────────────────
     Three Enters on CH5 (or three clicks on END OF TRANSMISSION)
     hand the tube over to win98.js. */

  let knocks = 0, knockTimer = 0;
  const knockDots = $$('#riddleKnock i');

  function paintKnocks() {
    knockDots.forEach((d, i) => d.classList.toggle('is-on', i < knocks));
  }

  function resetKnocks() {
    clearTimeout(knockTimer);
    knocks = 0;
    paintKnocks();
  }

  function knock() {
    if (!powered || body.classList.contains('is-alt')) return;
    if (current !== tabs.length - 1) { resetKnocks(); return; }   // CH5 only
    clearTimeout(knockTimer);
    knockTimer = setTimeout(resetKnocks, 1400);
    if (++knocks < 3) { paintKnocks(); return; }
    paintKnocks();
    clearTimeout(knockTimer);
    setTimeout(resetKnocks, 260);        // let the third cell land first
    document.dispatchEvent(new CustomEvent('kvd:gate'));
  }

  // keyup, not keydown: Enter's default action activates whatever button
  // has focus, and opening the gate moves focus onto one of its buttons.
  // On keydown that click landed on the freshly-focused ADMIN button.
  window.addEventListener('keyup', e => {
    if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
    knock();
  });
  $('.sign')?.addEventListener('click', knock);

  /* ── §11b · RIDDLE ──────────────────────────────────────
     Every riddle in the pool has the same answer — three knocks on
     CH5 — so a visitor who draws any one of them can get in. The
     button is the only signpost the restricted segment gets. */

  const RIDDLES = [
    'I end every line you write, and I have never written one. ' +
    'Ask for me three times, here, and a door opens.',

    'Five buttons on the panel, six rooms behind it. The sixth was never ' +
    'given a button — only a knock.',

    'Twice is a stutter. Three times is a password. ' +
    'I am the key you strike to commit.',

    'Not a channel, a knob, or a switch. I am the widest key that means yes. ' +
    'Ask me, ask me, ask me.',

    'The station answers to a rhythm, not a word. Knock the way a polite ' +
    'visitor knocks, and knock here.',

    'Once is nothing. Twice is a coincidence. Three times is an invitation. ' +
    'The rest is up to your right hand.',

    'You have the addresses. Now press the key you would have used to send ' +
    'the message — three times.',

    'The sign-off below is not a full stop, it is a door knocker. ' +
    'It takes three, and so does the key.',
  ];

  const rBtn  = $('#riddleBtn');
  const rOut  = $('#riddleOut');
  const rText = $('#riddleText');
  const rNo   = $('#riddleNo');
  const rHint = $('#riddleHint');

  if (rBtn) {
    let last = -1;      // never draw the same riddle twice in a row
    let drawn = 0;
    let typeTimer = 0;

    // Enter is the answer to the puzzle, so the button must not still be
    // holding focus when the visitor tries it — the panel takes it instead.
    const type = txt => {
      clearTimeout(typeTimer);
      if (calm.matches) { rText.textContent = txt; return; }
      let i = 0;
      const step = () => {
        rText.textContent = txt.slice(0, ++i);
        if (i < txt.length) typeTimer = setTimeout(step, 8 + Math.random() * 14);
      };
      rText.textContent = '';
      typeTimer = setTimeout(step, 90);
    };

    rBtn.addEventListener('click', () => {
      let i = Math.floor(Math.random() * RIDDLES.length);
      if (i === last) i = (i + 1) % RIDDLES.length;
      last = i;
      drawn++;

      rOut.hidden = false;
      rBtn.setAttribute('aria-expanded', 'true');
      rNo.textContent = 'RIDDLE ' + String(i + 1).padStart(2, '0');
      type(RIDDLES[i]);

      // the nudge sharpens for anyone still drawing cards
      rHint.hidden = drawn < 3;
      rHint.textContent = drawn < 5
        ? 'draw another'
        : 'they all have the same answer';

      resetKnocks();
      rOut.focus({ preventScroll: true });
      // bring the knock cells and the sign-off into view — they are the
      // only confirmation that the first two presses registered
      scroll.scrollTo({
        top: scroll.scrollHeight,
        behavior: calm.matches ? 'auto' : 'smooth',
      });
    });
  }

  /* ── §6b · AUDIO ────────────────────────────────────────
     One AudioContext for the whole set: the power switch, the knob's
     detents, and win98.js's startup chime all run through the same
     master gain, so the TUBE knob controls the lot in OS mode.

     Everything is synthesised — no audio files ship. A context can
     only start inside a user gesture, so every entry point calls
     ensure() first and quietly does nothing if that fails. */

  const audio = (() => {
    let ac = null, master = null;
    let vol = 0.7, muted = false;

    try {
      const v = localStorage.getItem('kvd-vol');
      if (v !== null && !isNaN(parseFloat(v))) vol = clamp(parseFloat(v), 0, 1);
      muted = localStorage.getItem('kvd-mute') === '1';
    } catch (_) {}

    function save() {
      try {
        localStorage.setItem('kvd-vol', String(vol));
        localStorage.setItem('kvd-mute', muted ? '1' : '0');
      } catch (_) {}
    }

    function level() {
      if (!ac || !master) return;
      master.gain.setTargetAtTime(muted ? 0 : vol, ac.currentTime, 0.015);
    }

    function ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        if (!ac) {
          ac = new AC();
          master = ac.createGain();
          master.gain.value = muted ? 0 : vol;
          master.connect(ac.destination);
        }
        if (ac.state === 'suspended') ac.resume();
      } catch (_) { ac = null; }
      return ac;
    }

    /* A switch, not a beep. Filtered noise for the contact, a fast
       downward triangle under it for the mass of the plastic. */
    function click(hard) {
      if (!ensure() || muted) return;
      const t = ac.currentTime;
      const dur = 0.05;

      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 7);
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = hard ? 2000 : 2650;
      bp.Q.value = 0.9;
      const ng = ac.createGain();
      ng.gain.value = hard ? 0.55 : 0.3;
      src.connect(bp); bp.connect(ng); ng.connect(master);
      src.start(t); src.stop(t + dur);

      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(hard ? 165 : 215, t);
      o.frequency.exponentialRampToValueAtTime(68, t + 0.045);
      g.gain.setValueAtTime(hard ? 0.24 : 0.13, t);
      g.gain.exponentialRampToValueAtTime(0.0006, t + 0.05);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.06);
    }

    /* ── the set idling ──────────────────────────────────
       What a powered tube actually puts into a room: mains hum out of
       the transformer, and the flyback whistling at the line rate.
       The set is wired for Mumbai, so that is 50 Hz mains and a 15625 Hz
       line rate — PAL numbers, not NTSC's 60 / 15734.

       15.6 kHz is above where a lot of adults hear anything, so half of
       it rides underneath at a lower level. That keeps it audible
       without being a dog whistle. Everything here is held very low on
       purpose: this should be the sound you notice stopping, not the
       sound you notice. */

    const MAINS = 50;
    const FLYBACK = 15625;
    let amb = null;

    function ambient(on) {
      if (!on) {
        if (!amb || !ac) return;
        const dead = amb; amb = null;
        try {
          dead.g.gain.cancelScheduledValues(ac.currentTime);
          dead.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.16);
          dead.nodes.forEach(n => n.stop(ac.currentTime + 1.1));
        } catch (_) {}
        return;
      }
      if (amb || !ensure()) return;

      const t = ac.currentTime;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(1, t + 1.8);      // the tube warming
      g.connect(master);

      const nodes = [];
      const osc = (hz, level, dest) => {
        const o = ac.createOscillator();
        const og = ac.createGain();
        o.type = 'sine'; o.frequency.value = hz;
        og.gain.value = level;
        o.connect(og); og.connect(dest);
        o.start(t); nodes.push(o);
      };

      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 400; lp.Q.value = 0.7;
      lp.connect(g);
      osc(MAINS, 0.030, lp);
      osc(MAINS * 2, 0.017, lp);
      osc(MAINS * 3, 0.008, lp);

      osc(FLYBACK, 0.0070, g);
      osc(FLYBACK / 2, 0.0034, g);

      // nothing electrical is perfectly steady
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.frequency.value = 0.23;
      lfoG.gain.value = 0.2;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      lfo.start(t); nodes.push(lfo);

      amb = { g, nodes };
    }

    /* ── degauss ─────────────────────────────────────────
       The thunk-wobble every colour set makes when the degaussing coil
       fires on a cold start: a low tone dropping in pitch while the
       field collapses around it, the wobble fast at first and slowing
       as it settles, and the shadow mask taking the hit up front. */
    function degauss() {
      if (!ensure() || muted) return;
      const t = ac.currentTime;
      const dur = 1.5;

      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
      g.connect(master);

      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(76, t);
      o.frequency.exponentialRampToValueAtTime(37, t + dur);
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(880, t);
      lp.frequency.exponentialRampToValueAtTime(170, t + dur);
      o.connect(lp); lp.connect(g);
      o.start(t); o.stop(t + dur);

      const trem = ac.createOscillator();
      const tremG = ac.createGain();
      trem.frequency.setValueAtTime(11, t);
      trem.frequency.exponentialRampToValueAtTime(2.2, t + dur);
      tremG.gain.value = 0.38;
      trem.connect(tremG); tremG.connect(g.gain);
      trem.start(t); trem.stop(t + dur);

      const nb = ac.createBuffer(1, Math.ceil(ac.sampleRate * 0.12), ac.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) {
        nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 3);
      }
      const ns = ac.createBufferSource();
      ns.buffer = nb;
      const nf = ac.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 620; nf.Q.value = 1.1;
      const ng = ac.createGain();
      ng.gain.value = 0.4;
      ns.connect(nf); nf.connect(ng); ng.connect(master);
      ns.start(t); ns.stop(t + 0.12);
    }

    /* POST beep — a bare square, the way a motherboard speaker does it */
    function beep(hz, dur) {
      if (!ensure() || muted) return;
      hz = hz || 880; dur = dur || 0.11;
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'square';
      o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.17, t + 0.006);
      g.gain.setValueAtTime(0.17, t + dur - 0.015);
      g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    }

    /* one character landing on the tube. Throttled: the typewriter can
       ask for these faster than they are worth hearing. */
    let lastKey = 0;
    function key() {
      if (!ensure() || muted) return;
      const t = ac.currentTime;
      if (t - lastKey < 0.028) return;
      lastKey = t;
      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * 0.02), ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 5);
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 3200 + Math.random() * 900;
      bp.Q.value = 1.4;
      const g = ac.createGain();
      g.gain.value = 0.13;          // the terminal should be heard working
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.02);
    }

    /* one detent of the knob — dry, tiny, slightly different each time
       so a fast sweep does not turn into a machine-gun tone */
    function tick() {
      if (!ensure() || muted) return;
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'square';
      o.frequency.value = 1450 + Math.random() * 320;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0004, t + 0.026);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.03);
    }

    return {
      ensure, click, tick, ambient, degauss, beep, key,
      get running() { return !!amb; },
      get ctx() { return ac; },
      get bus() { return master; },
      get volume() { return vol; },
      set volume(v) {
        vol = clamp(v, 0, 1);
        if (vol > 0) muted = false;
        level(); save();
      },
      get muted() { return muted; },
      set muted(m) { muted = !!m; level(); save(); },
    };
  })();

  /* A context cannot start outside a user gesture, so the set is silent
     until the first click or keypress — then it warms up: the degauss
     coil fires and the idle hum fades in behind it. On a cold load that
     is usually the keypress that skips the boot. */
  let warmed = false;
  function warmUp() {
    if (warmed || !powered) return;
    warmed = true;
    if (!audio.ensure()) return;
    audio.degauss();
    setTimeout(() => { if (powered) audio.ambient(true); }, 500);
  }
  window.addEventListener('pointerdown', warmUp);
  window.addEventListener('keydown', warmUp);

  /* small surface for win98.js: static bursts, bend control, audio */
  const warpDisp = $('#warpDisp');

  // the safe area depends on how hard the tube is bending, so every
  // change of scale has to re-measure it
  function applyWarpScale(v) {
    warpScale = v;
    warpDisp?.setAttribute('scale', v);
    setSafeArea();
  }

  /* ── §8b · THE MASK KNOB ────────────────────────────────
     Three positions, cycled: none → dot → grille. The looks themselves
     are in win98.css; this only decides which one is on and remembers
     it, because a picture setting the visitor chose should still be
     there next time — same reasoning as the volume. */

  const MASKS  = ['none', 'dot', 'grille'];
  const MASK_L = ['none', 'shadow mask', 'aperture grille'];
  const maskKnob = $('#mask');
  let maskAt = 0;

  try {
    const saved = MASKS.indexOf(localStorage.getItem('kvd-mask'));
    if (saved > 0) maskAt = saved;
  } catch (_) { /* private mode: not worth failing over */ }

  function setMask(i) {
    maskAt = (i + MASKS.length) % MASKS.length;
    body.dataset.mask = MASKS[maskAt];
    maskKnob.setAttribute('aria-label',
      `Shadow mask: ${MASK_L[maskAt]}. Activate to change.`);
    try { localStorage.setItem('kvd-mask', MASKS[maskAt]); } catch (_) {}
  }

  maskKnob.addEventListener('click', e => {
    e.stopPropagation();
    audio.ensure();
    audio.key?.();
    setMask(maskAt + 1);
  });

  setMask(maskAt);

  /* ── §8c · DEGAUSS ──────────────────────────────────────
     The coil dumps a decaying field through the tube: the geometry
     swells, overshoots, and rings down over about half a second. Driven
     from the operator console in overdrive.js — there is no button for
     it on the fascia, because a visitor has no business degaussing
     anything. */

  let degaussing = false;

  function degauss() {
    if (!powered || degaussing) return;
    degaussing = true;
    audio.ensure();
    audio.degauss();
    burst(300);
    body.classList.add('is-degauss');

    /* Each swing smaller than the last, alternating sides, home by
       ~600ms. Skipped where the warp is off (WebKit): no geometry to
       ring, and the light half still plays. */
    if (body.classList.contains('is-warped')) {
      [[1.5, 0], [0.7, 130], [1.24, 250], [0.86, 370], [1.06, 480], [1, 580]]
        .forEach(([m, t]) => setTimeout(() => {
          if (powered) applyWarpScale(WARP_S * m);
        }, t));
    }

    setTimeout(() => {
      body.classList.remove('is-degauss');
      degaussing = false;
    }, 640);
  }

  window.KVD = {
    burst,
    audio,
    degauss,
    setMask,
    maskNames: MASKS,
    setWarpScale: applyWarpScale,
    restoreWarp() { applyWarpScale(WARP_S); },
  };

  // deep link on load
  const hash = location.hash.slice(1);
  if (hash) {
    const idx = tabs.findIndex(t => t.dataset.target === 'ch-' + hash);
    if (idx > 0) select(idx);
  }

  /* ── §7 · POWER ─────────────────────────────────────────── */

  const power = $('#power');

  function powerOff() {
    powered = false;
    audio.click(true);            // heavier going down
    audio.ambient(false);         // and the room goes quiet
    setMode('off');
    body.classList.add('is-powering-off');
    setTimeout(() => {
      body.classList.remove('is-powering-off');
      body.classList.add('is-off');
      standby.hidden = false;
      standby.focus({ preventScroll: true });
    }, 500);
    power.setAttribute('aria-label', 'Power on');
  }

  function powerOn() {
    powered = true;
    warmed = true;
    audio.click(false);           // lighter coming back up
    audio.degauss();              // the coil fires on every cold start
    setTimeout(() => { if (powered) audio.ambient(true); }, 500);
    standby.hidden = true;
    body.classList.remove('is-off');
    body.classList.add('is-booting');
    setTimeout(() => body.classList.remove('is-booting'), 640);
    burst(420);
    power.setAttribute('aria-label', 'Power off');
    power.focus({ preventScroll: true });
  }

  power.addEventListener('click', e => { e.stopPropagation(); powered ? powerOff() : powerOn(); });
  standby.addEventListener('click', powerOn);

  /* ── §8 · THE TUBE KNOB ─────────────────────────────────
     Two jobs, decided by what is on the tube.

     Terminal — a two-position phosphor selector, click to toggle.
     Windows 98 — a volume control: turn it clockwise and it gets
     louder, anticlockwise and it gets quieter. A colour tube running
     an OS has no phosphor to choose, and the set needs a volume
     control once it has sound, so the same knob does both jobs the
     way a real one would.

     Drag, wheel and arrow keys all work; a real knob answers to more
     than one grip. */

  const knob = $('#knob');
  // scoped: a bare '.knob__dial' takes whichever knob is first in the
  // DOM, which is only the right one by accident
  const dial = $('.knob__dial', knob);
  const SWEEP = 135;               // degrees either side of centre
  const DETENT = 0.05;             // volume per audible click

  /* The knob is a phosphor selector on the terminal and a volume
     control on anything with an OS on it — either OS. Adding a second
     one meant this could no longer name a single class. */
  const osMode = () =>
    body.classList.contains('is-win98') || body.classList.contains('is-overdrive');

  function paintDial() {
    if (!dial) return;
    if (osMode()) {
      dial.style.rotate = (audio.volume * 2 - 1) * SWEEP + 'deg';
      knob.style.setProperty('--vol', String(audio.muted ? 0 : audio.volume));
    } else {
      dial.style.rotate = '';      // hand it back to the phosphor rule
    }
  }

  function describeKnob() {
    if (osMode()) {
      const pct = Math.round(audio.volume * 100);
      knob.setAttribute('aria-label', `Volume ${pct}%. Turn to adjust.`);
      knob.title = `Volume ${pct}%`;
      knob.setAttribute('role', 'slider');
      knob.setAttribute('aria-valuemin', '0');
      knob.setAttribute('aria-valuemax', '100');
      knob.setAttribute('aria-valuenow', String(pct));
    } else {
      const p4 = document.documentElement.dataset.phosphor === 'p4';
      knob.setAttribute('aria-label', p4
        ? 'Tube: P4 white. Switch to P1 green.'
        : 'Tube: P1 green. Switch to P4 white.');
      knob.title = 'Tube: P4 white / P1 green';
      knob.removeAttribute('role');
      knob.removeAttribute('aria-valuemin');
      knob.removeAttribute('aria-valuemax');
      knob.removeAttribute('aria-valuenow');
    }
  }

  let lastDetent = 0;

  function setVolume(v) {
    audio.ensure();
    audio.volume = v;
    const step = Math.round(audio.volume / DETENT);
    if (step !== lastDetent) { lastDetent = step; audio.tick(); }
    paintDial();
    describeKnob();
    document.dispatchEvent(new CustomEvent('kvd:volume', { detail: audio.volume }));
  }

  function togglePhosphor() {
    const next = document.documentElement.dataset.phosphor === 'p4' ? 'p1' : 'p4';
    document.documentElement.dataset.phosphor = next;
    describeKnob();
    if (redrawStill) redrawStill();
  }

  /* pointer drag — angle around the knob's centre, unwrapped so a sweep
     past the 180° seam does not jump the volume across the range */
  let turning = false, lastAngle = 0, moved = 0;

  const angleAt = e => {
    const r = knob.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2),
                      e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  };

  knob.addEventListener('pointerdown', e => {
    if (!osMode()) return;
    turning = true; moved = 0;
    lastAngle = angleAt(e);
    knob.setPointerCapture(e.pointerId);
    audio.ensure();
    e.preventDefault();
  });

  knob.addEventListener('pointermove', e => {
    if (!turning) return;
    const a = angleAt(e);
    let d = a - lastAngle;
    if (d > 180) d -= 360;          // crossed the seam anticlockwise
    if (d < -180) d += 360;         // ... or clockwise
    lastAngle = a;
    moved += Math.abs(d);
    setVolume(audio.volume + d / (SWEEP * 2));
  });

  const endTurn = e => {
    if (!turning) return;
    turning = false;
    try { knob.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  knob.addEventListener('pointerup', endTurn);
  knob.addEventListener('pointercancel', endTurn);

  knob.addEventListener('click', e => {
    if (osMode()) {
      // a turn ends in a click event too; only a genuine tap gets through
      if (moved < 4) { audio.ensure(); audio.muted = !audio.muted; describeKnob(); }
      moved = 0;
      e.preventDefault();
      return;
    }
    togglePhosphor();
  });

  knob.addEventListener('wheel', e => {
    if (!osMode()) return;
    e.preventDefault();
    setVolume(audio.volume - Math.sign(e.deltaY) * DETENT);
  }, { passive: false });

  knob.addEventListener('keydown', e => {
    if (!osMode()) return;
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    setVolume(audio.volume + step * DETENT);
  });

  /* ── §8b · MODE LOCK ────────────────────────────────────
     The gate and the OS own the tube, so the channel keys do nothing
     while either is up — including the static burst, which used to
     fire and look like the set had done something. They stay focusable
     and announce themselves as disabled rather than going `disabled`,
     because they come back the moment you shut down. */

  function syncMode() {
    const locked = body.classList.contains('is-alt');
    tabs.forEach(t => t.setAttribute('aria-disabled', locked ? 'true' : 'false'));
    lastDetent = Math.round(audio.volume / DETENT);
    paintDial();
    describeKnob();
  }

  new MutationObserver(syncMode)
    .observe(body, { attributes: true, attributeFilter: ['class'] });
  syncMode();

  /* ── §9 · TELEMETRY ─────────────────────────────────────── */

  const t0 = Date.now();
  const slUp = $('#slUp'), slRx = $('#slRx'), slSig = $('#slSig');
  const rSignal = $('#rSignal'), rPackets = $('#rPackets'), rElev = $('#rElev'), peakVal = $('#peakVal');
  let packets = 1204;
  const pad = n => String(n).padStart(2, '0');

  setInterval(() => {
    if (!powered) return;
    const s = Math.floor((Date.now() - t0) / 1000);
    slUp.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    slRx.textContent = (7.2 + Math.random() * 2.6).toFixed(1);

    const sig = 88 + Math.round(Math.random() * 11);
    slSig.style.width = sig + '%';
    if (rSignal) rSignal.textContent = sig + '%';

    packets += Math.floor(Math.random() * 4);
    if (rPackets) rPackets.textContent = packets.toLocaleString('en-US');
    if (rElev)   rElev.textContent = (58 + Math.random() * 7).toFixed(1) + '°';
    if (peakVal) peakVal.textContent = '−' + (39 + Math.round(Math.random() * 6));
  }, 1000);

  /* ── §10 · SPECTRUM ─────────────────────────────────────
     Throttled hard: it lives inside the warp filter, so every repaint
     re-runs the displacement over the whole screen. 12 fps also reads
     more like a real analyser sweep. */

  const cv = $('#spectrum');
  if (cv) {
    const ctx = cv.getContext('2d');
    const BINS = 96;
    const hold = new Array(BINS).fill(0);
    let w = 0, h = 0, last = 0;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ink = () => getComputedStyle(document.documentElement).getPropertyValue('--p').trim() || '#2bff88';
    const gauss = (x, mu, sg, amp) => amp * Math.exp(-((x - mu) ** 2) / (2 * sg * sg));

    const trace = (t, decay) => {
      const c = ink(), bw = w / BINS;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = c; ctx.globalAlpha = 0.12; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        const x = Math.round((w / 8) * i) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let i = 1; i < 3; i++) {
        const y = Math.round((h / 3) * i) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const drift = Math.sin(t / 2600) * 5;
      for (let i = 0; i < BINS; i++) {
        let v = 0.06 + Math.random() * 0.09;
        v += gauss(i, BINS / 2 + drift, 1.9, 0.78);
        v += gauss(i, BINS / 2 - 13 + drift, 3.2, 0.3);
        v += gauss(i, BINS / 2 + 13 + drift, 3.2, 0.3);
        v = Math.min(v, 1);
        hold[i] = decay ? Math.max(v, hold[i] - 0.05) : v;
        const bh = v * (h - 6);
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.28 + v * 0.6;
        ctx.fillRect(i * bw, h - bh, Math.max(bw - 1, 1), bh);
      }

      ctx.globalAlpha = 0.55; ctx.strokeStyle = c;
      ctx.beginPath();
      for (let i = 0; i < BINS; i++) {
        const y = h - hold[i] * (h - 6);
        i ? ctx.lineTo(i * bw + bw / 2, y) : ctx.moveTo(i * bw + bw / 2, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const frame = now => {
      requestAnimationFrame(frame);
      if (!w) resize();
      if (!w || now - last < 83) return;    // 12 fps
      last = now;
      trace(now, true);
    };

    addEventListener('resize', resize);
    resize();

    if (calm.matches) {
      const still = () => { if (!w) resize(); if (w) trace(0, false); };
      still();
      addEventListener('resize', still);
      redrawStill = still;
    } else {
      requestAnimationFrame(frame);
    }
  }

  /* ── go ─────────────────────────────────────────────────── */

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { buildWarpMap(); setSafeArea(); sizeTv(); }, 160);
  });

  buildWarpMap();
  setSafeArea();
  sizeTv();
  requestAnimationFrame(tvFrame);
  coldStart();
})();
