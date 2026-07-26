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

module.exports = { isAdmin };
