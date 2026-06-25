import React from 'react';

// Right-click context menu. Feed/Bath open the shop (cost money); Play is a free
// mini-game. Study/Work are the school→earn loop; 看病 (see a doctor) appears
// only while the pet is sick. Sit is a free rest; sleep is automatic when tired.
export default function ContextMenu({ x, y, sick, onClose, onFeed, onBath, onPlay, onSit, onStudy, onWork, onMedicine, onSettings, onQuit }) {
  const sep = <div style={{ height: 2, background: '#eef0f7', margin: '4px 6px', borderRadius: 2 }} />;
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50 }} />
      <div style={{ position: 'absolute', left: x, top: y, background: '#fff', border: '3px solid #222a55', borderRadius: 14, padding: 6, boxShadow: '0 8px 0 rgba(34,42,85,.22)', zIndex: 60, minWidth: 150, fontWeight: 800, fontSize: 13, color: '#222a55', animation: 'popIn .14s ease-out' }}>
        <div className="menu-item" onClick={onFeed}><span>🐟</span>喂食</div>
        <div className="menu-item" onClick={onBath}><span>🛁</span>洗澡</div>
        <div className="menu-item" onClick={onPlay}><span>🎈</span>玩耍</div>
        <div className="menu-item" onClick={onSit}><span>🪑</span>坐下</div>
        {sep}
        <div className="menu-item" onClick={onStudy}><span>📖</span>上学</div>
        <div className="menu-item" onClick={onWork}><span>💼</span>上班</div>
        {sick && <div className="menu-item" onClick={onMedicine}><span>💊</span>看病</div>}
        {sep}
        <div className="menu-item" onClick={onSettings}><span>⚙️</span>设置</div>
        <div className="menu-item danger" onClick={onQuit}><span>⏻</span>退出</div>
      </div>
    </>
  );
}
