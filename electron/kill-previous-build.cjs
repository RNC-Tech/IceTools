// electron-builder repacks release/win-unpacked/resources/app.asar on every
// build. On this machine something (Windows Defender, the OEM PC-manager
// real-time scanner, Search Indexer - any of several background processes
// that open newly-written files) transiently locks that file right after
// it's written, so electron-builder's own attempt to clear and rewrite it on
// the *next* build intermittently hits ERROR_SHARING_VIOLATION and fails the
// whole packaging step.
//
// Rather than disabling or fighting whichever scanner is responsible, we
// remove the stale output directory ourselves before electron-builder runs,
// using fs.rmSync's built-in maxRetries/retryDelay - which exists precisely
// for these transient Windows EBUSY/EPERM cases - so a build starts from a
// clean, unlocked directory instead of trying to overwrite one in place.
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

try {
  execSync("taskkill /IM IceTools.exe /F /T", { stdio: "ignore" });
  console.log("Closed a previously-running IceTools.exe before rebuilding.");
} catch {
  // No previous instance running - nothing to do.
}

const releaseDir = path.join(__dirname, "..", "release");
try {
  fs.rmSync(releaseDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  console.log("Cleared previous release/ output.");
} catch (err) {
  console.warn(`Could not fully clear release/ (${err.message}) - build will proceed anyway.`);
}
