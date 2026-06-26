import React from 'react';

const label = { display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, letterSpacing: '.3px', color: '#6b74a8', marginBottom: 4 };

// Compact modal settings dialog sized to fit the small pet window:
// name, animation speed, window opacity. (Sound was removed, so there is no
// volume control.) The dim backdrop only covers the pet window (not the whole
// screen), keeping things unobtrusive.
export default function SettingsPanel({ name, speed, opacity, onName, onSpeed, onOpacity, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 196, background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 14, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 900, fontSize: 15, color: '#222a55', letterSpacing: '1px' }}>设置</span>
          <div onClick={onClose} style={{ width: 24, height: 24, border: '2px solid #222a55', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, color: '#222a55', fontSize: 12 }}>✕</div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.3px', color: '#6b74a8', marginBottom: 4 }}>名字</div>
        <input value={name} onChange={onName} maxLength={12}
          style={{ width: '100%', border: '2px solid #222a55', borderRadius: 9, padding: '7px 10px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 13, color: '#222a55', outline: 'none', marginBottom: 12 }} />

        <div style={label}><span>动画速度</span><span>{speed}x</span></div>
        <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={onSpeed}
          style={{ width: '100%', accentColor: '#ff9d3d', marginBottom: 12 }} />

        <div style={label}><span>透明度</span><span>{opacity}%</span></div>
        <input type="range" min="50" max="100" step="1" value={opacity} onChange={onOpacity}
          style={{ width: '100%', accentColor: '#5a6acf', marginBottom: 14 }} />

        <div onClick={onClose} style={{ textAlign: 'center', background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>完成</div>
      </div>
    </div>
  );
}
