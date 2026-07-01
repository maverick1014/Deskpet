import React from 'react';
import { t, tn } from '../i18n.js';
import { ACHIEVEMENTS } from '../wardrobe.js';

// Achievements / collection album: a small list of milestones. Unlocked ones
// show in colour with a check; locked ones are greyed with a hint. No emoji as
// content art — a simple pixel star badge is drawn with CSS boxes.
function Badge({ on }) {
  // A tiny chunky pixel star (5x5 blocks) — filled gold when unlocked, grey when
  // locked. Drawn as a mini grid of divs so it stays hand-made pixel art.
  const S = [
    '..X..',
    '.XXX.',
    'XXXXX',
    '.XXX.',
    '.X.X.',
  ];
  const fill = on ? '#ffcf3d' : '#cfd6e6';
  const edge = on ? '#e8a01a' : '#b7bfd2';
  const px = 4;
  return (
    <div style={{ position: 'relative', width: 5 * px, height: 5 * px, flex: '0 0 auto' }}>
      {S.map((row, y) => row.split('').map((c, x) => c === 'X' ? (
        <div key={y + '-' + x} style={{ position: 'absolute', left: x * px, top: y * px, width: px, height: px, background: fill, boxShadow: 'inset 0 0 0 0.5px ' + edge }} />
      ) : null))}
    </div>
  );
}

export default function AlbumPanel({ lang = 'zh', petName = 'Pengu', unlocked = [], onClose }) {
  const have = new Set(unlocked);
  const n = ACHIEVEMENTS.filter((a) => have.has(a.key)).length;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 72 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 202, maxHeight: 'calc(100% - 16px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 14, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: '#222a55', letterSpacing: '1px', marginBottom: 3 }}>{t(lang, 'ach.title')}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 3, lineHeight: 1.4 }}>{t(lang, 'ach.blurb', petName)}</div>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#5a6acf', marginBottom: 11 }}>{t(lang, 'ach.progress', n, ACHIEVEMENTS.length)}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ACHIEVEMENTS.map((a) => {
            const on = have.has(a.key);
            return (
              <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 9px', borderRadius: 12, border: '2px solid ' + (on ? '#ffcf3d' : '#e4e8f2'), background: on ? '#fffaec' : '#f7f8fc', opacity: on ? 1 : 0.7 }}>
                <Badge on={on} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: on ? '#222a55' : '#9aa3cc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tn(a.name, lang)}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#9aa3cc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{on ? tn(a.desc, lang) : t(lang, 'ach.locked')}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div onClick={onClose} style={{ textAlign: 'center', background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', marginTop: 12, boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>{t(lang, 'set.done')}</div>
      </div>
    </div>
  );
}
