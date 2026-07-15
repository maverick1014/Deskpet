# Career Path — study → career design spec

Pengu grows up along a **career path**: at each school stage it studies
age-appropriate courses, and studying is what *qualifies* it for work. Menial
tasks need nothing; skilled careers need the right course(s); the top
professions need a **combo** of skills and a **university major**. At 大学 the pet
**enrolls in one faculty** — that choice is its career direction.

This is the finalized spec. Build is phased (see bottom); nothing here is coded
until each phase is authored + tested per the pixel-art skill.

## Unlock types

| Type | Meaning |
|---|---|
| 🟢 Anytime | No age, no study — from day one (chores) |
| 🔵 Stage only | Must have reached / finished a school stage; no specific course |
| 🟡 1 course | Studied one specific subject |
| 🟣 Combo | Studied two or more subjects (and, for professions, a university major) |

## A. Curriculum by stage (what the pet is taught)

| Stage · age | Subjects | Count |
|---|---|---|
| 幼儿园 Kindergarten · 3–6 | 识字 Literacy · 数数 Numbers · 画画 Drawing · 唱歌 Singing · 手工 Crafts | 5 |
| 小学 Primary · 6–12 | 语文 Chinese · 数学 Math · 英语 English · 科学 Science · 体育 PE · 音乐 Music · 美术 Art | 7 |
| 中学 Secondary · 12–18 | 语文 · 数学 · 英语 · 物理 Physics · 化学 Chemistry · 生物 Biology · 历史 History · 地理 Geography · 体育 · 信息 IT | 10 |
| 大学 College · 18–22 | Enroll in ONE faculty, study its majors — see B | choose |

Recurring subjects (语文/数学/英语/体育) are harder rounds at each stage; "have I
studied X?" is satisfied by any stage. Graduating a stage = completing that
stage's subjects, which advances age and unlocks the next stage's courses + jobs.

## B. 大学 College — faculties (the "different schools to choose")

At college the pet **picks one faculty** (its path) and studies that faculty's
majors. The faculty decides which top career it can reach.

| 学院 Faculty | 专业 Majors | Leads to career |
|---|---|---|
| 计算机学院 Computing | 计算机 CompSci · 人工智能 AI | 程序员 Programmer |
| 商学院 Business | 会计 Accounting · 金融 Finance | 会计 Accountant |
| 医学院 Medicine | 医学 Medicine · 护理 Nursing | 医生 Doctor |
| 教育学院 Education | 教育 Education · 心理 Psychology | 老师 Teacher |
| 艺术学院 Arts | 美术 Fine Art · 设计 Design | 画家 Painter |

## C. Jobs & unlock requirements ⭐

| Job | Unlocks from | Requirement | Type | Pay |
|---|---|---|---|---|
| 拔草 Weeding | anytime | — | 🟢 | ¢ |
| 发传单 Flyering | anytime | — | 🟢 | ¢ |
| 洗碗 Dishwashing | anytime | — | 🟢 | ¢ |
| 钓鱼 Fishing | 小学 Primary | — (hobby) | 🔵 | $ |
| 清洁工 Cleaner | after 小学 Primary | — | 🔵 | $ |
| 便利店店员 Clerk | 中学 Secondary | 数学 | 🟡 | $$ |
| 咖啡师 Barista | 中学 Secondary | 英语 | 🟡 | $$ |
| 快递员 Courier | 中学 Secondary | 体育 + 地理 | 🟣 | $$ |
| 家教 Tutor *(new)* | after 中学 Secondary | any 1 Secondary subject | 🟡 | $$ |
| 程序员 Programmer | 大学 College | 计算机(major) + 数学 | 🟣 | $$$ |
| 会计 Accountant *(new)* | 大学 College | 会计(major) + 数学 | 🟣 | $$$ |
| 老师 Teacher | 大学 College | 教育(major) + 1 teaching subject | 🟣 | $$$ |
| 画家 Painter | 大学 College | 美术(major, 艺术学院) | 🟡 | $$$ |
| 医生 Doctor *(new)* | 大学 College | 医学(major) + 生物 + 化学 | 🟣 | $$$$ |

## D. Build — shipped in v1.21.0

The whole system landed in **v1.21.0** (one release, not phased):
- Stage-based curriculum for 幼儿园 / 小学 / 中学, each subject with its own
  chalkboard glyph + bilingual "learn out loud" facts, and a mini-flashcard
  study prop.
- 大学 faculty enrollment (pick one path) + its majors.
- Careers hard-gated by stage + course; the Work menu shows locked ones with
  what to study. New professions 家教 / 会计 / 医生 with outfits + scenes + badges.
- Persistent `learned` set + `faculty`, with save-migration for existing pets.

Every subject scene, job scene, and attire was authored as an ASCII grid,
rendered, and eyeball-checked via `.claude/skills/pixel-art/SKILL.md` before wiring.
