# Deskpet — TODO

## Per-subject & per-job focus animations

Right now every **class** shares one `study` pose (book prop) and every **shift**
shares one `work` pose (briefcase prop). Each subject and each job should have its
**own** distinctive looping animation while the focus session runs, so the pet
visibly "does" that activity.

**How it's built today (context for whoever implements this):**
- The pet is drawn on a `<canvas>` by action (`p.action`), with extra DOM "props"
  layered in `partRef` (see `bookProp()` / `briefcaseProp()` in `App.jsx`).
- A focus session sets `p.action = 'study' | 'work'` and calls `bookProp(0)` /
  `briefcaseProp(0)` (0 = persist until `clearProp()`).
- **Plan:** give each subject/job a `propKey` (or its own prop builder) and start
  that prop in `beginFocus()` based on `session.subjectKey` / `session.jobIdx`.
  Optionally add a matching canvas pose per activity. Keep each prop a small,
  self-contained DOM builder like the existing `bookProp`, looping via CSS
  keyframes in `index.css`.

### Subjects (study)

| Subject | Animation description | Implementation prompt |
|---|---|---|
| 语文 (Chinese) | Pet holds a brush and writes calligraphy on a small scroll; an ink character fades in/out, a drop of ink drips. | "Add a `chineseProp` DOM prop: a hanging scroll beside the pet with a brush that bobs; a faint 字 character cross-fades on a CSS loop. Wire it for `subjectKey==='cn'`." |
| 英语 (English) | Floating A·B·C letters drift upward and gently rotate; pet 'reads aloud' (beak opens on a loop). | "Add an `englishProp`: 2–3 letter glyphs rising and fading on staggered CSS loops, like the music notes. Wire it for `subjectKey==='en'`." |
| 数学 (Math) | A small abacus / counting beads slide; numbers (1,2,3) pop above the head one at a time. | "Add a `mathProp`: an abacus rail with beads that slide on a loop, plus a number that pops and fades. Wire it for `subjectKey==='ma'`." |
| 科学 (Science) | A beaker bubbles (rising bubbles), occasional spark/💡 lightbulb above the head. | "Add a `scienceProp`: a flask with CSS-animated rising bubbles and an intermittent ✨/💡. Wire it for `subjectKey==='sc'`." |

### Jobs (work)

| Job | Animation description | Implementation prompt |
|---|---|---|
| 发传单 (flyering) | Pet holds out flyers; a paper sheet flutters away to the side every few seconds. | "Add a `flyerProp`: a stack of papers in hand; on a loop one sheet detaches and drifts off-screen. Wire it for the `发传单` job." |
| 拔草 (weeding) | Pet bends down and tugs; a tuft of grass pops out with a little dirt particle burst. | "Add a `weedProp` + slight bend pose; on a loop a grass tuft pops and a few dirt specks scatter. Wire it for `拔草`." |
| 洗碗 (dishwashing) | A plate + sponge scrub back-and-forth; soap bubbles rise (reuse `bubbles()`). | "Add a `dishProp`: a plate with a sponge translating left-right on a loop; periodically spawn bubbles. Wire it for `洗碗`." |
| 清洁工 (cleaning) | Pet sweeps a broom side to side; a small dust cloud puffs at the broom head. | "Add a `broomProp`: a broom rotating side-to-side on a loop with a dust puff. Wire it for `清洁工`." |
| 便利店店员 (clerk) | Items slide across a scanner that blinks; a 🧾 receipt prints out. | "Add a `scanProp`: an item sliding past a blinking scanner light, then a receipt slip grows downward. Wire it for `便利店店员`." |
| 快递员 (courier) | Pet carries a box and jogs in place (legs pump); a tiny 📦 bobs. | "Add a `parcelProp` + jog pose; box bobs while legs pump on a loop. Wire it for `快递员`." |
| 程序员 (programmer) | A laptop in front; tiny code lines (▌ ▍ ▎) blink/scroll on the screen. | "Add a `laptopProp`: a laptop with CSS-animated code lines and a blinking cursor. Wire it for `程序员`." |
| 老师 (teacher) | A small chalkboard; pet taps a pointer; chalk text appears line by line. | "Add a `boardProp`: a chalkboard with a pointer that taps on a loop and chalk strokes fading in. Wire it for `老师`." |

**Acceptance:** starting a class/shift shows the matching prop; it loops for the
whole session and is removed by `clearProp()` on finish/break. Keep each prop
lightweight (CSS keyframes only, no JS per-frame).
