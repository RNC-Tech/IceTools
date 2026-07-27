const si = require("systeminformation");
const { runCommand, runPowerShell } = require("./exec.cjs");

const BATTERY_PERCENTAGE_REG_PATH = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";

const GUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ULTIMATE_PERFORMANCE_SOURCE_GUID = "e9a42b02-d5df-448d-aa00-03f14749eb61";

// `powercfg /list` output lines look like:
// Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced) *
const LINE_RE = /Power Scheme GUID:\s*([0-9a-fA-F-]{36})\s*\(([^)]*)\)\s*(\*)?/;

async function listPlans() {
  const out = await runCommand("powercfg.exe", ["/list"]);
  const plans = [];
  for (const line of out.split(/\r?\n/)) {
    const match = LINE_RE.exec(line);
    if (match) {
      plans.push({ guid: match[1], name: match[2], active: Boolean(match[3]) });
    }
  }
  return plans;
}

async function setActivePlan(guid) {
  if (!GUID_RE.test(guid)) throw new Error("Invalid plan GUID");
  await runCommand("powercfg.exe", ["/setactive", guid]);
  return { success: true };
}

async function enableUltimatePerformance() {
  await runCommand("powercfg.exe", ["-duplicatescheme", ULTIMATE_PERFORMANCE_SOURCE_GUID]);
  return listPlans();
}

async function getBatteryInfo() {
  const battery = await si.battery();
  if (!battery.hasBattery) return { hasBattery: false };
  return {
    hasBattery: true,
    percent: battery.percent,
    isCharging: battery.isCharging,
    acConnected: battery.acConnected,
    cycleCount: battery.cycleCount || null,
    model: battery.model || null,
    manufacturer: battery.manufacturer || null,
    serial: battery.serial || null,
    // "Health" as manufacturers/OS use the term: how much of the original
    // designed capacity the battery can still actually hold.
    healthPercent:
      battery.designedCapacity && battery.maxCapacity
        ? Math.round((battery.maxCapacity / battery.designedCapacity) * 100)
        : null,
  };
}

// Windows 11's "Battery percentage" taskbar toggle - HKCU-scoped, so no
// admin needed. Explorer re-reads this live in current builds; older builds
// may need a taskbar refresh (sign out/in) to visually update.
async function getShowBatteryPercentage() {
  try {
    const out = await runPowerShell(
      "(Get-ItemProperty -Path $env:ICE_REG_PATH -Name IsBatteryPercentageEnabled -ErrorAction Stop).IsBatteryPercentageEnabled",
      { env: { ICE_REG_PATH: BATTERY_PERCENTAGE_REG_PATH } }
    );
    return out.trim() === "1";
  } catch {
    return false;
  }
}

async function setShowBatteryPercentage(enabled) {
  await runPowerShell(
    `if (-not (Test-Path $env:ICE_REG_PATH)) { New-Item -Path $env:ICE_REG_PATH -Force | Out-Null }
     New-ItemProperty -Path $env:ICE_REG_PATH -Name IsBatteryPercentageEnabled -Value $env:ICE_VALUE -PropertyType DWord -Force | Out-Null`,
    { env: { ICE_REG_PATH: BATTERY_PERCENTAGE_REG_PATH, ICE_VALUE: enabled ? "1" : "0" } }
  );
  return { success: true };
}

module.exports = {
  listPlans,
  setActivePlan,
  enableUltimatePerformance,
  getBatteryInfo,
  getShowBatteryPercentage,
  setShowBatteryPercentage,
};
