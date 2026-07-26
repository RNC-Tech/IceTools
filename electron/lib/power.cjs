const { runCommand } = require("./exec.cjs");

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

module.exports = { listPlans, setActivePlan, enableUltimatePerformance };
