# Pengu — Desktop Pet Companion 🐧

An interactive penguin that lives on your desktop. Built from the
`Pengu Desktop Pet.dc.html` design, implemented per the `CLAUDE.md` handoff spec
(Electron + React + Canvas 2D + SQLite).

## Quick start

```bash
npm install        # installs deps; rebuilds better-sqlite3 for Electron (best-effort)
npm start          # bundles the renderer and launches the app
```

`npm start` runs `build:renderer` (esbuild bundles the JSX into
`src/dist/renderer.js`) and then `electron .`.

To iterate on the UI with a rebuild-on-save bundler in one terminal and Electron
in another:

```bash
npm run watch:renderer   # terminal 1
electron .               # terminal 2
```

A non-interactive smoke check (loads the renderer, prints the storage mode, then
quits after 1.5s):

```bash
PENGU_SMOKE=1 npm start
```

## What it does (QQ宠物-style)

- **A small, frameless, transparent, always-on-top window that physically walks
  around the screen.** It is only ~220×300px and never covers your desktop — the
  window itself moves as the penguin waddles (`win.setPosition` driven by the
  renderer's animation loop). This mirrors the four classic QQ宠物 techniques:
  - **Layered / transparent window** — `transparent: true`, no frame/shadow.
  - **Mouse hit-test bypass** — the window is click-through (`setIgnoreMouseEvents`)
    everywhere except the penguin's own pixels; the renderer toggles it on only
    while the cursor is over the penguin or a panel is open, so clicks fall
    through to whatever is behind it.
  - **Sprite animation** — Canvas 2D, redrawn per frame (idle/walk/eat/sleep/play).
  - **Boundary + taskbar avoidance** — walking is clamped to the display
    **work area**, which excludes the Dock / taskbar, so Pengu never walks off
    screen or hides behind the bar. Re-clamps on resolution/monitor changes.
- **Procedurally rendered pixel penguin** on a Canvas 2D element (16×16 grid,
  7px pixels) with idle/blink, walking (waddle), eating, sleeping, playing, and
  a double-click dance/spin. No sprite-sheet PNG is needed — the art is drawn in
  code, straight from the design.
- **Needs system:** hunger (rises 0.5/s), energy (drops while walking/playing),
  cleanliness (slow decay), and a derived mood (happy / sad / tired / playful).
  At >70 hunger Pengu looks sad and slows down; under 10 energy it auto-sleeps.
- **Interactions:** left-click opens the care panel (feed / play / sleep /
  settings); when very hungry Pengu may waddle off annoyed instead. Right-click
  opens a context menu with the full action set — feed, play, **play ball
  (玩球)**, **play badminton (打羽毛球)**, **sit down (坐下)**, sleep. Drag to
  reposition. Double-click to dance. Pengu also sits to rest and plays ball on
  its own while idle.
- **Language:** the UI is all Chinese (dialogue bubbles, menus, care panel,
  settings); the pet's name defaults to "Pengu".
- **Settings:** name, volume, animation speed, window opacity.
- **Procedural sound effects** via the Web Audio API (no audio files needed).
- **Persistence** between sessions, including offline hunger/cleanliness decay
  based on elapsed time since the last save.

## Phase 1 — the "alive" layer

Inspired by the `mypet-ref-docs/` design (Stage 1: *make the pet feel alive*),
this adds character on top of the base pet:

- **Personality (5 dimensions)** — liveliness / courage / attachment / appetite /
  curiosity, each 0–100, rolled once and persisted. It modulates how often and
  how fast Pengu walks, how far it roams (brave = wanders the middle, timid =
  hugs the edges), and how quickly it gets hungry. Shown as a trait label
  (e.g. "Lively · Curious") under the name in the care panel.
  (`src/renderer/personality.js`)
- **Dialogue bubbles** — short speech bubbles: a time-of-day greeting on launch,
  reactions when clicked/fed/played, and proactive idle chatter ("So bored…",
  "Where'd you go?", "I'm hungry…") whose tone follows personality and mood.
  (`src/renderer/dialogue.js`)
- **Bored mood** — when idle and ignored for a while, Pengu gets bored
  (and says so).
- **Idle FPS throttle** — the canvas redraws at ~18fps when idle and full rate
  while walking/playing, to keep CPU low for an always-on app.

This is the MVP slice; richer walk modes (edge-cling / hide / fling) and the
Stage-2 life-sim systems come in later phases.

## Persistence

Primary store is **SQLite** (`better-sqlite3`) in the Electron main process,
using the schema from the spec (`pets`, `pet_state`, `preferences`). The
renderer talks to it over a small IPC bridge (`preload.js` → `state:load` /
`state:save`).

If `better-sqlite3` can't be built for this machine's Electron ABI, the app
**automatically falls back to a JSON file** in the user-data directory — so it
always runs. The active mode is printed at launch under `PENGU_SMOKE=1`. Data
lives in Electron's `userData` dir (`pengu.db` or `pengu-save.json`).

## Project structure

```
main.js                     Electron main: transparent always-on-top window
preload.js                  contextBridge IPC API (window.pengu.*)
scripts/rebuild.js          best-effort native rebuild of better-sqlite3
src/
  index.html                renderer shell (loads the esbuild bundle)
  main/
    constants.js            DEFAULTS + SQLite schema
    database.js             SQLite store with JSON fallback
    ipcHandlers.js          state:load/save, win:interactive, win:quit
  renderer/
    main.jsx                React entry
    App.jsx                 the pet engine (canvas, behaviors, persistence)
    store.js                IPC/localStorage persistence bridge
    index.css               resets, keyframes, button/menu styles
    components/
      StatusBar.jsx         care popup card (stats + actions)
      ContextMenu.jsx       right-click menu
      SettingsPanel.jsx     settings modal
electron-builder.json       macOS .dmg / Windows .exe packaging
```

## Packaging

```bash
npm run dist   # electron-builder → release/  (mac dmg / win nsis)
```

## Notes / decisions vs. the spec

- The spec called for a PNG sprite sheet and `.mp3` files. The design prototype
  renders the penguin in code and synthesizes audio with the Web Audio API, so
  this build keeps that approach — fully self-contained, no binary assets.
- The pet is a small window that walks around the screen (QQ宠物 style) rather
  than a full-display overlay — so it never blocks your work and only its own
  pixels are clickable. Position persists between sessions. The walk is driven
  from the renderer (`moveWindow` over IPC, ~60fps, throttled); if you ever see
  stepping on a slow machine, the movement can be moved into the main process.
- Left-click opens the care panel (from the design) rather than a blind 50/50
  play-or-waddle; the spec's "waddle away when annoyed" still triggers on click
  while hunger is high.
```
