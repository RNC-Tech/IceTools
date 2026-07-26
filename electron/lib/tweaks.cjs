const { runPowerShell } = require("./exec.cjs");

// Small curated set of reversible registry tweaks. Each is defined by a fixed
// (non-user-controlled) registry path/value, so no injection surface - but we
// still route the fixed strings through env vars for consistency with the
// rest of the codebase.
const TWEAKS = [
  {
    id: "gameMode",
    label: "Enable Game Mode",
    description: "Turns on Windows Game Mode (prioritizes foreground games for CPU/GPU scheduling).",
    regPath: "HKCU:\\Software\\Microsoft\\GameBar",
    valueName: "AllowAutoGameMode",
    onValue: 1,
    offValue: 0,
    requiresAdmin: false,
  },
  {
    id: "startupDelay",
    label: "Disable Startup App Delay",
    description: "Removes the ~10s Explorer delay before startup apps launch after logon.",
    regPath: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize",
    valueName: "StartupDelayInMSec",
    onValue: 0,
    offValue: null, // null offValue = delete the value to restore default OS behavior
    requiresAdmin: false,
  },
  {
    id: "bestPerformanceVisuals",
    label: "Visual Effects: Best Performance",
    description: "Disables animations/shadows/transparency for a snappier UI (like 'Adjust for best performance').",
    regPath: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects",
    valueName: "VisualFXSetting",
    onValue: 2,
    offValue: 0,
    requiresAdmin: false,
  },
];

async function readValue(regPath, valueName) {
  try {
    const out = await runPowerShell(
      "(Get-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -ErrorAction Stop).$env:ICE_VALUE",
      { env: { ICE_PATH: regPath, ICE_VALUE: valueName } }
    );
    return out === "" ? null : Number(out);
  } catch {
    return null;
  }
}

async function list() {
  const results = [];
  for (const t of TWEAKS) {
    const current = await readValue(t.regPath, t.valueName);
    results.push({
      id: t.id,
      label: t.label,
      description: t.description,
      requiresAdmin: t.requiresAdmin,
      enabled: current === t.onValue,
    });
  }
  return results;
}

async function apply(id, enabled) {
  const t = TWEAKS.find((x) => x.id === id);
  if (!t) throw new Error("Unknown tweak");

  if (enabled) {
    await runPowerShell(
      `if (-not (Test-Path $env:ICE_PATH)) { New-Item -Path $env:ICE_PATH -Force | Out-Null }
       New-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -Value $env:ICE_ON -PropertyType DWord -Force | Out-Null`,
      { env: { ICE_PATH: t.regPath, ICE_VALUE: t.valueName, ICE_ON: String(t.onValue) } }
    );
  } else if (t.offValue === null) {
    await runPowerShell("Remove-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -ErrorAction SilentlyContinue", {
      env: { ICE_PATH: t.regPath, ICE_VALUE: t.valueName },
    });
  } else {
    await runPowerShell(
      `if (-not (Test-Path $env:ICE_PATH)) { New-Item -Path $env:ICE_PATH -Force | Out-Null }
       New-ItemProperty -Path $env:ICE_PATH -Name $env:ICE_VALUE -Value $env:ICE_OFF -PropertyType DWord -Force | Out-Null`,
      { env: { ICE_PATH: t.regPath, ICE_VALUE: t.valueName, ICE_OFF: String(t.offValue) } }
    );
  }
  return { success: true };
}

module.exports = { list, apply };
