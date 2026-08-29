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

    pic: svg(`<path d="M8 3h11l6 6v20H8z" fill="#fff" stroke="#000"/>
      <path d="M19 3v6h6" fill="#dcdcdc" stroke="#000"/>
      <rect x="11" y="14" width="12" height="10" fill="#5a8fd0" stroke="#000"/>
      <circle cx="14.5" cy="17" r="1.5" fill="#ffe066"/>
      <path d="M11 24l4-5 3 3 2-2 3 4z" fill="#2e9b3f"/>`),

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

    calc: svg(`<rect x="6" y="3" width="20" height="26" fill="#c0c0c0" stroke="#000"/>
      <rect x="9" y="6" width="14" height="5" fill="#fff" stroke="#808080"/>
      <g fill="#7a7a7a"><rect x="9" y="14" width="4" height="3"/><rect x="14" y="14" width="4" height="3"/>
      <rect x="19" y="14" width="4" height="3"/><rect x="9" y="19" width="4" height="3"/>
      <rect x="14" y="19" width="4" height="3"/><rect x="19" y="19" width="4" height="3"/>
      <rect x="9" y="24" width="9" height="3"/></g>
      <rect x="19" y="24" width="4" height="3" fill="#7f0000"/>`),

    dos: svg(`<rect x="3" y="5" width="26" height="22" fill="#c0c0c0" stroke="#000"/>
      <rect x="3" y="5" width="26" height="4" fill="#000080"/>
      <rect x="5" y="11" width="22" height="14" fill="#000"/>
      <g stroke="#c0c0c0" stroke-width="2"><path d="M7 15h4M7 19h8"/></g>`),

    ie: svg(`<ellipse cx="16" cy="17" rx="14" ry="5.5" fill="none" stroke="#e8b21e"
        stroke-width="3" transform="rotate(-21 16 17)"/>
      <text x="16" y="25" font-family="Times New Roman,Georgia,serif" font-size="24"
        font-weight="700" fill="#1f5fbf" text-anchor="middle" shape-rendering="auto">e</text>`),

    snake: svg(`<rect x="3" y="3" width="26" height="26" fill="#0a1a0a" stroke="#000"/>
      <g fill="#22c022"><rect x="6" y="20" width="5" height="5"/><rect x="11" y="20" width="5" height="5"/>
      <rect x="16" y="20" width="5" height="5"/><rect x="16" y="15" width="5" height="5"/>
      <rect x="16" y="10" width="5" height="5"/></g>
      <rect x="16" y="5" width="5" height="5" fill="#5aff5a"/>
      <circle cx="9" cy="10" r="2.5" fill="#e02020"/>`),

    doom: svg(`<rect x="3" y="4" width="26" height="24" fill="#280a06" stroke="#000"/>
      <path d="M8 24c0-7 3.5-11 8-11s8 4 8 11z" fill="#a8301a"/>
      <path d="M8 13l3-4 2 3 3-4 3 4 2-3 3 4z" fill="#7a1c0c"/>
      <circle cx="12.5" cy="19" r="2" fill="#ffcf3f"/><circle cx="19.5" cy="19" r="2" fill="#ffcf3f"/>
      <path d="M11 25h10v2H11z" fill="#5e1408"/>`),

    doom2: svg(`<rect x="3" y="4" width="26" height="24" fill="#1b0a20" stroke="#000"/>
      <path d="M8 24c0-7 3.5-11 8-11s8 4 8 11z" fill="#7a2a9a"/>
      <path d="M8 13l3-4 2 3 3-4 3 4 2-3 3 4z" fill="#4e1868"/>
      <circle cx="12.5" cy="19" r="2" fill="#5aff5a"/><circle cx="19.5" cy="19" r="2" fill="#5aff5a"/>
      <path d="M11 25h10v2H11z" fill="#360f48"/>`),

    vc: svg(`<rect x="3" y="3" width="26" height="26" fill="#140b26" stroke="#000"/>
      <circle cx="19" cy="17" r="8" fill="#ff4f9a"/>
      <g fill="#140b26"><rect x="11" y="14" width="17" height="1.5"/>
      <rect x="11" y="17.5" width="17" height="1.5"/><rect x="11" y="21" width="17" height="1.5"/></g>
      <rect x="8" y="14" width="1.8" height="13" fill="#0a0518"/>
      <path d="M8.9 14.5c-2.4-2-4.6-1.6-6 .4 1.8-.9 3.6-.7 6 1zM8.9 14.5c2.4-2 4.6-1.6 6 .4-1.8-.9-3.6-.7-6 1z" fill="#0a0518"/>`),

    gta: svg(`<rect x="3" y="3" width="26" height="26" fill="#3c3c3c" stroke="#000"/>
      <g fill="#e8d44a" opacity=".45"><rect x="15" y="4" width="2" height="5"/>
      <rect x="15" y="13" width="2" height="5"/><rect x="15" y="22" width="2" height="5"/></g>
      <rect x="10" y="7" width="12" height="18" rx="3" fill="#e0b81c" stroke="#000"/>
      <rect x="12" y="10" width="8" height="5" fill="#26374f"/>
      <rect x="12" y="18" width="8" height="4" fill="#26374f"/>`),

    /* The three fan games get motifs off their own names — a die for the
       roguelite, an eclipse, a vortex. Deliberately nothing borrowed from
       the franchise they belong to. */
    rogue: svg(`<rect x="3" y="3" width="26" height="26" fill="#101828" stroke="#000"/>
      <rect x="8" y="8" width="16" height="16" rx="2" fill="#e6e6e6" stroke="#000"/>
      <g fill="#b02a1e"><circle cx="12.4" cy="12.4" r="1.7"/><circle cx="19.6" cy="12.4" r="1.7"/>
      <circle cx="16" cy="16" r="1.7"/><circle cx="12.4" cy="19.6" r="1.7"/>
      <circle cx="19.6" cy="19.6" r="1.7"/></g>`),

    eclipse: svg(`<rect x="3" y="3" width="26" height="26" fill="#0b1020" stroke="#000"/>
      <circle cx="16" cy="16" r="9.5" fill="#ffd24a"/>
      <circle cx="13.2" cy="14.8" r="8.4" fill="#0b1020"/>
      <path d="M16 4.5v3M16 24.5v3M4.5 16h3M24.5 16h3" stroke="#ffe9a0" stroke-width="1.6"/>`),

    vortex: svg(`<rect x="3" y="3" width="26" height="26" fill="#08131f" stroke="#000"/>
      <path d="M16 6.5a9.5 9.5 0 1 1-9 12.4" fill="none" stroke="#3fc7f0" stroke-width="2.6"/>
      <path d="M16 11.5a4.5 4.5 0 1 0 4.3 5.9" fill="none" stroke="#7ee1ff" stroke-width="2.2"/>
      <circle cx="16" cy="16" r="1.7" fill="#fff"/>`),

    cal: svg(`<rect x="4" y="7" width="24" height="21" fill="#fff" stroke="#000"/>
      <rect x="4" y="7" width="24" height="6" fill="#a8202a" stroke="#000"/>
      <rect x="9" y="3" width="3" height="7" fill="#9a9a9a" stroke="#000"/>
      <rect x="20" y="3" width="3" height="7" fill="#9a9a9a" stroke="#000"/>
      <g fill="#6a6a6a"><rect x="7" y="16" width="4" height="3"/><rect x="14" y="16" width="4" height="3"/>
      <rect x="21" y="16" width="4" height="3"/><rect x="7" y="22" width="4" height="3"/></g>
      <rect x="14" y="22" width="4" height="3" fill="#a8202a"/>`),
  };

  /* ── §2 · APPS ──────────────────────────────────────────
     ✎ Window contents live here. Same portfolio material as the
     terminal channels, wearing a different shell. */

  const ABOUT_TEXT = [
    'Third-year B.Tech IT student at K. J. Somaiya College of Engineering,',
    'on the Honours track in Cyber Security. Most of what I do is one loop',
    'run in both directions: take something apart until it gives, then',
    "build something that doesn't.",
    '',
    'Taking apart looks like the DVWA finding in PROJECTS - a missing',
    'extension check that ends in remote code execution, written up the',
    'way a client would need to read it. Building looks like PrivacyLayer:',
    'an identity system with no personal data on the server to breach in',
    'the first place.',
    '',
    'Based in Mumbai, IN (UTC+5:30). Currently open to internships.',
    '',
    '-- this file is editable, and nothing is saved anywhere.',
  ].join('\n');

  /* label | key sent to the calculator | colour class */
  const CALC_ROWS = [
    ['C|clr|hot', 'CE|ce|hot', '←|back|hot', '÷|/|op'],
    ['7|7', '8|8', '9|9', '×|*|op'],
    ['4|4', '5|5', '6|6', '−|-|op'],
    ['1|1', '2|2', '3|3', '+|+|op'],
    ['0|0', '.|.', '±|neg', '=|=|op'],
  ];

  const calcPad = () => CALC_ROWS.map(row => row.map(spec => {
    const [label, key, cls] = spec.split('|');
    return `<button class="calc__k${cls ? ' calc__k--' + cls : ''}" data-k="${key}">${label}</button>`;
  }).join('')).join('');

  const APPS = {
    mycomputer: { title: 'My Computer', icon: 'computer', w: 430, h: 260, body: `
      <div class="w98list">
        ${item('floppy', '3½ Floppy (A:)')}
        ${item('drive', '(C:)')}
        ${item('cd', '(D:)')}
        ${item('gear', 'Control Panel', 'display')}
        ${item('chip', 'Device Manager', 'skills')}
      </div>`,
      status: ['5 object(s)', '1.44 MB free'] },

    about: { title: 'About Me.txt - Notepad', label: 'About Me.txt', icon: 'doc',
      w: 470, h: 310, menubar: true, pane: true, flush: true,
      body: '<textarea class="w98edit" spellcheck="false" aria-label="About Me.txt">'
        + ABOUT_TEXT + '</textarea>' },

    projects: { title: 'Projects', icon: 'folder', w: 420, h: 250, body: `
      <div class="w98list">
        ${item('doc', 'PrivacyLayer.prj', 'proj1')}
        ${item('doc', 'SemiCon-ML.prj', 'proj5')}
        ${item('doc', 'DATNet.prj', 'proj6')}
        ${item('doc', 'DVWA-RCE.prj', 'proj2')}
        ${item('doc', 'SomaiyaSat.prj', 'proj3')}
        ${item('doc', 'E-Cell.prj', 'proj4')}
        ${item('pic', 'SEMICON.BMP', 'semipic')}
      </div>`,
      status: ['7 object(s)', '  '] },

    proj1: { title: 'PrivacyLayer', icon: 'doc', w: 460, h: 330, pane: true, body: `
      <h4>PrivacyLayer — 2026</h4>
      <p>Self-sovereign identity. Prove you hold a degree, or that you are over 18,
         without handing over the data behind it: credentials stay on the device,
         the verifier learns the minimum, and there is no server-side PII to breach
         by construction.</p>
      <p>A nine-package TypeScript monorepo. The security-critical core runs on Node
         built-ins with <i>zero</i> runtime dependencies, alongside Groth16 circuits,
         a Solidity anchor contract, three services and a React Native wallet.</p>
      <p>Consent receipts go into an off-chain Merkle transparency log, and only the
         root is anchored on-chain — a public per-user log would be a correlation
         oracle and would collide with the right to erasure. Every presentation is
         nonce- and audience-bound, so a captured QR cannot be replayed against a
         different verifier. Issuers live in a signed, versioned trust registry, and
         revocation flips a bitstring status list.</p>
      <p>344 tests, and an end-to-end demo that runs issue → selective disclosure →
         verify → revoke with no mocked cryptography.</p>
      <p><b>Stated honestly:</b> the shipped suite is Ed25519 with hash-based
         selective disclosure. The BBS+ rail that would make presentations genuinely
         unlinkable is interfaced but not implemented, so unlinkability is a design
         property here rather than a delivered one.</p>
      <p><b>Built with:</b> TypeScript, W3C VC 2.0, DID, OpenID4VP, Ed25519, Groth16,
         Solidity, React Native<br>
         <b>Status:</b> Live — private repository</p>` },

    proj5: { title: 'SemiCon-ML', icon: 'doc', w: 470, h: 340, pane: true, body: `
      <h4>SemiCon-ML — NAFNet-SR — 2026</h4>
      <p>Built for the SemiCon AI Hackathon (KLA problem statement 01): recover a
         clean 256&times;256 image from a 128&times;128 input degraded by multiplicative
         speckle, additive Gaussian noise and 2&times; downsampling applied jointly, in
         random order. Denoising and super-resolution in a single forward pass.</p>
      <p>A NAFNet body verified byte-identical to the reference implementation, with
         the input and output ends adapted for the task: a log input transform,
         because the dominant noise is <i>multiplicative</i> and the log makes it
         behave additively before the network sees it; a resize-conv SR head; and a
         bicubic global residual, so the network learns only the correction rather
         than the whole reconstruction. An FFT notch on known period-2 and period-4
         bins clears the last artifact for +1.35 dB at no inference cost.</p>
      <table class="w98metrics">
        <tr><th></th><th>Bicubic</th><th>Ours</th></tr>
        <tr><td>PSNR</td><td>22.639 dB</td><td><b>29.333 dB</b></td></tr>
        <tr><td>SSIM</td><td>0.4933</td><td><b>0.7764</b></td></tr>
        <tr><td>LPIPS</td><td>0.4631</td><td><b>0.2669</b></td></tr>
      </table>
      <p>+6.69 dB over the no-model baseline, on a 320-image held-out split that is
         source-aware and leakage-verified — 62% of the total gain available between
         that baseline and a perfect-denoise ceiling. 29.16M parameters, 12.6 ms per
         image. The forward model was <i>measured</i>, not guessed: a 26.2M-equation
         kernel solve and a noise fit at R² = 0.975.</p>
      <p>See <a href="#" data-openlink="semipic">SEMICON.BMP</a> for a plate.</p>
      <p><b>Built with:</b> PyTorch, Python, NumPy, CUDA<br>
         <b>Status:</b> Published —
         <a href="https://github.com/Bladekiller246/SemiCon-ML"
            target="_blank" rel="noopener">on GitHub</a></p>` },

    proj6: { title: 'DATNet', icon: 'doc', w: 470, h: 330, pane: true, body: `
      <h4>DATNet — dual-axis restoration — 2026</h4>
      <p><b>Work in progress.</b> Not published, and there is no verdict yet —
         what follows is what has been built and measured, not a result.</p>
      <p>One transformer block holding both attention axes at once: Restormer's
         channel-axis MDTA and SwinIR's shifted-window spatial attention, blended
         by a learned per-channel gate. The claim isn't that two attentions were
         combined — that is crowded — but that the channel/spatial balance is
         an <i>explicit, measurable quantity</i> that depends on the degradation,
         and that one all-in-one checkpoint can carry super-resolution too.</p>
      <p>Trained on denoising, the gate does not sit still. It settles
         channel-dominant at full resolution (g ≈ 0.80), spatial-dominant across
         the bottleneck (g ≈ 0.20), and close to even in between — the shape the
         hypothesis says should exist at all. That is one arm; the comparison arms
         have not been re-run, so it is a measurement rather than a finding.</p>
      <p>An ablation is only honest if the arms differ by architecture and nothing
         else, so MDTA and GDFN are held bit-exact against Restormer's own
         implementation and the window attention against SwinIR.</p>
      <p>The first run of the experiment was thrown out: the gate turned out to be
         decorative, making the dual arm a fixed blend rather than the architecture
         under test. It was discarded, a test now asserts the gate and only the
         gate sets the balance, and the remaining arms are queued rather than
         claimed.</p>
      <p>Trained on one 8 GB laptop GPU in bounded, resumable segments. The card
         does not run out of memory — the driver silently spills to system RAM and
         runs 20× slower — so the allocator is capped to make the failure honest.</p>
      <p><b>Built with:</b> PyTorch, Python, CUDA<br>
         <b>Status:</b> Work in progress — not yet published</p>` },

    /* The one raster image in the OS. Greyscale, three panels wide, shown at
       whatever the window is rather than at 1:1 — the source is 792px and no
       default window is that wide. */
    semipic: { title: 'SEMICON.BMP - Imaging', label: 'SEMICON.BMP', icon: 'pic',
      w: 500, h: 260, flush: true, body: `
      <div class="w98img">
        <img src="assets/semicon-compare.png" width="792" height="256"
             alt="Three panels side by side. Left: the degraded input, buried in
                  speckle. Centre: the model's restored output, with the fine
                  striped texture legible again. Right: the ground truth, which
                  the centre panel closely matches.">
        <div class="w98img__cap">
          <span>Degraded input</span><span>Model output</span><span>Ground truth</span>
        </div>
      </div>`,
      status: ['792 x 256', '8-bit grey'] },
    proj2: { title: 'Unrestricted File Upload to RCE', icon: 'doc', w: 450, h: 290, pane: true, body: `
      <h4>Unrestricted File Upload → RCE — 2026</h4>
      <p>VAPT finding against DVWA's upload module: no extension, MIME-type or
         magic-byte validation, on a directory sitting inside the web root. Chained
         to remote code execution with a benign PHP shell to confirm system-level
         command execution.</p>
      <p>Rated Critical, and published with root cause, reproduction steps, business
         impact and a four-part fix — extension allow-listing, magic-byte
         verification, execution disabled in upload directories, and UUID renaming.</p>
      <p><b>Built with:</b> DVWA, Burp Suite, PHP<br>
         <b>Status:</b> Published —
         <a href="https://github.com/Bladekiller246/dvwa-file-upload-Vulnerability-"
            target="_blank" rel="noopener">on GitHub</a></p>` },
    proj3: { title: 'SomaiyaSat · SomaiyaPod', icon: 'doc', w: 450, h: 270, pane: true, body: `
      <h4>SomaiyaSat · SomaiyaPod — 2026</h4>
      <p>Mission site and ground-station tooling for a 5 cm PocketQube carrying an
         onboard AI data router and a multi-mode amateur radio payload — M17,
         Codec2, SSTV and TT&amp;C.</p>
      <p>Ground-station registration and a telemetry alert dashboard.</p>
      <p><b>Built with:</b> Next.js, JavaScript<br>
         <b>Status:</b> In build — private repository</p>` },
    proj4: { title: 'E-Cell Research Paper', icon: 'doc', w: 430, h: 240, pane: true, body: `
      <h4>E-Cell Impact on Engineering Campuses — 2026</h4>
      <p>Editor on a research paper examining what Entrepreneurship Cells actually
         do for the institutions that house them — correcting errors and pulling
         the draft into one voice.</p>
      <p><b>Role:</b> Editor<br>
         <b>Status:</b> Manuscript in preparation</p>` },

    skills: { title: 'Device Manager', icon: 'chip', w: 400, h: 300, pane: true, body: `
      <ul class="w98tree">
        <li><b>${I.computer.replace('32" height="32', '16" height="16')} KVD-4400</b>
          <ul>
            <li>Recon — Nmap, Netcat, Wireshark</li>
            <li>Web application — Burp Suite, OWASP ZAP, DVWA</li>
            <li>Exploitation — Metasploit, John the Ripper, Exploit-DB</li>
            <li>Languages — Python (pandas/NumPy), C, C++, JavaScript, TypeScript</li>
            <li>Machine learning — PyTorch, CUDA, image restoration (NAFNet, Restormer/SwinIR)</li>
            <li>Databases — MS SQL Server (T-SQL), MongoDB</li>
            <li>Infrastructure — Linux, Git, VS Code, Jupyter</li>
            <li>Forensics — driver loading, honours coursework</li>
            <li>Certificate — Web Designing and Development, Aptech (2018)</li>
            <li>Certificate — Google Cybersecurity Professional, Coursera (loading, expected Dec 2026)</li>
          </ul>
        </li>
      </ul>` },

    contact: { title: 'Contact', icon: 'mail', w: 400, h: 220, pane: true, body: `
      <p>The station listens on all of these. Mail gets the fastest reply.</p>
      <dl class="w98fields">
        <dt>Mail</dt><dd><a href="mailto:mannkuvadiya2006@gmail.com">mannkuvadiya2006@gmail.com</a></dd>
        <dt>GitHub</dt><dd><a href="https://github.com/Bladekiller246" target="_blank" rel="noopener">github.com/Bladekiller246</a></dd>
        <dt>LinkedIn</dt><dd><a href="https://linkedin.com/in/mann-kuvadiya" target="_blank" rel="noopener">linkedin.com/in/mann-kuvadiya</a></dd>
        <dt>Résumé</dt><dd><a href="Mann_Kuvadiya_Resume.pdf" target="_blank" rel="noopener">Mann_Kuvadiya_Resume.pdf</a></dd>
      </dl>` },

    /* Left by the operator for whoever comes next. Opens itself on the
       desktop when there is one, and is simply absent when there is
       not — see SEGMENT.note(). */
    note: { title: 'FOR_YOU.TXT', label: 'For You', icon: 'doc',
      w: 420, h: 240, pane: true, body: '' },

    bin: { title: 'Recycle Bin', icon: 'bin', w: 360, h: 190, body:
      `<p style="padding:16px;text-align:center;color:#555">This folder is empty.</p>`,
      status: ['0 object(s)', '0 bytes'] },

    help: { title: 'Help', icon: 'help', w: 410, h: 290, pane: true, body: `
      <h4>Using this desktop</h4>
      <p>• <b>Double-click</b> an icon to open it (or press Enter when it's focused).<br>
         • Drag a window by its title bar; drag the bottom-right corner to resize.<br>
         • Use the taskbar buttons to switch between open windows.<br>
         • <b>Right-click</b> the desktop to arrange icons or change the colour.<br>
         • <b>Start ▸ Shut Down</b> returns you to the terminal.<br>
         • <b>Esc</b> closes the front window.</p>
      <h4>Worth opening</h4>
      <p>• <b>Internet Explorer</b> — browses a small web that lives inside this
         machine. Back, Forward and Stop all work; it cannot reach the real
         internet and says so rather than pretending.<br>
         • <b>MS-DOS Prompt</b> — type <b>help</b> for the command list. The whole
         portfolio is on A: as plain text.<br>
         • <b>Calendar</b> — also on a double-click of the tray clock.<br>
         • <b>Run…</b> takes program names, same as the real thing.<br>
         • <b>Minesweeper</b> is 9×9 with 10 mines, and the first click is always safe.</p>
      <h4>The knob</h4>
      <p>The <b>TUBE</b> knob on the cabinet is the volume in here. Turn it
         clockwise for louder, click it to mute. The channel keys are locked
         while Windows is up.</p>
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

    calc: { title: 'Calculator', icon: 'calc', w: 244, h: 262, flush: true, body: `
      <div class="calc" tabindex="0">
        <output class="calc__lcd" data-lcd>0</output>
        <div class="calc__pad">${calcPad()}</div>
      </div>`,
      init: initCalc },

    ie: { title: 'Internet Explorer', label: 'Internet', icon: 'ie',
      w: 590, h: 420, flush: true, body: `
      <div class="ie">
        <div class="w98menubar"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span>
          <span><u>G</u>o</span><span>F<u>a</u>vorites</span><span><u>H</u>elp</span></div>
        <div class="ie__bar">
          <button class="ie__btn" data-nav="back" disabled><b>&#9664;</b>Back</button>
          <button class="ie__btn" data-nav="fwd" disabled><b>&#9654;</b>Forward</button>
          <button class="ie__btn" data-nav="stop" disabled><b class="ie__x">&#10006;</b>Stop</button>
          <button class="ie__btn" data-nav="reload"><b>&#8635;</b>Refresh</button>
          <button class="ie__btn" data-nav="home"><b>&#8962;</b>Home</button>
          <!-- No page can tell a blocked frame from a loaded one, so this
               stays lit whenever a live page is up: one click and the real
               browser gets it. -->
          <button class="ie__btn ie__btn--out" data-nav="pop" disabled
            title="Open this address in a real browser window"><b>&#8599;</b>New window</button>
        </div>
        <div class="ie__addr">
          <label for="ieUrl">Address</label>
          <input class="ie__url" id="ieUrl" data-url spellcheck="false" autocomplete="off">
          <button class="w98btn ie__go" data-nav="go">Go</button>
          <span class="ie__throb" data-throb aria-hidden="true">e</span>
        </div>
        <div class="ie__view">
          <div class="ie__page" data-page tabindex="0"></div>
          <!-- The real web, rendered by the real engine. sandbox without
               allow-top-navigation: a framed site must not be able to
               steer the page it is sitting inside. The attribute is set
               again per load — a proxied page gets a tighter one. See
               IE_SANDBOX. -->
          <iframe class="ie__frame" data-frame title="Web page" hidden
            referrerpolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
        </div>
        <div class="ie__favs" data-favs hidden></div>
        <div class="w98status ie__status">
          <i data-status>Done</i>
          <i class="ie__prog"><b data-progress></b></i>
          <i data-zone>Internet zone</i>
        </div>
      </div>`,
      init: initIE },

    games: { title: 'Games', icon: 'folder', w: 440, h: 300, body: `
      <div class="w98list">
        ${item('snake', 'Snake', 'snake')}
        ${item('mine', 'Minesweeper', 'mines')}
        ${item('doom', 'DOOM', 'doom')}
        ${item('doom2', 'DOOM II', 'doom2')}
        ${item('gta', 'Grand Theft Auto', 'gta')}
        ${item('gta', 'Grand Theft Auto 2', 'gta2')}
        ${item('vc', 'GTA: Vice City', 'vicecity')}
        ${item('rogue', 'PokéRogue', 'pokerogue')}
        ${item('eclipse', 'Pokémon Eclipse RPG', 'eclipse')}
        ${item('vortex', 'Pokémon Vortex', 'vortex')}
      </div>`,
      status: ['10 object(s)', '  '] },

    snake: { title: 'Snake', icon: 'snake', w: 372, h: 352, body: `
      <div class="snk">
        <div class="snk__head">
          <span class="snk__lcd" data-lcd="score">000</span>
          <button class="snk__face" data-new aria-label="New game">&#9654;</button>
          <span class="snk__lcd" data-lcd="best">000</span>
        </div>
        <canvas class="snk__board" data-board></canvas>
        <p class="snk__msg" data-msg>Arrow keys or WASD &middot; P pauses</p>
      </div>`,
      init: initSnake },

    calendar: { title: 'Date/Time Properties', label: 'Calendar', icon: 'cal',
      w: 318, h: 302, body: `
      <div class="cal">
        <div class="cal__head">
          <button class="w98btn cal__step" data-cal="prev" aria-label="Previous month">&#9664;</button>
          <select class="w98input cal__month" data-cal="month" aria-label="Month"></select>
          <input class="w98input cal__year" data-cal="year" inputmode="numeric" aria-label="Year">
          <button class="w98btn cal__step" data-cal="next" aria-label="Next month">&#9654;</button>
        </div>
        <table class="cal__grid">
          <thead><tr><th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th></tr></thead>
          <tbody data-cal="grid"></tbody>
        </table>
        <p class="cal__now">Current time: <b data-cal="clock">&nbsp;</b></p>
        <div class="w98btns"><button class="w98btn" data-cal="today">Today</button></div>
      </div>`,
      init: initCalendar },

    dos: { title: 'MS-DOS Prompt', icon: 'dos', w: 540, h: 320, flush: true, body: `
      <div class="dos" data-dos>
        <pre class="dos__log" data-log></pre>
        <p class="dos__line">
          <span data-prompt>A:\\PORTFOLIO&gt;</span><input class="dos__in" data-in
            spellcheck="false" autocomplete="off" aria-label="MS-DOS command line">
        </p>
      </div>`,
      init: initDos },
  };

  function item(icon, label, opens) {
    return `<button class="w98item" ${opens ? `data-open="${opens}"` : ''}>${I[icon]}<span>${label}</span></button>`;
  }


  /* desktop layout, in order */
  const DESKTOP = ['mycomputer', 'ie', 'about', 'projects', 'skills', 'contact',
                   'dos', 'games', 'bin'];

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
    // guest is the default path, so it is what the keyboard lands on
    defer(() => $('#gateGuest').focus({ preventScroll: true }));
  }

  function backToTerminal() {
    stopTimers();
    window.JOURNAL?.sessionEnd();
    [gate, login, osboot, splash, w98].forEach(hide);
    window.OVERDRIVE?.stop();
    stopWhine(false);
    body.classList.remove('is-alt', 'is-win98', 'is-admin');
    hideCtx();
    kvd().restoreWarp?.();
    kvd().burst?.(380);
    closeMenu();
    document.querySelector('#tab-comms')?.focus({ preventScroll: true });
  }

  document.addEventListener('kvd:gate', openGate);
  $('#gateBack').addEventListener('click', backToTerminal);

  /* ── §3b · THE RESTRICTED SEGMENT ───────────────────────
     A prop lock, and worth being plain about it: this pair lives in
     client-side source, so anyone who opens devtools has it. It gates a
     hidden room in a portfolio, nothing more, and nothing behind it is
     secret — it is a door with a key under the mat, on purpose, because
     a static site has nowhere else to put a key. */
  const ADMIN_USER = 'Gone_Gambling';
  const ADMIN_PASS = 'ALL_ON_RED';

  /* The tone that arrives with the red. A thin high pair, detuned just
     enough to beat against each other a few times a second — the sound
     of a room that is listening. It sits under a lowpass so it is never
     shrill, and it *cuts* rather than fades when the door opens, which
     is the whole trick: silence lands harder than any sting. */
  let whine = null;

  function startWhine() {
    const a = snd();
    if (!a || !a.ensure() || a.muted || whine) return;
    const ac = a.ctx;
    const t0 = ac.currentTime;

    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(0.05, t0 + 1.6);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200;
    out.connect(lp); lp.connect(a.bus);

    const oscs = [2870, 2876.5].map(hz => {
      const o = ac.createOscillator();
      o.type = 'sine'; o.frequency.value = hz;
      o.connect(out); o.start(t0);
      return o;
    });

    // something far below it, felt more than heard
    const sub = ac.createOscillator();
    const subG = ac.createGain();
    sub.type = 'sine'; sub.frequency.value = 41;
    subG.gain.setValueAtTime(0.0001, t0);
    subG.gain.exponentialRampToValueAtTime(0.055, t0 + 2.4);
    sub.connect(subG); subG.connect(a.bus); sub.start(t0);

    whine = { out, subG, oscs: oscs.concat(sub) };
  }

  /* cut:true is the door opening — 25ms to nothing. Otherwise it backs
     out the way it came in. */
  function stopWhine(cut) {
    if (!whine) return;
    const a = snd();
    /* This runs immediately before the handoff to OVERDRIVE, so it is
       not allowed to throw: a torn-down context here would take the
       whole submit handler with it and a correct password would appear
       to do nothing. Drop the reference and move on. */
    if (!a || !a.ctx) { whine = null; return; }
    const t0 = a.ctx.currentTime;
    const fall = cut ? 0.025 : 0.5;
    [whine.out, whine.subG].forEach(g => {
      g.gain.cancelScheduledValues(t0);
      g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + fall);
    });
    whine.oscs.forEach(o => o.stop(t0 + fall + 0.05));
    whine = null;
  }

  function openAdmin() {
    hide(gate); show(login);
    body.classList.add('is-admin');
    $('#loginMsg').textContent = '';
    $('#loginMsg').classList.remove('is-deny');
    $('#luser').value = ''; $('#lpass').value = '';
    /* A successful login disables this on the way out and has no reason
       to put it back — the OS is taking the screen. Which means the
       *second* visit to this door arrives at a dead button unless the
       reset happens here, on the way in. */
    $('#loginGo').disabled = false;
    ensureAudio();
    startWhine();
    kvd().burst?.(300);
    defer(() => $('#luser').focus({ preventScroll: true }));
  }

  function leaveAdmin() {
    body.classList.remove('is-admin');
    stopWhine(false);
  }

  $('#gateAdmin').addEventListener('click', openAdmin);

  $('#loginCancel').addEventListener('click', () => {
    leaveAdmin();
    hide(login); show(gate);
    $('#gateAdmin').focus();
  });

  let attempts = 0;
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('#loginMsg');
    const go = $('#loginGo');
    const user = $('#luser').value.trim();
    const pass = $('#lpass').value;
    const ok = user === ADMIN_USER && pass === ADMIN_PASS;

    go.disabled = true;
    msg.classList.remove('is-deny');
    msg.textContent = 'AUTHENTICATING…';

    setTimeout(() => {
      if (ok) {
        window.JOURNAL?.grant();
        msg.textContent = 'IDENTITY CONFIRMED — welcome back, operator';
        $('#lpass').value = '';
        stopWhine(true);            // the room stops listening
        kvd().burst?.(520);
        setTimeout(startAdmin, 620);
        return;
      }
      attempts++;
      window.JOURNAL?.deny();
      msg.classList.add('is-deny');
      msg.textContent = `ACCESS DENIED — credentials rejected (attempt ${attempts})`;
      $('#lpass').value = '';
      go.disabled = false;
      kvd().burst?.(260);
      $('#lpass').focus({ preventScroll: true });
    }, 900);
  });

  /* Hand the tube to the other operating system. It lives in
     overdrive.js and owns everything from here; this only clears the
     terminal's own furniture out of the way first. */
  function startAdmin() {
    stopTimers();
    hide(gate); hide(login);
    body.classList.remove('is-admin');
    body.classList.add('is-alt');
    window.OVERDRIVE?.start({
      onExit: backToTerminal,
      audio: snd(),
      burst: n => kvd().burst?.(n),
      setWarp: n => kvd().setWarpScale?.(n),
      // RECON needs a server to read headers; this is the same one
      // compatibility mode uses, and is empty until one is deployed
      proxy: IE_WORKER,
      apps: DESKTOP.map(id => ({ id, name: APPS[id]?.label || APPS[id]?.title || id })),
    });
  }

  $('#gateGuest').addEventListener('click', () => { ensureAudio(); startGuest(); });

  /* ── STARTUP CHIME ──────────────────────────────────────
     Synthesised, not sampled: a rising D-major figure over a warm pad.
     The real Windows 98 sound is Microsoft's copyrighted asset and is not
     shipped here — this is an original stand-in with the same shape.
     The AudioContext is created on the GUEST click so autoplay policy
     lets it through; playChime() then just schedules notes. */

  // The context, the master gain, the volume and the mute flag all live
  // in crt.js §6b — the TUBE knob drives them, and the chime is just one
  // more thing plugged into the same bus.
  const snd = () => kvd().audio;

  function ensureAudio() { snd()?.ensure(); }

  function playChime() {
    const a = snd();
    if (!a || !a.ensure() || a.muted || calm.matches) return;
    const ac = a.ctx;
    const t0 = ac.currentTime + 0.06;
    const out = ac.createGain();
    out.gain.value = 0.85;
    out.connect(a.bus);

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
    window.JOURNAL?.sessionStart('guest');

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
      <div class="w98body${app.pane ? ' pane' : ''}${app.flush ? ' w98body--flush' : ''}">${app.body}</div>
      ${app.status ? `<div class="w98status">${app.status.map(t => `<i>${t}</i>`).join('')}</div>` : ''}`;

    winLayer.appendChild(win);

    const task = document.createElement('button');
    task.className = 'w98task';
    task.innerHTML = `${I[app.icon].replace('width="32" height="32"', 'width="13" height="13"')}<span>${app.title}</span>`;
    taskbar.appendChild(task);

    open.set(id, { win, task });
    window.JOURNAL?.enter(id, app.title);

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
    /* Prose links inside a window body. Separate from [data-open] because an
       icon opens on the second click and a link opens on the first. */
    win.querySelectorAll('[data-openlink]').forEach(a => {
      a.addEventListener('click', ev => {
        ev.preventDefault(); openApp(a.dataset.openlink);
      });
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
    window.JOURNAL?.leave(id, APPS[id]?.title || id);
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
      // Edge to edge, and the tube shaves its corners — which is what a
      // maximised window looks like on real glass. What it must not do
      // is lose the title bar's icon or buttons to the curve, so
      // .is-max pulls the *contents* in to --edge-x instead.
      Object.assign(win.style, {
        left: '0px', top: '0px', width: '100%', height: '100%',
      });
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
    snake: 'snake', games: 'games', doom: 'doom', doom2: 'doom2',
    'doom ii': 'doom2', gta: 'gta', 'grand theft auto': 'gta',
    gta2: 'gta2', 'gta 2': 'gta2', 'grand theft auto 2': 'gta2',
    vc: 'vicecity', vicecity: 'vicecity', 'vice city': 'vicecity',
    'gta vice city': 'vicecity',
    control: 'display', 'control panel': 'display', display: 'display',
    devmgr: 'skills', 'device manager': 'skills',
    mail: 'contact', contact: 'contact',
    help: 'help', 'my computer': 'mycomputer', sol: 'mines',
    calc: 'calc', calculator: 'calc',
    command: 'dos', 'command.com': 'dos', cmd: 'dos', dos: 'dos',
    'ms-dos prompt': 'dos', prompt: 'dos',
    iexplore: 'ie', ie: 'ie', 'internet explorer': 'ie', browser: 'ie',
    calendar: 'calendar', date: 'calendar', time: 'calendar',
    'date/time': 'calendar', timedate: 'calendar',
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

  /* Calculator: standard view, accumulator model, keyboard-driven */
  function initCalc(win) {
    const lcd = win.querySelector('[data-lcd]');
    const root = win.querySelector('.calc');

    let cur = '0';      // what the display is showing
    let acc = null;     // the left-hand operand, once one exists
    let op = null;      // pending operator
    let fresh = true;   // next digit starts a new number
    let err = false;

    const MAXLEN = 16;

    // 0.1 + 0.2 must not read 0.30000000000000004 on a 1998 calculator
    const tidy = n => {
      if (!isFinite(n)) return null;
      const s = String(+n.toPrecision(12));
      return s.length > MAXLEN ? n.toExponential(9) : s;
    };

    const paint = () => { lcd.textContent = cur; };

    const apply = () => {
      const b = parseFloat(cur);
      const r = op === '+' ? acc + b
              : op === '-' ? acc - b
              : op === '*' ? acc * b
              : acc / b;
      const s = tidy(r);
      if (s === null) { cur = 'Cannot divide by zero'; err = true; return; }
      cur = s;
    };

    function key(k) {
      if (err && k !== 'clr') return;          // only C clears an error

      if (k >= '0' && k <= '9') {
        if (fresh) { cur = k; fresh = false; }
        else if (cur.length < MAXLEN) cur = cur === '0' ? k : cur + k;
      } else if (k === '.') {
        if (fresh) { cur = '0.'; fresh = false; }
        else if (!cur.includes('.')) cur += '.';
      } else if (k === 'neg') {
        cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur;
      } else if (k === 'back') {
        if (!fresh) cur = cur.slice(0, -1).replace(/^-?$/, '0');
      } else if (k === 'ce') {
        cur = '0'; fresh = true;
      } else if (k === 'clr') {
        cur = '0'; acc = null; op = null; fresh = true; err = false;
      } else if (k === '+' || k === '-' || k === '*' || k === '/') {
        if (op !== null && !fresh) apply();
        if (!err) { acc = parseFloat(cur); op = k; fresh = true; }
      } else if (k === '=') {
        if (op !== null) { apply(); op = null; acc = null; }
        fresh = true;
      }
      paint();
    }

    win.querySelectorAll('.calc__k').forEach(b =>
      b.addEventListener('click', () => { key(b.dataset.k); root.focus(); }));

    const KEYMAP = {
      Enter: '=', '=': '=', Backspace: 'back', Escape: 'clr',
      Delete: 'ce', x: '*', X: '*', ',': '.',
    };

    const dirty = () => err || cur !== '0' || acc !== null || op !== null;

    win.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = KEYMAP[e.key] || e.key;
      if (!/^([0-9]|\.|\+|-|\*|\/|=|clr|ce|back|neg)$/.test(k)) return;
      // Esc clears, the way the real one does — but on an already-clear
      // display it falls through and closes the window like everywhere else
      if (e.key === 'Escape' && !dirty()) return;
      e.preventDefault();
      e.stopPropagation();
      key(k);
    });

    defer(() => root.focus({ preventScroll: true }));
    paint();
  }

  /* ── §6c1 · SNAKE ────────────────────────────────────────
     Written here, not embedded — it is small enough to own. Grid of
     cells on a canvas, a queue for the body, and a turn buffer so a
     fast double-tap round a corner does not get eaten by the tick. */

  function initSnake(win) {
    const COLS = 24, ROWS = 18, CELL = 14;
    const cv = win.querySelector('[data-board]');
    const ctx = cv.getContext('2d');
    const scoreEl = win.querySelector('[data-lcd="score"]');
    const bestEl = win.querySelector('[data-lcd="best"]');
    const face = win.querySelector('[data-new]');
    const msg = win.querySelector('[data-msg]');

    cv.width = COLS * CELL;
    cv.height = ROWS * CELL;

    const pad3 = n => String(Math.max(0, Math.min(999, n))).padStart(3, '0');
    let best = 0;
    try { best = parseInt(localStorage.getItem('kvd-snake'), 10) || 0; } catch (_) {}

    let snake, dir, turns, food, score, timer, over, paused, speed;

    const at = (x, y) => snake.some(s => s.x === x && s.y === y);

    function place() {
      let x, y;
      do {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
      } while (at(x, y));
      food = { x, y };
    }

    function reset() {
      snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
      dir = { x: 1, y: 0 };
      turns = [];
      score = 0; over = false; paused = false; speed = 140;
      face.textContent = '▶';
      msg.textContent = 'Arrow keys or WASD · P pauses';
      place();
      run();
      draw();
      paint();
    }

    function run() {
      clearInterval(timer);
      timer = setInterval(tick, speed);
    }

    function paint() {
      scoreEl.textContent = pad3(score);
      bestEl.textContent = pad3(best);
    }

    function tick() {
      if (over || paused) return;

      // one queued turn per tick, so a corner taken quickly still lands
      while (turns.length) {
        const t = turns.shift();
        if (t.x !== -dir.x || t.y !== -dir.y) { dir = t; break; }
      }

      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || at(head.x, head.y)) {
        lose();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        if (score > best) {
          best = score;
          try { localStorage.setItem('kvd-snake', String(best)); } catch (_) {}
        }
        if (speed > 62) { speed -= 4; run(); }
        place();
        paint();
      } else {
        snake.pop();
      }
      draw();
    }

    function lose() {
      over = true;
      clearInterval(timer);
      face.textContent = '↻';
      msg.textContent = score >= best && score > 0
        ? `${score} — best yet. Press the button to go again.`
        : `${score}. Press the button to go again.`;
      draw();
    }

    function draw() {
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0, 0, cv.width, cv.height);

      ctx.strokeStyle = 'rgba(60,140,60,.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < COLS; x++) { ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, cv.height); }
      for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, y * CELL + .5); ctx.lineTo(cv.width, y * CELL + .5); }
      ctx.stroke();

      ctx.fillStyle = '#e02020';
      ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);

      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#5aff5a' : '#22c022';
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });

      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,.6)';
        ctx.fillRect(0, cv.height / 2 - 18, cv.width, 36);
        ctx.fillStyle = '#fff';
        ctx.font = '700 17px "MS Sans Serif",Tahoma,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', cv.width / 2, cv.height / 2 + 6);
      } else if (paused) {
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(0, cv.height / 2 - 16, cv.width, 32);
        ctx.fillStyle = '#fff';
        ctx.font = '700 15px "MS Sans Serif",Tahoma,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', cv.width / 2, cv.height / 2 + 5);
      }
    }

    const KEYS = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
    };

    win.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'p' || e.key === 'P') {
        if (!over) { paused = !paused; draw(); }
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (e.key === 'Enter' && over) { reset(); e.preventDefault(); e.stopPropagation(); return; }
      const k = KEYS[e.key];
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();          // arrows must not walk the desktop icons
      if (over || paused) return;
      if (turns.length < 2) turns.push({ x: k[0], y: k[1] });
    });

    face.addEventListener('click', reset);
    cv.addEventListener('pointerdown', () => cv.focus());
    cv.tabIndex = 0;

    win._cleanup = () => clearInterval(timer);
    defer(() => cv.focus({ preventScroll: true }));
    reset();
  }

  /* ── §6c1b · THE ARCADE ──────────────────────────────────
     DOOM, DOOM II and the original Grand Theft Auto are DOS binaries.
     They run here the only way they can in a browser: the Internet
     Archive's in-page DOSBox, framed. The emulator is not sandboxed —
     it needs workers, WASM and full keyboard, and archive.org is the
     host either way — but nothing loads until Start is pressed, so
     opening the folder does not spin up three emulators.

     Grand Theft Auto is the 1997 DMA Design original. GTA2 is a Win32
     DirectX title: DOSBox cannot run it and no in-browser build of it
     exists, which is a technical wall rather than a licensing one. */

  const ARCHIVE = id => 'https://archive.org/embed/' + id;

  const ARCADE = {
    doom: { name: 'DOOM', icon: 'doom', src: ARCHIVE('DoomsharewareEpisode'),
      blurb: 'id Software, 1993 — Episode 1, Knee-Deep in the Dead.' },

    doom2: { name: 'DOOM II', icon: 'doom2', src: ARCHIVE('doomII'),
      blurb: 'id Software, 1994 — Hell on Earth.' },

    gta: { name: 'Grand Theft Auto', icon: 'gta',
      src: ARCHIVE('grand-theft-auto-1997-dma-design'),
      blurb: 'DMA Design, 1997 — the original top-down one.' },

    /* Not DOSBox. A JavaScript port of the engine, which reflows to
       whatever size you give it — so it is marked fluid and fills the
       window instead of being scaled like the emulated three. */
    gta2: { name: 'Grand Theft Auto 2', icon: 'gta', fluid: true,
      src: 'https://gta2js.vercel.app/',
      blurb: 'Rockstar North, 1999. A JS port of the engine ' +
             '(h0x91b/gta2-resurection), running on the data from the ' +
             'official free release — not emulated, rebuilt.' },

    /* The one that has to open outward. reVCDOS is a real WebAssembly
       port and it genuinely runs, but the only public build is on
       dos.zone, whose CSP names the hosts allowed to frame it and this
       is not one of them:

         frame-ancestors https://dos.zone https://cdn.dos.zone
                         http://br.cdn.dos.zone https://sec.dos.zone
                         https://test.js-dos.com https://*.discord.com

       Self-hosting is the documented alternative, but that means
       carrying Vice City's asset bundle — past GitHub's 100 MB file
       ceiling and Pages' 1 GB budget. So: launcher. Flip `launch` off
       the day a framable build exists and it moves in-window. */
    vicecity: { name: 'GTA: Vice City', icon: 'vc', launch: true,
      src: 'https://dos.zone/revcdos/',
      blurb: 'Rockstar North, 2002. A WebAssembly port of the rebuilt ' +
             'engine (reVC / reVCDOS), hosted by DOS Zone.' },

    /* ── the fan games ──────────────────────────────────────
       Unlike everything above, these are live third-party sites rather
       than something emulated or ported: they run on their own servers,
       and they can change, break or disappear without notice.

       Framing checked by reading their headers, not assumed —
       pokerogue.net and eclipserpg.com sent no X-Frame-Options and no
       frame-ancestors policy; pokemon-vortex.com sent
       `x-frame-options: SAMEORIGIN`, so it gets the launcher. Any of
       them can add the header any day, which is what the launcher
       treatment exists for.

       One caveat that is nobody's bug: a game framed cross-origin is
       in a partitioned storage bucket in current browsers, so saves
       made in here are not the saves made on the real site, and may not
       survive at all. Play anything you care about keeping in a real
       window. */
    /* Frames fine — it is the *login* that cannot survive being framed.
       The session cookie is set in a cross-origin context, so Chrome
       partitions it and Firefox and Safari drop it; the next request
       goes out unauthenticated and the logged-out page comes back.
       Measured by logging in, not assumed.

       There is no fix on this side. Storage Access has to be requested
       by the framed page itself after a gesture, and `allow=
       "storage-access"` only grants permission to ask — the game would
       have to call it. So: launcher, where the cookie is first-party
       and an account works. */
    pokerogue: { name: 'PokéRogue', icon: 'rogue', launch: true,
      why: 'This one frames fine — the login does not. A session cookie set ' +
           'inside another site\'s page is a third-party cookie, and the ' +
           'browser drops it, so the game comes back logged out. It opens in ' +
           'a real window instead, where an account works.',
      src: 'https://pokerogue.net/',
      blurb: 'Pagefault Games — a browser Pokémon fangame built as a ' +
             'roguelite: endless runs, stacking items, biome to biome. ' +
             'Open source, TypeScript, AGPL-3.0.' },

    eclipse: { name: 'Pokémon Eclipse RPG', icon: 'eclipse', fluid: true,
      src: 'https://eclipserpg.com/',
      blurb: 'A browser RPG set in the Apholite region, against ' +
             'ShadowCelebi. Fan-made — Pokémon belongs to Nintendo, ' +
             'Game Freak and Creatures.' },

    vortex: { name: 'Pokémon Vortex', icon: 'vortex', launch: true,
      src: 'https://www.pokemon-vortex.com/',
      blurb: 'A long-running browser MMO, fan-made. It allows only its ' +
             'own site to frame it, so this one opens outward.' },
  };

  /* One shell for all three, built here rather than up in APPS — ARCADE
     is a const declared in this section, and the loop has to run after
     it exists, not before. */
  Object.keys(ARCADE).forEach(id => {
    const g = ARCADE[id];
    APPS[id] = {
      title: g.name, icon: g.icon,
      w: g.launch ? 470 : 680, h: g.launch ? 344 : 500, flush: true,
      body: `
        <div class="arc" data-arc="${esc(g.src)}"${g.fluid ? ' data-fluid' : ''}${
          g.launch ? ' data-launch' : ''}>
          <div class="arc__start">
            ${I[g.icon].replace('width="32" height="32"', 'width="52" height="52"')}
            <h3>${g.name}</h3>
            <p>${g.blurb}</p>
            <button class="w98btn arc__go" data-go>${g.launch ? 'Launch' : 'Start'}</button>
            <p class="arc__note">${
              // a launcher is not always a framing refusal — `why` says which
              g.launch ? (g.why ||
                         'Its host only allows itself to be framed by its own site, ' +
                         'so this one opens in a new browser window. Everything else ' +
                         'in this folder runs in place.')
              : g.fluid ? 'Runs in the browser. Click inside once it loads so it gets the keyboard.'
              : 'Runs in DOSBox, streamed from the Internet Archive. Click inside once it loads so it gets the keyboard.'}</p>
          </div>
        </div>`,
      init: initArcade,
    };
  });

  /* The emulator lays its canvas out once, against whatever the iframe
     measured at load, and never reflows — so maximising the window just
     bought more black around a small picture. It is cross-origin, so
     there is no telling it to resize.

     Instead the frame keeps a fixed logical size and gets scaled to fit
     by transform. The browser maps pointer coordinates through a
     transform, so clicking still lands where it looks like it should,
     and the whole thing composites on the GPU. 800x600 as the base
     means the default window is a slight downscale — sharp — and a
     maximised one a modest upscale, which a CRT is forgiving of. */
  const ARC_W = 800, ARC_H = 600;

  function initArcade(win) {
    const root = win.querySelector('[data-arc]');
    const src = root.dataset.arc;
    const fluid = root.hasAttribute('data-fluid');

    /* Sealed from the admin segment. The window still opens and still
       says what it is — a game that has quietly vanished from the
       folder is a bug report, one that says it was sealed is a story. */
    if (!window.SEGMENT?.arcadeOpen()) {
      root.querySelector('[data-go]').replaceWith(
        Object.assign(document.createElement('p'), {
          className: 'arc__note',
          textContent: 'Sealed by the operator. This cabinet is not taking coins today.',
        }));
      return;
    }

    if (root.hasAttribute('data-launch')) {
      win.querySelector('[data-go]').addEventListener('click', () =>
        window.open(src, '_blank', 'noopener'));
      return;
    }

    win.querySelector('[data-go]').addEventListener('click', () => {
      const stage = document.createElement('div');
      stage.className = 'arc__stage';

      const f = document.createElement('iframe');
      f.className = 'arc__frame';
      f.title = 'Game';
      f.setAttribute('allow', 'autoplay; fullscreen; gamepad');
      f.setAttribute('scrolling', 'no');
      f.src = src;

      stage.appendChild(f);
      root.innerHTML = '';
      root.appendChild(stage);

      let ro = null;
      if (fluid) {
        // it lays itself out to whatever it is given — just give it everything
        f.classList.add('arc__frame--fluid');
      } else {
        f.style.width = ARC_W + 'px';
        f.style.height = ARC_H + 'px';
        const fit = () => {
          const r = stage.getBoundingClientRect();
          if (!r.width || !r.height) return;
          f.style.transform = 'scale(' + Math.min(r.width / ARC_W, r.height / ARC_H) + ')';
        };
        ro = new ResizeObserver(fit);
        ro.observe(stage);
        fit();
      }

      win._cleanup = () => { ro?.disconnect(); f.remove(); };
      // the game only sees the keyboard once the frame has it
      defer(() => f.focus());
    });

    win._cleanup = () => { root.querySelector('iframe')?.remove(); };
  }

  /* ── §6c2 · INTERNET EXPLORER ────────────────────────────
     A real browser over a web that is not real.

     It cannot fetch anything, and that is not a shortcut: a static page
     has no proxy to fetch through, and every site worth loading sends
     X-Frame-Options that would refuse the frame anyway. What it does do
     is *browse* — history with working back and forward, a stop that
     actually cancels the load, refresh, an address bar that resolves
     hostnames, and the genuine "page cannot be displayed" when it can't.
     Type a real URL and it hands it to your actual browser rather than
     pretending.

     The pages are the portfolio again, written the way a personal site
     was written in 1998. ✎ to edit. */

  const IE_HOME = 'http://kvd.local/';

  const page = (title, body) => ({ title, body });

  const SITES = {
    'kvd.local': page('Mann Kuvadiya :: Ground Station', `
      <center>
        <h1 class="ie-h1">MANN KUVADIYA</h1>
        <p class="ie-tag">~ vulnerability assessment &middot; penetration testing ~</p>
        <hr class="ie-rule">
      </center>
      <p><b>Welcome to my homepage!</b> This station breaks web applications on
         purpose, writes down exactly how, and then builds the things that don't
         break the same way. Pull up a chair.</p>
      <table class="ie-nav">
        <tr>
          <td><a data-href="http://kvd.local/missions">Missions</a></td>
          <td><a data-href="http://kvd.local/station">The Station</a></td>
          <td><a data-href="http://kvd.local/downlink">Downlink</a></td>
          <td><a data-href="http://kvd.local/guestbook">Guestbook</a></td>
        </tr>
      </table>
      <p>Last updated: whenever the pass window closed.</p>
      <hr class="ie-rule">
      <h2 class="ie-h2">Out on the wire</h2>
      <p>This browser does reach the real internet &mdash; the page below the
         chrome is rendered by the engine you are actually running. Plenty of
         sites allow being framed; the ones that don't are fetched through a
         proxy instead and arrive as plain HTML, which is enough for most of
         the web and nowhere near enough for an application:</p>
      <ul>
        <li><a data-href="https://info.cern.ch/hypertext/WWW/TheProject.html">The
            first website ever published</a> (CERN, 1991)</li>
        <li><a data-href="https://wiby.me">Wiby</a> &mdash; a search engine for
            pages built like this one</li>
        <li><a data-href="https://www.spacejam.com/1996/">Space Jam</a>, still up,
            still 1996</li>
      </ul>
      <p>More under <b>Favorites</b> in the menu bar.</p>
      <hr class="ie-rule">
      <center>
        <p class="ie-small">You are visitor number
          <span class="ie-counter">0000<b>7</b><b>3</b><b>1</b></span></p>
        <p class="ie-small">Best viewed at 800&times;600 &middot; This site is
          <b>Lynx friendly</b></p>
      </center>`),

    'kvd.local/missions': page('Missions', `
      <h2 class="ie-h2">Mission log</h2>
      <hr class="ie-rule">
      <table class="ie-table">
        <tr><th>Desig</th><th>Name</th><th>Year</th><th>Status</th></tr>
        <tr><td>MSN-01</td><td>PrivacyLayer</td><td>2026</td><td>LIVE</td></tr>
        <tr><td>MSN-02</td><td>SemiCon-ML &middot; NAFNet-SR</td><td>2026</td><td>LIVE</td></tr>
        <tr><td>MSN-03</td><td>DATNet &middot; dual-axis restoration</td><td>2026</td><td>WIP</td></tr>
        <tr><td>MSN-04</td><td>Unrestricted File Upload &rarr; RCE</td><td>2026</td><td>LIVE</td></tr>
        <tr><td>MSN-05</td><td>SomaiyaSat &middot; SomaiyaPod</td><td>2026</td><td>BUILD</td></tr>
        <tr><td>MSN-06</td><td>E-Cell Research Paper</td><td>2026</td><td>BUILD</td></tr>
      </table>
      <p>Full write-ups are in the <a data-href="http://kvd.local/">Projects</a>
         folder on the desktop, or on
         <a data-href="https://github.com/Bladekiller246">GitHub</a>.</p>
      <p><a data-href="http://kvd.local/">&laquo; Back to the index</a></p>`),

    'kvd.local/station': page('The Station', `
      <h2 class="ie-h2">About the station</h2>
      <hr class="ie-rule">
      <p>A third-year B.Tech IT student at K. J. Somaiya College of Engineering,
         on the Honours track in Cyber Security. Most of what gets built here is
         one loop run in both directions: take something apart until it gives,
         then build something that doesn't.</p>
      <table class="ie-table">
        <tr><th>Based</th><td>Mumbai, IN &middot; UTC+5:30</td></tr>
        <tr><th>Degree</th><td>B.Tech IT, Honours in Cyber Security &middot; CGPA 8.00/10</td></tr>
        <tr><th>Focus</th><td>VAPT &middot; Web app security &middot; Network recon</td></tr>
        <tr><th>Learning</th><td>Digital forensics, Google Cybersecurity certificate</td></tr>
        <tr><th>Certificates</th><td>Web Designing and Development, Aptech (2018) &middot;
            Google Cybersecurity Professional, Coursera (expected Dec 2026)</td></tr>
        <tr><th>Status</th><td>Open to internships</td></tr>
      </table>
      <p><a data-href="http://kvd.local/">&laquo; Back to the index</a></p>`),

    'kvd.local/downlink': page('Downlink', `
      <h2 class="ie-h2">Open a downlink</h2>
      <hr class="ie-rule">
      <p>The station listens on all of these. Mail gets the fastest reply.</p>
      <table class="ie-table">
        <tr><th>Mail</th><td><a data-href="mailto:mannkuvadiya2006@gmail.com">mannkuvadiya2006@gmail.com</a></td></tr>
        <tr><th>GitHub</th><td><a data-href="https://github.com/Bladekiller246">github.com/Bladekiller246</a></td></tr>
        <tr><th>LinkedIn</th><td><a data-href="https://linkedin.com/in/mann-kuvadiya">linkedin.com/in/mann-kuvadiya</a></td></tr>
      </table>
      <p><a data-href="http://kvd.local/">&laquo; Back to the index</a></p>`),

    'kvd.local/guestbook': page('Guestbook', `
      <h2 class="ie-h2">Sign my guestbook</h2>
      <hr class="ie-rule">
      <p>Nothing here is sent anywhere and nothing is stored. There is no
         server on the other end of this window &mdash; it is a page inside a
         browser inside a terminal on somebody's desk.</p>
      <table class="ie-form">
        <tr><th>Name</th><td><input class="w98input" data-gb spellcheck="false"></td></tr>
        <tr><th>Homepage</th><td><input class="w98input" data-gb spellcheck="false" value="http://"></td></tr>
        <tr><th>Message</th><td><textarea class="w98input" rows="3" data-gb spellcheck="false"></textarea></td></tr>
      </table>
      <p><button class="w98btn" data-gbsign>Sign it</button>
         <span class="ie-note" data-gbout></span></p>
      <p><a data-href="http://kvd.local/">&laquo; Back to the index</a></p>`),
  };

  const IE_404 = title => page('Cannot find server', `
    <h2 class="ie-h2">The page cannot be displayed</h2>
    <hr class="ie-rule">
    <p>The page you are looking for is currently unavailable. The site might be
       experiencing technical difficulties, or you may need to adjust your
       browser settings.</p>
    <p class="ie-note">Cannot find server or DNS Error &mdash;
       <b>${esc(title)}</b></p>
    <hr class="ie-rule">
    <p>Please try the following:</p>
    <ul>
      <li>Check that the address is spelled correctly.</li>
      <li>Go to <a data-href="http://kvd.local/">the station index</a>.</li>
      <li>Accept that this terminal has no uplink to anywhere but itself.</li>
    </ul>`);

  /* Shown when the page would not come up — either the site refuses to
     be framed and the engine obeyed it, or compatibility mode was tried
     and no proxy would answer. Offers both ways forward. */
  const IE_REFUSED = (url, why) => page('Connection refused', `
    <h2 class="ie-h2">${esc(why)}</h2>
    <hr class="ie-rule">
    <p><b>${esc(url)}</b> would not open in this window.</p>
    <p class="ie-note">Most large sites send <b>X-Frame-Options</b> or a
       <b>frame-ancestors</b> policy telling browsers never to display them
       inside another page. Your browser is obeying that, correctly, and
       nothing on this side can talk it out of it.</p>
    <hr class="ie-rule">
    <p>Two ways round it:</p>
    <p><button class="w98btn" data-proxy="${esc(url)}">Retry in compatibility mode</button>
       <span class="ie-note">&nbsp;fetches the page through a public proxy
       instead of framing it &mdash; see below</span></p>
    <p><button class="w98btn" data-external="${esc(url)}">Open ${esc(url)} in a new window</button></p>
    <hr class="ie-rule">
    <p class="ie-note"><b>About compatibility mode.</b> The framing headers are
       the site's word to <i>your browser</i>, so the page is fetched by
       somebody else's server instead and handed to the frame as text. That
       server sees the address. Only the HTML travels that way &mdash; images,
       stylesheets and scripts still come from the site itself &mdash; so
       ordinary pages arrive intact and anything that runs as an application
       will not. Forms that post, and anything you are logged in to, will not
       work at all.</p>
    <p><a data-href="http://kvd.local/">&laquo; Back to the station</a></p>`);

  /* Hosts known to forbid framing, so the refusal page can be shown at
     once and be *right* rather than guessing.

     A page cannot detect the refusal itself. Measured, not assumed: for
     a frame the engine blocked and a frame that loaded fine, every
     readable signal is identical — `contentWindow.location` throws the
     same SecurityError, `contentDocument` is null for both, `length` is
     0 for both, and timing is no help either (blocked neocities.org
     took 923 ms; working example.com took 85 ms). The browser logs the
     reason to the console and exposes nothing to script.

     So: this list for the sites people actually try, an optimistic load
     for everything else, and an always-available "open properly"
     button for whatever slips through. Not exhaustive and cannot be.

     These no longer refuse outright — a host listed here goes straight
     to compatibility mode below, since there is no point framing it
     first to watch it fail. */
  const IE_DENY = [
    'google.com', 'google.co.in', 'gmail.com', 'youtube.com', 'github.com',
    'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 'linkedin.com',
    'reddit.com', 'amazon.com', 'amazon.in', 'netflix.com', 'apple.com',
    'microsoft.com', 'live.com', 'outlook.com', 'bing.com', 'stackoverflow.com',
    'neocities.org', 'openai.com', 'chatgpt.com', 'anthropic.com', 'claude.ai',
    'notion.so', 'figma.com', 'twitch.tv', 'discord.com', 'whatsapp.com',
  ];

  /* Addresses that frame fine even though their host is on IE_DENY,
     which matches whole hosts and would otherwise swallow the embeds
     ieRewrite() exists to produce. Checked first. */
  const IE_ALLOW = [
    /^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//i,
  ];

  /* Some hosts refuse their normal pages but publish a framable embed —
     worth rewriting rather than refusing. */
  function ieRewrite(u) {
    const yt = u.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/i)
            || u.match(/^https?:\/\/youtu\.be\/([\w-]{6,})/i);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    return u;
  }

  /* ── compatibility mode ──────────────────────────────────
     The trick from x-frame-bypass (niutech, MIT): X-Frame-Options and
     frame-ancestors are instructions to a *browser* about framing, and
     an ordinary server-to-server GET is neither a browser nor a frame.
     So fetch the HTML through a public CORS proxy and hand the text to
     the frame as `srcdoc`. The frame never asks the site for permission
     to embed it, so there is nothing left for the site to refuse.

     What it costs, stated plainly because it is not free:

     · The proxy sees every address opened this way. These are free
       public ones, run by strangers. The fetch is anonymous — no
       cookies, no credentials, `credentials: 'omit'` — so it is always
       the logged-out view of a page. Don't drive a session through it.
     · Only the HTML comes through the proxy. Everything the page then
       pulls in resolves against <base> and loads from the real origin,
       so a static page arrives whole and an application arrives broken:
       anything fetched by the site's own XHR is same-origin to a
       document that is no longer on that origin, and fails.
     · `srcdoc` inherits *this* document's origin, so a proxied load
       drops `allow-same-origin` from the sandbox. The fetched HTML gets
       an opaque origin and cannot touch this page — which is the whole
       reason to drop it, since otherwise arbitrary third-party script
       would be running first-party here. The cost is `frameElement`,
       which is how the original follows links; links come back over
       postMessage instead (IE_BRIDGE).
     · GET only. A read-only proxy has no way to post a form.

     Tried in order, first one that answers wins. Any of them can be
     rate-limited or gone on any given day, which is what the fallback
     chain and the refusal page are for. */
  /* A proxy of your own beats all of it: it can strip the headers at
     the source, rewrite the links so navigation stays in the frame,
     and stream instead of buffering. Deploy proxy/worker.js, put its
     URL here, and everything below becomes the fallback for when it is
     down or over quota. Empty = never called.

     It has to be a *different origin* from this page. Everything it
     serves is same-origin with whatever serves it, and the frame keeps
     allow-same-origin for a real load — on its own workers.dev
     subdomain that isolates proxied pages, on a path of this domain it
     would hand them the run of this one. See proxy/README.md. */
  const IE_WORKER = '';

  const IE_PROXIES = [
    ['api.allorigins.win', u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)],
    ['api.codetabs.com',   u => 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(u)],
    ['corsproxy.io',       u => 'https://corsproxy.io/?url=' + encodeURIComponent(u)],
  ];

  const IE_SANDBOX = {
    // a real cross-origin load: same-origin means the *site's* origin
    live:  'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox',
    // srcdoc: same-origin would mean *ours*, so it does not get it
    proxy: 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox',
  };

  /* Injected into every proxied page. It is the only way back out of an
     opaque-origin frame: no shared DOM, so navigation is a message. */
  const IE_BRIDGE = `<script>(function(){
  var post = function (m) { m.kvdIE = 1; parent.postMessage(m, '*'); };
  var link = function (e) { return e.target.closest && e.target.closest('a[href]'); };
  addEventListener('click', function (e) {
    var a = link(e);
    if (!a || a.target === '_blank') return;
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(raw)) return;
    e.preventDefault();
    post({ go: a.href });
  }, true);
  addEventListener('submit', function (e) {
    var f = e.target;
    e.preventDefault();
    if ((f.method || 'get').toLowerCase() === 'post') {
      post({ note: 'That form has to be posted, which the proxy cannot do.' });
      return;
    }
    var q = new URLSearchParams(new FormData(f)).toString();
    post({ go: (f.action || location.href).split('#')[0].split('?')[0] + (q ? '?' + q : '') });
  }, true);
  addEventListener('mouseover', function (e) { var a = link(e); if (a) post({ hover: a.href }); }, true);
  addEventListener('mouseout',  function (e) { if (link(e)) post({ hover: '' }); }, true);
})();<\/script>`;

  const IE_DOC = body =>
    `<body style="margin:0;padding:12px 14px;background:#fff;color:#000;` +
    `font:13px/1.5 'MS Sans Serif',Tahoma,sans-serif">${body}</body>`;

  const IE_FETCHING = IE_DOC('<p style="color:#555">Contacting proxy&hellip;</p>');

  /* <base> so relative URLs still resolve against the real site, the
     bridge for navigation, and two things removed: the page's own CSP
     meta, which would otherwise forbid the bridge from running, and
     `crossorigin` attributes, which now ask for CORS the new opaque
     origin will never be granted. */
  function ieShim(html, url) {
    const head = `<base href="${esc(url)}">` + IE_BRIDGE;
    const out = html
      .replace(/<meta[^>]+http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, '')
      .replace(/\s+crossorigin(\s*=\s*(["'][^"']*["']|\S+))?/gi, '');
    return /<head[^>]*>/i.test(out)
      ? out.replace(/<head[^>]*>/i, m => m + head)
      : '<!DOCTYPE html><html><head>' + head + '</head>' + out + '</html>';
  }

  const iePlain = text =>
    IE_DOC(`<pre style="white-space:pre-wrap;font:12px 'Courier New',monospace">${esc(text)}</pre>`);

  /* Verified framable at the time of writing — checked by reading their
     response headers, not by guessing. A site can add the header any
     day, which is what the refusal page above is for. */
  const IE_FAVS = [
    ['The first website (CERN, 1991)', 'https://info.cern.ch/hypertext/WWW/TheProject.html'],
    ['Wikipedia — Cathode-ray tube', 'https://en.wikipedia.org/wiki/Cathode-ray_tube'],
    ['Wikipedia — random article', 'https://en.wikipedia.org/wiki/Special:Random'],
    ['Space Jam (1996)', 'https://www.spacejam.com/1996/'],
    ["Cameron's World", 'https://cameronsworld.net'],
    ['Wiby — search the old web', 'https://wiby.me'],
    ['Internet Archive', 'https://archive.org'],
    ['RFC 1149 — IP over avian carriers', 'https://www.rfc-editor.org/rfc/rfc1149.txt'],
    ['example.com', 'https://example.com'],
  ];

  function initIE(win) {
    const view   = win.querySelector('[data-page]');
    const frame  = win.querySelector('[data-frame]');
    const urlIn  = win.querySelector('[data-url]');
    const status = win.querySelector('[data-status]');
    const prog   = win.querySelector('[data-progress]');
    const throb  = win.querySelector('[data-throb]');
    const favBox = win.querySelector('[data-favs]');
    const zone   = win.querySelector('[data-zone]');
    const nav    = k => win.querySelector('[data-nav="' + k + '"]');

    const hist = [];
    let at = -1;
    let load = null;        // { timer, url, live, pending, ctrl }
    let want = null;        // the url the iframe is currently trying
    let note = '';          // what the status bar says instead of "Done"
    let titled = false;     // the frame told us its own title; don't overwrite it
    const forced = new Set();   // hosts pinned to compatibility mode

    // "kvd.local/missions" — the key SITES is written in
    const keyOf = u => u.replace(/^[a-z]+:\/\//i, '').replace(/\/+$/, '').toLowerCase();
    const isLocal = u => /^https?:\/\/kvd\.local(\/|$)/i.test(u);

    function normalise(raw) {
      let u = String(raw).trim();
      if (!u) return '';
      if (/^(mailto|tel):/i.test(u)) return u;
      if (!/^[a-z]+:\/\//i.test(u)) u = 'https://' + u;
      return u;
    }

    function setTitle(t) {
      win.querySelector('.w98title b').textContent = t + ' - Internet Explorer';
      const task = open.get('ie')?.task?.querySelector('span');
      if (task) task.textContent = t;
    }

    function paintNav() {
      nav('back').disabled = at <= 0;
      nav('fwd').disabled = at >= hist.length - 1;
      nav('stop').disabled = !load;
      const live = hist[at] && !isLocal(hist[at]);
      nav('pop').disabled = !live;
    }

    function stop() {
      if (!load) return;
      clearInterval(load.timer);
      clearTimeout(load.giveUp);
      load.ctrl?.abort();     // a proxy fetch in flight, if there is one
      load = null;
      want = null;
      throb.classList.remove('is-spin');
      prog.style.width = '0%';
      status.textContent = 'Stopped';
      paintNav();
    }

    /* srcdoc outranks src, so both go or neither does */
    function blankFrame() {
      frame.hidden = true;
      frame.removeAttribute('src');
      frame.removeAttribute('srcdoc');
    }

    /* ── local pages ── */
    function drawLocal(u, p) {
      blankFrame();
      view.hidden = false;
      view.innerHTML = p.body;
      view.scrollTop = 0;
      setTitle(p.title);
      wirePage();
      finish();
    }

    function finish() {
      if (load) { clearInterval(load.timer); clearTimeout(load.giveUp); }
      load = null; want = null;
      throb.classList.remove('is-spin');
      prog.style.width = '0%';
      status.textContent = note || 'Done';
      paintNav();
    }

    /* ── the real web ── */

    const hostOf = u => { try { return new URL(u).hostname.toLowerCase(); } catch (_) { return ''; } };
    const framable = u => IE_ALLOW.some(r => r.test(u));
    const denied = u => {
      if (framable(u)) return false;
      const h = hostOf(u);
      return IE_DENY.some(d => h === d || h.endsWith('.' + d));
    };

    function showRefusal(u, why) {
      blankFrame();
      view.hidden = false;
      view.innerHTML = IE_REFUSED(u, why).body;
      view.scrollTop = 0;
      setTitle('Connection refused');
      wirePage();
      finish();
    }

    function settleLive(u, why) {
      if (want !== u) return;
      if (why === 'timeout') {
        showRefusal(u, 'The page is taking too long to respond');
        return;
      }
      // DOMContentLoaded beats load, so a title from the bridge is
      // already the better one by the time this runs
      if (!titled) setTitle(u.replace(/^https?:\/\//, '').replace(/\/$/, ''));
      finish();
    }

    // the placeholder doc fires this too, hence `pending`
    frame.addEventListener('load', () => {
      if (want && !load?.pending) settleLive(want, 'load');
    });

    function drawLive(u) {
      // an https page cannot pull in an http frame — but a proxy fetched
      // over https can, so that is a reason to proxy rather than refuse
      const mixed = location.protocol === 'https:' && /^http:\/\//i.test(u);
      const pinned = forced.has(hostOf(u)) && !framable(u);
      if (mixed || denied(u) || pinned) {
        if (IE_WORKER) drawWorker(u); else drawProxied(u);
        return;
      }

      view.hidden = true;
      frame.hidden = false;
      want = u;
      frame.removeAttribute('srcdoc');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      frame.setAttribute('sandbox', IE_SANDBOX.live);
      frame.src = u;
      if (load) load.giveUp = setTimeout(() => settleLive(u, 'timeout'), 12000);
    }

    /* Our own proxy, when there is one. This is an ordinary frame load
       again — real navigation, real history, streamed, and a Stop that
       cancels for real — so it keeps allow-same-origin, which here
       means same-origin with the *worker*, not with this page. */
    function drawWorker(u) {
      view.hidden = true;
      frame.hidden = false;
      want = u;
      frame.removeAttribute('srcdoc');
      // the worker checks this to know the call came from the site; it
      // is never passed on, so the target still sees nothing of us
      frame.setAttribute('referrerpolicy', 'origin');
      frame.setAttribute('sandbox', IE_SANDBOX.live);
      // hand-pasted constant, so don't trust it to lack a trailing slash
      frame.src = IE_WORKER.replace(/\/+$/, '') + '/?url=' + encodeURIComponent(u);
      forced.add(hostOf(u));
      zone.textContent = 'Compatibility zone';
      note = 'Done — fetched through the proxy';
      if (load) load.giveUp = setTimeout(() => settleLive(u, 'timeout'), 20000);
    }

    /* ── compatibility mode ── */

    async function ieFetch(u, signal) {
      let last = null;
      for (const [name, wrap] of IE_PROXIES) {
        try {
          const res = await fetch(wrap(u), { signal, credentials: 'omit' });
          if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
          const type = (res.headers.get('content-type') || '').toLowerCase();
          if (type && !/^text\/|html|xml|json|javascript/.test(type))
            throw new Error(type + ' is not a page');
          const body = await res.text();
          if (!body.trim()) throw new Error('empty response');
          return {
            via: name,
            doc: /html|xml/.test(type) || !type ? ieShim(body, u) : iePlain(body),
          };
        } catch (err) {
          if (signal.aborted) throw err;
          last = err;
        }
      }
      throw last || new Error('no proxy configured');
    }

    async function drawProxied(u) {
      view.hidden = true;
      frame.hidden = false;
      want = u;
      frame.removeAttribute('src');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      frame.setAttribute('sandbox', IE_SANDBOX.proxy);
      frame.srcdoc = IE_FETCHING;
      status.textContent = 'Fetching ' + u + ' through a proxy…';

      const ctrl = new AbortController();
      if (load) {
        load.pending = true;    // the placeholder's load event is not the page
        load.ctrl = ctrl;
        load.giveUp = setTimeout(() => ctrl.abort(), 25000);
      }

      let got;
      try {
        got = await ieFetch(u, ctrl.signal);
      } catch (err) {
        if (want !== u) return;   // stopped, or navigated away mid-flight
        showRefusal(u, ctrl.signal.aborted
          ? 'The proxy is taking too long to respond'
          : 'No proxy would fetch that address');
        return;
      }
      if (want !== u) return;

      forced.add(hostOf(u));      // links off this page go the same way
      zone.textContent = 'Compatibility zone';
      note = 'Done — fetched through ' + got.via;
      if (load) load.pending = false;
      frame.srcdoc = got.doc;
    }

    /* The only channel out of an opaque-origin frame. Anything else on
       the page can postMessage too — the DOOM cabinets are iframes —
       so the sender is checked before a word of it is believed. */
    const onBridge = e => {
      if (e.source !== frame.contentWindow) return;
      const d = e.data;
      if (!d || d.kvdIE !== 1) return;

      // srcdoc mode: the page cannot navigate itself, so it asks
      if (typeof d.go === 'string') { go(d.go); return; }

      // worker mode: it navigated on its own and is reporting where to.
      // The address bar is cross-origin to it and cannot look.
      if (typeof d.at === 'string' && d.at !== hist[at]) {
        hist.splice(at + 1);
        hist.push(d.at);
        at = hist.length - 1;
        urlIn.value = d.at;
        forced.add(hostOf(d.at));
        paintNav();
      }
      if (d.title) { titled = true; setTitle(d.title); }
      if (typeof d.note === 'string') status.textContent = d.note;
      if (typeof d.hover === 'string') status.textContent = d.hover || note || 'Done';
    };
    window.addEventListener('message', onBridge);

    function go(raw, push) {
      let u = normalise(raw);
      if (!u) return;
      if (/^mailto:/i.test(u)) { window.open(u); return; }
      if (!isLocal(u)) u = ieRewrite(u);

      stop();
      if (push !== false) {
        hist.splice(at + 1);
        hist.push(u);
        at = hist.length - 1;
      }
      urlIn.value = u;
      window.JOURNAL?.seek(u, isLocal(u));
      note = '';
      titled = false;
      zone.textContent = 'Internet zone';
      closeFavs();

      const local = isLocal(u) ? (SITES[keyOf(u)] || IE_404(u)) : null;

      let pct = 0;
      status.textContent = 'Opening page ' + u + '…';
      throb.classList.add('is-spin');
      load = { url: u, live: !local };
      paintNav();

      load.timer = setInterval(() => {
        // a local page runs to 100 on its own; a live one eases toward 90
        // and waits for the engine to actually finish
        pct += local ? 8 + Math.random() * 22 : (90 - pct) * 0.13;
        if (local && pct >= 100) { drawLocal(u, local); return; }
        prog.style.width = Math.min(pct, 96) + '%';
      }, 55);

      if (!local) drawLive(u);
    }

    /* ── Favorites ── */
    favBox.innerHTML = IE_FAVS
      .map(f => `<button data-fav="${esc(f[1])}">${esc(f[0])}</button>`).join('') +
      `<hr><button data-fav="${IE_HOME}">The station index</button>`;

    const closeFavs = () => { favBox.hidden = true; };
    favBox.querySelectorAll('[data-fav]').forEach(b =>
      b.addEventListener('click', () => { closeFavs(); go(b.dataset.fav); }));

    const favMenu = [...win.querySelectorAll('.w98menubar span')]
      .find(s => /Favorites/i.test(s.textContent));
    favMenu?.addEventListener('click', e => {
      e.stopPropagation();
      favBox.hidden = !favBox.hidden;
      if (!favBox.hidden) {
        const m = favMenu.getBoundingClientRect();
        const w = win.getBoundingClientRect();
        favBox.style.left = (m.left - w.left) + 'px';
        favBox.style.top = (m.bottom - w.top) + 'px';
      }
    });
    win.addEventListener('pointerdown', e => {
      if (!favBox.hidden && !e.target.closest('[data-favs]')) closeFavs();
    });

    function wirePage() {
      view.querySelectorAll('[data-href]').forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.href); });
        a.addEventListener('mouseenter', () => { status.textContent = a.dataset.href; });
        a.addEventListener('mouseleave', () => { status.textContent = 'Done'; });
      });
      view.querySelectorAll('[data-external]').forEach(b =>
        b.addEventListener('click', () =>
          window.open(b.dataset.external, '_blank', 'noopener')));

      // pin the host first, so links off the page it fetches follow it
      view.querySelectorAll('[data-proxy]').forEach(b =>
        b.addEventListener('click', () => {
          forced.add(hostOf(b.dataset.proxy));
          go(b.dataset.proxy, false);
        }));

      const sign = view.querySelector('[data-gbsign]');
      if (sign) {
        sign.addEventListener('click', () => {
          const out = view.querySelector('[data-gbout]');
          const name = view.querySelector('[data-gb]');
          out.textContent = name && name.value.trim()
            ? `Thanks, ${name.value.trim()} — nothing was sent, and nothing was kept.`
            : 'Nothing was sent, and nothing was kept.';
        });
      }
    }

    nav('back').addEventListener('click', () => { if (at > 0) { at--; go(hist[at], false); } });
    nav('fwd').addEventListener('click', () => { if (at < hist.length - 1) { at++; go(hist[at], false); } });
    nav('reload').addEventListener('click', () => { if (hist[at]) go(hist[at], false); });
    nav('home').addEventListener('click', () => go(IE_HOME));
    nav('stop').addEventListener('click', stop);
    nav('go').addEventListener('click', () => go(urlIn.value));
    nav('pop').addEventListener('click', () => {
      if (hist[at]) window.open(hist[at], '_blank', 'noopener');
    });

    urlIn.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); go(urlIn.value); }
    });
    urlIn.addEventListener('focus', () => urlIn.select());

    win._cleanup = () => {
      stop();
      window.removeEventListener('message', onBridge);
      blankFrame();
    };
    go(IE_HOME);
  }

  /* ── §6c3 · CALENDAR ─────────────────────────────────────
     The Date/Time control panel, which is where a calendar lived in
     1998. Read-only about the machine's clock — it shows the host's
     time and will not try to set it. */

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December'];

  function initCalendar(win) {
    const q = k => win.querySelector('[data-cal="' + k + '"]');
    const monthSel = q('month'), yearIn = q('year'), grid = q('grid'), clock = q('clock');

    const today = new Date();
    let y = today.getFullYear(), m = today.getMonth();
    let picked = today.getDate();

    monthSel.innerHTML = MONTHS
      .map((n, i) => `<option value="${i}">${n}</option>`).join('');

    function render() {
      monthSel.value = String(m);
      yearIn.value = String(y);

      const first = new Date(y, m, 1).getDay();          // 0 = Sunday
      const days = new Date(y, m + 1, 0).getDate();
      const isNow = (d) => y === today.getFullYear() && m === today.getMonth()
                        && d === today.getDate();

      let html = '', cell = 0;
      for (let row = 0; row < 6; row++) {
        html += '<tr>';
        for (let col = 0; col < 7; col++, cell++) {
          const d = cell - first + 1;
          if (d < 1 || d > days) { html += '<td></td>'; continue; }
          const cls = [d === picked ? 'is-sel' : '', isNow(d) ? 'is-today' : '']
            .filter(Boolean).join(' ');
          html += `<td><button class="cal__d ${cls}" data-d="${d}">${d}</button></td>`;
        }
        html += '</tr>';
        if (cell >= first + days) break;
      }
      grid.innerHTML = html;

      grid.querySelectorAll('.cal__d').forEach(b =>
        b.addEventListener('click', () => { picked = +b.dataset.d; render(); }));
    }

    function shift(by) {
      m += by;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      render();
    }

    q('prev').addEventListener('click', () => shift(-1));
    q('next').addEventListener('click', () => shift(1));
    monthSel.addEventListener('change', () => { m = +monthSel.value; render(); });
    yearIn.addEventListener('change', () => {
      const v = parseInt(yearIn.value, 10);
      if (v >= 1601 && v <= 9999) { y = v; } // the range the real dialog took
      render();
    });
    yearIn.addEventListener('keydown', e => e.stopPropagation());
    q('today').addEventListener('click', () => {
      y = today.getFullYear(); m = today.getMonth(); picked = today.getDate();
      render();
    });

    const tickClockFace = () => {
      clock.textContent = new Date().toLocaleTimeString();
    };
    tickClockFace();
    const t = setInterval(tickClockFace, 1000);
    win._cleanup = () => clearInterval(t);

    render();
  }

  /* ── §6d · MS-DOS PROMPT ─────────────────────────────────
     A:\ is the portfolio, as plain text. Directories are objects,
     files are strings — that is the whole filesystem. */

  const DOS_FS = {
    'README.TXT': [
      'KVD-4400 / guest session',
      '',
      'Everything on this volume is the portfolio, in the format it was',
      'probably written in first. DIR to look around, TYPE to read.',
      'CD PROJECTS for the mission files.',
    ].join('\n'),

    'ABOUT.TXT': ABOUT_TEXT,

    'SKILLS.TXT': [
      'RECON ......... Nmap, Netcat, Wireshark',
      'WEB APP ....... Burp Suite, OWASP ZAP, DVWA',
      'EXPLOIT ....... Metasploit, John the Ripper, Exploit-DB',
      'LANGUAGES ..... Python (pandas/NumPy), C, C++, JavaScript, TypeScript',
      'ML ............ PyTorch, CUDA, image restoration (NAFNet, Restormer/SwinIR)',
      'DATABASES ..... MS SQL Server (T-SQL), MongoDB',
      'INFRA ......... Linux, Git, VS Code, Jupyter',
      'FORENSICS ..... loading, honours coursework',
      '',
      'CERTIFICATES',
      '  Web Designing and Development, Aptech ......... 2018',
      '  Google Cybersecurity Professional, Coursera ... expected Dec 2026',
    ].join('\n'),

    'CONTACT.TXT': [
      'MAIL ........ mannkuvadiya2006@gmail.com',
      'GITHUB ...... github.com/Bladekiller246',
      'LINKEDIN .... linkedin.com/in/mann-kuvadiya',
      'RESUME ...... Mann_Kuvadiya_Resume.pdf',
      '',
      'Mail gets the fastest reply.',
    ].join('\n'),

    PROJECTS: {
      'PRIVACY.TXT': [
        'MSN-01  PrivacyLayer  (2026, LIVE)',
        '',
        'Self-sovereign identity. Prove you hold a degree, or that you are',
        'over 18, without handing over the data behind it: credentials stay',
        'on the device, the verifier learns the minimum, and there is no',
        'server-side PII to breach by construction.',
        '',
        'A nine-package TypeScript monorepo. The security-critical core runs',
        'on Node built-ins with ZERO runtime dependencies, alongside Groth16',
        'circuits, a Solidity anchor contract, three services and a React',
        'Native wallet.',
        '',
        'Consent receipts go into an off-chain Merkle transparency log, and',
        'only the root is anchored on-chain - a public per-user log would be',
        'a correlation oracle and would collide with the right to erasure.',
        'Every presentation is nonce- and audience-bound, so a captured QR',
        'cannot be replayed against a different verifier. Issuers live in a',
        'signed, versioned trust registry, and revocation flips a bitstring',
        'status list.',
        '',
        '344 tests, and an end-to-end demo that runs issue -> selective',
        'disclosure -> verify -> revoke with no mocked cryptography.',
        '',
        'Stated honestly: the shipped suite is Ed25519 with hash-based',
        'selective disclosure. The BBS+ rail that would make presentations',
        'genuinely unlinkable is interfaced but not implemented, so',
        'unlinkability is a design property here rather than a delivered one.',
        '',
        'Built with: TypeScript, W3C VC 2.0, DID, OpenID4VP, Ed25519,',
        '            Groth16, Solidity, React Native',
        'Status: private repository',
      ].join('\n'),
      'SEMICON.TXT': [
        'MSN-02  SemiCon-ML / NAFNet-SR  (2026, LIVE)',
        '',
        'Built for the SemiCon AI Hackathon (KLA problem statement 01):',
        'recover a clean 256x256 image from a 128x128 input degraded by',
        'multiplicative speckle, additive Gaussian noise and 2x downsampling',
        'applied jointly, in random order. Denoising and super-resolution in',
        'a single forward pass.',
        '',
        'A NAFNet body verified byte-identical to the reference, with the',
        'input and output ends adapted for the task: a log input transform,',
        'because the dominant noise is MULTIPLICATIVE and the log makes it',
        'behave additively before the network sees it; a resize-conv SR head;',
        'and a bicubic global residual, so the network learns only the',
        'correction rather than the whole reconstruction. An FFT notch on',
        'known period-2 and period-4 bins clears the last artifact for',
        '+1.35 dB at no inference cost.',
        '',
        '                  BICUBIC        OURS',
        '  PSNR .......... 22.639 dB      29.333 dB',
        '  SSIM ..........  0.4933         0.7764',
        '  LPIPS .........  0.4631         0.2669',
        '',
        '+6.69 dB over the no-model baseline, on a 320-image held-out split',
        'that is source-aware and leakage-verified - 62% of the total gain',
        'available between that baseline and a perfect-denoise ceiling.',
        '29.16M parameters, 12.6 ms per image. The forward model was',
        'MEASURED, not guessed: a 26.2M-equation kernel solve and a noise',
        'fit at R^2 = 0.975.',
        '',
        'Built with: PyTorch, Python, NumPy, CUDA',
        'Status: github.com/Bladekiller246/SemiCon-ML',
      ].join('\n'),
      'DATNET.TXT': [
        'MSN-03  DATNet / dual-axis restoration  (2026, WORK IN PROGRESS)',
        '',
        'NOT PUBLISHED, AND THERE IS NO VERDICT YET. What follows is what',
        'has been built and measured, not a result.',
        '',
        "One transformer block holding both attention axes at once:",
        "Restormer's channel-axis MDTA and SwinIR's shifted-window spatial",
        'attention, blended by a learned per-channel gate. The claim is not',
        'that two attentions were combined - that is crowded - but that the',
        'channel/spatial balance is an EXPLICIT, MEASURABLE quantity that',
        'depends on the degradation, and that one all-in-one checkpoint can',
        'carry super-resolution too.',
        '',
        'Trained on denoising, the gate does not sit still:',
        '',
        '  ENC 1 ......... g ~ 0.80    channel-dominant',
        '  ENC 2 ......... g ~ 0.50    even',
        '  BOTTLENECK .... g ~ 0.20    spatial-dominant',
        '  DEC 2 ......... g ~ 0.50    even',
        '  DEC 1 / REFINE  g ~ 0.80    channel-dominant',
        '',
        'That is the shape the hypothesis says should exist at all. It is',
        'also ONE ARM - the comparison arms have not been re-run, so it is',
        'a measurement rather than a finding.',
        '',
        'An ablation is only honest if the arms differ by architecture and',
        'nothing else, so MDTA and GDFN are held bit-exact against',
        "Restormer's own implementation, and the window attention against",
        'SwinIR.',
        '',
        'The first run of the experiment was thrown out: the gate turned',
        'out to be decorative, making the dual arm a fixed blend rather',
        'than the architecture under test. It was discarded, a test now',
        'asserts the gate and only the gate sets the balance, and the',
        'remaining arms are queued rather than claimed.',
        '',
        'Trained on one 8 GB laptop GPU in bounded, resumable segments.',
        'The card does not run out of memory - the driver silently spills',
        'to system RAM and runs 20x slower - so the allocator is capped to',
        'make the failure honest.',
        '',
        'Built with: PyTorch, Python, CUDA',
        'Status: work in progress, not yet published',
      ].join('\n'),
      'DVWA.TXT': [
        'MSN-04  Unrestricted File Upload -> RCE  (2026, LIVE)',
        '',
        "VAPT finding against DVWA's upload module: no extension, MIME-type",
        'or magic-byte validation, on a directory sitting inside the web',
        'root. Chained to remote code execution with a benign PHP shell to',
        'confirm system-level command execution.',
        '',
        'Rated Critical, and published with root cause, reproduction steps,',
        'business impact and a four-part fix - extension allow-listing,',
        'magic-byte verification, execution disabled in upload directories,',
        'and UUID renaming.',
        '',
        'Built with: DVWA, Burp Suite, PHP',
        'Status: github.com/Bladekiller246/dvwa-file-upload-Vulnerability-',
      ].join('\n'),
      'SOMAIYA.TXT': [
        'MSN-05  SomaiyaSat / SomaiyaPod  (2026, BUILD)',
        '',
        'Mission site and ground-station tooling for a 5 cm PocketQube',
        'carrying an onboard AI data router and a multi-mode amateur radio',
        'payload - M17, Codec2, SSTV and TT&C. Ground-station registration',
        'and a telemetry alert dashboard.',
        '',
        'Built with: Next.js, JavaScript',
        'Status: private repository',
      ].join('\n'),
      'ECELL.TXT': [
        'MSN-06  E-Cell Impact on Engineering Campuses  (2026, BUILD)',
        '',
        'Editor on a research paper examining what Entrepreneurship Cells',
        'actually do for the institutions that house them - correcting',
        'errors and pulling the draft into one voice.',
        '',
        'Role: Editor',
        'Status: manuscript in preparation',
      ].join('\n'),
    },
  };

  const DOS_HELP = [
    'CD [dir]     change directory (CD .. goes up, CD \\ goes to the root)',
    'CLS          clear the screen',
    'DIR          list this directory',
    'ECHO text    print text',
    'EXIT         close this prompt',
    'HELP         this list',
    'START app    open a program (try START WINMINE)',
    'TIME / DATE  the host clock',
    'TREE         the whole volume at once',
    'TYPE file    print a file',
    'VER          version',
  ].join('\n');

  const isDir = node => node && typeof node === 'object';

  function initDos(win) {
    const pane   = win.querySelector('[data-dos]');
    const log    = win.querySelector('[data-log]');
    const input  = win.querySelector('[data-in]');
    const label  = win.querySelector('[data-prompt]');

    let cwd = [];                       // path below A:\PORTFOLIO
    const hist = [];
    let hi = 0;

    const node = () => cwd.reduce((n, seg) => n[seg], DOS_FS);
    const cwdText = () => 'A:\\PORTFOLIO' + cwd.map(s => '\\' + s).join('');

    const echo = t => {
      log.textContent += t + '\n';
      pane.scrollTop = pane.scrollHeight;
    };

    function dir() {
      const here = node();
      const names = Object.keys(here);
      const dirs = names.filter(n => isDir(here[n]));
      const files = names.filter(n => !isDir(here[n]));
      const rows = [
        ' Volume in drive A is PORTFOLIO',
        '',
        ' Directory of ' + cwdText(),
        '',
        '.            <DIR>',
        cwd.length ? '..           <DIR>' : null,
        ...dirs.map(n => n.padEnd(13) + '<DIR>'),
        ...files.map(n => n.padEnd(13) + String(here[n].length).padStart(9) + '  bytes'),
        '',
        `      ${files.length} file(s)   ${dirs.length} dir(s)`,
      ].filter(r => r !== null);
      echo(rows.join('\n'));
    }

    function tree(here, prefix) {
      Object.keys(here).forEach((n, i, all) => {
        const last = i === all.length - 1;
        echo(prefix + (last ? '\\---' : '+---') + n);
        if (isDir(here[n])) tree(here[n], prefix + (last ? '    ' : '|   '));
      });
    }

    const START = {
      winmine: 'mines', minesweeper: 'mines', calc: 'calc', calculator: 'calc',
      notepad: 'about', explorer: 'projects', control: 'display',
      devmgr: 'skills', mail: 'contact', help: 'help',
      iexplore: 'ie', ie: 'ie', calendar: 'calendar', timedate: 'calendar',
      snake: 'snake', doom: 'doom', doom2: 'doom2', gta: 'gta', gta2: 'gta2',
      vicecity: 'vicecity', vc: 'vicecity', games: 'games',
    };

    function run(raw) {
      const line = raw.trim();
      if (!line) return;
      const [head, ...rest] = line.split(/\s+/);
      const cmd = head.toLowerCase();
      const arg = rest.join(' ');
      const here = node();

      if (cmd === 'help' || cmd === '?') return echo(DOS_HELP);
      if (cmd === 'cls') { log.textContent = ''; return; }
      if (cmd === 'ver') return echo('\nKVD-DOS 7.10  [Version 4.10.1998]\n');
      if (cmd === 'dir') return dir();
      if (cmd === 'echo') return echo(arg || 'ECHO is on.');
      if (cmd === 'date') return echo('Current date is ' + new Date().toDateString());
      if (cmd === 'time') return echo('Current time is ' + new Date().toLocaleTimeString());
      if (cmd === 'tree') { echo(cwdText()); return tree(here, ''); }
      if (cmd === 'exit') return closeApp('dos');
      if (cmd === 'win') return echo('Windows is already running.');
      if (cmd === 'mem') return echo('  655,360 bytes total conventional memory\n' +
                                     '  640,112 bytes free, which was plenty in 1998.');
      if (cmd === 'format') return echo('You are a guest. Nice try.');

      if (cmd === 'start') {
        const id = START[arg.toLowerCase()];
        if (!id) return echo('Cannot find ' + (arg || 'that') + '.');
        openApp(id);
        return;
      }

      if (cmd === 'cd' || cmd === 'chdir') {
        if (!arg || arg === '.') return echo(cwdText());
        if (arg === '\\' || arg === '/') { cwd = []; }
        else if (arg === '..') { cwd.pop(); }
        else {
          const key = Object.keys(here).find(n => n.toLowerCase() === arg.toLowerCase());
          if (!key || !isDir(here[key])) return echo('Invalid directory');
          cwd.push(key);
        }
        label.textContent = cwdText() + '>';
        return;
      }

      if (cmd === 'type' || cmd === 'cat' || cmd === 'more') {
        const key = Object.keys(here).find(n => n.toLowerCase() === arg.toLowerCase());
        if (!key) return echo('File not found - ' + (arg || ''));
        if (isDir(here[key])) return echo('Access denied - ' + key + ' is a directory.');
        return echo('\n' + here[key] + '\n');
      }

      // an unrecognised filename is still worth trying to open
      const guess = Object.keys(here).find(n => n.toLowerCase() === cmd);
      if (guess && !isDir(here[guess])) return echo('\n' + here[guess] + '\n');

      echo("Bad command or file name - " + head.toUpperCase());
    }

    const submit = () => {
      const raw = input.value;
      input.value = '';
      echo(label.textContent + ' ' + raw);
      if (raw.trim()) { hist.push(raw); hi = hist.length; }
      run(raw);
    };

    input.addEventListener('keydown', e => {
      e.stopPropagation();                       // Esc belongs to the prompt
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'ArrowUp' && hi > 0) { input.value = hist[--hi]; e.preventDefault(); }
      else if (e.key === 'ArrowDown') {
        hi = Math.min(hi + 1, hist.length);
        input.value = hist[hi] || '';
        e.preventDefault();
      } else if (e.key === 'Escape') { input.value = ''; }
    });

    // clicking anywhere in the black puts the caret back on the line
    pane.addEventListener('pointerup', e => {
      if (getSelection().isCollapsed && !e.target.closest('.dos__in')) input.focus();
    });

    log.textContent =
      'KVD-DOS 7.10  [Version 4.10.1998]\n' +
      '(C) Copyright KVD Systems 1981-1998\n\n' +
      "Type HELP for a list of commands. Type DIR to look around.\n\n";
    label.textContent = cwdText() + '>';
    defer(() => input.focus({ preventScroll: true }));
  }

  /* ── §6e · DESKTOP CONTEXT MENU ──────────────────────────── */

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
    // the operator decides what is on this desktop; see segment.js
    const list = (iconOrder || DESKTOP)
      .filter(id => !window.SEGMENT?.isHidden(id));
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
    const now = new Date();
    clockEl.textContent = now
      .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      .replace(/\s/g, ' ');
    // hovering the tray clock shows the date, same as the real shell
    clockEl.title = now.toLocaleDateString([], {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  // and double-clicking it opens Date/Time, same as the real shell
  clockEl?.addEventListener('dblclick', () => openApp('calendar'));

  function buildSpeaker() {
    const tray = clockEl?.parentElement;
    if (!tray || tray.querySelector('.w98spk')) return;
    const b = document.createElement('button');
    b.className = 'w98spk';
    b.innerHTML = I.speaker.replace('width="32" height="32"', 'width="15" height="15"');

    const paint = () => {
      const a = snd();
      const off = !a || a.muted || a.volume === 0;
      b.setAttribute('aria-pressed', off ? 'true' : 'false');
      b.title = off ? 'Sound off' : `Volume ${Math.round(a.volume * 100)}% — the TUBE knob turns it`;
    };

    b.addEventListener('click', () => {
      const a = snd();
      if (!a) return;
      a.ensure();
      a.muted = !a.muted;
      paint();
      if (!a.muted) playChime();
    });

    // the knob is the other way to change this
    document.addEventListener('kvd:volume', paint);
    paint();
    tray.insertBefore(b, clockEl);
  }

  function showDesktop() {
    hide(splash);
    buildDesktop();
    show(w98);
    kvd().burst?.(240);

    /* A note left from the admin segment opens itself. Filling the body
       here rather than at declaration time because it is written after
       APPS is built, and possibly after this page loaded. */
    const left = window.SEGMENT?.note();
    if (left && left.trim()) {
      APPS.note.body =
        '<div class="w98pane"><p style="white-space:pre-wrap;margin:0">' +
        esc(left.trim()) + '</p>' +
        '<p class="ie-note" style="margin-top:14px">Left on this machine by the ' +
        'operator. It was not sent from anywhere.</p></div>';
      defer(() => openApp('note'));
    }

    const first = desk.querySelector('.w98icon');
    if (first) first.focus({ preventScroll: true });
  }

  /* ── §7b · LIVE MISSION MANIFEST ────────────────────────
     github.js fires this once the API answers, with the same list
     CH3 got. Until then — and for good if the fetch never lands —
     the authored APPS entries above stand. */

  document.addEventListener('kvd:projects', e => {
    const list = e.detail;
    if (!Array.isArray(list) || !list.length) return;

    // the authored proj1..proj4 are replaced wholesale, not merged: a
    // half-live folder listing would be lying about which is which
    Object.keys(APPS).forEach(k => { if (/^proj\d+$/.test(k)) delete APPS[k]; });

    list.forEach((m, i) => {
      APPS['proj' + (i + 1)] = {
        title: m.name, icon: 'doc', w: 440, h: 260, pane: true, body: `
          <h4>${esc(m.name)}${m.year ? ' — ' + esc(m.year) : ''}</h4>
          <p>${esc(m.desc)}</p>
          <p><b>Built with:</b> ${esc(m.tags.join(', ')) || 'not stated'}<br>
             <b>Status:</b> ${esc(m.label)}</p>
          <p><a href="${esc(m.url)}" target="_blank" rel="noopener">${
            esc(m.url.replace(/^https?:\/\//, ''))}</a></p>`,
      };
    });

    // the authored plate belongs to SemiCon-ML, not to the manifest. It stays
    // only while the live list still has that project for it to belong to —
    // an output image with nothing above it explains nothing
    const plate = list.some(m => /semicon/i.test(m.name));

    APPS.projects.body = '<div class="w98list">' +
      list.map((m, i) => item('doc', m.name + '.prj', 'proj' + (i + 1))).join('') +
      (plate ? item('pic', 'SEMICON.BMP', 'semipic') : '') +
      '</div>';
    APPS.projects.status = [(list.length + (plate ? 1 : 0)) + ' object(s)', '  '];

    // a folder already on screen is showing the old listing
    if (open.has('projects')) { closeApp('projects'); openApp('projects'); }
  });

  /* ── §8 · START MENU ────────────────────────────────────── */

  const MENU = [
    { label: 'Programs',    icon: 'folder', act: () => openApp('projects') },
    { label: 'Documents',   icon: 'doc',    act: () => openApp('about') },
    { label: 'Internet Explorer', icon: 'ie', act: () => openApp('ie') },
    { label: 'MS-DOS Prompt', icon: 'dos',  act: () => openApp('dos') },
    { label: 'Calculator',  icon: 'calc',   act: () => openApp('calc') },
    { label: 'Calendar',    icon: 'cal',    act: () => openApp('calendar') },
    { label: 'Games',       icon: 'folder', act: () => openApp('games') },
    { label: 'Settings',    icon: 'gear',   act: () => openApp('display') },
    { label: 'Find',        icon: 'find',   act: () => openApp('skills') },
    { label: 'Help',        icon: 'help',   act: () => openApp('help') },
    { label: 'Run...',      icon: 'run',    act: () => openApp('run') },
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

  function openMenu() {
    menu.hidden = false;
    startBtn.setAttribute('aria-expanded', 'true');
    defer(() => menu.querySelector('.w98mi[data-i]')?.focus({ preventScroll: true }));
  }
  function closeMenu(refocus) {
    menu.hidden = true;
    startBtn.setAttribute('aria-expanded', 'false');
    if (refocus) startBtn.focus({ preventScroll: true });
  }

  /* Up/Down walk the menu and wrap, the way the real shell does */
  menu.addEventListener('keydown', e => {
    const items = [...menu.querySelectorAll('.w98mi[data-i]')];
    const at = items.indexOf(document.activeElement);
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (step) {
      e.preventDefault();
      items[(at + step + items.length) % items.length].focus();
    } else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End')  { e.preventDefault(); items[items.length - 1].focus(); }
  });

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
    if (!menu.hidden) { closeMenu(true); return; }
    if (!w98.hidden && open.size) {
      const top = [...open.entries()]
        .sort((a, b) => (+a[1].win.style.zIndex) - (+b[1].win.style.zIndex)).pop();
      if (top) closeApp(top[0]);
      return;
    }
    // same retreat as CANCEL, so it has to undo the same things —
    // escaping out used to leave the room red and still humming
    if (!login.hidden) {
      leaveAdmin();
      hide(login); show(gate);
      $('#gateAdmin').focus();
      return;
    }
    if (!gate.hidden) backToTerminal();
  });
})();
