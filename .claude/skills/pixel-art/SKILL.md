---
name: pixel-art
description: Author or modify ANY Deskpet pixel art or animation — penguin sprites, poses, expressions, focus scenes (上课/发传单/拔草…), mini-game pieces, or on-canvas effects. Encodes the project's ASCII-grid + palette technique and a MANDATORY render-and-look visual self-check. Use this whenever a task touches pixel art or animation.
---

# Pixel-art authoring (Deskpet)

Deskpet's art is **hand-authored pixel art expressed as code** — not images, not
emoji. Follow this exact technique and ALWAYS run the visual self-check before
wiring a sprite in.

## The technique

1. **A sprite is an ASCII grid + a palette.** Each character is one pixel; the
   letter is a palette code. The penguin is 16×16. Penguin palette (`pal()` in
   `src/renderer/App.jsx`): `.`=transparent, `D`=body navy `#222a55`, `L`=white,
   `O`=beak/feet `#ff9d3d`, `S`/`R`=ribbon, `E`=eye, `C`=cheek pink, `T`=accent
   blue, `G`=grime, `K`=egg shell. Scenes use `scenePal()`/`sceneGrids()`; games
   use `GAME_PAL`/`SPR` in `src/renderer/games.js`.
2. **Render = one `fillRect` per pixel.** `draw(grid)` maps each letter→colour and
   paints a cell-sized square; `imageSmoothingEnabled=false` + CSS
   `image-rendering:pixelated`. Reuse `drawSprite(ctx, grid, palette, ox, oy, px)`
   for anything off the main penguin canvas (scenes, games).
3. **Variants = row-swaps from a base.** `sw(idle, [[6,'..new row..'], …])` clones a
   base grid and replaces only the rows that change (how `happy`/`sad`/`sit`/
   `confused`/`aha` are made). Keep new poses derived from the base so they stay
   in-style.
4. **Motion = grid-swap + transforms.** The `requestAnimationFrame` loop picks a
   grid by `p.action`, blinks via an eye-row swap, alternates feet rows to walk,
   and layers `translateY`/`rotate`/`scaleY` (sine-driven) per action for bob /
   squash / hop. Prefer transforms over drawing many frames.

## HARD RULES (see CLAUDE.md)
- **No emoji, ever** — draw it as pixels.
- **Animation lives on/around the penguin's pixel art**; games are acted out by
  the real penguin in its own window (no modal board).
- New grids must be **rectangular** (all rows equal length) and use **only
  defined palette letters**.

## MANDATORY visual self-check (do NOT skip)

After authoring or editing ANY grid — and before wiring it into the code —
render it and LOOK at it:

```bash
# spec: {"grid":[...rows...], "palette":{...optional override...}, "scale":18}
python3 .claude/skills/pixel-art/render_grid.py spec.json /tmp/preview.png
```

Then **open `/tmp/preview.png` with the Read tool and reason about it out loud**:

1. **Logic check** (the script also prints these): grid is rectangular; every
   letter is in the palette; transparent (`.`) is where you expect empty space.
2. **Silhouette check:** does the shape actually read as the intended thing
   (a *sitting* penguin, a *blackboard*, a *bubble*)? Check proportions, symmetry
   where intended, that limbs/feet/props are where they should be, and that there
   are no stray or missing pixels.
3. **In-style check:** consistent with the penguin's palette and chunky look; not
   an emoji or a smooth/anti-aliased shape.
4. **Animation check:** if it's a pose for motion, confirm the base rows line up
   with the transform (e.g. a "sit" grid + a squash transform should land the
   feet on the ground, not float).

If anything is off, **edit the rows and re-render** until it's right. Only then
add it to `setupGrids()` / `sceneGrids()` / `games.js` and build
(`npm run build:renderer`).

For an animated pose, render the **key frames** (or the base grid for each
`p.action` state) and check them as a set so the motion will read.

## When spawning sub-agents for pixel art
Pass these instructions (or tell them to run this skill): they must author grids
this way, run the render-and-look self-check on every sprite, and never use emoji.
