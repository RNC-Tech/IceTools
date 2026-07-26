const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { runPowerShellJson, runPowerShell } = require("./exec.cjs");
const { getIconsForPaths, extractExePath } = require("./icons.cjs");

// Registry-based startup entries (Run keys). Origins map 1:1 to real registry
// locations; the "disabled store" mirrors HKCU/HKLM so a toggle is reversible
// without ever losing the original command line.
const ORIGINS = {
  HKCU_Run: "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
  HKLM_Run: "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
  HKLM_Run32: "HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run",
};
const DISABLED_ROOT = "HKCU:\\Software\\IceTools\\DisabledStartup";

const LIST_SCRIPT = `
$origins = @{
  HKCU_Run = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  HKLM_Run = 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  HKLM_Run32 = 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run'
}
$results = @()
foreach ($originName in $origins.Keys) {
  $keyPath = $origins[$originName]
  if (Test-Path $keyPath) {
    $props = Get-ItemProperty -Path $keyPath -ErrorAction SilentlyContinue
    if ($props) {
      foreach ($p in $props.PSObject.Properties) {
        if ($p.Name -notmatch '^PS(Path|ParentPath|ChildName|Drive|Provider)$') {
          $results += [PSCustomObject]@{
            id = "$originName|$($p.Name)"
            name = $p.Name
            command = "$($p.Value)"
            origin = $originName
            enabled = $true
          }
        }
      }
    }
  }
}
$disabledRoot = 'HKCU:\\Software\\IceTools\\DisabledStartup'
if (Test-Path $disabledRoot) {
  Get-ChildItem -Path $disabledRoot -ErrorAction SilentlyContinue | ForEach-Object {
    $originName = $_.PSChildName
    $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
    if ($props) {
      foreach ($p in $props.PSObject.Properties) {
        if ($p.Name -notmatch '^PS(Path|ParentPath|ChildName|Drive|Provider)$') {
          $results += [PSCustomObject]@{
            id = "$originName|$($p.Name)"
            name = $p.Name
            command = "$($p.Value)"
            origin = $originName
            enabled = $false
          }
        }
      }
    }
  }
}
$results | ConvertTo-Json -Depth 4
`;

async function listRegistryStartupItems() {
  const items = await runPowerShellJson(LIST_SCRIPT);
  return items;
}

function startupFolders() {
  return [
    {
      id: "user",
      dir: path.join(os.homedir(), "AppData", "Roaming", "Microsoft", "Windows", "Start Menu", "Programs", "Startup"),
      requiresAdmin: false,
    },
    {
      id: "allUsers",
      dir: "C\\:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup".replace("C\\:", "C:"),
      requiresAdmin: true,
    },
  ];
}

async function listFolderStartupItems() {
  const results = [];
  for (const folder of startupFolders()) {
    const disabledDir = path.join(folder.dir, "_IceToolsDisabled");
    for (const [dir, enabled] of [[folder.dir, true], [disabledDir, false]]) {
      let entries = [];
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.isDirectory()) continue;
        results.push({
          id: `folder:${folder.id}|${entry.name}`,
          name: entry.name.replace(/\.lnk$/i, ""),
          command: path.join(dir, entry.name),
          origin: `folder:${folder.id}`,
          enabled,
        });
      }
    }
  }
  return results;
}

async function list() {
  const [reg, folders] = await Promise.all([listRegistryStartupItems(), listFolderStartupItems()]);
  const items = [...reg, ...folders];

  // Folder items' `command` is already a real file path (.lnk/.exe); registry
  // items' `command` is a full command line that needs the exe pulled out of it.
  const exePaths = items.map((item) => (item.origin.startsWith("folder:") ? item.command : extractExePath(item.command)));
  const icons = await getIconsForPaths(exePaths);
  return items.map((item, i) => ({ ...item, icon: icons.get(exePaths[i]) || null }));
}

async function toggleRegistryItem(origin, name, enable) {
  const sourceRoot = enable ? `${DISABLED_ROOT}\\${origin}` : ORIGINS[origin];
  const destRoot = enable ? ORIGINS[origin] : `${DISABLED_ROOT}\\${origin}`;
  if (!sourceRoot || !destRoot) throw new Error("Unknown startup origin");

  await runPowerShell(
    `
    $sourceRoot = $env:ICE_SRC
    $destRoot = $env:ICE_DST
    $name = $env:ICE_NAME
    if (-not (Test-Path $destRoot)) { New-Item -Path $destRoot -Force | Out-Null }
    $value = (Get-ItemProperty -Path $sourceRoot -Name $name -ErrorAction Stop).$name
    New-ItemProperty -Path $destRoot -Name $name -Value $value -PropertyType String -Force | Out-Null
    Remove-ItemProperty -Path $sourceRoot -Name $name -Force
    `,
    { env: { ICE_SRC: sourceRoot, ICE_DST: destRoot, ICE_NAME: name } }
  );
}

async function toggleFolderItem(originId, fileName, enable) {
  const folderId = originId.split(":")[1];
  const folder = startupFolders().find((f) => f.id === folderId);
  if (!folder) throw new Error("Unknown startup folder");
  const disabledDir = path.join(folder.dir, "_IceToolsDisabled");
  if (enable) {
    await fs.rename(path.join(disabledDir, fileName), path.join(folder.dir, fileName));
  } else {
    await fs.mkdir(disabledDir, { recursive: true });
    await fs.rename(path.join(folder.dir, fileName), path.join(disabledDir, fileName));
  }
}

async function toggle(item) {
  const { id, enabled } = item; // enabled = desired new state
  const sepIndex = id.indexOf("|");
  const origin = id.slice(0, sepIndex);
  const name = id.slice(sepIndex + 1);
  if (origin.startsWith("folder:")) {
    await toggleFolderItem(origin, name, enabled);
  } else {
    await toggleRegistryItem(origin, name, enabled);
  }
  return { success: true };
}

module.exports = { list, toggle };
