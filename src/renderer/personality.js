// Personality system (Phase 1, from 宠物情感系统.md).
// Five stable dimensions, each 0-100, generated once and persisted. They give
// each pet a consistent character that modulates how it walks, talks and reacts.
//   liveliness 活泼度 — walk frequency / speed / playfulness
//   courage    胆量   — how far it roams vs. hugging the edges
//   attachment 亲密度 — how soon it gets lonely without interaction
//   appetite   食欲   — how fast it gets hungry
//   curiosity  好奇心 — chance to wander off exploring
const DIMS = ['liveliness', 'courage', 'attachment', 'appetite', 'curiosity'];

export function genPersonality() {
  const r = () => 20 + Math.floor(Math.random() * 71); // 20–90, avoids extremes
  const p = {};
  for (const d of DIMS) p[d] = r();
  return p;
}

// Coerce a loaded value into a valid personality, filling gaps with fresh rolls.
export function normPersonality(p) {
  const base = genPersonality();
  if (!p || typeof p !== 'object') return base;
  const out = {};
  for (const d of DIMS) {
    const n = Number(p[d]);
    out[d] = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : base[d];
  }
  return out;
}

const HIGH = {
  liveliness: '活泼', courage: '勇敢', attachment: '黏人',
  appetite: '吃货', curiosity: '好奇',
};
const LOW = {
  liveliness: '文静', courage: '胆小', attachment: '独立',
  appetite: '挑食', curiosity: '谨慎',
};

// A short two-word descriptor for the UI, e.g. "活泼 · 好奇".
export function traitLabel(p) {
  const sorted = DIMS.map((d) => [d, p[d]]).sort((a, b) => b[1] - a[1]);
  const top = sorted[0], bottom = sorted[sorted.length - 1];
  const a = top[1] >= 50 ? HIGH[top[0]] : LOW[top[0]];
  const b = bottom[1] < 50 ? LOW[bottom[0]] : HIGH[sorted[1][0]];
  return a === b ? a : `${a} · ${b}`;
}
