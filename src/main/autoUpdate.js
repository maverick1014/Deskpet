// Windows silent auto-update (Option B) via electron-updater.
//
// electron-builder already publishes to GitHub Releases and bakes an
// app-update.yml into the packaged app, so the updater just works on Windows
// (NSIS). It downloads new versions in the background and installs them silently
// when the user quits; we also surface a "restart to update now" prompt.
//
// macOS is intentionally EXCLUDED: Squirrel.Mac refuses unsigned updates, and
// the app currently uses ad-hoc signing. Mac keeps the Option A "download"
// notifier until a real Apple Developer ID cert is available.
const { app } = require('electron');

let updater = null;

function start(getWin) {
  if (!app.isPackaged || process.platform !== 'win32') return; // Windows packaged builds only
  try { updater = require('electron-updater').autoUpdater; } catch (e) { return; }
  updater.autoDownload = true;            // fetch the new version in the background
  updater.autoInstallOnAppQuit = true;    // silently install it when the app quits
  updater.on('update-downloaded', (info) => {
    const w = getWin && getWin();
    if (w && !w.isDestroyed()) w.webContents.send('update:ready', { version: info && info.version });
  });
  updater.on('error', () => { /* offline / rate-limited: ignore */ });
  const check = () => { try { updater.checkForUpdates().catch(() => {}); } catch (e) { /* ignore */ } };
  check();
  setInterval(check, 6 * 60 * 60 * 1000); // re-check every 6 hours
}

// Restart now and apply the downloaded update (called from the renderer button).
function quitAndInstall() {
  try { if (updater) updater.quitAndInstall(false, true); } catch (e) { /* ignore */ }
}

module.exports = { start, quitAndInstall };
