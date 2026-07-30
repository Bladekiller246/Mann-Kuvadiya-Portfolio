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

  /* Title-safe area, in exact pixels off the live tube size. Two things
     push content off a curved screen: the barrel pulls it outward, and
     #tubeShape cuts in at the corners. These cover both. */
  function setSafeArea() {
    const W = glass.clientWidth, H = glass.clientHeight;
    if (!W || !H) return;
    // corner radius of #tubeShape + barrel pull (~2.1% per axis at K=0.022)
    // + breathing room; without the warp, the clip alone sets the floor
    const fx = canWarp ? 0.046 : 0.026;
    const fy = canWarp ? 0.048 : 0.028;
    glass.style.setProperty('--warp-x', Math.round(W * fx) + 'px');
    glass.style.setProperty('--warp-y', Math.round(H * fy) + 'px');
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

  function knock() {
    if (!powered || body.classList.contains('is-alt')) return;
    if (current !== tabs.length - 1) { knocks = 0; return; }   // CH5 only
    clearTimeout(knockTimer);
    knockTimer = setTimeout(() => { knocks = 0; }, 1400);
    if (++knocks < 3) return;
    knocks = 0;
    clearTimeout(knockTimer);
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

  /* small surface for win98.js: static bursts and bend control */
  const warpDisp = $('#warpDisp');
  window.KVD = {
    burst,
    setWarpScale(v) { warpDisp?.setAttribute('scale', v); },
    restoreWarp() { warpDisp?.setAttribute('scale', WARP_S); },
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

  /* ── §8 · PHOSPHOR ──────────────────────────────────────── */

  const knob = $('#knob');
  knob.addEventListener('click', () => {
    const next = document.documentElement.dataset.phosphor === 'p4' ? 'p1' : 'p4';
    document.documentElement.dataset.phosphor = next;
    knob.setAttribute('aria-label', next === 'p4'
      ? 'Tube: P4 white. Switch to P1 green.'
      : 'Tube: P1 green. Switch to P4 white.');
    if (redrawStill) redrawStill();
  });

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
