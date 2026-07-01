// Wardrobe + achievements data, shared by App.jsx (render/logic) and the panel
// components (thumbnails/lists). Keeping the catalogue + accessory pixel grids
// here avoids duplicating them and keeps a single source of truth.
//
// HARD RULE (see CLAUDE.md): every accessory is HAND-DRAWN PIXEL ART — an ASCII
// grid of palette letters overlaid on the base penguin grid, never emoji. The
// grids below were authored + visually verified via .claude/skills/pixel-art.

// Buyable accessories. `slot` (hat / face / neck) lets a hat + glasses + scarf be
// worn together; `cost` is in coins.
export const WARDROBE = [
  { key: 'tophat',  slot: 'hat',  cost: 120, name: { zh: '绅士礼帽', en: 'Top hat' } },
  { key: 'beanie',  slot: 'hat',  cost: 90,  name: { zh: '毛线帽',   en: 'Beanie' } },
  { key: 'glasses', slot: 'face', cost: 80,  name: { zh: '圆框眼镜', en: 'Glasses' } },
  { key: 'scarf',   slot: 'neck', cost: 100, name: { zh: '暖围巾',   en: 'Scarf' } },
];
export const WARDROBE_MAP = WARDROBE.reduce((m, w) => { m[w.key] = w; return m; }, {});

// Row-swaps applied to the base penguin grid for each accessory (row index ->
// new 16-wide row). Verified via the pixel-art render-and-look self-check.
export const ACCESSORY_ROWS = {
  tophat: [[0, '......PPPP......'], [1, '......PPPP......'], [2, '.....PPPPPP.....'], [3, '...PPPPPPPPPP...'], [4, '..DDPPPPPPPPDD..']],
  beanie: [[0, '.......WW.......'], [1, '....MMMMMMMM....'], [2, '...MMMMMMMMMM...'], [3, '..MMMMMMMMMMMM..'], [4, '..IIIIIIIIIIII..']],
  glasses: [[5, '..DLPPPLLPPPLD..'], [6, '..DPZEPLLPEZPD..'], [7, '..DPPPLOOLPPPD..']],
  scarf: [[9, '..DVVVVVVVVVVD..'], [10, '..VVVVVVVVVVVV..'], [11, '..DDDLLLLLLVVD..']],
};

// Achievement milestones (bilingual). Unlock logic lives in App.jsx.
export const ACHIEVEMENTS = [
  { key: 'firstClass', name: { zh: '第一节课', en: 'First class' }, desc: { zh: '完成第一节课', en: 'Finish your first class' } },
  { key: 'graduate', name: { zh: '毕业生', en: 'Graduate' }, desc: { zh: '从一个学段毕业', en: 'Graduate a school stage' } },
  { key: 'lv5', name: { zh: '五级达成', en: 'Level 5' }, desc: { zh: '成长到 5 级', en: 'Reach level 5' } },
  { key: 'firstJob', name: { zh: '第一份工资', en: 'First paycheck' }, desc: { zh: '完成第一次上班', en: 'Finish your first shift' } },
  { key: 'buddyCheer', name: { zh: '代码搭子', en: 'Code buddy' }, desc: { zh: '第一次为你的代码欢呼', en: 'First commit-buddy cheer' } },
  { key: 'dressUp', name: { zh: '会打扮啦', en: 'Dressed up' }, desc: { zh: '第一次穿上配饰', en: 'Wear your first accessory' } },
  { key: 'focus', name: { zh: '专注一刻', en: 'Focus friend' }, desc: { zh: '完成一次番茄专注', en: 'Finish a Pomodoro focus' } },
  { key: 'played3', name: { zh: '老朋友', en: 'Old friend' }, desc: { zh: '陪伴满 3 天', en: 'Play for 3 days' } },
  { key: 'wellFed', name: { zh: '顿顿吃饱', en: 'Well fed' }, desc: { zh: '连续 3 天吃得饱饱的', en: 'Stay well fed 3 days' } },
];
export const ACH_MAP = ACHIEVEMENTS.reduce((m, a) => { m[a.key] = a; return m; }, {});

// Base idle penguin grid (mirrors setupGrids() in App.jsx) — used only to draw
// the little wardrobe thumbnails so a preview matches exactly what's worn.
const BASE_IDLE = [
  '......DDDD......', '....DDDDDDDD....', '...DDDDDDDDDD...', '..DDDDDDDDDDDD..',
  '..DDLLLLLLLLDD..', '..DLLLLLLLLLLD..', '..DLLELLLLELLD..', '..DLCLLOOLLCLD..',
  '..DLLLLLLLLLLD..', '..DDLLLLLLLLDD..', '...SSSSSSSSSS...', '..DDDLLLLLLDDD..',
  '..DDDLLLLLLDDD..', '..DDDLLLLLLDDD..', '...DDLLLLLLDD...', '....OO....OO....',
];
// Thumbnail palette (subset of pal() in App.jsx that these grids use).
const THUMB_PAL = {
  '.': null, D: '#222a55', L: '#ffffff', O: '#ff9d3d', S: '#ff4d6d', E: '#1a1f3d',
  C: '#ff9bbb', P: '#23262e', W: '#f4f7fc', M: '#39507f', I: '#aeb9c8', V: '#e0554e', Z: '#8bd0ff',
};

// Draw a small penguin wearing `key` onto a canvas 2d context (px = cell size).
export function drawAccessoryThumb(ctx, key, px = 5) {
  const grid = BASE_IDLE.slice();
  const rows = ACCESSORY_ROWS[key];
  if (rows) for (const [i, row] of rows) grid[i] = row;
  ctx.clearRect(0, 0, grid[0].length * px, grid.length * px);
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const c = THUMB_PAL[row[x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x * px, y * px, px, px);
    }
  }
}
