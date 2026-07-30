# KVD-4400 — portfolio

A monochrome retro-CRT portfolio built as a **ground-station monitor**: a beige
CRT computer monitor sitting in a dark room. The tube geometrically bends its
contents, the controls are moulded into the cabinet fascia, and each section is
a channel you tune to.

Three files, no build step, no dependencies:

| File | What's in it |
|---|---|
| `index.html` | All content. Every editable spot is marked `<!-- ✎ -->`. |
| `styles.css` | Tokens, cabinet, tube geometry, CRT overlays, screen content, fascia. |
| `crt.js` | Warp map, safe area, static, boot sequence, channels, power, tube, spectrum. |

## Run it

Open `index.html` directly, or serve it:

```bash
python -m http.server 8000
```

## Replace the placeholders

Search `index.html` for `✎` — that marks every line written to be swapped:

- **CH1 SIGNAL** — the one-line thesis and the supporting sentence
- **CH2 ID** — the two bio paragraphs and the four spec rows
- **CH3 WORK** — four project dossiers. Duplicate an `<li class="dossier">` to add
  one. `MSN-01` is just a designation; renumber freely. Status badge is
  `is-live`, `is-arch`, or `is-build`.
- **CH4 SYS** — the module list. `[ OK ]` uses `.mod__ok`, `[LOAD]` uses `.mod__warn`.
- **CH5 COMMS** — the four links. Mail is already yours; GitHub, LinkedIn and
  resume are `#` stubs.

The live telemetry (signal %, packet count, elevation, RX rate, spectrum trace)
is decorative — generated in `crt.js` §9–10. It reads as a console at idle; it
does not claim real data.

## Controls

Everything physical lives on the cabinet fascia, below the screen. Telemetry
stays on the screen, because that's data the terminal displays rather than a
control.

| Input | Does |
|---|---|
| Keys `1`–`5` on the fascia, or number keys `1`–`5` | Change channel |
| `←` `→` `↑` `↓` while a channel key has focus | Step through channels |
| ⏻ button | Power the tube down and back up |
| TUBE knob | Swap P4 white ↔ P1 green phosphor |
| Any key during boot | Skip the boot sequence |

## Monochrome

The default tube is **P4 white phosphor** — the phosphor actual black-and-white
sets used. There is no colour anywhere on the screen: no aperture grille (a
monochrome tube has no shadow mask), no chromatic fringing on the nameplate, and
the static is grey. Project states are distinguished by weight and border style
rather than hue, since a B&W tube cannot show hue.

The static carries a slight blue cast, because real black-and-white tubes ran
cool rather than neutral.

The two colour exceptions are both deliberate and both *off* the screen: the
power lamp on the plastic is a green/red bulb, and the TUBE knob's second
position switches the phosphor to P1 green. Turn the knob back, or delete the
`html[data-phosphor="p1"]` block in `styles.css` to drop the option entirely.

## How the bend works

`#tubeWarp` is an SVG `feDisplacementMap`. `crt.js` §1 generates its displacement
map on a canvas: for each pixel it computes a barrel lens (`1 / (1 + k·r²)`),
writes the x-offset into red and the y-offset into green, and feeds it in as a
data URI. The filter then physically warps the live DOM — text, rules, scanlines
and the static canvas all bow together.

Things worth knowing before you change it:

- `WARP_K` in `crt.js` sets bend strength, tuned to `0.022` — a late-model
  near-flat computer tube, not a 70s TV. `setSafeArea()` derives the title-safe
  margins (`--warp-x` / `--warp-y`) from the live tube size, so **raising
  `WARP_K` means raising those factors too.** The barrel pulls edge content
  outward and `#tubeShape` rounds off the corners; between them, text with too
  little margin gets pushed off the glass.
- `#tubeShape` is a rounded rectangle with a generous corner radius and about
  1% of bow per edge. An earlier version pinched the corners hard and read as a
  fishbowl rather than a monitor.
- The map is generated at 420px wide. At 160 its own upscaling interpolation
  visibly shredded 1–2px rules and small text near the edges.
- `.scroll`'s bottom inset includes `--warp-y` so scrolling text can't slide
  under the statusline.
- The scanline layer sits *above* the screen content, so anything thinner than a
  few pixels gets sliced into dashes. That's why the statusline bar is 5px and
  its channel chip is outlined rather than a filled block.
- `.raster` exists only because the power-on/roll keyframes animate `filter`,
  which would otherwise clobber the warp on the same element.

## Boot sequence

Cold start runs ~3.4s in `crt.js` §3–4: POST lines type out, a load meter ramps
to 100% on an uneven curve (real loaders stall), then a burst of static covers
the hand-off to CH1. Any key skips it.

The Google Fonts stylesheet is deliberately loaded **non-blocking**
(`media="print" onload="this.media='all'"`). Left render-blocking, a cold font
fetch delayed script start by ~3s — the boot hadn't begun and the screen was
just black.

## Design notes

- **Palette** — `#08090a` tube black, `#eef2f3` P4 phosphor, `#3b4245` burn-in,
  and an aged-ivory plastic ramp (`--shell-hi` → `--shell-dk`) the way beige ABS
  yellows. Retint the tube via `--p`, `--p-dim`, `--p-mid`, `--p-glow`;
  `--p-glow` is a space-separated RGB triplet because the glows use
  `rgb(… / alpha)`.
- **Cabinet** — `--bz` sets bezel thickness, `--cr` the corner radius, `--wl` the
  screen-well lip. The recess is a single element (`.well`) whose inset shadows
  do the moulding: dark lip above the glass, light catch below.
- **Type** — VT323 for display, IBM Plex Mono for body. Both fall back to the
  system monospace. Cabinet lettering is debossed: dark ink plus a 1px white
  bevel below, which is what reads as engraved on light plastic.
- **Layout** — the page never scrolls; the document scrolls *inside* the glass.
  The cabinet holds a boxy `1.22` proportion on landscape viewports and fills
  the screen on narrow ones.

## Browser support

The bend is enabled on Chromium and Firefox. It is **skipped on WebKit/Safari**,
where `feImage` inside a filter applied to an HTML element is unreliable — rather
than risk a blank layer, `canWarp` in `crt.js` §1 opts out, `setSafeArea()`
switches to the narrower clip-only margins, and the page falls back to the curved
outline plus overlays.

## Accessibility

- Channels use the ARIA tabs pattern with roving tabindex; focus stays on the key.
- `prefers-reduced-motion` skips the boot sequence entirely and disables flicker,
  the channel-change static, the roll and the typewriter. The bend stays — it's
  geometry, not motion.
- The hero uses `align-content: safe center`; plain `center` pushed the top of an
  overflowing hero out of the scroller's reach on short and mobile viewports.
- Focus rings are drawn in the active phosphor colour on screen, and dark against
  the plastic on the fascia.
- Degrades to a plain scrolling page with all five sections visible if JS fails.
