const { runPowerShell, runCommand } = require("./exec.cjs");

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
    category: "performance",
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
    category: "performance",
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
    category: "performance",
  },
  {
    id: "disableTelemetry",
    label: "Disable Diagnostic Data",
    description: "Sets Windows diagnostic data collection to the minimum level policy allows.",
    regPath: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection",
    valueName: "AllowTelemetry",
    onValue: 0,
    offValue: null,
    requiresAdmin: true,
    category: "privacy",
  },
  {
    id: "disableAdvertisingId",
    label: "Disable Advertising ID",
    description: "Stops apps from using your advertising ID to personalize ads across apps.",
    regPath: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo",
    valueName: "Enabled",
    onValue: 0,
    offValue: null,
    requiresAdmin: false,
    category: "privacy",
  },
  {
    id: "disableTailoredExperiences",
    label: "Disable Tailored Experiences",
    description: "Stops Windows from using your diagnostic data to suggest tips and personalized content.",
    regPath: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Privacy",
    valueName: "TailoredExperiencesWithDiagnosticDataEnabled",
    onValue: 0,
    offValue: null,
    requiresAdmin: false,
    category: "privacy",
  },
  {
    id: "disableActivityFeed",
    label: "Disable Activity History",
    description: "Stops Windows from collecting your activity history (Timeline) for this device.",
    regPath: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System",
    valueName: "EnableActivityFeed",
    onValue: 0,
    offValue: null,
    requiresAdmin: true,
    category: "privacy",
  },
  {
    id: "disableBingSearch",
    label: "Disable Web Search in Start Menu",
    description: "Keeps Start Menu search results limited to your PC, without sending queries to Bing.",
    regPath: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search",
    valueName: "BingSearchEnabled",
    onValue: 0,
    offValue: null,
    requiresAdmin: false,
    category: "privacy",
  },
  {
    id: "disableConsumerFeatures",
    label: "Disable Consumer Features",
    description: "Stops Windows from auto-installing suggested apps and promotional content.",
    regPath: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\CloudContent",
    valueName: "DisableWindowsConsumerFeatures",
    onValue: 1,
    offValue: null,
    requiresAdmin: true,
    category: "privacy",
  },
  {
    id: "removeWidgets",
    label: "Remove Widgets",
    description: "Hides the Widgets icon and panel from the taskbar.",
    regPath: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
    valueName: "TaskbarDa",
    onValue: 0,
    offValue: 1,
    requiresAdmin: false,
    category: "privacy",
  },
  {
    id: "disableSuperfetch",
    label: "Disable Superfetch",
    description: "Stops and disables the SysMain service, which preloads apps into RAM in the background.",
    kind: "service",
    serviceName: "SysMain",
    requiresAdmin: true,
    category: "privacy",
  },
  {
    id: "disableDeliveryOptimization",
    label: "Disable Delivery Optimization",
    description: "Stops and disables the service that shares Windows Update downloads with other PCs over your network.",
    kind: "service",
    serviceName: "DoSvc",
    requiresAdmin: true,
    category: "privacy",
  },
  {
    id: "disableHibernate",
    label: "Disable Hibernate",
    description: "Turns off hibernation and deletes hiberfil.sys, freeing disk space equal to your installed RAM.",
    kind: "hibernate",
    requiresAdmin: true,
    category: "privacy",
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

// Superfetch/DeliveryOptimization are services, not registry DWORDs - "applied"
// means the service is disabled (and stopped), "reverted" restores it to
// Automatic and starts it back up.
async function readServiceDisabled(serviceName) {
  try {
    const out = await runPowerShell("(Get-Service -Name $env:ICE_SVC -ErrorAction Stop).StartType.ToString()", {
      env: { ICE_SVC: serviceName },
    });
    return out.trim() === "Disabled";
  } catch {
    return null;
  }
}

async function applyServiceDisabled(serviceName, enabled) {
  if (enabled) {
    await runPowerShell("Stop-Service -Name $env:ICE_SVC -Force -ErrorAction SilentlyContinue", {
      env: { ICE_SVC: serviceName },
    });
    await runPowerShell("Set-Service -Name $env:ICE_SVC -StartupType Disabled -ErrorAction Stop", {
      env: { ICE_SVC: serviceName },
    });
  } else {
    await runPowerShell("Set-Service -Name $env:ICE_SVC -StartupType Automatic -ErrorAction Stop", {
      env: { ICE_SVC: serviceName },
    });
    await runPowerShell("Start-Service -Name $env:ICE_SVC -ErrorAction SilentlyContinue", {
      env: { ICE_SVC: serviceName },
    });
  }
}

// Hibernate has no plain registry toggle Microsoft supports - powercfg also
// resizes/deletes hiberfil.sys, which a raw registry write wouldn't do.
async function readHibernateEnabled() {
  try {
    const out = await runCommand("powercfg.exe", ["/a"]);
    return !/Hibernation has not been enabled/i.test(out);
  } catch {
    return null;
  }
}

async function list() {
  const results = [];
  for (const t of TWEAKS) {
    const kind = t.kind || "registry";
    let enabled;
    if (kind === "service") {
      enabled = await readServiceDisabled(t.serviceName);
    } else if (kind === "hibernate") {
      const hibernateOn = await readHibernateEnabled();
      enabled = hibernateOn === false;
    } else {
      const current = await readValue(t.regPath, t.valueName);
      enabled = current === t.onValue;
    }
    results.push({
      id: t.id,
      label: t.label,
      description: t.description,
      requiresAdmin: t.requiresAdmin,
      category: t.category,
      enabled: Boolean(enabled),
    });
  }
  return results;
}

async function apply(id, enabled) {
  const t = TWEAKS.find((x) => x.id === id);
  if (!t) throw new Error("Unknown tweak");
  const kind = t.kind || "registry";

  if (kind === "service") {
    await applyServiceDisabled(t.serviceName, enabled);
    return { success: true };
  }

  if (kind === "hibernate") {
    await runCommand("powercfg.exe", ["/hibernate", enabled ? "off" : "on"]);
    return { success: true };
  }

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
