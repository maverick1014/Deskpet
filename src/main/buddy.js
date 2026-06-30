// Code Buddy — file-watch bridge. Tails ~/.deskpet/claude-events.jsonl (appended
// to by the deskpet-hook helper that Claude Code runs) and forwards each new
// event line to the renderer as a 'buddy:event' message. Pure local I/O; no
// network, no ports. Uses fs.watchFile (polling) for cross-platform reliability.
const fs = require('fs');
const path = require('path');
const install = require('./buddyInstall');

const EVENTS = install.paths.events;
let offset = 0;
let watching = false;
let getWinRef = null;

function readNew() {
  let st;
  try { st = fs.statSync(EVENTS); } catch (e) { return; }
  if (st.size < offset) offset = 0;      // file truncated / rotated → restart
  if (st.size === offset) return;
  let buf = '';
  try {
    const fd = fs.openSync(EVENTS, 'r');
    const len = st.size - offset;
    const b = Buffer.alloc(len);
    fs.readSync(fd, b, 0, len, offset);
    fs.closeSync(fd);
    buf = b.toString('utf8');
  } catch (e) { return; }
  offset = st.size;

  const w = getWinRef && getWinRef();
  if (!w || w.isDestroyed()) return;
  for (const ln of buf.split('\n')) {
    if (!ln.trim()) continue;
    let evt;
    try { evt = JSON.parse(ln); } catch (e) { continue; }
    try { w.webContents.send('buddy:event', evt); } catch (e) { /* ignore */ }
  }
}

// Start watching. Safe to call even when not connected — events only ever appear
// once the hooks are installed, so the pet simply stays quiet until then. We seek
// to the current end of file so old events aren't replayed on launch.
function start(getWin) {
  getWinRef = getWin;
  try {
    fs.mkdirSync(path.dirname(EVENTS), { recursive: true });
    if (!fs.existsSync(EVENTS)) fs.writeFileSync(EVENTS, '');
    offset = fs.statSync(EVENTS).size;
  } catch (e) { return; }
  if (watching) return;
  watching = true;
  try { fs.watchFile(EVENTS, { interval: 600 }, readNew); } catch (e) { watching = false; }
}

function stop() {
  if (!watching) return;
  try { fs.unwatchFile(EVENTS); } catch (e) { /* ignore */ }
  watching = false;
}

module.exports = { start, stop };
