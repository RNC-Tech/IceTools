// electron-builder repacks the output directory's app.asar on every build.
// On this machine, Cursor's own file-watching/indexing grabs an open handle
// on files inside the project workspace almost immediately after they're
// written, which made electron-builder's attempt to clear and rewrite
// app.asar intermittently hit ERROR_SHARING_VIOLATION (confirmed via
// Windows' Restart Manager API - see conversation history). The real fix is
// that `directories.output` in package.json now points *outside* the project
// folder entirely (../IceTools-release), so Cursor's workspace never
// contains these files to lock in the first place.
//
// This script is now mostly a safety net for stale output from before that
// change, or for the rare case something else (an antivirus scan, a leftover
// packaged instance) holds a handle - fs.rmSync's maxRetries/retryDelay
// exists precisely for these transient Windows EBUSY/EPERM cases.
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

try {
  execSync("taskkill /IM IceTools.exe /F /T", { stdio: "ignore" });
  console.log("Closed a previously-running IceTools.exe before rebuilding.");
} catch {
  // No previous instance running - nothing to do.
}

const outputDir = path.join(__dirname, "..", "..", "IceTools-release");
try {
  fs.rmSync(outputDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  console.log("Cleared previous build output.");
} catch (err) {
  console.warn(`Could not fully clear previous build output (${err.message}) - build will proceed anyway.`);
}
