// Main-process IPC listeners.
const { ipcMain, app, screen } = require('electron');
const { WINDOW } = require('./constants');
const db = require('./database');

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
