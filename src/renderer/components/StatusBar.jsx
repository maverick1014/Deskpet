import React from 'react';
import { SHOP } from '../shop.js';

// Hover care panel with two modes:
//  • category view — a minimal, background-less row of 3 action buttons
//    (喂食/洗澡/玩耍). A small frosted pill above shows money, or the relevant
//    stat while a button is hovered. Sits BELOW the pet (the speech bubble is
//    above), so the two never overlap.
//  • shop view — after clicking a category, a small card lists that category's
//    items VERTICALLY (icon · name · +amount · 💰cost); affordable rows click.
const META = {
  fullness: { icon: '🍗', label: '饱腹', color: (v) => (v < 30 ? '#ff5a5f' : '#ff9d3d') },
  clean: { icon: '🫧', label: '清洁', color: (v) => (v <= 25 ? '#ff5a5f' : '#4cc3ff') },
  happy: { icon: '😊', label: '快乐', color: (v) => (v < 30 ? '#8a93c2' : '#ff6fa5') },
  health: { icon: '❤️', label: '健康', color: (v) => (v < 50 ? '#ff5a5f' : '#36c98f') },
};

function Bar({ which, value }) {
  const m = META[which];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
      <span style={{ fontSize: 13, width: 16, textAlign: 'center' }}>{m.icon}</span>
      <span style={{ fontSize: 10, fontWeight: 800, color: '#6b74a8', width: 26 }}>{m.label}</span>
      <div style={{ flex: 1, height: 9, background: '#e7edf7', border: '2px solid #222a55', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: Math.round(value) + '%', background: m.color(value), borderRadius: 4, transition: 'width .3s, background .3s' }} />
      </div>
      <span style={{ fontSize: 9.5, fontWeight: 800, color: '#9aa3cc', width: 30, textAlign: 'right' }}>{Math.round(value)}%</span>
    </div>
  );
}

export default function StatusBar(props) {
  const { stat, shopCat, money = 0, placement, arrowShift = 0, fullness, cleanliness, happiness, health = 100,
    onStat, onLeave, onOpenCat, onBuy, onBack, onPlay } = props;
  const vals = { fullness, clean: cleanliness, happy: happiness, health };
  const below = placement === 'below';

  // ---- shop view: a small card with a VERTICAL list of items ----------------
  if (shopCat && SHOP[shopCat]) {
    const cat = SHOP[shopCat];
    const tag = META[cat.stat].color(vals[cat.stat]);
    const arrow = {
      position: 'absolute', left: '50%', width: 14, height: 14, marginLeft: -7 - arrowShift,
      background: '#fff', transform: 'rotate(45deg)',
      ...(below
        ? { top: -8, borderLeft: '3px solid #222a55', borderTop: '3px solid #222a55' }
        : { bottom: -8, borderRight: '3px solid #222a55', borderBottom: '3px solid #222a55' }),
    };
    return (
      <div style={{ position: 'relative', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: '10px 12px 12px', boxShadow: '0 7px 0 rgba(34,42,85,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <span onClick={onBack} style={{ fontSize: 11, fontWeight: 900, color: '#6b74a8', cursor: 'pointer' }}>‹ 返回</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#e8a01a' }}>💰 {money}</span>
        </div>
        <div style={{ marginBottom: 8 }}><Bar which={cat.stat} value={vals[cat.stat]} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {cat.items.map((it) => {
            const afford = money >= it.cost;
            return (
              <div key={it.key} onClick={() => afford && onBuy(shopCat, it)} title={it.name}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 10, border: '2px solid ' + (afford ? '#222a55' : '#d6dae8'), background: afford ? '#fff' : '#f4f5fa', cursor: afford ? 'pointer' : 'not-allowed', opacity: afford ? 1 : 0.5 }}>
                <span style={{ fontSize: 20, lineHeight: 1, width: 24, textAlign: 'center' }}>{it.icon}</span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 800, color: '#222a55', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: tag }}>+{it.amt}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#e8a01a', width: 38, textAlign: 'right' }}>💰{it.cost}</span>
              </div>
            );
          })}
        </div>
        <div style={arrow} />
      </div>
    );
  }

  // ---- category view: minimal, background-less action buttons ----------------
  // Each button is its own frosted pill (legible over any wallpaper) — there is
  // no enclosing card, keeping the bar light and unobtrusive.
  const pill = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    width: 50, padding: '7px 0 6px', borderRadius: 14,
    background: 'rgba(255,255,255,.86)', border: '2px solid rgba(34,42,85,.14)',
    boxShadow: '0 3px 0 rgba(34,42,85,.12)', backdropFilter: 'blur(2px)',
  };
  const btn = (emoji, label, name, onClick) => (
    <div className="act" onClick={onClick} onMouseEnter={() => onStat(name)} onMouseLeave={onLeave} style={pill}>
      <span style={{ fontSize: 23, lineHeight: 1 }}>{emoji}</span>{label}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      {/* small frosted readout: money normally, or the stat being previewed */}
      <div style={{ minHeight: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,.86)', border: '2px solid rgba(34,42,85,.12)', boxShadow: '0 2px 0 rgba(34,42,85,.1)', width: stat ? 160 : 'auto' }}>
        {stat
          ? <Bar which={stat} value={vals[stat]} />
          : <span style={{ fontSize: 12, fontWeight: 900, color: '#e8a01a' }}>💰 {money}</span>}
      </div>
      {/* 喂食 / 洗澡 cost money (open shop); 玩耍 is a free mini-game with the owner */}
      <div style={{ display: 'flex', gap: 9 }}>
        {btn('🐟', '喂食', 'fullness', () => onOpenCat('food'))}
        {btn('🛁', '洗澡', 'clean', () => onOpenCat('bath'))}
        {btn('🎈', '玩耍', 'happy', onPlay)}
      </div>
    </div>
  );
}
