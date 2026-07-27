const os = require("node:os");
const si = require("systeminformation");
const { runPowerShell, runPowerShellJson, runCommand } = require("./exec.cjs");
const { getIconsForPaths } = require("./icons.cjs");

const PRIORITY_MAP = {
  Idle: "Idle",
  BelowNormal: "BelowNormal",
  Normal: "Normal",
  AboveNormal: "AboveNormal",
  High: "High",
  RealTime: "RealTime",
};

// si.cpu() shells out to PowerShell 2-3 times (Win32_processor, Win32_CacheMemory,
// HypervisorPresent) on Windows, but the model/core count never change at
// runtime - fetch once and cache instead of re-spawning PowerShell on every poll.
let cpuInfoCache = null;
async function getCpuInfo() {
  if (!cpuInfoCache) {
    const cpu = await si.cpu();
    cpuInfoCache = { model: `${cpu.manufacturer} ${cpu.brand}`.trim(), cores: cpu.cores };
  }
  return cpuInfoCache;
}

// Cheap, native-only stats safe to poll frequently (no subprocess spawned):
// si.currentLoad() samples os.cpus() twice in-process, and os.totalmem/freemem
// are direct OS calls - unlike si.mem(), which shells out to PowerShell on
// Windows for page-file info we don't even use here.
async function getLiveStats() {
  const load = await si.currentLoad();
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    cpu: {
      loadPercent: Math.round(load.currentLoad * 10) / 10,
      perCore: load.cpus.map((c) => Math.round(c.load * 10) / 10),
    },
    memory: {
      totalBytes: total,
      usedBytes: used,
      usedPercent: Math.round((used / total) * 1000) / 10,
    },
  };
}

// si.fsSize() shells out to PowerShell (Win32_LogicalDisk) - disk usage barely
// moves second to second, so this is fetched far less often than live stats.
async function getDisks() {
  const fsSize = await si.fsSize();
  return fsSize.map((d) => ({
    mount: d.mount,
    totalBytes: d.size,
    usedBytes: d.used,
    usedPercent: Math.round(d.use * 10) / 10,
  }));
}

// Queries nvidia-smi directly via async execFile rather than si.graphics(),
// which internally uses execSync and would block the main process (and thus
// every pending IPC call) for the duration of each call. Gracefully reports
// unavailable on non-NVIDIA GPUs or systems without the driver installed.
let gpuAvailable = true;
async function getGpuStats() {
  if (!gpuAvailable) return { available: false };
  try {
    const out = await runCommand("nvidia-smi.exe", [
      "--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total",
      "--format=csv,noheader,nounits",
    ]);
    const [name, util, temp, memUsed, memTotal] = out
      .split("\n")[0]
      .split(",")
      .map((s) => s.trim());
    return {
      available: true,
      name,
      loadPercent: Number(util),
      temperatureC: Number(temp),
      memUsedBytes: Number(memUsed) * 1024 * 1024,
      memTotalBytes: Number(memTotal) * 1024 * 1024,
    };
  } catch {
    gpuAvailable = false;
    return { available: false };
  }
}

// defrag /O lets Windows pick the right strategy per media type - actual
// defragmentation for HDDs, TRIM for SSDs - the same tool "Optimize Drives"
// uses under the hood. Can genuinely take minutes on a large/fragmented HDD,
// so this gets a much longer timeout than our other commands.
async function optimizeDisk(mount) {
  const driveLetter = mount.replace(/[\\/]+$/, "");
  if (!/^[A-Za-z]:$/.test(driveLetter)) throw new Error("Invalid drive");
  await runCommand("defrag.exe", [driveLetter, "/O"], { timeout: 30 * 60 * 1000 });
  return { success: true };
}

async function getStats() {
  const [cpuInfo, live, disks] = await Promise.all([getCpuInfo(), getLiveStats(), getDisks()]);
  return {
    cpu: { ...cpuInfo, loadPercent: live.cpu.loadPercent },
    memory: live.memory,
    disks,
  };
}

// Per-process CPU% requires two time-spaced samples of cumulative CPU
// seconds; kept here (not in PowerShell) so we only ever spawn one process
// per poll instead of re-deriving state remotely.
const previousCpuSamples = new Map(); // pid -> { cpuSeconds, timestamp }

// Get-Process is a native .NET cmdlet - unlike si.processes(), which queries
// Win32_Process over WMI/CIM on Windows, an approach that is well known to be
// far slower and heavier than Get-Process for the same data.
const PROCESS_LIST_SCRIPT = `
Get-Process | Select-Object Id, ProcessName,
  @{N='CpuSeconds'; E={$_.CPU}},
  @{N='WorkingSet'; E={$_.WorkingSet64}},
  @{N='Priority'; E={ try { $_.PriorityClass.ToString() } catch { '' } }},
  @{N='Path'; E={ try { $_.Path } catch { $null } }} |
ConvertTo-Json -Depth 2
`;

async function getProcesses() {
  const raw = await runPowerShellJson(PROCESS_LIST_SCRIPT);
  const now = Date.now();
  const cores = os.cpus().length || 1;
  const seenPids = new Set();

  const withCpu = raw.map((p) => {
    seenPids.add(p.Id);
    const prev = previousCpuSamples.get(p.Id);
    let cpuPercent = 0;
    if (prev && typeof p.CpuSeconds === "number") {
      const deltaCpu = p.CpuSeconds - prev.cpuSeconds;
      const deltaTime = (now - prev.timestamp) / 1000;
      if (deltaTime > 0 && deltaCpu >= 0) cpuPercent = (deltaCpu / deltaTime / cores) * 100;
    }
    previousCpuSamples.set(p.Id, { cpuSeconds: p.CpuSeconds || 0, timestamp: now });
    return {
      pid: p.Id,
      name: p.ProcessName,
      cpu: Math.round(cpuPercent * 10) / 10,
      memBytes: p.WorkingSet || 0,
      priority: p.Priority || "Normal",
      path: p.Path || null,
    };
  });

  for (const pid of previousCpuSamples.keys()) {
    if (!seenPids.has(pid)) previousCpuSamples.delete(pid);
  }

  const top = withCpu.sort((a, b) => b.cpu - a.cpu).slice(0, 200);
  const icons = await getIconsForPaths(top.map((p) => p.path));
  return top.map((p) => ({ ...p, icon: icons.get(p.path) || null }));
}

async function killProcess(pid) {
  const numericPid = Number(pid);
  if (!Number.isInteger(numericPid) || numericPid <= 0) {
    throw new Error("Invalid PID");
  }
  await runCommand("taskkill.exe", ["/PID", String(numericPid), "/F", "/T"]);
  return { success: true };
}

async function setPriority(pid, priority) {
  const numericPid = Number(pid);
  if (!Number.isInteger(numericPid) || numericPid <= 0) {
    throw new Error("Invalid PID");
  }
  if (!PRIORITY_MAP[priority]) {
    throw new Error("Invalid priority class");
  }
  await runPowerShell("(Get-Process -Id $env:ICE_PID).PriorityClass = $env:ICE_PRIORITY", {
    env: { ICE_PID: String(numericPid), ICE_PRIORITY: PRIORITY_MAP[priority] },
  });
  return { success: true };
}

module.exports = {
  getStats,
  getLiveStats,
  getDisks,
  getGpuStats,
  getProcesses,
  killProcess,
  setPriority,
  optimizeDisk,
  PRIORITY_MAP,
};
