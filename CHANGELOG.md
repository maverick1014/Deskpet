# Changelog

All notable changes to **Pengu — Desktop Pet** (桌面宠物企鹅) are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); the project
is pre-release, so versions are milestone markers rather than published releases.

## [Unreleased] — Animation discovery (ongoing)

New lifelike animations being added one at a time.

## [1.4.1] — 2026-06-26 — Scroll fixes for shop & settings

### Fixed
- **Shop list was clipped by the window and couldn't scroll** — the shop now
  opens as a window-centred sheet with a scrollable item list, so every item is
  reachable.
- **Settings dialog overflowed the window** (title and 完成 button cut off) — it
  now caps to the window height and scrolls internally.

## [1.4.0] — 2026-06-26 — Kindergarten, free schooling & online rewards

### Added
- **幼儿园 (kindergarten)** education tier — the school path is now
  未入学 → 幼儿园 → 小学 → 中学 → 大学 (with a matching new entry-level job).
- **Online reward** — the pet automatically earns **+10💰 every hour online**.

### Changed
- **No age limit on schooling** — a little one can now go to 幼儿园 without
  waiting to grow up. (Working still requires growing up.)

## [1.3.0] — 2026-06-26 — Cloud save (optional account)

### Added
- **Optional cloud save with an email + password account** (Supabase-backed).
  Sign in from **Settings → ☁️ 云存档** and your pet's save is mirrored to the
  cloud, so it survives a reinstall or moves with you to another machine.
  - The pet still works fully **offline** — signing in is optional.
  - On login, the **newest** save wins (cloud vs local), then changes auto-sync
    in the background; a **立即同步** button forces an immediate push.
  - Per-account isolation via Row-Level Security — you only ever see your own
    save. The publishable key is the only credential shipped in the client.

## [1.2.0] — 2026-06-26 — Quieter, cleaner, more minimal UI

### Changed
- **No more action sounds** — feeding, playing, bathing, etc. are now silent.
  The volume control was removed from settings accordingly.
- **Care panel now sits below the pet** while the speech bubble stays above, so
  the bubble no longer covers the action buttons on hover. (Flips above only when
  the pet is right at the bottom edge of the screen.)
- **Minimal, background-less action bar** — the three action buttons
  (喂食/洗澡/玩耍) are now light frosted pills with no enclosing card.
- **Shop items are a vertical list** (icon · name · +amount · 💰cost) instead of
  a cramped horizontal row, so longer item names are readable.

## [1.1.1] — 2026-06-25 — System tray & off-screen rescue (Windows fixes)

### Added
- **System-tray icon** ("collapse section") — the pet runs as a background app
  and is now always reachable from the tray, even though it stays out of the
  taskbar. Tray menu: recall pet to centre · show · hide · quit.
- **"Bring pet to centre" / 回到中央** rescue action, available three ways:
  - the tray menu,
  - **double-clicking the tray icon**, and
  - the pet's **right-click menu**.
  Recovers the penguin when it has wandered or been dragged off-screen.

### Fixed
- **Windows: pet could disappear off-screen with no way to get it back** — with
  no taskbar entry there was no recovery path. The tray icon + recall-to-centre
  give a reliable way to summon it back.

## [1.1.0] — 2026-06-25 — Lifelike animations & a patient, loving pet

First feature release on top of v1.0.1. Bundles the recent animation work:
- 🐧 **Belly slide** · 🪽 **wing flap** · 🤧 **sneeze** (drawn puff) · 💗 **heart-eyes** when
  petted · 👀 **watches the cursor**
- 🐦 **Peck** — curiously dips its head to peck a little crumb off the ground
- 🥱 **Yawn** — a big sleepy yawn (eyes scrunch shut, beak gapes, leans back)
- 🪶 **Preen** — grooms its feathers (leans to its side, nibbling); a downy feather drifts off
- 😴 **Doze** — drowsily nods off: the head sinks down, then jerks back up as it catches itself
- 👋 **Wave hello** — a cheery side-to-side greeting; also fires when your cursor first comes near
- 💗 **"Misses you, waits patiently"** behaviour and hand-drawn activity props

## [0.11.0] — 2026-06-25 — Hand-drawn props & a patient, loving pet

### Added
- **"Misses you, waits patiently" behaviour** — after a long stretch with no
  interaction, the pet (a good child who knows you're busy) sits and looks up
  hopefully with a little ❤️ drifting up, sometimes saying a sweet, *non-nagging*
  line ("主人在忙吧，我乖乖等~"). Replaces the old needy lonely chatter.

### Changed
- **All activity props are now hand-drawn animations instead of emoji:**
  - 📖 → a drawn **open book** with a page gently turning (used by reading & study)
  - 🎵 → drawn **music notes** drifting upward
  - 💼 → a drawn **briefcase** carried while working
  - ❤️ → a drawn **heart** (tinted to the pet's gender colour)
  - 🥱 → the stretch is now **pose-only** (no emoji)
  - (the 📺 TV was already drawn)

## [0.10.0] — 2026-06-25 — A more lifelike, self-entertaining companion

### Added
- **Idle "doing its own thing" behaviours** (autonomous when grown & content):
  - 📺 **watch TV** (a little set beside it flickering through channels)
  - 📖 **read** · 🎵 **listen to music** (sways to the beat)
  - 🥱 **stretch & yawn** · 👀 **glance around**
  - Each raises happiness a touch and is interruptible by feeding / clicking / dragging.

### Changed
- **Much less chatty.** It now keeps to itself and only speaks up for a real **need**
  (hungry / dirty / tired / sick) — no more needy "where'd you go?".
- **Smiley face when happy** — high 快乐 now shows a big grin (was a neutral/flat look).
- **Hatch time reduced to 2 hours** of online time (was 2 days).

## [0.9.0] — 2026-06-25 — Onboarding & the egg → penguin growth stage

### Added
- **Onboarding** for a brand-new pet, two steps:
  1. **Choose an egg** — 男孩 (red ribbon) or 女孩 (pink ribbon).
  2. **Name the pet** (Enter or "就叫这个名字！🐣").
- **Growth life-stage** — the pet hatches as a **baby in a cracked egg** (head poking
  out, shell cap on top, egg-shell body, gender-coloured ribbon) and becomes a **full
  penguin after 2 days of total online time** (`playTime`), with a "我长大啦！🎉" hatch.
- **Boy/girl difference** — the ribbon (egg) and scarf (penguin) are **red for boys,
  pink for girls**.
- **Baby-stage limits** — childish babble (`DIA.baby`); 玩耍 can only **play ball**;
  上学 / 上班 are locked until grown ("我还在蛋里呢，长大再说嘛~").

### Fixed
- Onboarding/growth state (`gender`, `playTime`) now persists correctly; fixed a
  boot-time race where `boot()` read pet state before the async load had applied.

## [0.8.0] — 2026-06-25 — Death & revival (health loop complete)

### Added
- **Death** — if total neglect drains 健康 (health) to 0, the pet dies: it topples
  over, greys out, and a 👻 drifts up. The state persists across restarts.
- **Revive overlay** — a dead pet shows two choices:
  - **复活丹 (¥400)** → revived with restored health and a ~1-"day" weakness
    (−30% work pay) afterward, with a "pop back to life" hop.
  - **重新养一只** → start over with a brand-new pet (fresh personality + stats).
- **静养 (rest)** — taking medicine now ends with a short rest that recovers a little
  extra health, instead of a purely instant cure.

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
