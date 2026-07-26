const { spawn } = require("node:child_process");

// Launches Chris Titus Tech's Windows Utility (github.com/ChrisTitusTech/winutil)
// in its own visible console/GUI, detached from IceTools. It's spawned via a
// new `cmd /c start` console rather than run hidden in our own process tree,
// so the user can see exactly what's executing, watch for its own UAC prompt,
// and interact with its GUI once it loads - nothing here runs silently.
function runCttWinUtil() {
  const child = spawn(
    "cmd.exe",
    ["/c", "start", "CTT Windows Utility", "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "irm christitus.com/win | iex"],
    { detached: true, stdio: "ignore", windowsHide: false }
  );
  child.unref();
  return { success: true };
}

module.exports = { runCttWinUtil };
