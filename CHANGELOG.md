# Changelog

All notable changes to **Pengu — Desktop Pet** (桌面宠物企鹅) are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); the project
is pre-release, so versions are milestone markers rather than published releases.

## [Unreleased] — Animation discovery (ongoing)

New lifelike animations being added one at a time.
See `TODO.md` for the remaining activity-authentic focus animations.

## [1.11.0] — 2026-06-30 — English version & language picker (multi-nation pet)

### Added
- **A language picker on the login screen — 中文 / English.** Pick your language
  when you sign up or log in, and the pet speaks it everywhere: the care panel,
  right-click menu, level names (Baby / Child / Adult), the focus bar, the
  break-confirmation popup, onboarding, and the pet's own speech bubbles.
- **Bilingual dialogue & lessons.** Greetings, moods, play/feed/bath chatter, and
  the per-subject knowledge the pet learns and shows off are all translated. The
  英语 (English) lesson stays in English in both languages — because that *is* the
  lesson the pet is practising.
- Your chosen language is **saved with the rest of the pet's state** and synced to
  the cloud, so it follows you across devices and reinstalls.

### Notes
- This is a first pass: the most-used surfaces are fully translated. A few deep
  game-flavour lines and the Settings / school / work pickers still show Chinese
  and will be translated in a follow-up.

## [1.10.4] — 2026-06-30 — Growth level & experience bar

### Added
- **A growth level + experience bar** in the care panel, so you can see how grown
  your pet is at a glance: **Lv1 宝宝 → Lv2 幼年 → Lv3 成年** (adult), with a
  percentage bar showing progress to the next level. Reaching **Lv3 grows it into
  an adult penguin** (the existing adulthood threshold).

## [1.10.3] — 2026-06-30 — Fix: study/work progress lost on restart

### Fixed
- **An in-progress class or shift is no longer lost when you close the app.** The
  focus session is now saved, so on reopening the pet **resumes** the class/shift
  where it left off — or, if its time already finished while you were away,
  **auto-completes it and credits the class** (you were "at school" the whole
  time). Previously the session vanished on restart and you had to study again.

## [1.10.2] — 2026-06-30 — Fix: couldn't focus the login fields

### Fixed
- **The login / signup screen was click-through** — tapping a field passed the
  click to whatever was behind the window instead of focusing the input, so you
  couldn't type your email or password. The window is now marked interactive
  while the login gate (and the "中断专注？" confirm) is showing.

## [1.10.1] — 2026-06-29 — Pacing & polish from play-testing

### Changed
- **Calmer class pacing.** 上课 is now mostly the pet quietly doing homework for a
  long stretch (a sheet + scribbling pencil), with the lively beats (思考/恍然大悟/
  举手回答/打瞌睡→被粉笔砸醒) as *occasional* interruptions — no more constant chalk.
- **拔草 is a proper weeding routine.** The pet arrives at a weedy patch, **puts on
  its work hat**, then pulls the tall weeds **one by one left-to-right** (kicking up
  dirt), **rests and wipes its brow** now and then, and when the patch is clear
  **trudges to a fresh patch** and starts over.
- **发传单 passers-by are now full, penguin-sized people** (were tiny) — everything
  drawn to the pet's scale.
- **吹泡泡 bubbles are bigger and gentler** — about 1–2 per second, large (easy to
  click), drifting slowly upward instead of a fast spray.
- **Speech bubbles size better** — longer/English lines get a comfortable width
  instead of wrapping into one narrow word per line.

### Added
- **A "中断专注？" confirmation** before a class/shift is broken, so a stray click or
  double-click doesn't wipe your focus progress.

## [1.10.0] — 2026-06-29 — Lively, knowledge-driven study courses

