# Code Buddy mode — design spec

> Status: **proposal for review.** No code is written against this yet.
> Target: macOS first (the bridge is cross-platform; only the installed hook
> command differs per-OS, so Windows is a small follow-up).

## Goal

Turn Deskpet into a **live coding companion for Claude Code**. Once the user
"connects" their Claude Code (a one-time install from Deskpet's Settings), the
penguin **automatically** reacts to whatever Claude Code is doing — it puts on
its coder gear, sits with its laptop, panics at a failing test, cheers when a
big change lands, and speaks a short remark when Claude finishes a turn.

This is the same idea as the community `claude-buddy` project, but instead of
ASCII art in the terminal status line, the buddy is the **real pixel penguin in
its own window** — which Deskpet already animates, and which already has a
`程序员` (coder) scene with headphones/glasses attire and a laptop.

## Principles

- **Always-on once connected.** Installing the hooks IS the connection. Every
  Claude Code session then drives the penguin automatically — no per-session
  toggle. A single Settings switch connects / disconnects (installs / removes
  the hooks).
- **100% local.** Events flow hook → local file → Deskpet on the same machine.
  **Nothing about the user's code, prompts, or tool output is ever sent to
  Supabase or any network.** Buddy state is not part of the cloud save.
- **No emoji, all pixel art.** Every buddy reaction is hand-drawn pixel art in
  the penguin's style (CLAUDE.md hard rule), authored via the `pixel-art` skill
  with the render-and-look self-check.

## Architecture

```
Claude Code  ──(hooks: shell commands)──►  append one JSON line
                                            ~/.deskpet/claude-events.jsonl
                                                     │
                                   Electron main (main.js) fs.watch + tail
                                                     │  webContents.send('buddy:event', evt)
                                                     ▼
                                   preload.js  →  window.pengu.onBuddyEvent(cb)
                                                     │
                                   App.jsx  →  maps event → penguin reaction
```

### Why a file, not a local server

A file-append bridge needs no open port, no firewall prompt, and survives the
pet not being open (events just queue; on launch we read only the tail / events
newer than launch time). A localhost HTTP server would be more "real-time" but
adds a port, a curl dependency in every hook, and failure modes we don't need.

### The event file

- Path: `~/.deskpet/claude-events.jsonl` (one compact JSON object per line).
- Each hook appends; Deskpet only ever reads + truncates. Capped (e.g. keep last
  ~200 lines) so it can't grow unbounded.
- Event shape:
  ```json
  { "ts": 1730000000, "kind": "tool_error", "tool": "Bash", "detail": "tests failed", "say": "optional short buddy line" }
  ```
- `kind` ∈ `session_start | prompt | tool_ok | tool_error | big_diff | finish | needs_input`.
- `say` is only present on `finish` (the buddy comment Claude embedded — see below).

## Claude Code hooks installed (the "connection")

Written into the user's `~/.claude/settings.json` by the Settings switch. macOS
forms shown; each just appends a JSON line via a tiny bundled helper
(`deskpet-hook`, so the same call works regardless of shell quoting). Conceptually:

| Hook | Fires when | Event emitted |
|------|-----------|---------------|
| `SessionStart` | a Claude Code session begins | `session_start` |
| `UserPromptSubmit` | user sends a prompt | `prompt` |
| `PostToolUse` (Bash) | a tool finished; helper inspects output for error / test-fail / large diff | `tool_error` / `big_diff` / `tool_ok` |
| `Notification` | Claude needs permission / input | `needs_input` |
| `Stop` | Claude finished its turn; helper extracts any `<!-- buddy: … -->` comment | `finish` (+ `say`) |

Disconnecting removes exactly — and only — the Deskpet hook entries, leaving the
rest of the user's `settings.json` untouched. We never overwrite the file; we
parse, splice out our blocks (tagged so they're identifiable), and write back.

### Buddy comments (the `say` line)

To get a *spoken* remark rather than just reactions, we register a minimal MCP
server whose instructions ask Claude to end substantial turns with an invisible
`<!-- buddy: short friendly remark -->`. The `Stop` hook greps that out and puts
it in the `say` field. If absent, the penguin just does a silent celebrate. This
is optional polish layered on top of the reactions — reactions work without it.

## Reaction map (pixel art)

Reuses the existing coder scene + attire; new poses are small row-swaps/overlays.

| Event | Penguin reaction |
|-------|------------------|
| `session_start` | wakes, dons coder gear, opens laptop (existing 程序员 scene) |
| `prompt` | perks up, "listening" lean toward the screen |
| `tool_ok` / `big_diff` | types busily at the laptop; content/proud |
| `tool_error` | **panic / worried** pose + small red `!` pixel above head |
| `needs_input` | taps the window edge to get attention (reuse attention tap) |
| `finish` | **cheer / thumbs-up**; if `say` present, speech bubble with it |

### New pixel poses to author (via pixel-art skill)

1. `panic` — flippers up, wide eyes, sweat-drop pixel.
2. `cheer` — both flippers raised.
3. `thumbsUp` — one flipper out with a thumbs-up pixel shape.
4. `thinking` — one flipper to chin, small `…` pixels (used while a long tool runs).

(`listening`/`typing` likely reuse existing coder-scene frames.)

## Files this will add / touch

- `BUDDY.md` *(this doc)*
- `src/main/buddy.js` *(new)* — fs.watch the event file, tail, debounce, forward.
- `main.js` — start the buddy watcher; `webContents.send('buddy:event', …)`.
- `preload.js` — expose `onBuddyEvent(cb)` and `connectBuddy()/disconnectBuddy()/buddyStatus()`.
- `src/main/buddyInstall.js` *(new)* — read/splice/write `~/.claude/settings.json`; lay down the `deskpet-hook` helper.
- `tools/deskpet-hook` *(new, bundled)* — the tiny per-OS hook helper that classifies tool output and appends an event line.
- `src/renderer/App.jsx` — `onBuddyEvent` listener → reaction dispatcher; the new poses.
- `src/renderer/components/SettingsPanel.jsx` — a "Connect to Claude Code" switch + status.
- `CHANGELOG.md`, `package.json` — version bump.

## Out of scope (v1)

- The ASCII terminal status-line buddy (the desktop pet replaces it).
- Windows hook command (bridge is ready; only the helper invocation differs — fast follow).
- Streaming token-level reactions (we react at tool / turn granularity).

## Open questions for review

1. OK to have the Settings switch **write into `~/.claude/settings.json`**? (It
   only adds/removes clearly-tagged Deskpet entries and never touches the rest.)
2. Want the spoken buddy comments (the MCP piece), or are silent reactions enough
   for v1?
3. Any reaction you specifically want (e.g. a special pose when tests pass)?
