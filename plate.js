/* ═══════════════════════════════════════════════════════════════
   plate.js — the SemiCon-ML result plate, as a React component.

   The one React in the project, and the only file that reaches the
   network for code. Three rules it keeps:

   1. It is an upgrade, never a requirement. The authored <figure> in
      index.html is complete on its own; this replaces it only once
      React has actually arrived. CDN blocked, offline, module scripts
      unsupported, an exception in here — the static plate stays, and
      the visitor is never shown a gap where a widget should be.

   2. It costs nothing until it is looked at. React and react-dom are
      ~140 KB, and the plate lives on CH3. The import is deferred until
      the channel is tuned to, so a visitor who reads CH1 and leaves
      never pays for it.

   3. No build step. React from esm.sh, markup through htm's tagged
      templates rather than JSX, so "open index.html and it works"
      stays true — which is the whole premise of the repo.

   Why it is a component at all: three static panels can show you the
   before and the after, but not the boundary between them. Dragging one
   image over another is how you actually read a restoration result, and
   that is a slider position, a chosen pair and a pointer capture — real
   state, which is what React is for.
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const SRC = {
    react:  'https://esm.sh/react@18.3.1',
    client: 'https://esm.sh/react-dom@18.3.1/client',
    htm:    'https://esm.sh/htm@3.1.1',
  };

  /* Measured off assets/semicon-compare.png, not guessed: three 256px
     panels at x=0, 268 and 536, separated by 12px white gutters. The
     panes are one background image at three offsets rather than three
     files — same bytes, one request, already in the browser cache from
     the static figure. */
  const PLATE_W = 792, PANEL = 256;
  const PANES = [
    { o: 0,   label: 'DEGRADED',     long: 'the degraded 128² input' },
    { o: 268, label: 'RESTORED',     long: "the model's 256² output" },
    { o: 536, label: 'GROUND TRUTH', long: 'the ground truth' },
  ];

  /* Each pairing answers a different question, so each carries the
     number that actually belongs to it. */
  const PAIRS = [
    { id: 'in-out', a: 0, b: 1, label: 'IN / OUT',
      note: 'What the model recovered — +6.69 dB over the no-model baseline.' },
    { id: 'out-gt', a: 1, b: 2, label: 'OUT / GT',
      note: 'How close it got — 29.333 dB PSNR, 0.7764 SSIM. The softness that ' +
            'remains is an information limit, not a tuning failure.' },
    { id: 'in-gt',  a: 0, b: 2, label: 'IN / GT',
      note: 'The whole gap the model had to close, with nothing in between.' },
  ];

  const panel = document.getElementById('ch-work');
  if (!panel || !panel.querySelector('.fig')) return;

  /* Re-read rather than hold a reference: github.js can replace the whole
     dossier list with the live manifest at any point, and a plate that is
     no longer on the page should not cost the visitor a React download. */
  const findFigure = () => document.querySelector('#ch-work .fig');

  /* ── the component ──────────────────────────────────────────── */

  function build(React, createRoot, htm) {
    const { createElement, useState } = React;
    const html = htm.bind(createElement);

    function Compare() {
      const [pairId, setPairId] = useState(PAIRS[0].id);
      const [pos, setPos] = useState(50);

      const pair = PAIRS.find(p => p.id === pairId) || PAIRS[0];
      const A = PANES[pair.a];
      const B = PANES[pair.b];

      // switching pair keeps the wipe where the reader left it — the
      // position is the thing being compared, not a mode to reset
      const pick = id => setPairId(id);

      return html`
        <figure class="fig cmp">
          <div class="cmp__bar" role="group" aria-label="Choose which two panels to compare">
            ${PAIRS.map(p => html`
              <button type="button" key=${p.id}
                      class=${'cmp__pick' + (p.id === pairId ? ' is-on' : '')}
                      aria-pressed=${p.id === pairId}
                      onClick=${() => pick(p.id)}>${p.label}</button>`)}
          </div>

          <div class="fig__frame cmp__frame" role="img"
               aria-label=${`A wipe comparison: ${A.long} on the left of the divider, `
                          + `${B.long} on the right.`}>
            <div class="cmp__pane" style=${{ '--o': String(B.o) }}></div>
            <div class="cmp__pane cmp__pane--top"
                 style=${{ '--o': String(A.o), clipPath: `inset(0 ${100 - pos}% 0 0)` }}></div>

            <div class="cmp__seam" style=${{ left: pos + '%' }} aria-hidden="true">
              <span class="cmp__grip"></span>
            </div>

            <span class="cmp__tag cmp__tag--l" aria-hidden="true">${A.label}</span>
            <span class="cmp__tag cmp__tag--r" aria-hidden="true">${B.label}</span>

            <input class="cmp__range" type="range" min="0" max="100" step="0.5"
                   value=${pos}
                   aria-label=${`Wipe between ${A.long} and ${B.long}`}
                   aria-valuetext=${`${Math.round(pos)}% ${A.label}`}
                   onInput=${e => setPos(Number(e.target.value))} />
          </div>

          <figcaption class="cmp__cap">${pair.note}</figcaption>
        </figure>`;
    }

    const figure = findFigure();
    if (!figure) return;
    const mount = document.createElement('div');
    figure.replaceWith(mount);
    createRoot(mount).render(createElement(Compare));
  }

  /* ── load, once the channel is actually looked at ───────────── */

  let started = false;

  async function start() {
    if (started) return;
    started = true;
    if (!findFigure()) return;   // manifest already took the plate away
    try {
      const [React, dom, htm] = await Promise.all([
        import(SRC.react), import(SRC.client), import(SRC.htm),
      ]);
      build(React, dom.createRoot, htm.default);
    } catch (err) {
      // The authored figure is untouched and says everything this would
      // have. Log why, and leave the page alone.
      console.warn('[plate] static plate kept — React did not load:', err.message);
    }
  }

  if (!panel.hidden) start();
  else {
    const seen = new MutationObserver(() => {
      if (!panel.hidden) { seen.disconnect(); start(); }
    });
    seen.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  }
})();
