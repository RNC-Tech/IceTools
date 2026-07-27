const { app } = require("electron");
const { spawn } = require("node:child_process");
const { runPowerShell } = require("./exec.cjs");

async function isAdmin() {
  if (process.platform !== "win32") return false;
  try {
    const out = await runPowerShell(
      "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"
    );
    return out.trim().toLowerCase() === "true";
  } catch {
    return false;
  }
}

// Spawns a new elevated instance via PowerShell's Start-Process -Verb RunAs
// (triggers the real UAC prompt) and quits this unelevated instance
// regardless of whether the user approves or cancels it - only meaningful
// for a packaged install, since there's no single relaunchable exe in dev
// mode (run the terminal itself as Administrator there instead).
function relaunchAsAdmin() {
  if (!app.isPackaged) {
    throw new Error("Only available in the installed app - run your terminal as Administrator for dev mode instead.");
  }
  const child = spawn(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", "Start-Process -FilePath $env:ICE_EXE_PATH -Verb RunAs"],
    { detached: true, stdio: "ignore", windowsHide: true, env: { ...process.env, ICE_EXE_PATH: process.execPath } }
  );
  child.unref();
  app.quit();
  return { success: true };
}

module.exports = { isAdmin, relaunchAsAdmin };
