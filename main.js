// Electron main process.
//
// QQ宠物-style desktop pet: a SMALL, frameless, transparent, always-on-top
// window that physically walks around the screen. It never covers your desktop —
// only the penguin's own pixels capture the mouse; everything else is
// click-through (hit-test bypass), so you keep working normally.
const { app, BrowserWindow, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { WINDOW } = require('./src/main/constants');
const db = require('./src/main/database');
const ipc = require('./src/main/ipcHandlers');

let win = null;
let tray = null;
let isQuitting = false;

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

// Recall the pet to the centre of the primary screen. This is the rescue hatch
// for when the penguin has wandered (or been dragged) off-screen — common on
// Windows multi-monitor / display-scaling setups where it can end up somewhere
// you can't reach it. The renderer owns the walk position, so we just make sure
// the window is visible and tell it to re-centre and re-clamp.
function recenterPet() {
  if (!win || win.isDestroyed()) return;
  if (!win.isVisible()) win.show();
  win.webContents.send('pet:recenter');
}

// System-tray ("collapse section") icon. Since the pet window is frameless and
// hidden from the taskbar (skipTaskbar), the tray is the one always-reachable
// control surface: show/hide the pet, recall it to centre, or quit.
function buildTray() {
  let image = nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png'));
  if (!image.isEmpty()) image = image.resize({ width: 16, height: 16 });
  tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image);
  tray.setToolTip('Deskpet');

  const menu = Menu.buildFromTemplate([
    { label: '召回宠物到中央  ·  Bring pet to centre', click: recenterPet },
    { type: 'separator' },
    { label: '显示  ·  Show', click: () => { if (win && !win.isDestroyed()) win.show(); } },
    { label: '隐藏  ·  Hide', click: () => { if (win && !win.isDestroyed()) win.hide(); } },
    { type: 'separator' },
    { label: '退出  ·  Quit', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);

  // Double-clicking the tray icon recalls the pet — the quickest way to get it
  // back if it has vanished off the edge of the screen.
  tray.on('double-click', recenterPet);
}

app.whenReady().then(() => {
  db.init();
  ipc.register(() => win);
  createWindow();
  buildTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (tray) { tray.destroy(); tray = null; }
});

// The pet has no visible window chrome to close, so this normally only fires on
// a real quit. The tray keeps the app alive in the background regardless.
app.on('window-all-closed', () => {
  if (!isQuitting) return;
  db.close();
  app.quit();
});
