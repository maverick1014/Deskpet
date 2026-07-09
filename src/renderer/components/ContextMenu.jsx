import React from 'react';
import { t } from '../i18n.js';

// Right-click context menu. Feed/Bath/Play/Sit were moved OUT of here — they're
// reachable directly (hover care panel + interacting with the pet), so the menu
// stays short and won't get cropped by the small window. Study/Work are the
// school→earn loop (also on the hover panel now); 看病 (see a doctor) appears
// only while the pet is sick. `maxH` caps the height so it always fits + scrolls.
export default function ContextMenu({ x, y, sick, focusing, lang = 'zh', maxH, onClose, onStudy, onWork, onMedicine, onStopFocus, onCenter, onSettings, onQuit, onWardrobe, onAlbum, onPomodoro }) {
  const sep = <div style={{ height: 2, background: '#eef0f7', margin: '4px 6px', borderRadius: 2 }} />;
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50 }} />
      <div style={{ position: 'absolute', left: x, top: y, background: '#fff', border: '3px solid #222a55', borderRadius: 14, padding: 6, boxShadow: '0 8px 0 rgba(34,42,85,.22)', zIndex: 60, minWidth: 150, maxHeight: maxH || 'calc(100vh - 12px)', overflowY: 'auto', fontWeight: 800, fontSize: 13, color: '#222a55', animation: 'popIn .14s ease-out' }}>
        {focusing
          ? <div className="menu-item danger" onClick={onStopFocus}><span>⏹</span>{t(lang, 'menu.stopFocus')}</div>
          : (<>
              <div className="menu-item" onClick={onStudy}><span>📖</span>{t(lang, 'menu.study')}</div>
              <div className="menu-item" onClick={onWork}><span>💼</span>{t(lang, 'menu.work')}</div>
              <div className="menu-item" onClick={onPomodoro}><span>⏱</span>{t(lang, 'menu.pomodoro')}</div>
            </>)}
        {sick && <div className="menu-item" onClick={onMedicine}><span>💊</span>{t(lang, 'menu.doctor')}</div>}
        {sep}
        <div className="menu-item" onClick={onWardrobe}><span>🎩</span>{t(lang, 'menu.wardrobe')}</div>
        <div className="menu-item" onClick={onAlbum}><span>🏆</span>{t(lang, 'menu.album')}</div>
        {sep}
        <div className="menu-item" onClick={onCenter}><span>🎯</span>{t(lang, 'menu.center')}</div>
        <div className="menu-item" onClick={onSettings}><span>⚙️</span>{t(lang, 'menu.settings')}</div>
        <div className="menu-item danger" onClick={onQuit}><span>⏻</span>{t(lang, 'menu.quit')}</div>
      </div>
    </>
  );
}
