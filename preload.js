// Secure IPC bridge between the sandboxed renderer and the main process.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pengu', {
  // Persistence (SQLite in main, JSON fallback).
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (data) => ipcRenderer.invoke('state:save', data),

  // Screen / window geometry for the walking engine.
  getStage: () => ipcRenderer.invoke('stage:get'),
  moveWindow: (x, y) => ipcRenderer.send('win:move', { x, y }),
  onStageUpdate: (cb) => {
    const handler = (_e, stage) => cb(stage);
    ipcRenderer.on('stage:update', handler);
    return () => ipcRenderer.removeListener('stage:update', handler);
  },

  // Window behavior.
  setInteractive: (flag) => ipcRenderer.send('win:interactive', !!flag),
  quit: () => ipcRenderer.send('win:quit'),

  // Recall the pet to screen centre (fired from the tray / right-click menu).
  onRecenter: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('pet:recenter', handler);
    return () => ipcRenderer.removeListener('pet:recenter', handler);
  },

  // ---- Auto-update (Option A): version check + open the download page ----
  appVersion: () => ipcRenderer.invoke('app:version'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  openUrl: (url) => ipcRenderer.send('open:url', url),
  stageWindow: (on) => ipcRenderer.send('win:stage', !!on),
  // ---- Auto-update (Option B, Windows): silent download → restart to apply ----
  onUpdateReady: (cb) => {
    const handler = (_e, p) => cb(p);
    ipcRenderer.on('update:ready', handler);
    return () => ipcRenderer.removeListener('update:ready', handler);
  },
  restartToUpdate: () => ipcRenderer.send('update:restart'),

  // ---- Code Buddy: connect to Claude Code + receive its activity events ----
  buddyStatus: () => ipcRenderer.invoke('buddy:status'),
  buddyConnect: () => ipcRenderer.invoke('buddy:connect'),
  buddyDisconnect: () => ipcRenderer.invoke('buddy:disconnect'),
  onBuddyEvent: (cb) => {
    const handler = (_e, evt) => cb(evt);
    ipcRenderer.on('buddy:event', handler);
    return () => ipcRenderer.removeListener('buddy:event', handler);
  },
});
