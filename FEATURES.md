# Pengu — Features & Roadmap

A living checklist of what's built, what's next, and what's on the backlog.
For the dated history of changes, see [`CHANGELOG.md`](./CHANGELOG.md).

**Status legend:** `[x]` done · `[~]` done, needs play-testing · `[ ]` not started

---

## ✅ Done

### Core — the "alive" pet
- [x] QQ宠物-style pet: small, frameless, transparent, always-on-top window that
      walks around the desktop
- [x] Click-through everywhere except the penguin's own pixels (work normally behind it)
- [x] Reaches **every screen edge** (penguin centered in window; window may overflow off-screen)
- [x] Procedural pixel-art penguin (Canvas 2D) + procedural Web Audio sound effects
- [x] Drag to reposition · right-click menu · double-click to dance
- [x] Idle FPS throttle to keep CPU low
- [x] **Launch entrance** — hops out of a pink "Anywhere Door" (任意门) with confetti, then greets

### Personality & dialogue
- [x] 5 personality traits (活泼/胆量/亲密/食欲/好奇) that modulate walk frequency, range, speed, needs
- [x] Speech bubbles: time-of-day greetings, reactions, proactive idle chatter
- [x] Moods (happy / sad / tired / playful / bored) reflected in face + chatter
- [x] **Entire UI in Chinese**

### Needs & care
- [x] Stats: **饱腹 (fullness, 0 = hungry)**, **清洁 (cleanliness)**, **快乐 (happiness)**, hidden **精力 (energy)**
- [x] Hover-driven care panel; hovering a button reveals just that stat
- [x] **喂食 (feed)** and **洗澡 (bath)** via shop, with variants & soap-bubble effect
- [x] **玩耍 (play)** — free mini-game with the owner (random ball/badminton/dance/play), raises 快乐
- [x] Auto-sleep when tired; **坐下 (sit)** free rest
- [x] **Weak state** — starving pet half-collapses on the ground (走不了), pleads for food
- [x] **Dirty state** — low cleanliness shows grimy body + buzzing 🪰 flies
- [x] Actions with animations: 玩球, 打羽毛球, 坐下, 洗澡, 上学, 上班
- [x] **24/7 idle-pet pacing** (~2.5–3h to hungry) + offline decay capped at 20% (never returns sick)

### Economy
- [x] **Money (¥)**, starts at 200, persisted
- [x] Shop with priced variants (food ¥10–36, bath ¥10–38); unaffordable items grey out

### School → Work (earning)
- [x] **健康 (Health)** hidden stat (erodes only under prolonged neglect)
- [x] **School (上学)** — study raises education 未入学→小学→中学→大学 (4/8/16 sessions), reading animation
- [x] **Work (上班)** — pay scales with education (¥8→¥50/shift), working animation; blocked when sick/tired

### Sickness → Medicine
- [x] Sickness onset when health < 50; stages 初级/中级/晚期; sick pet rests, can't work, shows 🤒
- [x] **Medicine (看病)** shop — 感冒药/退烧药/特效药; right tier cures, weaker downgrades a stage

### Persistence
- [x] SQLite (better-sqlite3) with JSON-file fallback; all stats/money/education/illness saved
- [x] Offline decay on relaunch based on elapsed time

---

## 🔜 Next phase (planned)

### Finish the health loop
- [x] **Death & revive** — health hitting 0 (total neglect) → pet dies (toppled, grey, 👻);
      revive overlay offers **复活丹 (¥400)** → +health & a ~1-day work-pay weakness (−30%),
      or **重新养一只** (fresh pet). Death persists across restarts.
- [x] **静养** — after medicine the pet takes a short rest and recovers a little extra health.
- [x] Sick pet can't work at all (stronger than the doc's per-stage efficiency penalty).

### Real mini-games (玩耍 → actual games + coin rewards)
- [ ] Playable mini-games: 跳绳 (jump rope), 打地鼠 (whack-a-mole), 羽毛球 (badminton)
- [ ] Rewards: gold coins + 快乐 + small health (a light, free-ish income path)

### Deeper school & work
- [ ] School **subjects** (中文/数学/科学/英语/艺术/体育) with per-subject progress
- [ ] Work: **job picker / variety** per education tier, 30-min sessions, **过劳 (overwork)** penalty, post-work health check
- [ ] Learning unlocks specific job types (skill gating)

### UI surfacing
- [ ] Show **学历 (education)** and **健康 (health)** in a small persistent readout
- [ ] Show illness stage clearly when sick

---

## 💡 Backlog / future ideas

### Expansion directions (可扩展方向)
- [ ] 职业成长树与多职业选择 — richer career tree / multiple jobs
- [ ] 学科技能树 — subject skill tree that unlocks jobs & abilities
- [ ] 情绪系统 — fuller emotion model (happiness / stress / social)
- [ ] 积分与成就系统 — points & achievements to reward daily care
- [ ] 多宠物养育和互动 — raise multiple pets at once
- [ ] 更多小游戏和互动行为 — more games & interactions

---

> Maintained alongside `CHANGELOG.md`. Reference designs live in `mypet-ref-docs/`.
