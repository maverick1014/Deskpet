import React from 'react';
import { t } from '../i18n.js';

// Right-click context menu. Feed/Bath open the shop (cost money); Play is a free
// mini-game. Study/Work are the school→earn loop; 看病 (see a doctor) appears
// only while the pet is sick. Sit is a free rest; sleep is automatic when tired.
export default function ContextMenu({ x, y, sick, focusing, lang = 'zh', onClose, onFeed, onBath, onPlay, onSit, onStudy, onWork, onMedicine, onStopFocus, onCenter, onSettings, onQuit, onWardrobe, onAlbum, onPomodoro }) {
  const sep = <div style={{ height: 2, background: '#eef0f7', margin: '4px 6px', borderRadius: 2 }} />;
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50 }} />
      <div style={{ position: 'absolute', left: x, top: y, background: '#fff', border: '3px solid #222a55', borderRadius: 14, padding: 6, boxShadow: '0 8px 0 rgba(34,42,85,.22)', zIndex: 60, minWidth: 150, fontWeight: 800, fontSize: 13, color: '#222a55', animation: 'popIn .14s ease-out' }}>
        <div className="menu-item" onClick={onFeed}><span>🐟</span>{t(lang, 'menu.feed')}</div>
        <div className="menu-item" onClick={onBath}><span>🛁</span>{t(lang, 'menu.bath')}</div>
        <div className="menu-item" onClick={onPlay}><span>🎈</span>{t(lang, 'menu.play')}</div>
        <div className="menu-item" onClick={onSit}><span>🪑</span>{t(lang, 'menu.sit')}</div>
        {sep}
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
