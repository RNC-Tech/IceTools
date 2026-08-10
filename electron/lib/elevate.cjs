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

function relaunchAsAdmin() {
  const exePath = process.execPath;
  let psCommand = "";

  if (app.isPackaged) {
    psCommand = `Start-Process -FilePath '${exePath.replace(/'/g, "''")}' -Verb RunAs`;
  } else {
    const args = process.argv.slice(1).map((a) => `'${a.replace(/'/g, "''")}'`).join(" ");
    psCommand = `Start-Process -FilePath '${exePath.replace(/'/g, "''")}' -ArgumentList ${args} -Verb RunAs`;
  }

  const child = spawn(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", psCommand],
    { detached: true, stdio: "ignore", windowsHide: true }
  );

  child.unref();

  setTimeout(() => {
    app.exit(0);
  }, 300);

  return { success: true };
}

module.exports = { isAdmin, relaunchAsAdmin };
