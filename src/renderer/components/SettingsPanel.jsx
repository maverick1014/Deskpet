import React from 'react';

const label = { display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, letterSpacing: '.3px', color: '#6b74a8', marginBottom: 4 };

// Compact modal settings dialog sized to fit the small pet window:
// name, animation speed, window opacity, and an optional cloud-save account.
// (Sound was removed, so there is no volume control.) The dim backdrop only
// covers the pet window (not the whole screen), keeping things unobtrusive.
function syncLabel(syncedAt) {
  if (!syncedAt) return '尚未同步';
  const m = Math.floor((Date.now() - syncedAt) / 60000);
  if (m <= 0) return '刚刚已同步';
  if (m < 60) return `${m} 分钟前同步`;
  return '已同步';
}

export default function SettingsPanel({
  name, speed, opacity, onName, onSpeed, onOpacity, onClose,
  cloudOn, user, authEmail, authPw, authBusy, authMsg, syncedAt,
  onAuthEmail, onAuthPw, onSignIn, onSignUp, onSignOut, onSyncNow,
}) {
  const field = { width: '100%', boxSizing: 'border-box', border: '2px solid #222a55', borderRadius: 9, padding: '6px 9px', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 12, color: '#222a55', outline: 'none', marginBottom: 7 };
  const sbtn = (bg) => ({ flex: 1, textAlign: 'center', background: bg, color: '#fff', padding: '7px 0', borderRadius: 9, fontWeight: 900, fontSize: 12, cursor: authBusy ? 'default' : 'pointer', opacity: authBusy ? 0.6 : 1 });
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,24,60,.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 196, maxHeight: 'calc(100% - 16px)', overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '3px solid #222a55', borderRadius: 18, padding: 14, boxShadow: '0 8px 0 rgba(34,42,85,.22)', animation: 'popIn .2s ease-out' }}>
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
          style={{ width: '100%', accentColor: '#5a6acf', marginBottom: 12 }} />

        {/* ---- cloud save / account ------------------------------------ */}
        {cloudOn && (
          <div style={{ borderTop: '2px solid #eef0f7', paddingTop: 11, marginBottom: 12 }}>
            <div style={{ ...label, marginBottom: 7 }}><span>☁️ 云存档</span></div>
            {user ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#222a55', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{user.email}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 8 }}>{syncLabel(syncedAt)}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <div onClick={() => !authBusy && onSyncNow()} style={sbtn('#36c98f')}>{authBusy ? '…' : '立即同步'}</div>
                  <div onClick={() => !authBusy && onSignOut()} style={sbtn('#8a93c2')}>退出登录</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa3cc', marginBottom: 7, lineHeight: 1.4 }}>登录后存档会自动备份到云端，换设备也不丢失。</div>
                <input type="email" placeholder="邮箱" value={authEmail} onChange={onAuthEmail} autoComplete="username" style={field} />
                <input type="password" placeholder="密码（至少6位）" value={authPw} onChange={onAuthPw} autoComplete="current-password" style={field} />
                {authMsg && <div style={{ fontSize: 10, fontWeight: 800, color: '#ff5a5f', marginBottom: 7, lineHeight: 1.35 }}>{authMsg}</div>}
                <div style={{ display: 'flex', gap: 7 }}>
                  <div onClick={() => !authBusy && onSignIn()} style={sbtn('#222a55')}>{authBusy ? '…' : '登录'}</div>
                  <div onClick={() => !authBusy && onSignUp()} style={sbtn('#ff9d3d')}>注册</div>
                </div>
              </>
            )}
          </div>
        )}

        <div onClick={onClose} style={{ textAlign: 'center', background: '#222a55', color: '#fff', padding: 9, borderRadius: 11, fontWeight: 900, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 0 rgba(34,42,85,.3)' }}>完成</div>
      </div>
    </div>
  );
}
