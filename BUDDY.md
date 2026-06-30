# Code Buddy mode — design spec

> Status: **proposal for review.** No code is written against this yet.
> Target: macOS first (the bridge is cross-platform; only the installed hook
> command differs per-OS, so Windows is a small follow-up).

## Goal

Make Deskpet a **companion + notifier for a developer using Claude Code**. Once
the user "connects" their Claude Code (a one-time install from Deskpet's
Settings), the penguin keeps living its **normal pet life** — walking, sitting,
napping, chatting — and **only breaks from that when something special happens**
in the Claude Code session: it perks up to notify you of an error, cheers when
tests pass, taps the window when Claude needs your permission, speaks a short
remark when Claude finishes — then **goes right back to being a normal pet.**

The penguin is **NOT** a coder character. It does **not** wear developer gear and
does **not** sit at a laptop pretending to write the code. It's a pet that sits
*beside* the developer and reacts on their behalf — the same idea as the
community `claude-buddy` project, but instead of ASCII art in the terminal, the
buddy is the **real pixel penguin in its own window**, reacting in its own style.

## Principles

- **Stays a pet, not a coder.** Default behaviour is unchanged — the normal
  wandering/idle/sleep/chatter pet. No coder attire, no laptop scene, no
  persistent "work mode". Buddy reactions are **transient interruptions** layered
  over normal life: trigger → quick pose/notify/speak → return to normal.
- **Reacts only on events.** Nothing happens during ordinary coding; the penguin
  acts only when one of the defined criteria below is met (error, tests pass,
  needs permission, turn finished, etc.). It should feel like a calm companion
  that pipes up at the right moments, not a mascot constantly performing.
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

**CONFIRMED: the talking version is in scope.** We register a minimal MCP server
whose instructions ask Claude to end substantial turns with an invisible
`<!-- buddy: short friendly remark -->`. The `Stop` hook greps that out and puts
it in the `say` field, and the penguin speaks it. If a turn has no such note, the
penguin just does a silent cheer.

## Reaction map (pixel art)

The penguin is its **normal pet self**; each reaction is a brief interruption,
then it returns to normal wandering/idle. **No coder gear, no laptop scene.**
All rows confirmed wanted by the owner.

| Code | Event | Penguin reaction (transient, then back to normal) |
|------|-------|---------------------------------------------------|
| A | `session_start` | notices you started — perks up / quick wave, then resumes |
| B | `prompt` | brief look toward the screen ("I'm with you"), then resumes |
| C | `tool_run` (slow) | curious `thinking` glance while a long command runs |
| D | `tool_ok` | small content nod |
| E | `tests_pass` | **victory** — both flippers up + a pixel ✔ |
| F | `tool_error` / `tests_fail` | **worried/panic** pose, sweat-drop, red `!` — notifies you |
| G | `big_diff` | excited bounce (a lot just changed) |
| H | `git_commit` / `git_push` | **salute / thumbs-up** ("shipped it") |
| I | `needs_input` | **taps the window edge** to get your attention |
| J | `finish` | **cheer**; if a `say` note is present, speak it in a bubble |
| K | `session_end` | stretches / waves bye, fully back to normal pet life |

### New pixel poses to author (via pixel-art skill)

1. `panic` — flippers up, wide eyes, sweat-drop pixel (F).
2. `cheer` — both flippers raised (J).
3. `victory` — flippers up + a small pixel ✔ check mark (E).
4. `salute` / `thumbsUp` — one flipper out with a thumbs-up/salute shape (H).
5. `thinking` — one flipper to chin, small `…` pixels (C).
6. `notice` / `wave` — perk-up + small wave (A / B / K).

(`needs_input` reuses the existing attention-tap; "back to normal" reuses the
pet's existing idle/walk frames — there is no persistent buddy scene.)

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

## Decisions (signed off by owner)

1. ✅ The Settings switch **may write into `~/.claude/settings.json`** (only its
   own clearly-tagged entries; everything else untouched; fully reversible).
2. ✅ **Talking version** — spoken buddy comments via the MCP piece are in scope.
3. ✅ **All reactions A–K wanted.**
4. ✅ The penguin **keeps its normal pet behaviour** and is a companion/notifier —
   **no coder gear, no laptop scene.** Reactions are transient, then it returns
   to normal life.
