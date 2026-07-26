const { runPowerShellJson, runPowerShell } = require("./exec.cjs");
const { getIconsForPaths, extractExePath } = require("./icons.cjs");

const VALID_START_TYPES = ["Automatic", "AutomaticDelayedStart", "Manual", "Disabled"];

async function list() {
  // Status/StartType are enums that ConvertTo-Json serializes as raw integers
  // unless explicitly stringified - cast them so the renderer gets names.
  // ImagePath is read from the registry in the same script (one PowerShell
  // spawn total) rather than via Get-CimInstance Win32_Service, which is the
  // slow WMI path we specifically avoided for process listing too.
  const items = await runPowerShellJson(
    `$paths = @{}
     Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\*' -Name ImagePath -ErrorAction SilentlyContinue |
       ForEach-Object { $paths[$_.PSChildName] = $_.ImagePath }
     Get-Service | Select-Object Name, DisplayName,
       @{Name='Status'; Expression={$_.Status.ToString()}},
       @{Name='StartType'; Expression={$_.StartType.ToString()}},
       @{Name='ImagePath'; Expression={$paths[$_.Name]}} |
     ConvertTo-Json -Depth 3`
  );

  const mapped = items.map((s) => ({
    name: s.Name,
    displayName: s.DisplayName,
    status: s.Status, // Running | Stopped | Paused | ...
    startType: s.StartType, // Automatic | Manual | Disabled | ...
    exePath: extractExePath(s.ImagePath),
  }));

  const icons = await getIconsForPaths(mapped.map((s) => s.exePath));
  return mapped.map(({ exePath, ...s }) => ({ ...s, icon: icons.get(exePath) || null }));
}

async function setStatus(name, action) {
  if (!name) throw new Error("Service name required");
  const cmd = { start: "Start-Service", stop: "Stop-Service", restart: "Restart-Service" }[action];
  if (!cmd) throw new Error("Invalid service action");
  await runPowerShell(`${cmd} -Name $env:ICE_SVC -Force -ErrorAction Stop`, {
    env: { ICE_SVC: name },
  });
  return { success: true };
}

async function setStartType(name, startType) {
  if (!name) throw new Error("Service name required");
  if (!VALID_START_TYPES.includes(startType)) throw new Error("Invalid start type");
  await runPowerShell("Set-Service -Name $env:ICE_SVC -StartupType $env:ICE_START_TYPE -ErrorAction Stop", {
    env: { ICE_SVC: name, ICE_START_TYPE: startType },
  });
  return { success: true };
}

module.exports = { list, setStatus, setStartType, VALID_START_TYPES };
