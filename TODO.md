# Deskpet — TODO

## 1. Activity-authentic focus animations (big feature)

> **Status:** ✅ **上课 / 发传单 / 拔草 shipped in v1.6.0.**
> ✅ **All six work jobs (洗碗 / 清洁工 / 便利店店员 / 快递员 / 程序员 / 老师) shipped in
> v1.8.0** — each penguin now wears the job's attire (via the `withGear` system)
> and acts the job out as a multi-beat pixel scene with rotating variants, built
> on the same `startSceneFor`/`drawScene` scene system in App.jsx.
> ✅ **Study courses got a lively, knowledge-driven v2 in v1.10.0** — class plays
> varied student beats (listen / 思考 / 恍然大悟 / 举手回答 / 打瞌睡 → 被粉笔砸醒), the
> board is de-emphasised, each subject teaches real facts the pet speaks while
> studying and later reuses in idle chatter, and 英语 dresses it as a top-hatted
> gentleman speaking English.

Each **class** and **job** should play its **own multi-beat "scene"** that actually
looks like the activity — not a single static pose with a prop. Each activity needs
**2–3 variants** that the engine cycles through so a long session never looks like
one looping clip.

**Current state:** a focus session just sets `p.action='study'|'work'` and shows a
single persistent book/briefcase prop (`bookProp(0)`/`briefcaseProp(0)`).

**Target architecture (for whoever implements):**
- Give each subject/job a **scene** = an ordered list of **beats** (pose + props +
  expression + optional particle), each with a duration; the scene loops for the
  whole session, and a variant index is rotated each loop (or each beat) so it
  stays fresh.
- Reuse the expression atlas (`this.G.idle/happy/...`), the prop layer (`partRef`),
  and CSS keyframes in `index.css`. Add new face/pose variants as needed
  (confused, thinking, aha!, sweating, smiling-while-holding).
- Drive scenes from a small data table keyed by `subjectKey` / `jobIdx`, so adding
  an activity is data + a few prop builders, not engine surgery.
- **This is large — build it incrementally, one activity at a time.** Suggested
  first prototypes to validate the scene engine: **拔草** (clear progression arc)
  and **上课·数学** (expression arc). Ship each as its own release.

### Worked examples the owner described

**上课 (class) — e.g. 数学:**
- Scene: a **desk + chair**; the penguin **sits** facing a **blackboard** with chalk
  text (math: `1 + 1 = 2`).
- Expression arc per loop: **疑惑/confused** → **思考/thinking** (taps head / looks
  up) → **恍然大悟/aha!** (eyes light up, little 💡). Then the board text changes.
- Per-subject variants: 语文 = a 字 / brush stroke on the board; 英语 = `A B C` /
  a word; 数学 = a sum; 科学 = a simple diagram / 🧪. Same arc, different board
  content + a couple of subject-specific beats.

**发传单 (flyering):**
- Scene: the penguin stands holding flyers with a **big smile**; **passers-by walk
  across** the scene; as each one passes, the penguin **hands them a flyer**.
- Variants needed (≥3): different passers-by (tall/short/in a hurry), some take the
  flyer happily, some wave it off (penguin shrugs and keeps smiling), an occasional
  gust scatters a flyer it chases.

**拔草 (weeding):**
- Opening beat: the penguin **arrives** at a patch **overgrown with weeds taller
  than it is**.
- Progress arc: through repeated **tugging effort** the weeds **gradually thin out
  and the ground gets clean** over the course of the shift (tie progress to elapsed
  time / remaining countdown).
- Flavour beats (rotate): wears a **farmer's straw hat 👒**; occasionally **sweats**
  and **wipes its brow with a cute little wing**; occasionally **takes a short rest**
  (sits, then back to work). Variants = different weed clumps / dirt puffs.

### Per-activity quick specs (scene seed for each)

| Activity | Scene seed (beats → variants) |
|---|---|
| 语文 | desk+board, brush writes a 字 → confused→think→aha; variants: different characters, ink drip |
| 英语 | desk+board with `ABC`/a word → read aloud (beak), confused→aha; variants: different words |
| 数学 | desk+board `1+1=2` → confused→think→aha; variants: different sums, counting on flippers |
| 科学 | desk+board diagram + 🧪 bubbling → curious→aha 💡; variants: beaker colour, spark |
| 发传单 | smile + flyers, passers-by cross & take one; variants: passer types, refusal, chase a flyer |
| 拔草 | arrive at tall weeds → tug→clear progressively, straw hat, sweat-wipe, rest; variants: clumps |
| 洗碗 | sink + plate, scrub L/R, bubbles rise, occasional squeaky-clean shine; variants: stack height |
| 清洁工 | broom sweep side-to-side, dust puffs, push a dustpan; variants: trash bits, mop swap |
| 便利店店员 | counter, item slides past blinking scanner, receipt prints, nod to customer; variants: items |
| 快递员 | carry box & jog, set it down/scan, pick next; variants: box sizes, a dog chase beat |
| 程序员 | laptop, code lines scroll + blinking cursor, think→aha (bug fixed) 💡; variants: error→fix |
| 老师 | chalkboard + pointer taps, chalk lines appear, turn to "class"; variants: subjects on board |

**Acceptance:** each activity shows a recognisable, multi-beat scene that loops with
≥2 variants for the whole session; all props are tagged and removed on finish/break
(see `clearProp()`); CSS-only animation (no per-frame JS beyond the existing loop).

## 2. 玩耍 mini-games — rebuild as in-place, penguin-driven, pixel art

> The current six games (in `MiniGames.jsx`) violate the hard rules: they use
> EMOJI and play in a SEPARATE MODAL board. **Rebuild every game** so it follows
> the canonical pattern below. No emoji, no separate screen — see `CLAUDE.md`.

### Canonical pattern (owner's bubble-game example — follow this for ALL games)
- Choosing a game makes **the penguin bring out a pixel-art prop and act the game
  out in its own window** (no modal board).
- **吹泡泡 (bubble) — the reference game:**
  1. The penguin pulls out a **pixel bubble wand** and starts **blowing pixel
     bubbles** that float up/around the window.
  2. Bubbles spawn at **random sizes** (big / small / in-between — a few size
     variants), drawn as pixel circles in the pet's style (NOT the 🫧 emoji).
  3. The **player clicks a bubble to pop it** → **+1 mark**.
  4. **Every 10 marks → +happiness** (and a happy penguin reaction).
- Every other game uses the same shape: penguin produces a pixel prop → does the
  activity → player interacts by clicking the penguin / the pixel pieces → score
  accumulates → milestone grants happiness (some give a few coins).

### Per-game rebuild notes (all pixel art, in-window, penguin-acted)
- **接小鱼** — penguin stands; pixel fish toss up; click a fish to make the penguin
  peck/catch it. Keep the window fixed; move the penguin within it, not the window.
- **吹泡泡** — as the reference above.
- **猜拳** — penguin throws a pixel rock/paper/scissors with its wing; you pick via
  three small pixel hand-shapes shown at the pet's feet (part of the pet window).
- **接球** — penguin bats a pixel ball that bounces in-window; click to time the bat.
- **跟我拍** — penguin flashes a pixel gesture sequence (wing up/down, lean); repeat
  by clicking the penguin in the same order.
- (Drop the cup-shuffle unless it can be penguin-acted in-window.)

**Acceptance:** picking a game shows the penguin acting it out in its own window
with pixel-art pieces; clicking interacts directly; score → happiness; NO emoji,
NO modal board; pieces cleaned up when the game ends.
