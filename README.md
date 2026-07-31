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
  `is-live`, `is-arch`, or `is-build`. These are the fallback once repos are
  tagged — see [The live manifest](#the-live-manifest).
- **CH4 SYS** — the module list. `[ OK ]` uses `.mod__ok`, `[LOAD]` uses `.mod__warn`.
- **CH5 COMMS** — the four links. Mail is already yours; GitHub, LinkedIn and
  resume are `#` stubs. The riddle pool below them is in `crt.js` §11b.

The live telemetry (signal %, packet count, elevation, RX rate, spectrum trace)
is decorative — generated in `crt.js` §9–10. It reads as a console at idle; it
does not claim real data.

## The live manifest

`github.js` pulls the project list off the GitHub API so **CH3 WORK** and the
Windows 98 **Projects** folder stop being two hand-maintained copies of the same
thing. Config is the four constants at the top of the file — `USER`, `TOPIC`,
`MAX`, `TTL`.

**It is opt-in per repo.** Only repos carrying the `portfolio` topic are listed.
That is deliberate: "every public repo" is the wrong list for anyone who has
ever pushed a class exercise, and this account has fifty of them. To put a
project on the site, tag it on GitHub — *Settings ▸ About ▸ Topics ▸
`portfolio`* — and it appears on the next load, in both places.

Until something is tagged, the hand-written dossiers in `index.html` stand and
a note under the list says which topic to use.

| Situation | What you get |
|---|---|
| Repos tagged | They replace the authored list, newest push first, capped at `MAX` |
| Nothing tagged | Authored list, plus a note naming the topic |
| Offline / rate-limited / 500 | Authored list, plus a note saying why |
| No JS at all | Authored list, no note |

Status badges are derived, not typed: `archived` on GitHub → **ARCHIVE**, a
`homepage` set → **LIVE**, untouched for over `DORMANT_DAYS` → **ARCHIVE**,
anything else → **BUILD**.

Answers are cached in `localStorage` for 30 minutes. The unauthenticated API
allows 60 calls an hour per IP, and a visitor reloading a few times should not
spend them. No token is involved and none should be — anything in this file
ships to the browser.

## Controls

Everything physical lives on the cabinet fascia, below the screen. Telemetry
stays on the screen, because that's data the terminal displays rather than a
control.

| Input | Does |
|---|---|
| Keys `1`–`5` on the fascia, or number keys `1`–`5` | Change channel |
| `←` `→` `↑` `↓` while a channel key has focus | Step through channels |
| ⏻ button | Power the tube down and back up. Clicks — a synthesised switch, not a beep |
| TUBE knob *(terminal)* | Swap P4 white ↔ P1 green phosphor |
| TUBE knob *(Windows 98)* | **Volume.** Clockwise louder, anticlockwise quieter. Drag, scroll or arrow-key it; click to mute. Detents tick as it passes them, and a gauge ring round the knob shows the level |
| Keys `1`–`5` *(Windows 98)* | Locked. The OS owns the tube, so they dim and do nothing — including the static burst, which used to fire and read as though the set had responded |
| Any key during boot | Skip the boot sequence |
| **RIDDLE ME THIS** on CH5 | Draw a riddle whose answer is the line below |
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
  near-flat computer tube, not a 70s TV.
- **`setSafeArea()` measures, it does not guess.** It clones `#tubeShape`'s path
  into the defs sheet and runs `isPointInFill` against it, after applying the
  same barrel displacement the filter will. Two effects compound — the bend
  pushes content outward, and only *then* does the clip cut the corners — and
  their ratio moves with the viewport's aspect *and* with the bend strength,
  which OS mode drops to a quarter (`scale` 120 → 30). A single percentage was
  clipping the taskbar and a maximised title bar at every size. It publishes:

  | | |
  |---|---|
  | `--warp-x` / `--warp-y` | largest centred rectangle that fits, as an equal pixel margin on both axes. The deck, the desktop icons, the statusline. |
  | `--edge-x` | horizontal room for anything pinned to the very top or bottom, where the corner cuts deepest. Taskbar contents, Start menu, a maximised window's title bar and body. |

  Any change to `WARP_K` or to the path is picked up automatically; every change
  of `scale` re-measures.
- **Do not sample the last few rows.** The bend pushes a point at `y=1px` clean
  off the top of the tube, so no `x` is safe there at all. An early version
  scanned fractional bands including `y=0.001`, found nothing, and clamped
  `--edge-x` to its ceiling — 225px of inset on a 1401px tube. The bands are in
  pixels now (`EDGE_PX`), covering the range real chrome occupies, and a band
  with no answer is skipped rather than maxed.
- `#tubeShape` is the faceplate silhouette: straight top and bottom, and sides
  that **bow outward**, touching full width only at mid-height and falling back
  3.4% by the corners. `--wl` is `0`, so the glass runs right to the plastic
  opening and the bow is the outline you actually see.
  - Use **one cubic per side**, corner to corner. Two cubics meeting at the
    widest point hold the edge flat against the box for the middle 70% of its
    height, and the result reads as a rounded rectangle rather than a curve —
    the bow only shows if the deviation grows across the whole edge.
  - The 3.4% corner inset is a ceiling, not a preference. Everything inside is
    positioned off `--warp-x`, and anything closer to the edge than the corner
    cut gets sliced by it. The Win98 taskbar, Start menu and desktop icons all
    moved from `--warp-x * .6` to `* .85` to clear it, and maximised windows
    inset by `* .72` — full-bleed lost the left of the title bar, icon and all.
  - Earlier versions inset the corners far enough that the dark recess read as a
    **black frame**, which is the other end of the same trade.
- `.well` carries the **same clip** as `.glass`. It has to: a rounded-rect
  recess behind a bowed glass leaves the difference between the two shapes
  showing down both sides as black slivers — plastic, black gap, picture, which
  no real set has. Clipping both to one path means the cabinet meets the tube
  directly and the curve is the only edge in the frame. The cost is `.well`'s
  moulded lip, since a clip-path clips box-shadow too; `.glass`'s inner
  vignette draws the opening instead. A `drop-shadow` filter would bring the
  lip back, over a subtree that already carries a full-screen SVG displacement
  filter and repaints every frame — not worth 2px of highlight.
- The map is generated at 420px wide. At 160 its own upscaling interpolation
  visibly shredded 1–2px rules and small text near the edges.
- `.scroll`'s bottom inset includes `--warp-y` so scrolling text can't slide
  under the statusline.
- `.fx--roll` is a soft luminance band drifting down the tube on an 11s loop —
  the ghost of a vertical hold that is very nearly right and never quite
  settles. Held at ~3% white: any stronger and it stops reading as texture and
  starts reading as a fault. `transform` only, so it composites on the GPU and
  costs nothing per frame. Off under `prefers-reduced-motion`.
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
- **Cabinet** — the bezel is set per axis, not uniformly: `--bz-x` beside the
  tube, `--bz-t` above it, `--bz-b` below the fascia. A real desktop terminal
  carried almost no plastic at the sides — the depth was all in the base, where
  the controls and chassis went — and one uniform bezel threw away the widest
  part of the screen. The glass now runs to about 86% of the cabinet's area.
  `--cr` is the corner radius, `--wl` the screen-well lip. The recess is a
  single element (`.well`) whose inset shadows do the moulding: dark lip above
  the glass, light catch below.
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


## The riddle

The guest session used to be undiscoverable — nothing on the page suggested that
CH5 had a door in it. **RIDDLE ME THIS**, between the address list and the
sign-off, is the only signpost it gets.

Pressing it draws one of eight riddles at random (`RIDDLES` in `crt.js` §11b).
They are worded differently but **all have the same answer**: knock three times.
Half of them point at the Enter key, half at the sign-off line, so a visitor gets
a usable answer whichever one they draw; on a touch device the meta row also
names the tap target outright.

Three cells sit at the right of the riddle. They fill as the knocks land and
clear after 1.4s of silence — without them the first two presses look like
nothing happened, which is what made the door unfindable in the first place. The
button hands focus to the riddle panel rather than keeping it, so the very next
Enter counts as a knock instead of re-drawing.

Draw three riddles and a nudge appears; draw five and it says plainly that they
all share an answer.

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
| **Internet Explorer** | **Actually browses the web** — the frame under the chrome is your real browser engine. Working Back/Forward, a Stop that cancels the load, Refresh, Home, Favorites, and an address bar that takes any URL. Sites that refuse to be framed are fetched through a CORS proxy instead and still come up. Also serves an in-world site at `kvd.local` (`SITES` in `win98.js` §6c2), written the way a personal site was written in 1998. See [below](#internet-explorer-really-browses). |
| **Calendar** | Date/Time Properties: month dropdown, year field, working grid with today outlined, a live clock, and a Today button. Also opens on a **double-click of the tray clock**, same as the real shell. |
| **MS-DOS Prompt** | A working shell over a virtual `A:\PORTFOLIO`. `HELP` lists the commands; `DIR`, `CD`, `TYPE`, `TREE`, `CLS`, `ECHO`, `VER`, `DATE`, `TIME`, `MEM`, `START`, `EXIT` all do what they say. `↑`/`↓` walk the history. Typing a filename alone prints it. |
| **Calculator** | Standard view, working. Full keyboard: digits, `+ - * /`, `Enter`/`=`, `Backspace`, `Delete` (CE), `Esc` (C). Divide by zero says so. |
| **Games** | A folder on the desktop: Snake, Minesweeper, DOOM, DOOM II and Grand Theft Auto. See [The arcade](#the-arcade). |
| **Snake** | Written here, not embedded. 24×18 grid on a canvas, arrows or WASD, `P` pauses, speed climbs with every apple, best score kept in `localStorage`. Turns are queued so a fast corner isn't eaten by the tick. |
| **Minesweeper** | 9x9, 10 mines. Left-click reveals, right-click flags, the face resets. First click is always safe. |
| **Notepad** | The About window is a real editable textarea. Nothing is saved. |
| **Display Properties** | Start ▸ Settings, or right-click the desktop ▸ Properties. Recolours the desktop live. |
| **Run** | Start ▸ Run. Accepts `notepad`, `winmine`, `calc`, `command`, `explorer`, `control`, `devmgr`, `mail`, `help` and a few aliases; anything else gets the authentic "Cannot find the file" error. |
| Start menu | `↑`/`↓` walk it and wrap, `Home`/`End` jump; opening it focuses the first item, `Esc` closes it and returns focus to Start |
| Desktop right-click | Arrange Icons by Name (really sorts), Line up Icons (resets), Refresh, Properties |
| Sound | Speaker icon in the tray mutes the startup chime; the choice is remembered |
| Tray clock | Hovering it shows the full date |
| `Esc` | Closes the front window, then the menu, then the gate |

### The arcade

**Snake** is written in `win98.js` §6c1 — a canvas, a queue for the body, and a
turn buffer so a corner taken faster than the tick still lands. It owes nothing
to anyone.

**DOOM, DOOM II and Grand Theft Auto** are DOS binaries. They run the only way
they can in a browser: the Internet Archive's in-page DOSBox, framed. The
emulator isn't sandboxed — it needs workers, WASM and the full keyboard, and
archive.org is the host either way — but **nothing loads until Start is
pressed**, so opening the folder doesn't spin up three emulators.

| Window | Item |
|---|---|
| DOOM | `DoomsharewareEpisode` — Episode 1, *Knee-Deep in the Dead* |
| DOOM II | `doomII` — *Hell on Earth* |
| Grand Theft Auto | `grand-theft-auto-1997-dma-design` — DMA Design, 1997 |

**Three ways a game gets into the folder**, declared per entry in `ARCADE`:

| flag | how it runs | used by |
|---|---|---|
| *(none)* | fixed 800x600 iframe, `transform: scale()` to fit | DOOM, DOOM II, GTA |
| `fluid` | fills the window, no scaling | GTA 2 |
| `launch` | opens in a real browser window | GTA: Vice City |

**Why the scaling exists.** The Internet Archive's emulator measures the iframe
once at load and lays its canvas out against that, then never reflows. Maximising
the window just bought more black around a small picture, and the frame is
cross-origin so there is no telling it to resize. Keeping it at a fixed logical
size and scaling by transform fixes it — the browser maps pointer coordinates
through a transform, so clicks still land where they look like they should, and
it composites on the GPU.

**GTA 2 runs in place.** It is not emulated: `gta2js.vercel.app` is a JavaScript
port of the engine (h0x91b/gta2-resurection) on the data from the official free
release. It reflows to whatever size it is given — measured at 700x500, 1100x800
and 520x380, the canvas tracked exactly — so it is marked `fluid` and skips the
scaling entirely, which makes it the sharpest of the lot.

An earlier version of this file claimed GTA 2 could not run in a browser at all,
on the grounds that it is a Win32 DirectX title DOSBox cannot touch. The DOSBox
half was right and the conclusion was wrong: a port sidesteps emulation, so the
Win32 problem never arises.

**Vice City has to open outward.** reVCDOS is a real WebAssembly port and it
genuinely runs, but the only public build is on dos.zone, whose CSP names the
hosts allowed to frame it:

```
frame-ancestors https://dos.zone https://cdn.dos.zone http://br.cdn.dos.zone
                https://sec.dos.zone https://test.js-dos.com https://*.discord.com
```

That header is served site-wide, so `/revcdos/` and `/grand-theft-auto-vice-city/`
refuse identically. Self-hosting is the documented alternative but means carrying
Vice City's asset bundle, past GitHub's 100 MB file ceiling and Pages' 1 GB
budget. Drop `launch: true` the day a framable build exists and it moves
in-window with no other change.

### Internet Explorer really browses

The chrome is ours; the renderer underneath is **your actual browser engine**, in
an `<iframe>`. Wikipedia, CERN's first-ever website, Space Jam 1996 and the
Internet Archive all load live, inside the tube, under the scanlines.

It resolves four ways:

| Address | What happens |
|---|---|
| `kvd.local/…` that exists | The in-world page (`SITES`) |
| `kvd.local/…` that doesn't | The genuine *"The page cannot be displayed"* |
| A host on `IE_DENY` | Straight to compatibility mode — it would only refuse |
| Anything else | Loaded for real in the frame |

**Sites that refuse to be framed.** `X-Frame-Options` and `frame-ancestors` are
instructions to a *browser* about framing, and the browser keeps them —
nothing on this side talks it out of that. So compatibility mode doesn't
argue with it. It fetches the page's HTML through a public CORS proxy, which
is an ordinary server-to-server GET that is neither a browser nor a frame, and
hands the text to the frame as `srcdoc`. The frame never asks for permission
to embed the site, so the site has nothing left to refuse. The trick is
[x-frame-bypass](https://github.com/niutech/x-frame-bypass) (niutech, MIT);
the implementation here is its own — see below for why.

It engages on its own for `IE_DENY` hosts and for an `http://` address on an
`https://` page (the proxy fetch is https, so this fixes mixed content rather
than refusing it), and by hand from the **Retry in compatibility mode** button
on the refusal page. Once a host has been fetched that way it stays that way
for the session, so links off the page follow the same route. The status bar
names the proxy that answered and the zone reads **Compatibility zone** — it
should always be visible that a page came in second-hand.

Public CORS proxies are the **fallback**. If `IE_WORKER` points at a deployed
[`proxy/`](proxy/) worker, compatibility mode goes through that instead and
gets a much better version of all of this — [see below](#a-proxy-of-your-own).

**What it costs**, and the reasons it is not the default for everything:

- The proxy sees every address opened through it, and these are free public
  ones run by strangers. The fetch is anonymous — `credentials: 'omit'`, no
  cookies — so it is always the logged-out view. Don't drive a session through
  it. `IE_PROXIES` is a fallback chain of three; any of them can be
  rate-limited or gone on the day.
- Only the HTML travels through the proxy. Everything the page then pulls in
  resolves against the injected `<base>` and loads from the real origin, so a
  static page arrives whole and an application arrives broken — anything
  fetched by the site's own XHR is same-origin to a document that is no longer
  on that origin. Wikipedia and GitHub read fine; Gmail is never going to work.
- GET only. A read-only proxy has no way to post a form, and the bridge says
  so in the status bar instead of failing quietly.

**Three deliberate differences from the original**, all forced by this codebase:

- **Not a custom element.** `customElements.define(…, {extends: 'iframe'})` is
  a customized built-in, which WebKit has never shipped and won't. The frame is
  in the window template already, so this is plain functions on it instead.
- **The proxied frame does not get `allow-same-origin`.** `srcdoc` inherits the
  *embedder's* origin, so keeping it — as the original does — would run
  arbitrary third-party HTML as first-party on this page, with the run of its
  DOM and storage. Dropped for proxied loads only (`IE_SANDBOX`); a real
  cross-origin load still gets it, where it means the *site's* origin and is
  safe.
- **Links come back by `postMessage`.** The original follows them through
  `frameElement.load()`, which an opaque-origin frame cannot reach. `IE_BRIDGE`
  is injected into every proxied page and posts the URL out; the parent checks
  `e.source === frame.contentWindow` before believing a word of it, since the
  DOOM cabinets are iframes on this page too and can post as well.

The injected shim also strips the page's own CSP `<meta>` (it would otherwise
forbid the bridge from running) and any `crossorigin` attributes (they now ask
for CORS grants the new opaque origin will never get).

More of the web allows plain framing than you'd guess — Wikipedia does — and
those still load directly, at full speed, with their scripts working.

**A page cannot detect the refusal.** This was measured, not assumed — for a
blocked frame and a working one, every readable signal is identical:

```
https://example.com/    load 85ms   href THREW:SecurityError  doc null  length 0
https://github.com/     load 49ms   href THREW:SecurityError  doc null  length 0   (blocked)
https://neocities.org/  load 923ms  href THREW:SecurityError  doc null  length 0   (blocked)
```

Timing doesn't separate them either — the blocked one took ten times longer than
the working one. The engine logs the reason to the console and exposes nothing
to script. So instead of a heuristic that would be wrong either way:

- `IE_DENY` lists the hosts people actually try, so those skip the pointless
  attempt and go **straight to compatibility mode**
- everything else loads optimistically, and gets the retry button if it fails
- **New window** in the toolbar stays lit for the whole time a live page is up,
  so anything that slips through is one click from opening properly
- `ieRewrite()` turns a YouTube watch URL into its framable `/embed/` form, and
  `IE_ALLOW` keeps `IE_DENY` from swallowing the result — the deny list matches
  whole hosts, so `youtube.com` used to catch the rewrite it exists to produce
- an `https` page can't frame an `http` one; that one is proxied instead

The frame is sandboxed **without** `allow-top-navigation`: a site loaded in there
must not be able to steer the page it's sitting inside.

### A proxy of your own

Public CORS proxies are the fallback, not the good version. [`proxy/`](proxy/)
is a Cloudflare Worker that does the same job properly: strips the framing
headers at the source, rewrites the links so navigation stays in the frame,
and streams instead of buffering. Deploy it, put its URL in `IE_WORKER`
(`win98.js` §6c2), and the `srcdoc` path becomes the fallback for when it's
down or over quota. **Empty by default** — nothing changes until you deploy.

With it, a blocked site is an ordinary frame load again: real navigation, real
history, a Stop that genuinely cancels, no 25-second buffer-then-render. The
frame keeps `allow-same-origin`, which is safe *because the proxy is on its own
origin* — see below.

| | public CORS proxy | your worker |
|---|---|---|
| How it arrives | `srcdoc`, buffered whole | `src`, streamed |
| Sandbox | no `allow-same-origin` | keeps it — the *worker's* origin |
| Links | intercepted, posted to the parent | rewritten server-side, navigate normally |
| Redirects | followed by the proxy, invisibly | rewritten, stay inside the frame |
| Address bar | the URL you typed | tracks where the frame actually went |
| Who sees the URL | a stranger's server | yours |

**The proxy must not live on the portfolio's own origin.** Everything it
returns becomes same-origin with whatever serves it. On its own `workers.dev`
subdomain that isolates proxied pages from the portfolio. On a path of your own
domain, every page it serves becomes first-party to the portfolio and can read
and rewrite it — worse than having no proxy at all. That's why `IE_WORKER` is a
full origin and not a path.

**Tier 1 only, on purpose.** HTML documents and the links between them are
rewritten; images, CSS and scripts are left to `<base>` and load from the real
site. One worker request per page instead of one per asset, which is the
difference between Cloudflare's free 100k/day being ~100k page views and being
a few hundred. Making applications work means rewriting every subresource URL
and shimming `fetch`/XHR inside the page — measure the quota before reaching
for it.

**What it refuses**, and why each one is there:

- `POST` — a read-only proxy has no business forwarding writes
- private and link-local addresses, including `169.254.169.254` — SSRF
- sign-in, mail and banking hosts (`DENY_HOSTS`)
- `<input type="password">` is replaced with a disabled box *during the
  rewrite*, so a visitor cannot hand a real credential to a page your server
  is serving
- no cookies, no `Authorization`, no `Referer` reach the target — always the
  logged-out view, with nothing of the visitor in it

**On clickjacking**, since stripping framing headers is what invites it: every
response leaves the worker carrying `frame-ancestors 'self' <EMBEDDERS>`. The
site's policy is stripped and *this* one put back in its place, so a stranger
who spoofs past the gate still can't embed the result in a page of their own.
Beyond that there's no session in the frame to hijack — `credentials: omit`,
`Set-Cookie` dropped, and the document lands on the worker's origin, which
holds no cookie for the site it's showing. A click inside a proxied page acts
as nobody. `X-Frame-Options: DENY` needs no special handling, incidentally:
`DENY` and `SAMEORIGIN` are equally gone once the fetch is server-side. The
one thing still standing is JavaScript framebusting — `top` is
`[LegacyUnforgeable]`, so nothing can lie about it, and beating it means
rewriting the page's JS. [`proxy/README.md`](proxy/README.md#deny-frame-ancestors-and-clickjacking)
has the full reasoning.

The embedder gate reads `Referer` and `Sec-Fetch-Site`, both of which anyone
can set with `curl -H`. It stops drive-by scanning, not a determined person.
The rate limit, the deny lists, and it being a throwaway subdomain are what
actually hold the line. [`proxy/README.md`](proxy/README.md) has the deploy
steps and the verification curls.

**The remaining gap** after all of that is still applications — anything that
needs a session. Nothing short of shipping as a desktop app fixes those; a
Tauri webview isn't bound by framing rules at all, because you control the
client.

The DOS filesystem is one nested object (`DOS_FS` in `win98.js` §6d):
directories are objects, files are strings. Adding a file to `A:` is one line.
The same portfolio copy lives there in plain text, which is roughly the format
it was written in first.

### Sound

One `AudioContext` for the whole set, in `crt.js` §6b — everything runs through
the same master gain, so the TUBE knob controls the lot. **No audio files ship;
all of it is synthesised.**

| | |
|---|---|
| **Idle hum** | What a powered tube puts into a room. 50 Hz mains and its first two harmonics through a lowpass, plus the flyback whistling at a 15625 Hz line rate. PAL numbers, not NTSC's 60 / 15734 — the set is wired for Mumbai. |
| **Flyback whine** | 15.6 kHz is above where many adults hear anything, so half of it rides underneath at a lower level: audible without being a dog whistle. Runs the whole time the tube is on and stops with the power. |
| **Degauss** | The thunk-wobble on a cold start. A sawtooth dropping 76→37 Hz behind a closing lowpass, tremolo starting at 11 Hz and slowing to 2 Hz as the field settles, and a filtered noise burst up front for the shadow mask taking the hit. |
| **Power switch** | Filtered noise for the contact, a fast downward triangle for the mass of the plastic. Heavier going down than coming up. |
| **Boot** | A tick per POST line and per typed character (throttled to 28 ms), then a 1046 Hz square beep when the meter hits 100. |
| **Knob detent** | A 26 ms square blip, retuned slightly each time so a fast sweep doesn't become a tone. |
| **Startup chime** | See below — the only long one. |

Levels are deliberately low. The hum should be the thing you notice *stopping*,
not the thing you notice.

**A context cannot start outside a user gesture**, so the set is silent until
the first click or keypress — then it warms up: degauss fires, the hum fades in
over 1.8 s behind it. On a cold load that's usually the keypress that skips the
boot, which is why the first few POST lines are silent. Powering off stops the
hum; powering on runs the whole warm-up again.

Volume and mute persist in `localStorage` (`kvd-vol`, `kvd-mute`). The tray
speaker in Windows 98 and the TUBE knob are two handles on the same state.

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
- **The Start menu banner climbed out of the menu.** `Windows98` on the blue
  rail was a `width:0` block rotated `-90deg`. A rotate does not affect layout,
  and with zero width the `translate(-100%)` that was supposed to pull it back
  down resolved to zero — so the text ran upward out of the rail and sat on top
  of the desktop icons. It is `writing-mode:vertical-rl` + `rotate(180deg)` now,
  which reads bottom-to-top *and* takes up space, in a rail with `overflow:hidden`.
- **Windows 98 text was mushy.** Three things stacked up: the barrel filter
  resampling every glyph, the scanline overlay, and 11px type. Fixed by dropping
  the displacement to `scale` 30 in OS mode, easing the overlays, and going to
  12px. The terminal keeps the full bend — its type is large enough to take it.
