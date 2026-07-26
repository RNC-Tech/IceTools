const { runPowerShellJson, runPowerShell, runCommand } = require("./exec.cjs");

async function listAdapters() {
  const items = await runPowerShellJson(
    "Get-NetAdapter | Select-Object Name, InterfaceDescription, Status, LinkSpeed, MacAddress | ConvertTo-Json -Depth 3"
  );
  return items.map((a) => ({
    name: a.Name,
    description: a.InterfaceDescription,
    status: a.Status,
    linkSpeed: a.LinkSpeed,
    macAddress: a.MacAddress,
  }));
}

async function setAdapterEnabled(name, enabled) {
  if (!name) throw new Error("Adapter name required");
  const cmdlet = enabled ? "Enable-NetAdapter" : "Disable-NetAdapter";
  await runPowerShell(`${cmdlet} -Name $env:ICE_ADAPTER -Confirm:$false -ErrorAction Stop`, {
    env: { ICE_ADAPTER: name },
  });
  return { success: true };
}

async function flushDns() {
  await runCommand("ipconfig.exe", ["/flushdns"]);
  return { success: true };
}

async function resetWinsock() {
  const out = await runCommand("netsh.exe", ["winsock", "reset"]);
  return { success: true, requiresRestart: true, output: out };
}

async function resetTcpIp() {
  const out = await runCommand("netsh.exe", ["int", "ip", "reset"]);
  return { success: true, requiresRestart: true, output: out };
}

module.exports = { listAdapters, setAdapterEnabled, flushDns, resetWinsock, resetTcpIp };
