// Best-effort rebuild of native modules (better-sqlite3) against Electron's ABI.
// Failure is non-fatal: the app falls back to a JSON file store at runtime.
async function main() {
  let rebuild, electronVersion;
  try {
    ({ rebuild } = require('@electron/rebuild'));
    electronVersion = require('electron/package.json').version;
  } catch (e) {
    console.log('[rebuild] @electron/rebuild or electron not available yet — skipping.');
    return;
  }
  try {
    require.resolve('better-sqlite3');
  } catch (e) {
    console.log('[rebuild] better-sqlite3 not installed (optional) — skipping. JSON store will be used.');
    return;
  }
  try {
    const path = require('path');
    await rebuild({
      buildPath: path.join(__dirname, '..'),
      electronVersion,
      onlyModules: ['better-sqlite3'],
    });
    console.log('[rebuild] better-sqlite3 rebuilt for Electron ' + electronVersion + '.');
  } catch (e) {
    console.warn('[rebuild] Could not rebuild better-sqlite3 (' + e.message + '). JSON store will be used.');
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
