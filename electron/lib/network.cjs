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

async function getDnsServers(adapterName) {
  if (!adapterName) throw new Error("Adapter name required");
  const servers = await runPowerShellJson(
    "(Get-DnsClientServerAddress -InterfaceAlias $env:ICE_ADAPTER -AddressFamily IPv4 -ErrorAction Stop).ServerAddresses | ConvertTo-Json",
    { env: { ICE_ADAPTER: adapterName } }
  );
  return servers.filter(Boolean);
}

const IPV4_OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4_RE = new RegExp(`^${IPV4_OCTET}\\.${IPV4_OCTET}\\.${IPV4_OCTET}\\.${IPV4_OCTET}$`);

/** Pass an empty/null `servers` to reset the adapter back to automatic (DHCP) DNS. */
async function setDnsServers(adapterName, servers) {
  if (!adapterName) throw new Error("Adapter name required");

  if (!servers || servers.length === 0) {
    await runPowerShell("Set-DnsClientServerAddress -InterfaceAlias $env:ICE_ADAPTER -ResetServerAddresses -ErrorAction Stop", {
      env: { ICE_ADAPTER: adapterName },
    });
    return { success: true };
  }

  for (const ip of servers) {
    if (!IPV4_RE.test(ip)) throw new Error(`Invalid DNS server address: ${ip}`);
  }

  await runPowerShell(
    "Set-DnsClientServerAddress -InterfaceAlias $env:ICE_ADAPTER -ServerAddresses ($env:ICE_SERVERS -split ',') -ErrorAction Stop",
    { env: { ICE_ADAPTER: adapterName, ICE_SERVERS: servers.join(",") } }
  );
  return { success: true };
}

module.exports = {
  listAdapters,
  setAdapterEnabled,
  flushDns,
  resetWinsock,
  resetTcpIp,
  getDnsServers,
  setDnsServers,
};
