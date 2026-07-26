const si = require("systeminformation");
const { runPowerShell, runPowerShellJson, runCommand } = require("./exec.cjs");
const { getIconsForPaths } = require("./icons.cjs");

// Processes that must never be offered for closing, grouped by why:
//  - OS/session core: ending these can crash the desktop or log the user out.
//  - Security: these are the OS's own malware/threat protection engines.
//  - Virtualization: host processes for VMs/containers - closing kills the
//    guest (WSL, Hyper-V, VirtualBox, VMware, Docker) and any unsaved work in it.
// This app's own runtime (electron/node) is excluded so a cleanup pass can't
// close IceTools itself; its actual launching IDE/terminal is protected
// dynamically in listBackgroundApps() via the live ancestor-PID chain instead
// of by name, since that host could be any editor/shell.
const PROTECTED_NAMES = new Set([
  // OS / session core
  "system idle process",
  "system",
  "registry",
  "memory compression",
  "smss",
  "csrss",
  "wininit",
  "services",
  "lsass",
  "winlogon",
  "dwm",
  "svchost",
  "fontdrvhost",
  "sihost",
  "explorer",
  "taskhostw",
  "audiodg",
  "spoolsv",
  "wudfhost",
  "conhost",
  "runtimebroker",
  "shellexperiencehost",
  "startmenuexperiencehost",
  "searchindexer",
  "searchhost",
  "textinputhost",
  "trustedinstaller",
  "wmiprvse",
  "dllhost",
  // Security / antivirus
  "msmpeng",
  "nissrv",
  "securityhealthservice",
  "mssense",
  "smartscreen",
  // Virtualization / containers - closing these kills a running VM or container
  "vmmem",
  "vmmemwsl",
  "vmwp",
  "vmcompute",
  "wslservice",
  "wslhost",
  "dockerd",
  "com.docker.backend",
  "docker desktop",
  "vboxheadless",
  "vmware-vmx",
  // This app's own runtime
  "electron",
  "node",
]);

const LIST_SCRIPT = `
Get-Process | Where-Object { $_.MainWindowTitle -eq '' } |
  Select-Object Id, ProcessName, @{N='Memory'; E={$_.WorkingSet64}},
    @{N='Path'; E={ try { $_.Path } catch { $null } }} |
  ConvertTo-Json -Depth 2
`;

// Walks the parent-process chain starting from our own PID so we can protect
// whatever launched this app (an IDE, a terminal, a shell) without having to
// name every possible host by string - closing your own launcher process out
// from under yourself is exactly the kind of self-inflicted crash this list
// exists to prevent.
async function getAncestorPids() {
  const script = `
    $currentId = $env:ICE_ROOT_PID
    $ids = @()
    for ($i = 0; $i -lt 25; $i++) {
      if (-not $currentId -or $currentId -eq 0) { break }
      $ids += [int]$currentId
      $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $currentId" -ErrorAction SilentlyContinue
      if (-not $proc) { break }
      $parentId = $proc.ParentProcessId
      if (-not $parentId -or $parentId -eq $currentId -or ($ids -contains $parentId)) { break }
      $currentId = $parentId
    }
    $ids | ConvertTo-Json
  `;
  try {
    const ids = await runPowerShellJson(script, { env: { ICE_ROOT_PID: String(process.pid) } });
    return new Set(ids.map(Number));
  } catch {
    return new Set([process.pid]);
  }
}

/** Background apps = processes with no visible top-level window, minus core OS/security/virtualization processes and this app's own launcher chain. */
async function listBackgroundApps() {
  const [raw, ancestorPids] = await Promise.all([runPowerShellJson(LIST_SCRIPT), getAncestorPids()]);
  const filtered = raw
    .filter(
      (p) => p && p.ProcessName && !PROTECTED_NAMES.has(p.ProcessName.toLowerCase()) && !ancestorPids.has(p.Id)
    )
    .map((p) => ({ pid: p.Id, name: p.ProcessName, memBytes: p.Memory || 0, path: p.Path || null }))
    .sort((a, b) => b.memBytes - a.memBytes);

  const icons = await getIconsForPaths(filtered.map((p) => p.path));
  return filtered.map((p) => ({ ...p, icon: icons.get(p.path) || null }));
}

/**
 * Asks every process to release memory pages it isn't actively using back to
 * the OS (setting .NET Process.MinWorkingSet triggers SetProcessWorkingSetSize
 * under the hood). No process is closed - this only reclaims idle/cached
 * pages, so it's always safe. Access-denied on protected/system processes is
 * expected and silently skipped.
 */
async function trimWorkingSets() {
  await runPowerShell(`
    Get-Process | ForEach-Object {
      try { $_.MinWorkingSet = $_.MinWorkingSet } catch {}
    }
  `);
}

async function cleanMemory(pidsToClose = []) {
  const before = await si.mem();

  for (const pid of pidsToClose) {
    const numericPid = Number(pid);
    if (!Number.isInteger(numericPid) || numericPid <= 0) continue;
    try {
      await runCommand("taskkill.exe", ["/PID", String(numericPid), "/F"]);
    } catch {
      // already exited or protected - skip
    }
  }

  await trimWorkingSets();

  const after = await si.mem();
  return {
    closedCount: pidsToClose.length,
    freedBytes: Math.max(0, before.active - after.active),
    before: { usedBytes: before.active, totalBytes: before.total },
    after: { usedBytes: after.active, totalBytes: after.total },
  };
}

module.exports = { listBackgroundApps, trimWorkingSets, cleanMemory };
