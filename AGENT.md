# Deskpet (Pengu) — master prompt for AI agents

You are developing **Deskpet (Pengu)** — an Electron + React + Canvas 2D pixel
penguin desktop pet.

## HARD RULES (never break — see CLAUDE.md)
1. **No emoji as on-screen visuals.** Every visual is hand-drawn pixel art on the
   canvas (`draw()` / `fillRect` + the project palette `pal()`).
2. **All animation lives on the penguin's pixel art**; activity scenes are drawn
   on the canvas, not with DOM/emoji.
3. **Mini-games are acted out by the real penguin in its own window** — no
   separate popup game board.
4. **Every pixel/animation change** must go through `.claude/skills/pixel-art`:
   author an ASCII grid → render a PNG with `render_grid.py` → open and eyeball it
   before wiring it in.

## Architecture
- Penguin is 16×16 at 7px cells. Expressions = row-swaps (`sw`); motion =
  grid-swap + CSS transforms with easing (`easeInOutQuad`, squash/stretch).
- **i18n**: `t(lang, key)` for UI strings (`i18n.js`), `tn(obj, lang)` for
  bilingual data names; dialogue pools in `dialogue.js`. Language saved in state.
- **Behaviour**: `tick()` runs a weighted-urge idle picker (`_pickBehavior`) with
  cooldowns + no repeats; time-of-day and mood adjust the weights.
- **Persistence**: local SQLite (main) + Supabase cloud sync. Use only the
  `deskpet_` table prefix; never touch unrelated DBs.
- **Code Buddy**: Claude Code hooks → `~/.deskpet/claude-events.jsonl` → main
  `fs.watch` → penguin reactions. 100% local; nothing uploaded. Hooks run through
  the app's bundled Node (`ELECTRON_RUN_AS_NODE`), so PATH never matters.

## Release flow
- Develop on the assigned branch → bump `package.json` version + `CHANGELOG.md` →
  PR → squash-merge to `main`. CI builds the macOS/Windows installers and
  publishes the GitHub Release automatically.
- **Always test before deploy**: `npm run build:renderer`, `node --check` on the
  main-process files, a headless Electron smoke run, and an i18n key-coverage
  check.

## Style
Make behaviour smooth, weighty, and logical — like a real pet. Test first, then
deploy, then send the download link.
