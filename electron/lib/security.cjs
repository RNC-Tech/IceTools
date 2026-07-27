const { shell } = require("electron");
const { runPowerShellJson } = require("./exec.cjs");

// Get-MpComputerStatus throws if Windows Defender's PowerShell module isn't
// present (rare) or if a third-party AV has fully taken over and disabled
// the module - either way, "not available" is the right answer, not an error.
async function getDefenderStatus() {
  try {
    const raw = await runPowerShellJson(
      "Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, AntispywareEnabled, AntivirusSignatureAge, IoavProtectionEnabled | ConvertTo-Json"
    );
    const status = Array.isArray(raw) ? raw[0] : raw;
    if (!status) return { available: false };
    return {
      available: true,
      antivirusEnabled: Boolean(status.AntivirusEnabled),
      realTimeProtectionEnabled: Boolean(status.RealTimeProtectionEnabled),
      antispywareEnabled: Boolean(status.AntispywareEnabled),
      signatureAgeDays: typeof status.AntivirusSignatureAge === "number" ? status.AntivirusSignatureAge : null,
    };
  } catch {
    return { available: false };
  }
}

async function getFirewallStatus() {
  try {
    const raw = await runPowerShellJson("Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json");
    const profiles = Array.isArray(raw) ? raw : [raw];
    return { available: true, profiles: profiles.map((p) => ({ name: p.Name, enabled: Boolean(p.Enabled) })) };
  } catch {
    return { available: false, profiles: [] };
  }
}

// Fixed, hardcoded protocol URI - no user input involved - opens the actual
// Windows Security app rather than us trying to reimplement any of it.
async function openWindowsSecurity() {
  await shell.openExternal("windowsdefender:");
  return { success: true };
}

module.exports = { getDefenderStatus, getFirewallStatus, openWindowsSecurity };
