// Shop catalogue (Stage-2 economy). Only consumables cost money: food and bath
// supplies. Playing with the pet is FREE (a direct owner interaction), so it
// isn't in the shop. `amt` is the headline number shown on the chip; the other
// fields are the actual stat deltas applied.
export const SHOP = {
  food: {
    stat: 'fullness',
    items: [
      { key: 'fish', icon: '🐟', name: { zh: '小鱼干', en: 'Dried fish' }, amt: 20, full: 20, cost: 10 },
      { key: 'shrimp', icon: '🍤', name: { zh: '鲜虾', en: 'Fresh shrimp' }, amt: 40, full: 40, cost: 18 },
      { key: 'cake', icon: '🍰', name: { zh: '小蛋糕', en: 'Little cake' }, amt: 50, full: 50, happy: 8, cost: 28 },
      { key: 'feast', icon: '🍱', name: { zh: '海鲜饭', en: 'Seafood bento' }, amt: 75, full: 75, cost: 36 },
    ],
  },
  bath: {
    stat: 'clean',
    items: [
      { key: 'shower', icon: '🚿', name: { zh: '冲个澡', en: 'Quick shower' }, amt: 45, clean: 45, cost: 10 },
      { key: 'bubble', icon: '🛁', name: { zh: '泡泡浴', en: 'Bubble bath' }, amt: 100, clean: 100, cost: 20 },
      { key: 'spa', icon: '🧴', name: { zh: '精油SPA', en: 'Oil spa' }, amt: 100, clean: 100, happy: 12, cost: 38 },
    ],
  },
  // Medicine: only useful while sick. `tier` must be ≥ the illness stage to cure
  // (mild=1 / medium=2 / severe=3); `amt`/`heal` is the health restored.
  medicine: {
    stat: 'health',
    items: [
      { key: 'cold', icon: '💊', name: { zh: '感冒药', en: 'Cold pills' }, amt: 40, heal: 40, tier: 1, cost: 20 },
      { key: 'fever', icon: '💉', name: { zh: '退烧药', en: 'Fever shot' }, amt: 60, heal: 60, tier: 2, cost: 35 },
      { key: 'super', icon: '🧪', name: { zh: '特效药', en: 'Cure-all' }, amt: 100, heal: 100, tier: 3, cost: 60 },
    ],
  },
};

