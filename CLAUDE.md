# Deskpet — project rules for Claude (and any spawned agents)

Deskpet is an Electron + React desktop **pixel-art** penguin pet. The penguin is
rendered on a `<canvas>` as a grid of letter codes (see `setupGrids()` / `pal()` /
`draw()` in `src/renderer/App.jsx`): each cell is a 7px square, expressions are
row-swaps stored in `this.G`, and animation is grid-swapping + sprite transforms.

## HARD RULES — non-negotiable (the owner insisted)

1. **NO EMOJI. Ever.** Not in animations, not in mini-games, not in scene props,
   not as placeholder art. Every on-screen visual must be **hand-drawn pixel art**
   in the penguin's own style — i.e. drawn on the canvas as pixel grids via the
   same `draw()`/`fillRect` pixel system (or new pixel grids), using the project
   palette. If you're tempted to drop in a `🐟`/`👒`/`💡`, draw it as pixels instead.

2. **All animation lives on / around the penguin's pixel art.** Activity scenes
   (上课 / 发传单 / 拔草 / jobs / subjects) are drawn as pixel art on the canvas
   layer, animated by the existing render loop — not DOM emoji overlays.

3. **Mini-games interact DIRECTLY with the real penguin, in its own window.**
   No separate "game screen" / modal board. The penguin itself is the player and
   acts the game out in place (it pecks, bats, throws, reacts) with pixel-art game
   elements drawn in the same style. The owner explicitly does not want a popup
   board that plays separately from the pet.

4. **Use the `pixel-art` skill for EVERY animation / pixel-art change.** Before
   wiring any new or edited sprite, pose, expression, scene, or game piece into
   the code, you MUST follow `.claude/skills/pixel-art/SKILL.md`: author it as an
   ASCII grid, **render it to a PNG with `.claude/skills/pixel-art/render_grid.py`,
   open the PNG, and visually self-check** that the silhouette reads correctly and
   is in-style. Never ship a sprite you haven't looked at. Sub-agents doing pixel
   work must do the same.

## Practical notes
- Pixel art = add grids/sprites and draw them with `ctx.fillRect` at the 7px cell
  size, or compose extra small pixel sprites near the penguin on the canvas.
- The window is small (penguin ~112×130 in a 240×400 window) and walks around the
  screen by moving the whole window — design in-place interactions accordingly.
- Keep the palette consistent with `pal()` (BODY/white/beak/ribbon/etc.).

## Release flow (unchanged)
Develop on the assigned branch, bump `package.json` version, update `CHANGELOG.md`,
PR → squash-merge to `main`; CI builds the macOS/Windows installers and publishes
the GitHub Release automatically.
