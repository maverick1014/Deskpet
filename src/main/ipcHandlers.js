// Main-process IPC listeners.
const { ipcMain, app, screen, shell } = require('electron');
const { WINDOW } = require('./constants');
const db = require('./database');
const buddyInstall = require('./buddyInstall');
const REPO = 'maverick1014/Deskpet';

function stageInfo() {
  return {
    winW: WINDOW.width,
    winH: WINDOW.height,
    work: screen.getPrimaryDisplay().workArea,
  };
}

function register(getWin) {
  ipcMain.handle('state:load', () => db.load());
  ipcMain.handle('state:save', (_e, data) => db.save(data));
  ipcMain.handle('stage:get', () => stageInfo());

  // Walk the window across the screen (renderer drives the animation).
  ipcMain.on('win:move', (_e, { x, y }) => {
    const w = getWin();
    if (!w || w.isDestroyed()) return;
    try { w.setPosition(Math.round(x), Math.round(y), false); } catch (e) { /* ignore */ }
  });

  // Toggle window click-through. flag=true => interactive (capture mouse),
  // flag=false => click-through so the desktop behind stays usable
  // (this is the HTTRANSPARENT-style hit-test bypass).
  ipcMain.on('win:interactive', (_e, flag) => {
    const w = getWin();
    if (!w || w.isDestroyed()) return;
    try { w.setIgnoreMouseEvents(!flag, { forward: true }); } catch (e) { /* ignore */ }
  });

  ipcMain.on('win:quit', () => {
    db.close();
    app.quit();
  });

  // ---- update check: current version + latest GitHub release (Option A) ----
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('update:check', async () => {
    try {
      const res = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Deskpet' },
      });
      if (!res || !res.ok) return null;
      const j = await res.json();
      return { tag: j.tag_name, name: j.name, url: j.html_url };
    } catch (e) { return null; }
  });
  ipcMain.on('open:url', (_e, url) => { try { if (/^https:\/\//.test(String(url))) shell.openExternal(String(url)); } catch (e) { /* ignore */ } });

  // ---- "stage mode": grow the window to the whole work area for full-screen
  // mini-games/animations, then restore the small pet window afterwards.
  let stageSaved = null;
  ipcMain.on('win:stage', (_e, on) => {
    const w = getWin();
    if (!w || w.isDestroyed()) return;
    try {
      if (on) {
        if (!stageSaved) stageSaved = w.getBounds();
        const wa = screen.getPrimaryDisplay().workArea;
        w.setBounds({ x: wa.x, y: wa.y, width: wa.width, height: wa.height }, false);
      } else if (stageSaved) {
        w.setBounds(stageSaved, false);
        stageSaved = null;
      }
    } catch (e) { /* ignore */ }
  });

  // ---- Code Buddy: connect/disconnect to Claude Code (manages ~/.claude hooks).
  ipcMain.handle('buddy:status', () => {
    try { return { connected: buddyInstall.isInstalled() }; } catch (e) { return { connected: false, error: String(e) }; }
  });
  ipcMain.handle('buddy:connect', () => {
    try { buddyInstall.install(); return { connected: true }; } catch (e) { return { connected: false, error: String(e) }; }
  });
  ipcMain.handle('buddy:disconnect', () => {
    try { buddyInstall.remove(); return { connected: false }; } catch (e) { return { connected: true, error: String(e) }; }
  });

  // Re-send screen bounds when the display changes (resolution, dock, monitor)
  // so the renderer can re-clamp the walk area and avoid the taskbar.
  screen.on('display-metrics-changed', () => {
    const w = getWin();
    if (w && !w.isDestroyed()) w.webContents.send('stage:update', stageInfo());
  });
  screen.on('display-added', () => {
    const w = getWin();
    if (w && !w.isDestroyed()) w.webContents.send('stage:update', stageInfo());
  });
  screen.on('display-removed', () => {
    const w = getWin();
    if (w && !w.isDestroyed()) w.webContents.send('stage:update', stageInfo());
  });
}

module.exports = { register };
