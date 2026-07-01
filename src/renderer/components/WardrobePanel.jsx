import React from 'react';
import { t, tn } from '../i18n.js';
import { WARDROBE, WARDROBE_MAP, drawAccessoryThumb } from '../wardrobe.js';

// A little pixel thumbnail of the penguin wearing one accessory — drawn on a
// canvas via drawAccessoryThumb() so the preview matches exactly what's worn
// (no emoji; hand-drawn pixel art per CLAUDE.md).
function Thumb({ item }) {
  const ref = React.useRef(null);
  const PX = 3;
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawAccessoryThumb(ctx, item, PX);
  }, [item]);
  return <canvas ref={ref} width={16 * PX} height={16 * PX} style={{ width: 16 * PX, height: 16 * PX, imageRendering: 'pixelated', display: 'block' }} />;
}

// Wardrobe / dress-up modal: buy accessories with coins, tap an owned one to
// wear or take it off. Sized to the small pet window; scrolls if it overflows.
export default function WardrobePanel({ lang = 'zh', money = 0, owned = [], isEquipped, onBuy, onEquip, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 72 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 200, maxHeight: 'calc(100% - 16px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 14, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 15, color: '#222a55', letterSpacing: '1px' }}>{t(lang, 'ward.title')}</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#e8a01a' }}>💰 {money}</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 11, lineHeight: 1.4 }}>{t(lang, 'ward.blurb')}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {WARDROBE.map((it) => {
            const own = owned.includes(it.key);
            const worn = own && isEquipped(it.key);
            const afford = money >= it.cost;
            const clickable = own || afford;
            return (
              <div key={it.key}
                onClick={() => clickable && (own ? onEquip(it.key) : onBuy(it.key))}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 9px', borderRadius: 12,
                  border: '2px solid ' + (worn ? '#36c98f' : (clickable ? '#222a55' : '#d6dae8')),
                  background: worn ? '#eafaf3' : (clickable ? '#fff' : '#f4f5fa'),
                  cursor: clickable ? 'pointer' : 'not-allowed', opacity: clickable ? 1 : 0.55 }}>
                <div style={{ background: '#eef2fb', borderRadius: 8, padding: 2, flex: '0 0 auto' }}><Thumb item={it.key} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#222a55', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tn(it.name, lang)}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: worn ? '#36c98f' : '#9aa3cc' }}>
                    {worn ? t(lang, 'ward.wearing') : (own ? t(lang, 'ward.owned') : ('💰' + it.cost))}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: worn ? '#36c98f' : (own ? '#5a6acf' : '#e8a01a'), textAlign: 'right' }}>
                  {worn ? '✓' : (own ? t(lang, 'ward.wear') : t(lang, 'ward.buy'))}
                </span>
              </div>
            );
          })}
        </div>

        <div onClick={onClose} style={{ textAlign: 'center', background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', marginTop: 12, boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>{t(lang, 'set.done')}</div>
      </div>
    </div>
  );
}
