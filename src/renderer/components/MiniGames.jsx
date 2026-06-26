import React from 'react';

// 玩耍 — compact game PICKER only. (The old six-game emoji modal board was
// deleted: it violated the hard rules in CLAUDE.md / TODO.md §2.) Each game now
// plays IN-WINDOW on the real penguin, driven by GameEngine in games.js — this
// component just lets you choose which one. No emoji, no separate game board.
//
// Props: games [{ key, name }], onPick(key), onClose().

export default function GamePicker({ games, onPick, onClose }) {
  return (
    <div onPointerDown={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 74 }}>
      <div onPointerDown={(e) => e.stopPropagation()} style={{ width: 176, background: '#fff', border: '3px solid #222a55', borderRadius: 16, padding: 12, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .18s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 900, fontSize: 14, color: '#222a55' }}>玩耍</span>
          <div onClick={onClose} style={{ width: 22, height: 22, border: '2px solid #222a55', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, color: '#222a55', fontSize: 13, lineHeight: 1 }}>×</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(games || []).map((g) => (
            <div key={g.key} onClick={() => onPick(g.key)} style={{ padding: '10px 0', borderRadius: 11, border: '2px solid #222a55', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12, color: '#222a55', textAlign: 'center' }}>
              {g.name}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, fontWeight: 700, color: '#9aa3cc', textAlign: 'center' }}>选一个，企鹅就在窗口里陪你玩~</div>
      </div>
    </div>
  );
}