### Changed
- **上课 is now a real little student, not a static desk.** A class plays a lively
  loop of beats: listen → 思考 → 恍然大悟 (lightbulb) → **举手回答** (raises a flipper
  and blurts the answer) → **打瞌睡** (dozes, Z's drift up, head droops) → **被粉笔
  砸醒** (a chalk flies in from the board and it jolts awake). The blackboard is
  de-emphasised — only shown when the pet is paying attention.

### Added
- **Subjects teach real knowledge that the pet then uses.** While studying it
  "learns out loud" — 科学 光合作用/折射/声音传播…, 数学 sums & shapes, 语文 诗句/成语,
  **英语 spoken in English**. Once it has studied a subject, it mixes those facts
  into its idle chatter — so studying visibly makes it smarter.
- **英语 dresses the pet up as a dapper little gentleman** — a black top hat + bow
  tie — practising its English out loud.

## [1.9.0] — 2026-06-27 — Required cloud account with always-on auto-sync

### Changed
- **A cloud account is now required.** On launch the pet is gated behind a
  **login / signup** screen; once signed in, the save is mirrored to the cloud
  **automatically** — there's no optional toggle anymore.
- **Always-on auto-sync.** Every change is debounced-pushed to the cloud while
  signed in, and the **newest save wins** on login (cloud vs local).

### Added
- **Offline-tolerant play.** A previously-signed-in pet resolves its account
  from the **cached session with no network call**, so it keeps playing offline
  — only the syncing pauses.
- **Auto-resync on reconnect.** When the network comes back (or after a failed
  push), the latest save is flushed to the cloud automatically, so nothing
  edited offline is lost. The login screen shows an offline notice since the
  **first** signup/login needs a connection.

## [1.8.0] — 2026-06-27 — Every job is now a dressed-up, acted-out scene

### Added
- **All six remaining work jobs now play a real, attire-on, acted-out scene**
  instead of the generic briefcase prop — the penguin **wears the job's outfit**
  and **does the job**, each with rotating variants so a long shift stays fresh:
  - **洗碗** — in a **blue apron**, stands at a metal **sink** scrubbing a
    plate/bowl (rotates) with suds rising and a squeaky-clean shine.
  - **清洁工** — in a **cap**, sweeps a **broom** back and forth with dust puffs
    kicking up; a dustpan (with trash bits) waits to the side.
  - **便利店店员** — in a **red uniform cap**, rings up items (can/bottle/box) at
    a **counter** past a **scanner** whose laser flashes, printing a receipt.
  - **快递员** — in a **hi-viz cap + vest**, carries a **parcel** (size rotates)
    that bobs as it jogs, with a stack of parcels waiting.
  - **程序员** — in **headphones**, debugs at a **screen** of scrolling code with
    a blinking cursor; an error line turns green and a lightbulb pops (bug fixed).
  - **老师** — in **glasses + a bow tie**, points a **pointer** at a **chalkboard**
    whose subject rotates (语文/英语/数学/科学), tapping out chalk marks.
- New **job-attire system** (`withGear`) draws the outfit on the penguin, the way
  the 拔草 straw hat already did. All hand-drawn pixel art, authored + visually
  self-checked at real scene scale via the `pixel-art` skill. No emoji.
- **The four study courses now look distinct** — each shows its own animated prop
  beside the desk: 语文 a calligraphy brush + ink, 英语 an open book with floating
  letters, 数学 an abacus with a counting bead, 科学 a bubbling beaker.
- **Redesigned the egg/baby penguin** into a cuter hatching chick — round head,
  big sparkly eyes, tiny beak, in a cracked egg shell with a zigzag rim.

### Changed
- **Bigger, more detailed job tools** so the activity reads at a glance (sink with
  a faucet, broom with a clear handle + fanned bristles, a proper register/scanner,
  parcels with a tape cross + label, a larger code monitor).

## [1.7.3] — 2026-06-27 — 吹泡泡 now swings the wand like a 2D character

### Changed
- **The penguin now HOLDS the bubble wand in its flipper and SWINGS it.** Bubbles
  are produced along the wand's swing path (off the gold ring) only while the
  wand is moving — it no longer blows them statically from its beak.
  - A new **`swing` body action** leans the penguin side-to-side, kept in phase
    (`sin(t*0.0045)`) with the on-canvas arm so the flipper stays attached.
  - The wand is drawn as a swinging arm: a thick navy **flipper** + thinner
    **handle** line from the shoulder, with the **gold ring** at the tip; faster
    swings shed more bubbles, which then float up and away.
  - Pop a bubble (+1) as before; every 10 pops → +happiness & a happy hop.
- Authored and visually self-checked via the `pixel-art` skill at the real game
  scale before wiring in.



### Changed
- Verified every existing sprite (all penguin poses, scene props, and game
  pieces) by rendering and visually checking each via the `pixel-art` skill.
- **Redrew the 数学 chalkboard** — its `1 + 1 = 2` now reads clearly as blocky
  pixel digits instead of scattered marks.

## [1.7.1] — 2026-06-26 — A proper penguin sit-down

### Changed
- **坐下 now looks like a penguin actually sitting** — a dedicated pixel pose
  with the body settled low and **flat feet splayed forward**, instead of just a
  squash.
- **The pet holds the sit much longer** (~16s, was ~5s) before getting up to
  wander again, and rests a bit more energy while sitting.

## [1.7.0] — 2026-06-26 — Penguin-driven pixel-art games; emoji-free animations

### Changed
- **玩耍 mini-games rebuilt as in-window, penguin-driven pixel art** — no more
  separate modal board. The real penguin acts each game out in its own window:
  - 🫧→ **吹泡泡**: the penguin pulls out a pixel bubble wand and blows random-size
    pixel bubbles; click to pop (+1), every 10 marks → happiness.
  - **接小鱼** (peck the tossed pixel fish), **猜拳** (throws a pixel hand with its
    wing), **接球** (bat the bouncing pixel ball), **跟我拍** (repeat its gesture cues).
- **All animation emoji removed** per the project's pixel-art rule: floating
  emotes, the hunger/tired indicators, the fly/sick overlays, and the badminton
  shuttlecock are now the penguin's own **pixel face / drawn pixel art** — no emoji.

## [1.6.1] — 2026-06-26 — Focus scenes are now real pixel art (no emoji)

### Changed
- **上课 / 发传单 / 拔草 scenes are redrawn as hand-drawn pixel art** on a dedicated
  pixel scene canvas — no more emoji. Pixel desk + blackboard with per-subject
  pixel chalk (语文/英语/数学/科学), pixel passers-by + flyers, pixel weeds that
  clear over the shift, and a **pixel straw hat drawn on the penguin's head**.
- The penguin's own **pixel face** now drives the 疑惑 → 思考 → 恍然大悟 arc during
  class (new confused/think/aha expressions), with a drawn pixel lightbulb.

## [1.6.0] — 2026-06-26 — Activity-authentic focus scenes

### Added
- **上课, 发传单 and 拔草 now play a real, looping multi-beat scene** instead of a
  single static prop — each with 2–3 variants so a long session stays fresh:
  - **上课** — desk + blackboard; subject-specific chalk content (语文/英语/数学/科学)
    with an expression arc each loop: 疑惑 ❓ → 思考 🤔 → 恍然大悟 💡.
  - **发传单** — passers-by walk across; the penguin hands out flyers (some take it,
    some wave it off), with an occasional gust that blows a flyer away.
  - **拔草** — arrives at tall weeds that thin out as the shift progresses; wears a
    straw hat 👒, occasionally sweats and wipes its brow, and takes the odd rest.
- Other subjects/jobs keep the simple book/briefcase prop for now (see `TODO.md`).

## [1.5.3] — 2026-06-26 — 玩耍 mini-games

### Added
- **Six mini-games** behind 玩耍 (right-click → 玩耍, or the care-panel button):
  - 🐟 **接小鱼** — drag to catch falling fish (timed)
  - 🫧 **戳泡泡** — tap rising bubbles before they escape (timed)
  - ✌️ **猜拳** — rock/paper/scissors vs the penguin
  - 🥤 **猜小鱼** — find the fish after the cups shuffle
  - 🎾 **接球** — stop the marker in the zone to catch the ball
  - 🧠 **跟我拍** — repeat the penguin's growing colour sequence
  - Each round raises happiness (and some award a few coins).

## [1.5.2] — 2026-06-26 — Focus polish

### Fixed
- **The book / briefcase prop lingered after a class or shift ended.** Focus
  props are now tagged and fully swept on finish/break, so nothing is left behind
  (even if you fed or bathed mid-session).

### Changed
- **Studying / working no longer drains happiness.** Happiness decay is paused
  during a focus session (the pet is engaged), and finishing a shift now gives a
  small happiness boost instead of a penalty.

## [1.5.1] — 2026-06-26 — Slimmer care panel & gentler needs

### Changed
- **Care panel is smaller and cleaner** — smaller action buttons, the money
  readout is gone, and the stat preview is now a slim "language-bar" sized pill
  that only shows while hovering a button.
- **Needs decay more slowly** — hunger ~2× slower (≈5h to hungry) and
  cleanliness ~2× slower (≈8–9h to dirty), so the pet is less needy.

## [1.5.0] — 2026-06-26 — Timed school & work (focus sessions)

### Added
- **Timed school system.** 上课 now opens a **subject picker**. Each level has 4
  subjects (语文/英语/数学/科学); finishing a subject's classes graduates it, and
  graduating all 4 promotes to the next level.
  - Classes per subject **double each level**: 幼儿园 2 · 小学 4 · 中学 8 · 大学 16.
  - Class length (real time): 幼儿园 **15min** · 小学 **30min** · 中学 **1hr** · 大学 **2hr**.
- **Timed work system.** 上班 opens a **job picker** of jobs unlocked by your
  school level (higher level → better pay). Pick a **30min or 1hr** shift to earn
  `rate × minutes`.
- **Focus mechanic.** During a class/shift a **countdown timer** shows the time
  left. You can **only 喂食 / 洗澡** — **playing, quitting, or stopping breaks
  focus** and the session resets. A cheerful **done animation** plays on finish.

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
