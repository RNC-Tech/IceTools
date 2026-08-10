import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Zap, Wifi, SlidersHorizontal } from "../components/icons/index.js";
import {
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Globe,
  Gauge,
  ArrowDown,
  ArrowUp,
  Timer,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  CheckCircle2,
  ExternalLink,
  Zap as FastIcon,
  X,
} from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { Skeleton, TableSkeleton } from "../components/Skeleton.jsx";

function wifiSignalIcon(percent) {
  if (percent >= 65) return SignalHigh;
  if (percent >= 35) return SignalMedium;
  if (percent > 0) return SignalLow;
  return SignalZero;
}

function SpeedTestWebModal({ modalUrl, title, onClose }) {
  const toast = useToast();
  if (!modalUrl) return null;

  function handleExternalOpen() {
    call(window.api.app.openExternal(modalUrl)).catch((err) => toast.error(err.message));
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 glass-card bg-[#070f1e]/95 border border-blue-500/25 rounded-2xl w-full max-w-5xl h-[88vh] p-5 shadow-2xl text-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Gauge size={18} className="text-blue-400" />
            <h3 className="font-bold text-base text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-xs btn-outline rounded-full px-3 gap-1 border-blue-500/30 text-blue-300 hover:text-white"
              onClick={handleExternalOpen}
              title="Open in default external browser"
            >
              <span>Open in Browser</span>
              <ExternalLink size={10} />
            </button>
            <button className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-white" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Embedded Electron Webview */}
        <div className="flex-1 my-3 rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950">
          <webview
            src={modalUrl}
            className="w-full h-full border-none"
            style={{ width: "100%", height: "100%" }}
            allowpopups="true"
          ></webview>
        </div>

        {/* Footer with Exit Button Below */}
        <div className="pt-2 shrink-0 flex justify-end">
          <button className="btn btn-sm btn-primary rounded-full px-6 font-bold shadow-lg shadow-blue-500/30" onClick={onClose}>
            Exit Speed Test
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SpeedTestSection() {
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [activeWebModal, setActiveWebModal] = useState(null); // { url, title }
  const toast = useToast();

  async function runTest() {
    setTesting(true);
    setResult(null);
    try {
      const data = await call(window.api.network.runSpeedTest());
      setResult(data);
    } catch (err) {
      toast.error(`Speed test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  }

  function handleOpenFastCom() {
    call(window.api.app.openSpeedTestModal("https://fast.com", "Fast.com Speed Test (Netflix)")).catch(() => {
      setActiveWebModal({ url: "https://fast.com", title: "Fast.com Speed Test (Netflix)" });
    });
  }

  function handleOpenOokla() {
    call(window.api.app.openSpeedTestModal("https://www.speedtest.net", "Ookla Speedtest.net")).catch(() => {
      setActiveWebModal({ url: "https://www.speedtest.net", title: "Ookla Speedtest.net" });
    });
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-blue-500/20 space-y-4 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Gauge size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Network Speed Test</h3>
            <p className="text-xs text-slate-400">Measure latency, download, and upload speeds or launch web providers</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn btn-xs btn-outline rounded-full px-3.5 gap-1.5 border-blue-500/30 text-blue-300 hover:text-white"
            onClick={handleOpenFastCom}
            title="Open Fast.com speed test modal"
          >
            <FastIcon size={12} className="text-amber-400" />
            <span>Fast.com</span>
          </button>

          <button
            className="btn btn-xs btn-outline rounded-full px-3.5 gap-1.5 border-blue-500/30 text-blue-300 hover:text-white"
            onClick={handleOpenOokla}
            title="Open Speedtest.net speed test modal"
          >
            <Gauge size={12} className="text-emerald-400" />
            <span>Speedtest.net</span>
          </button>

          <button
            className="btn btn-sm btn-primary rounded-full px-5 gap-2 shadow-lg shadow-blue-500/30 font-bold"
            onClick={runTest}
            disabled={testing}
          >
            {testing ? <span className="loading loading-spinner loading-xs"></span> : <Gauge size={15} />}
            {testing ? "Testing Connection..." : "Run Speed Test"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-blue-500/15 text-center">
        <div>
          <Timer size={18} className="mx-auto text-blue-400 mb-1" />
          <div className="text-2xl font-black font-mono text-white">{result ? `${result.pingMs}` : "—"}</div>
          <div className="text-xs text-slate-400">Ping (ms)</div>
        </div>
        <div>
          <ArrowDown size={18} className="mx-auto text-emerald-400 mb-1" />
          <div className="text-2xl font-black font-mono text-emerald-400">{result ? result.downloadMbps : "—"}</div>
          <div className="text-xs text-slate-400">Download (Mbps)</div>
        </div>
        <div>
          <ArrowUp size={18} className="mx-auto text-sky-400 mb-1" />
          <div className="text-2xl font-black font-mono text-sky-400">{result ? result.uploadMbps : "—"}</div>
          <div className="text-xs text-slate-400">Upload (Mbps)</div>
        </div>
      </div>

      <SpeedTestWebModal
        modalUrl={activeWebModal?.url}
        title={activeWebModal?.title}
        onClose={() => setActiveWebModal(null)}
      />
    </div>
  );
}

const DNS_PRESETS = [
  { label: "Automatic (DHCP)", servers: [] },
  { label: "Cloudflare", servers: ["1.1.1.1", "1.0.0.1"] },
  { label: "Google", servers: ["8.8.8.8", "8.8.4.4"] },
  { label: "Quad9", servers: ["9.9.9.9", "149.112.112.112"] },
];

function batteryIcon(percent, isCharging) {
  if (isCharging) return BatteryCharging;
  if (percent >= 60) return BatteryFull;
  if (percent >= 30) return BatteryMedium;
  if (percent >= 15) return BatteryLow;
  return BatteryWarning;
}

function BatterySection({ battery, showPercent, onToggleShowPercent }) {
  if (!battery || !battery.hasBattery) return null;
  const Icon = batteryIcon(battery.percent, battery.isCharging);

  return (
    <div className="glass-card rounded-2xl p-5 border border-blue-500/20 space-y-4 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <Icon size={18} />
        </div>
        <h3 className="font-bold text-base text-white">Laptop Battery & Power Health</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Battery Charge</div>
          <div className="text-2xl font-black font-mono text-blue-400">{battery.percent}%</div>
          <div className="text-xs text-slate-400">{battery.isCharging ? "Charging" : battery.acConnected ? "Plugged in" : "On battery"}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Battery Health</div>
          <div className="text-2xl font-black font-mono text-emerald-400">{battery.healthPercent !== null ? `${battery.healthPercent}%` : "N/A"}</div>
          <div className="text-xs text-slate-400">Designed Capacity</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Hardware Model</div>
          <div className="text-sm font-bold text-white truncate">{battery.model || "Standard Battery"}</div>
          {battery.serial && <div className="text-xs font-mono text-slate-400">S/N {battery.serial}</div>}
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Cycle Count</div>
          <div className="text-2xl font-black font-mono text-white">{battery.cycleCount ?? "—"}</div>
        </div>
      </div>

      <label className="flex items-center justify-between pt-3 border-t border-blue-500/15 cursor-pointer">
        <span className="text-xs font-semibold text-slate-300">Show battery percentage in taskbar tray</span>
        <input
          type="checkbox"
          className="toggle toggle-primary toggle-sm"
          checked={showPercent}
          onChange={(e) => onToggleShowPercent(e.target.checked)}
        />
      </label>
    </div>
  );
}

function DnsModal({ adapter, onClose, onApplied }) {
  const [current, setCurrent] = useState(null);
  const [customPrimary, setCustomPrimary] = useState("");
  const [customSecondary, setCustomSecondary] = useState("");
  const [applying, setApplying] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!adapter) return;
    setCurrent(null);
    call(window.api.network.getDnsServers(adapter.name))
      .then(setCurrent)
      .catch(() => setCurrent([]));
  }, [adapter]);

  if (!adapter) return null;

  async function apply(servers) {
    setApplying(true);
    try {
      await call(window.api.network.setDnsServers(adapter.name, servers));
      toast.success(`DNS updated for "${adapter.name}"`);
      onApplied();
    } catch (err) {
      toast.error(`Could not set DNS: ${err.message}`);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box glass-card border border-blue-500/20 rounded-2xl max-w-md bg-[#0b172a] text-white">
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
          <h3 className="font-bold text-base flex items-center gap-2 text-white">
            <Globe size={18} className="text-blue-400" /> DNS Configuration for {adapter.name}
          </h3>
          <button className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-white" onClick={onClose} disabled={applying}>✕</button>
        </div>

        <p className="text-xs text-slate-400 pt-3">
          Current Servers: {current === null ? "..." : current.length > 0 ? current.join(", ") : "Automatic (DHCP)"}
        </p>

        <div className="grid grid-cols-2 gap-2 py-3">
          {DNS_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="btn btn-sm btn-outline rounded-xl text-xs border-blue-500/30 text-blue-300 hover:text-white"
              disabled={applying}
              onClick={() => apply(preset.servers)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-blue-500/20">
          <div className="text-xs font-semibold text-slate-300">Custom DNS Servers</div>
          <input
            className="input input-sm input-bordered w-full rounded-xl bg-slate-900/60 border-blue-500/20 text-xs font-mono text-white placeholder:text-slate-500"
            placeholder="Primary DNS (e.g. 1.1.1.1)"
            value={customPrimary}
            onChange={(e) => setCustomPrimary(e.target.value)}
            disabled={applying}
          />
          <input
            className="input input-sm input-bordered w-full rounded-xl bg-slate-900/60 border-blue-500/20 text-xs font-mono text-white placeholder:text-slate-500"
            placeholder="Secondary DNS (optional e.g. 1.0.0.1)"
            value={customSecondary}
            onChange={(e) => setCustomSecondary(e.target.value)}
            disabled={applying}
          />
          <button
            className="btn btn-sm btn-primary rounded-full w-full mt-1 font-bold"
            disabled={applying || !customPrimary.trim()}
            onClick={() => apply([customPrimary.trim(), customSecondary.trim()].filter(Boolean))}
          >
            {applying ? <span className="loading loading-spinner loading-xs"></span> : "Apply Custom DNS"}
          </button>
        </div>

        <div className="modal-action border-t border-blue-500/20 pt-3">
          <button className="btn btn-sm btn-ghost text-slate-300" onClick={onClose} disabled={applying}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={applying ? undefined : onClose}></div>
    </div>
  );
}

export default function PowerNetwork() {
  const [plans, setPlans] = useState([]);
  const [adapters, setAdapters] = useState([]);
  const [tweaks, setTweaks] = useState([]);
  const [battery, setBattery] = useState(null);
  const [showBatteryPercent, setShowBatteryPercent] = useState(false);
  const [wifiSignal, setWifiSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(null);
  const [dnsAdapter, setDnsAdapter] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, adaptersData, tweaksData, batteryData, showPercentData, wifiData] = await Promise.all([
        call(window.api.power.listPlans()),
        call(window.api.network.listAdapters()),
        call(window.api.tweaks.list()),
        call(window.api.power.getBatteryInfo()),
        call(window.api.power.getShowBatteryPercentage()),
        call(window.api.network.getWifiSignal()),
      ]);
      setPlans(plansData);
      setAdapters(adaptersData);
      setTweaks(tweaksData);
      setBattery(batteryData);
      setShowBatteryPercent(showPercentData);
      setWifiSignal(wifiData);
    } catch (err) {
      toast.error(`Failed to load power/network info: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function activatePlan(guid) {
    try {
      await call(window.api.power.setActivePlan(guid));
      toast.success("Power plan activated");
      load();
    } catch (err) {
      toast.error(`Could not activate plan: ${err.message}`);
    }
  }

  async function enableUltimate() {
    try {
      const updated = await call(window.api.power.enableUltimatePerformance());
      setPlans(updated);
      toast.success("Ultimate Performance plan added");
    } catch (err) {
      toast.error(`Could not add Ultimate Performance plan: ${err.message}`);
    }
  }

  async function handleToggleShowPercent(enabled) {
    setShowBatteryPercent(enabled);
    try {
      await call(window.api.power.setShowBatteryPercentage(enabled));
      toast.success(`Battery percentage ${enabled ? "shown" : "hidden"} in taskbar.`);
    } catch (err) {
      setShowBatteryPercent(!enabled);
      toast.error(`Could not change setting: ${err.message}`);
    }
  }

  async function toggleAdapter(adapter) {
    try {
      await call(window.api.network.setAdapterEnabled(adapter.name, adapter.status !== "Up"));
      toast.success(`${adapter.status === "Up" ? "Disabled" : "Enabled"} "${adapter.name}"`);
      load();
    } catch (err) {
      toast.error(`Could not toggle adapter: ${err.message}`);
    }
  }

  async function flushDns() {
    try {
      await call(window.api.network.flushDns());
      toast.success("DNS cache flushed successfully!");
    } catch (err) {
      toast.error(`Flush DNS failed: ${err.message}`);
    }
  }

  async function doReset(kind) {
    setResetConfirm(null);
    try {
      const result = kind === "winsock" ? await call(window.api.network.resetWinsock()) : await call(window.api.network.resetTcpIp());
      toast.success(result.requiresRestart ? "Reset complete - restart your PC to finish applying it." : "Reset complete");
    } catch (err) {
      toast.error(`Reset failed: ${err.message}`);
    }
  }

  async function toggleTweak(tweak) {
    try {
      await call(window.api.tweaks.apply(tweak.id, !tweak.enabled));
      toast.success(`${!tweak.enabled ? "Applied" : "Reverted"} "${tweak.label}"`);
      load();
    } catch (err) {
      toast.error(`Could not update tweak: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <TableSkeleton rows={4} columns={5} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        icon={Zap}
        title="Power & Network"
        description="Manage Windows power plans, adapter configurations, DNS presets, speed test diagnostics, and network tweaks."
        badge="Power & Connectivity"
      />

      {/* Power Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
            <Zap size={16} className="text-blue-400" /> Power Profiles
          </h3>
          <button className="btn btn-xs btn-outline rounded-full px-3.5 border-blue-500/30 text-blue-300" onClick={enableUltimate}>
            + Unlock Ultimate Performance
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.guid}
              className={`glass-card glass-card-hover rounded-2xl p-4 flex flex-col justify-between transition-all border ${
                p.active ? "border-blue-500/50 bg-blue-500/10 shadow-md shadow-blue-500/10" : "border-blue-500/15"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{p.name}</span>
                  {p.active && (
                    <span className="badge badge-xs bg-blue-500/20 text-blue-300 border-blue-500/30 gap-1 font-semibold rounded-md px-2 py-1">
                      <CheckCircle2 size={11} /> Active
                    </span>
                  )}
                </div>
              </div>

              {!p.active && (
                <div className="pt-3 flex justify-end">
                  <button className="btn btn-xs btn-outline rounded-full px-3 border-blue-500/30 text-blue-300" onClick={() => activatePlan(p.guid)}>
                    Activate Profile
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BatterySection battery={battery} showPercent={showBatteryPercent} onToggleShowPercent={handleToggleShowPercent} />

      {/* Network Adapters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
            <Wifi size={16} className="text-blue-400" /> Network Adapters
          </h3>
          {wifiSignal && wifiSignal.available && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
              {React.createElement(wifiSignalIcon(wifiSignal.signalPercent), { size: 14 })}
              <span>{wifiSignal.ssid} ({wifiSignal.signalPercent}%)</span>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-blue-500/15 shadow-xl">
          <div className="overflow-x-auto max-h-[45vh]">
            <table className="table table-sm w-full">
              <thead className="bg-[#0b172a]/90 text-xs text-slate-300 sticky top-0 backdrop-blur-md border-b border-blue-500/20">
                <tr>
                  <th>Adapter Name</th>
                  <th>Description</th>
                  <th className="w-24 text-center">Status</th>
                  <th className="w-32 text-center">Link Speed</th>
                  <th className="w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adapters.map((a) => (
                  <tr key={a.name} className="border-b border-white/5 hover:bg-blue-500/5 transition-colors">
                    <td className="font-bold text-xs text-white">{a.name}</td>
                    <td className="text-xs text-slate-400 truncate max-w-[220px]">{a.description}</td>
                    <td className="text-center">
                      <span
                        className={`badge badge-xs font-semibold rounded-md px-2.5 py-1 ${
                          a.status === "Up"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="text-center font-mono text-xs text-slate-400">{a.linkSpeed}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="btn btn-xs btn-outline rounded-full px-2.5 gap-1 border-blue-500/30 text-blue-300" onClick={() => setDnsAdapter(a)}>
                          <Globe size={11} /> DNS
                        </button>
                        <button className="btn btn-xs btn-outline rounded-full px-2.5 gap-1 border-blue-500/30 text-slate-300" onClick={() => toggleAdapter(a)}>
                          {a.status === "Up" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <button className="btn btn-xs btn-primary rounded-full px-4 gap-1 shadow-sm font-bold" onClick={flushDns}>
            Flush DNS Cache
          </button>
          <button className="btn btn-xs btn-outline rounded-full px-4 border-blue-500/30 text-blue-300" onClick={() => setResetConfirm("winsock")}>
            Reset Winsock Catalog
          </button>
          <button className="btn btn-xs btn-outline rounded-full px-4 border-blue-500/30 text-blue-300" onClick={() => setResetConfirm("tcpip")}>
            Reset TCP/IP Stack
          </button>
        </div>
      </div>

      <SpeedTestSection />

      {/* Tweaks */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-blue-400" /> Performance Tweaks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tweaks
            .filter((t) => t.category === "performance")
            .map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTweak(t)}
                className={`glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all border ${
                  t.enabled ? "border-blue-500/50 bg-blue-500/10" : "border-blue-500/15"
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-white">{t.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm shrink-0 ml-3"
                  checked={t.enabled}
                  onChange={() => {}}
                />
              </div>
            ))}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(resetConfirm)}
        title={resetConfirm === "winsock" ? "Reset Winsock catalog?" : "Reset TCP/IP stack?"}
        message="This resets low-level Windows networking configurations to default state and requires a PC restart."
        confirmLabel="Reset Stack"
        onConfirm={() => doReset(resetConfirm)}
        onCancel={() => setResetConfirm(null)}
      />

      <DnsModal adapter={dnsAdapter} onClose={() => setDnsAdapter(null)} onApplied={() => setDnsAdapter(null)} />
    </div>
  );
}
