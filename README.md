# KVD-4400 — portfolio

A monochrome retro-CRT portfolio built as a **ground-station monitor**: a beige
CRT computer monitor sitting in a dark room. The tube geometrically bends its
contents, the controls are moulded into the cabinet fascia, and each section is
a channel you tune to.

Hidden behind the terminal is a second skin: a guest session that boots
Windows 98 inside the same tube.

Five files, no build step, no dependencies:

| File | What's in it |
|---|---|
| `index.html` | All markup. Every editable spot is marked `<!-- ✎ -->`. |
| `styles.css` | Tokens, cabinet, tube geometry, CRT overlays, screen content, fascia. |
| `crt.js` | Warp map, safe area, static, boot sequence, channels, power, tube, spectrum. |
| `win98.css` | Access gate, OS boot, splash, and the Windows 98 shell. |
| `win98.js` | Icons, window contents, window manager, taskbar, Start menu. |

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
| **Enter ×3 on CH5** (or 3 clicks on END OF TRANSMISSION) | Open the access gate |

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
- `#tubeShape` fills its box with only a small corner radius, and `--wl` is `0`
  so the glass runs right to the plastic opening. Earlier versions inset the
  corners far enough that the dark recess read as a **black frame**, and it
  clipped maximised windows and the taskbar.
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


## The guest session

On **CH5 COMMS**, pressing Enter three times (or clicking END OF TRANSMISSION
three times) opens an access gate with two doors:

- **ADMIN** — a username/password prompt that always refuses. It is inert:
  purely client-side, submits nowhere, stores nothing, and validates nothing.
  It exists as a dead end until you decide what should live behind it. The
  refusal text and attempt counter are in `win98.js` §3.
- **GUEST** — a DOS-style loader types out, then the Windows 98 splash, then
  the desktop. About 5s end to end; instant under `prefers-reduced-motion`.

Get back out with **Start ▸ Shut Down** (returns to the terminal) or
**Start ▸ Log Off** (returns to the gate). `Esc` closes the front window, then
the menu, then the gate.

### The tube switches to colour

A monochrome tube cannot show Windows 98, so booting it flips the display:
`body.is-win98` turns on the RGB shadow mask (`.fx--grille` — a colour CRT has
one, the mono tube does not), dims the white phosphor bloom, and eases the
scanlines. Shutting down reverses all of it.

It also **cuts the barrel displacement to roughly a third** (`scale` 120 → 45,
via `KVD.setWarpScale`). The warp moves pixels but not hit-testing, so at full
strength clicks on desktop icons and title bars landed ~15px away from where
they appeared. At 45 the curve still reads and the pointer stays honest.

### What works in there

| Thing | How |
|---|---|
| Open something | Double-click an icon, or Enter when it's focused |
| Move a window | Drag its title bar |
| Resize a window | Drag the grip at the bottom-right |
| Maximise | Title-bar button, or double-click the title bar |
| Minimise / switch | Title-bar button, or the taskbar buttons |
| **Minesweeper** | 9x9, 10 mines. Left-click reveals, right-click flags, the face resets. First click is always safe. |
| **Notepad** | The About window is a real editable textarea. Nothing is saved. |
| **Display Properties** | Start ▸ Settings, or right-click the desktop ▸ Properties. Recolours the desktop live. |
| **Run** | Start ▸ Run. Accepts `notepad`, `winmine`, `explorer`, `control`, `devmgr`, `mail`, `help` and a few aliases; anything else gets the authentic "Cannot find the file" error. |
| Desktop right-click | Arrange Icons by Name (really sorts), Line up Icons (resets), Refresh, Properties |
| Sound | Speaker icon in the tray mutes the startup chime; the choice is remembered |
| `Esc` | Closes the front window, then the menu, then the gate |

### The startup chime

**This is not the Microsoft sound.** That file is their copyrighted asset and is
not shipped here. What plays is synthesised from scratch with the Web Audio API
in `win98.js` — a rising D-major figure over a warm pad, roughly the same shape
and length. Swap in a real audio file if you have the rights to one.

The `AudioContext` is created on the **GUEST click**, not at splash time, because
autoplay policy needs a user gesture; `playChime()` then only schedules notes.
It stays silent under `prefers-reduced-motion` and when muted.

### Editing the desktop

Window contents live in the `APPS` map in `win98.js` §2 — same portfolio
material as the terminal channels, wearing a different shell. Each entry takes
`title`, optional `label` (shorter text for the desktop icon), `icon`, `w`, `h`,
`body` HTML, and optional `menubar` / `pane` / `status`. `DESKTOP` lists which
appear as icons; `MENU` is the Start menu. Icons are inline SVG in `§1`.

Things the window manager already handles: drag by title bar, close, minimise to
taskbar, maximise/restore, focus and z-order, taskbar buttons, nested opens
(double-clicking a file inside a folder window), and clamping window size to the
tube so nothing hangs off a small screen.

## Bugs worth remembering

All found by driving the page, not by reading it:

- **The gate opened and instantly vanished.** The trigger ran on `keydown`, and
  Enter's default action activates whatever button has focus *after* listeners
  run — so opening the gate moved focus onto ADMIN and the same keypress clicked
  it. The trigger now fires on `keyup`, and focus moves are deferred two frames.
- **The static burst never reached full strength.** `.tv` had a 220ms CSS
  opacity transition while the burst only lived 300ms, so CSS and the canvas
  alpha fought each other and the channel swap showed through as a blank screen.
  The canvas now owns its own fade entirely.
- **The desktop never appeared after a refactor.** Splitting icon rendering into
  `renderIcons()` left an orphaned `b.addEventListener(...)` behind in
  `buildDesktop`, referencing a variable that no longer existed. It parsed fine
  — `node --check` passed — but threw at runtime before `show(w98)`, so the
  icons existed in the DOM and were simply never displayed.
- **Windows 98 text was mushy.** Three things stacked up: the barrel filter
  resampling every glyph, the scanline overlay, and 11px type. Fixed by dropping
  the displacement to `scale` 30 in OS mode, easing the overlays, and going to
  12px. The terminal keeps the full bend — its type is large enough to take it.
