import React from 'react';
import { t } from '../i18n.js';

const label = { display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, letterSpacing: '.3px', color: '#6b74a8', marginBottom: 4 };

// Compact modal settings dialog sized to fit the small pet window:
// name, animation speed, window opacity, and an optional cloud-save account.
// (Sound was removed, so there is no volume control.) The dim backdrop only
// covers the pet window (not the whole screen), keeping things unobtrusive.
function syncLabel(syncedAt, lang) {
  if (!syncedAt) return t(lang, 'sync.never');
  const m = Math.floor((Date.now() - syncedAt) / 60000);
  if (m <= 0) return t(lang, 'sync.justNow');
  if (m < 60) return t(lang, 'sync.minsAgo', m);
  return t(lang, 'sync.done');
}

export default function SettingsPanel({
  name, speed, opacity, onName, onSpeed, onOpacity, onClose,
  cloudOn, user, authEmail, authPw, authBusy, authMsg, syncedAt,
  onAuthEmail, onAuthPw, onSignIn, onSignUp, onSignOut, onSyncNow,
  lang = 'zh', buddyOn, onToggleBuddy, level,
}) {
  const field = { width: '100%', boxSizing: 'border-box', border: '2px solid #222a55', borderRadius: 9, padding: '6px 9px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 12, color: '#222a55', outline: 'none', marginBottom: 7 };
  const sbtn = (bg) => ({ flex: 1, textAlign: 'center', background: bg, color: '#fff', padding: '7px 0', borderRadius: 9, fontWeight: 900, fontSize: 12, cursor: authBusy ? 'default' : 'pointer', opacity: authBusy ? 0.6 : 1 });
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 196, maxHeight: 'calc(100% - 16px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 14, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 900, fontSize: 15, color: '#222a55', letterSpacing: '1px' }}>{t(lang, 'set.title')}</span>
          <div onClick={onClose} style={{ width: 24, height: 24, border: '2px solid #222a55', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 900, color: '#222a55', fontSize: 12 }}>✕</div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.3px', color: '#6b74a8', marginBottom: 4 }}>{t(lang, 'set.name')}</div>
        <input value={name} onChange={onName} maxLength={12}
          style={{ width: '100%', border: '2px solid #222a55', borderRadius: 9, padding: '7px 10px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 13, color: '#222a55', outline: 'none', marginBottom: 12 }} />

        <div style={label}><span>{t(lang, 'set.speed')}</span><span>{speed}x</span></div>
        <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={onSpeed}
          style={{ width: '100%', accentColor: '#ff9d3d', marginBottom: 12 }} />

        <div style={label}><span>{t(lang, 'set.opacity')}</span><span>{opacity}%</span></div>
        <input type="range" min="50" max="100" step="1" value={opacity} onChange={onOpacity}
          style={{ width: '100%', accentColor: '#5a6acf', marginBottom: 12 }} />

        {/* growth level + experience bar (unlimited) */}
        {level && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...label, marginBottom: 5 }}><span>{t(lang, 'set.level')}</span><span style={{ color: '#222a55' }}>Lv{level.level} · {level.name}</span></div>
            <div style={{ height: 9, background: '#e7edf7', border: '2px solid #222a55', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: level.pct + '%', background: 'linear-gradient(90deg,#ffd23d,#ff9d3d)', borderRadius: 4, transition: 'width .3s' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 9, fontWeight: 900, color: '#9aa3cc', marginTop: 3 }}>{level.pct}%</div>
          </div>
        )}

        {/* ---- cloud save / account ------------------------------------ */}
        {cloudOn && (
          <div style={{ borderTop: '2px solid #eef0f7', paddingTop: 11, marginBottom: 12 }}>
            <div style={{ ...label, marginBottom: 7 }}><span>☁️ {t(lang, 'set.cloud')}</span></div>
            {user ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#222a55', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{user.email}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 8 }}>{syncLabel(syncedAt, lang)}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <div onClick={() => !authBusy && onSyncNow()} style={sbtn('#36c98f')}>{authBusy ? '…' : t(lang, 'set.syncNow')}</div>
                  <div onClick={() => !authBusy && onSignOut()} style={sbtn('#8a93c2')}>{t(lang, 'set.signOut')}</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 7, lineHeight: 1.4 }}>{t(lang, 'set.cloudBlurb')}</div>
                <input type="email" placeholder={t(lang, 'set.email')} value={authEmail} onChange={onAuthEmail} autoComplete="username" style={field} />
                <input type="password" placeholder={t(lang, 'set.pw')} value={authPw} onChange={onAuthPw} autoComplete="current-password" style={field} />
                {authMsg && <div style={{ fontSize: 10, fontWeight: 800, color: '#ff5a5f', marginBottom: 7, lineHeight: 1.35 }}>{authMsg}</div>}
                <div style={{ display: 'flex', gap: 7 }}>
                  <div onClick={() => !authBusy && onSignIn()} style={sbtn('#222a55')}>{authBusy ? '…' : t(lang, 'set.signIn')}</div>
                  <div onClick={() => !authBusy && onSignUp()} style={sbtn('#ff9d3d')}>{t(lang, 'set.signUp')}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- Code Buddy: connect to Claude Code ---------------------- */}
        {onToggleBuddy && (
          <div style={{ borderTop: '2px solid #eef0f7', paddingTop: 11, marginBottom: 12 }}>
            <div style={{ ...label, marginBottom: 6 }}><span>🐧 {t(lang, 'buddy.title')}</span><span style={{ color: buddyOn ? '#36c98f' : '#9aa3cc' }}>{buddyOn ? '●' : '○'}</span></div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 8, lineHeight: 1.4 }}>{t(lang, 'buddy.blurb')}</div>
            <div onClick={onToggleBuddy} style={{ textAlign: 'center', background: buddyOn ? '#36c98f' : '#5a6acf', color: '#fff', padding: '8px 0', borderRadius: 9, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>
              {buddyOn ? t(lang, 'buddy.connected') : t(lang, 'buddy.connect')}
            </div>
          </div>
        )}

        <div onClick={onClose} style={{ textAlign: 'center', background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>{t(lang, 'set.done')}</div>
      </div>
    </div>
  );
}
