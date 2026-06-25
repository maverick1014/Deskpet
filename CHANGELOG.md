# Changelog

All notable changes to **Pengu — Desktop Pet** (桌面宠物企鹅) are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); the project
is pre-release, so versions are milestone markers rather than published releases.

## [0.7.0] — 2026-06-25 — Idle-pet balancing & launch entrance

### Added
- **"Anywhere Door" entrance (任意门):** on every launch the penguin hops out of a
  pink Doraemon-style door — the door pops up behind it, the pet springs out with a
  stretch-and-land hop and a confetti burst, the door fades, then it greets you.

### Changed
- Re-tuned needs to a **24/7 idle-pet timescale**, then sped it up ~60% for
  playability: 饱腹 (fullness) gets hungry in **~2.5–3h**, 清洁 (cleanliness) in
  **~4–5h**, 快乐 (happiness) in **~3h**. Health/sickness deliberately stay slow so
  faster needs don't make the pet sick easily.
- **Offline decay** (while the app is closed) is only **20% of the live rate**,
  capped, with **no offline health loss and no offline sickness** — the pet never
  comes back sick, just a little hungrier/dirtier.

## [0.6.0] — 2026-06-25 — School · Work · Sickness · Medicine

### Added
- **Hidden 健康 (Health) stat** — only *prolonged* neglect (a need low for hours)
  erodes it; all-round good care slowly heals it. Shown in the medicine shop.
- **Sickness** — when health drops below 50 the pet may fall ill (初级 → 中级 →
  晚期). A sick pet shows 🤒, looks sad, rests instead of wandering, and can't work;
  untreated illness slowly worsens.
- **Medicine shop (看病)** — 感冒药 ¥20 / 退烧药 ¥35 / 特效药 ¥60. The right strength
  cures outright; a weaker dose still helps (downgrades one stage), so you can't get
  hard-stuck. Appears in the right-click menu only while sick.
- **School (上学)** — study sessions (with a reading animation) raise education
  未入学 → 小学 → 中学 → 大学 (4 / 8 / 16 sessions per level).
- **Work (上班)** — earn money with a working animation; pay scales with education
  (打零工 ¥8 → 清洁工 ¥16 → 店员 ¥28 → 程序员 ¥50 per shift). Blocked while sick or
  too tired. This closes the economy loop: study → better job → earn → spend.

### Changed
- Right-click menu reorganized: 喂食 / 洗澡 / 玩耍 / 坐下 · 上学 / 上班 · (看病 when
  sick) · 设置 / 退出.

## [0.5.0] — 2026-06-25 — Economy & shop

### Added
- **Money (¥)** — every pet starts with **200**, persisted between sessions.
- **Shop** for 喂食 and 洗澡 — variants recover different amounts at different prices
  (food ¥10–36 for +20…75 饱腹; bath ¥10–38). Opens in-panel as item chips
  (icon / +amount / 💰cost); unaffordable items grey out.

### Changed
- **玩耍 (Play) is now free** — a mini-game with the owner (a random ball / badminton
  / dance / play animation) that raises 快乐 at no cost.

## [0.4.0] — 2026-06-25 — New stat model

### Changed
- Reworked the stats to match the intended design:
  - **饱腹 (fullness)** 0–100, where **0 = hungry** — replaces the old inverted
    "hunger". Feeding raises it.
  - **清洁 (cleanliness)** and **快乐 (happiness)** 0–100, higher = better.
  - **精力 (energy)** is now a **hidden** stat — drained by play/work, restored by
    sleep; when low the pet says it's tired and eventually auto-sleeps.
  - The care panel shows 饱腹 / 清洁 / 快乐 only. Old saves auto-migrate.

## [0.3.0] — 2026-06-25 — Care UX, new states & full-screen reach

### Added
- **Bath (洗澡)** action with a rising soap-bubble effect.
- **Weak state** — when starving, the pet half-collapses on the ground (走不了) and
  pleads for food until fed.
- **Dirty state** — low cleanliness shows a grimy body and buzzing 🪰 flies.

### Changed
- **Care panel is hover-driven** (previously click): hovering the pet shows
  喂食 / 洗澡 / 玩耍; hovering a button reveals just that stat. The panel flips
  above/below the pet and shifts sideways to stay on-screen.
- **Sleep is automatic** — removed the manual button; the pet sleeps when tired.

### Fixed
- **The pet can now reach every screen edge.** Re-architected the window geometry so
  the penguin is centered in the window and the *penguin* (not the window) is clamped
  to the work area; the transparent window is allowed to overflow off-screen
  (`enableLargerThanScreen`). Fixes "the pet gets blocked at half the screen" and the
  care panel being cut off at the top.
- Speech bubbles no longer wrap short lines onto two lines.

## [0.2.0] — 2026-06-25 — Chinese UI & more actions

### Added
- **New actions** with their own animations: 坐下 (sit / rest, recovers energy),
  玩球 (ball), 打羽毛球 (badminton). Sit and ball also happen autonomously when idle.

### Changed
- **Entire UI translated to Chinese** — dialogue lines, personality traits, care
  panel, context menu and settings; the font stack was updated so Chinese renders
  cleanly (and the settings title moved off the Latin-only pixel font).

## [0.1.0] — 2026-06-25 — Phase 1: the "alive" layer

### Added
- A QQ宠物-style desktop pet: a small, frameless, transparent, always-on-top penguin
  that physically walks around the screen, with click-through everywhere except its
  own pixels so you can keep working normally.
- **Personality (5 traits)** — liveliness / courage / attachment / appetite /
  curiosity — driving how often, how far and how fast it walks, plus its needs.
- **Dialogue bubbles** — time-of-day greetings, reactions, and proactive idle chatter.
- **Bored mood** when ignored, and an **idle FPS throttle** to keep CPU low.
- Procedurally drawn pixel-art penguin (Canvas 2D), procedural Web Audio sound
  effects, and SQLite persistence with a JSON-file fallback.
