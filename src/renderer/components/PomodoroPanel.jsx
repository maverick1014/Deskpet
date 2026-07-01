import React from 'react';
import { t } from '../i18n.js';

// Pomodoro focus companion picker: choose a length; the pet then sits and
// focuses with you (App.startPomodoro → beginFocus). Kept tiny for the window.
const LENGTHS = [15, 25, 45];

export default function PomodoroPanel({ lang = 'zh', onPick, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 72 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 190, boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 15, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: '#222a55', letterSpacing: '1px', marginBottom: 3 }}>{t(lang, 'pomo.title')}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 12, lineHeight: 1.4 }}>{t(lang, 'pomo.blurb')}</div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
          {LENGTHS.map((m) => (
            <div key={m} onClick={() => onPick(m)}
              style={{ flex: 1, textAlign: 'center', background: '#5a6acf', color: '#fff', padding: '10px 0', borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.28)' }}>
              {t(lang, 'pomo.mins', m)}
            </div>
          ))}
        </div>
        <div onClick={onClose} style={{ textAlign: 'center', background: '#fff', color: '#8a93c2', border: '2px solid #e4e8f2', padding: 8, borderRadius: 11, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>{t(lang, 'game.end')}</div>
      </div>
    </div>
  );
}
