// Electron main process.
//
// QQ宠物-style desktop pet: a SMALL, frameless, transparent, always-on-top
// window that physically walks around the screen. It never covers your desktop —
// only the penguin's own pixels capture the mouse; everything else is
// click-through (hit-test bypass), so you keep working normally.
const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { WINDOW } = require('./src/main/constants');
const db = require('./src/main/database');
const ipc = require('./src/main/ipcHandlers');

let win = null;

// Initial window placement: centre of the usable work area, so a fresh pet (and
// the onboarding screen) appears in the middle of the display. The renderer takes
// over positioning immediately — a returning pet jumps to its saved spot, and the
// penguin is always re-clamped inside the work area.
function spawnPosition() {
  const wa = screen.getPrimaryDisplay().workArea;
  return {
    x: Math.round(wa.x + wa.width / 2 - WINDOW.width / 2),
    y: Math.round(wa.y + wa.height / 2 - WINDOW.height / 2),
  };
}

function createWindow() {
  const pos = spawnPosition();

  win = new BrowserWindow({
    x: pos.x,
    y: pos.y,
    width: WINDOW.width,
    height: WINDOW.height,
    transparent: true,
    frame: false,
    // Allow the window to be positioned partly off-screen so the penguin can
    // walk/drag to every edge (macOS otherwise clamps it back on-screen).
    enableLargerThanScreen: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Float above virtually everything, on every workspace/Space.
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Start fully click-through. The renderer flips this on only while the cursor
  // is over the penguin (or a panel is open) — see ipcHandlers `win:interactive`.
  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  if (process.env.PENGU_SMOKE) {
    win.webContents.once('did-finish-load', () => {
      console.log('[pengu] smoke: renderer loaded OK (storage mode = ' + db.mode() + ')');
      setTimeout(() => app.quit(), 1500);
    });
    win.webContents.on('console-message', (_e, _lvl, message) => {
      console.log('[renderer] ' + message);
    });
  }

  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  db.init();
  ipc.register(() => win);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  db.close();
  app.quit();
});
