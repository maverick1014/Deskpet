// Thin persistence/window bridge. Uses the preload IPC API when running inside
// Electron, and falls back to localStorage / window geometry so the renderer
// also works in a plain browser (handy for development).
const api = (typeof window !== 'undefined' && window.pengu) ? window.pengu : null;
const hasIPC = !!(api && typeof api.loadState === 'function');

export async function loadState() {
  if (hasIPC) return api.loadState();
  try {
    const raw = localStorage.getItem('pengu_save');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveState(data) {
  if (hasIPC) return api.saveState(data);
  try {
    localStorage.setItem('pengu_save', JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

export async function getStage() {
  if (api && api.getStage) return api.getStage();
  // Browser fallback: pretend the whole viewport is the work area.
  return {
    winW: 220, winH: 300,
    work: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
  };
}

export function moveWindow(x, y) {
  if (api && api.moveWindow) api.moveWindow(x, y);
}

export function onStageUpdate(cb) {
  if (api && api.onStageUpdate) return api.onStageUpdate(cb);
  return () => {};
}

export function setInteractive(flag) {
  if (api && api.setInteractive) api.setInteractive(flag);
}

export function quitApp() {
  if (api && api.quit) api.quit();
}
