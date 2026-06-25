// electron-builder `afterPack` hook — guarantee a VALID ad-hoc signature on macOS.
//
// Without a paid Apple "Developer ID" certificate we can't notarize, so macOS will
// always show *some* Gatekeeper prompt on download. But there's a big difference
// between the two failure modes:
//   - unsigned / broken signature -> "Deskpet is damaged and can't be opened" (no recourse)
//   - valid ad-hoc signature      -> "unidentified developer" (right-click -> Open works)
// This hook ad-hoc signs the packaged .app so downloaders get the friendlier path.
//
// It runs after pack (before signing/dmg), and re-signs regardless of whether a
// real cert was found, so CI (no cert) and local builds behave the same.
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename; // "Deskpet"
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  console.log(`[adhoc-sign] ad-hoc signing ${appPath}`);
  // --deep ad-hoc signs nested frameworks/helpers then the app bundle itself.
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
  console.log('[adhoc-sign] ad-hoc signature is valid');
};
