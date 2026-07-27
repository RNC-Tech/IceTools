import React, { useCallback, useEffect, useState } from "react";
import { Zap, Wifi, SlidersHorizontal } from "../components/icons/index.js";
import { BatteryCharging, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Globe } from "lucide-react";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { Skeleton, TableSkeleton } from "../components/Skeleton.jsx";

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
    <section>
      <h2 className="text-xl font-black mb-2 flex items-center gap-2">
        <Icon size={20} />
        Battery
      </h2>
      <div className="card bg-base-200 max-w-2xl">
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide opacity-60">Charge</div>
              <div className="text-xl font-black">{battery.percent}%</div>
              <div className="text-xs opacity-60">{battery.isCharging ? "Charging" : battery.acConnected ? "Plugged in" : "On battery"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide opacity-60">Health</div>
              <div className="text-xl font-black">{battery.healthPercent !== null ? `${battery.healthPercent}%` : "N/A"}</div>
              <div className="text-xs opacity-60">of designed capacity</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide opacity-60">Model</div>
              <div className="text-sm font-medium">{battery.model || "Unknown"}</div>
              {battery.serial && <div className="text-xs opacity-60">S/N {battery.serial}</div>}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide opacity-60">Cycle Count</div>
              <div className="text-sm font-medium">{battery.cycleCount ?? "Unknown"}</div>
            </div>
          </div>
          <label className="flex items-center justify-between pt-3 mt-3 border-t border-base-300 cursor-pointer">
            <span className="text-sm">Show battery percentage in taskbar</span>
            <input
              type="checkbox"
              className="toggle toggle-success"
              checked={showPercent}
              onChange={(e) => onToggleShowPercent(e.target.checked)}
            />
          </label>
        </div>
      </div>
    </section>
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
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Globe size={18} />
          DNS for {adapter.name}
        </h3>
        <p className="text-xs opacity-60 mt-1">
          Current: {current === null ? "..." : current.length > 0 ? current.join(", ") : "Automatic (DHCP)"}
        </p>
        <div className="grid grid-cols-2 gap-2 py-4">
          {DNS_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="btn btn-sm btn-outline"
              disabled={applying}
              onClick={() => apply(preset.servers)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium opacity-70">Custom</div>
          <input
            className="input input-sm input-bordered w-full"
            placeholder="Primary DNS (e.g. 1.1.1.1)"
            value={customPrimary}
            onChange={(e) => setCustomPrimary(e.target.value)}
            disabled={applying}
          />
          <input
            className="input input-sm input-bordered w-full"
            placeholder="Secondary DNS (optional)"
            value={customSecondary}
            onChange={(e) => setCustomSecondary(e.target.value)}
            disabled={applying}
          />
          <button
            className="btn btn-sm btn-primary w-full"
            disabled={applying || !customPrimary.trim()}
            onClick={() => apply([customPrimary.trim(), customSecondary.trim()].filter(Boolean))}
          >
            {applying ? <span className="loading loading-spinner loading-xs"></span> : "Apply Custom"}
          </button>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose} disabled={applying}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={applying ? undefined : onClose}></div>
    </div>
  );
}

export default function PowerNetwork() {
  const [plans, setPlans] = useState([]);
  const [adapters, setAdapters] = useState([]);
  const [tweaks, setTweaks] = useState([]);
  const [battery, setBattery] = useState(null);
  const [showBatteryPercent, setShowBatteryPercent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(null); // "winsock" | "tcpip" | null
  const [dnsAdapter, setDnsAdapter] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, adaptersData, tweaksData, batteryData, showPercentData] = await Promise.all([
        call(window.api.power.listPlans()),
        call(window.api.network.listAdapters()),
        call(window.api.tweaks.list()),
        call(window.api.power.getBatteryInfo()),
        call(window.api.power.getShowBatteryPercentage()),
      ]);
      setPlans(plansData);
      setAdapters(adaptersData);
      setTweaks(tweaksData);
      setBattery(batteryData);
      setShowBatteryPercent(showPercentData);
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
      toast.success(`Battery percentage ${enabled ? "shown" : "hidden"} in taskbar - sign out/in if it doesn't update immediately.`);
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
      toast.success("DNS cache flushed");
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
      <div className="p-6 space-y-8">
        <section>
          <Skeleton className="h-7 w-40 mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card bg-base-200">
                <div className="card-body p-4 gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <Skeleton className="h-7 w-48 mb-2" />
          <TableSkeleton rows={3} columns={5} />
        </section>
        <section>
          <Skeleton className="h-7 w-56 mb-2" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-base-200">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Zap size={20} />
            Power Plans
          </h2>
          <button
            className="btn btn-sm tooltip tooltip-left"
            data-tip="Unlocks Windows' hidden max-performance power plan"
            onClick={enableUltimate}
          >
            Add Ultimate Performance Plan
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((p) => (
            <div key={p.guid} className={`card bg-base-200 ${p.active ? "ring-2 ring-primary" : ""}`}>
              <div className="card-body p-4">
                <div className="font-medium">{p.name}</div>
                {p.active ? (
                  <span className="badge badge-primary badge-sm w-fit">Active</span>
                ) : (
                  <button
                    className="btn btn-xs btn-outline w-fit tooltip"
                    data-tip="Switch to this power plan"
                    onClick={() => activatePlan(p.guid)}
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <BatterySection battery={battery} showPercent={showBatteryPercent} onToggleShowPercent={handleToggleShowPercent} />

      <section>
        <h2 className="text-xl font-black mb-2 flex items-center gap-2">
          <Wifi size={20} />
          Network Adapters
        </h2>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Link Speed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {adapters.map((a) => (
                <tr key={a.name}>
                  <td className="font-medium">{a.name}</td>
                  <td className="text-xs opacity-70">{a.description}</td>
                  <td>
                    <span className={`badge badge-sm ${a.status === "Up" ? "badge-success" : "badge-ghost"}`}>{a.status}</span>
                  </td>
                  <td className="text-xs">{a.linkSpeed}</td>
                  <td className="flex gap-1">
                    <button
                      className="btn btn-xs btn-outline tooltip tooltip-left"
                      data-tip="Change DNS servers for this adapter"
                      onClick={() => setDnsAdapter(a)}
                    >
                      <Globe size={12} />
                      DNS
                    </button>
                    <button
                      className="btn btn-xs btn-outline tooltip tooltip-left"
                      data-tip={a.status === "Up" ? "Disable this network adapter" : "Enable this network adapter"}
                      onClick={() => toggleAdapter(a)}
                    >
                      {a.status === "Up" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            className="btn btn-sm tooltip"
            data-tip="Clears the local DNS resolver cache"
            onClick={flushDns}
          >
            Flush DNS
          </button>
          <button
            className="btn btn-sm btn-outline tooltip"
            data-tip="Resets the Winsock catalog to defaults - requires restart"
            onClick={() => setResetConfirm("winsock")}
          >
            Reset Winsock
          </button>
          <button
            className="btn btn-sm btn-outline tooltip"
            data-tip="Resets the TCP/IP stack to defaults - requires restart"
            onClick={() => setResetConfirm("tcpip")}
          >
            Reset TCP/IP
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2 flex items-center gap-2">
          <SlidersHorizontal size={20} />
          Performance Tweaks
        </h2>
        <div className="space-y-2">
          {tweaks.map((t) => (
            <label key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-base-200 cursor-pointer">
              <div>
                <div className="font-medium">{t.label}</div>
                <div className="text-xs opacity-50">{t.description}</div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success tooltip tooltip-left"
                data-tip={t.enabled ? "Revert this tweak" : "Apply this tweak"}
                checked={t.enabled}
                onChange={() => toggleTweak(t)}
              />
            </label>
          ))}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(resetConfirm)}
        title={resetConfirm === "winsock" ? "Reset Winsock catalog?" : "Reset TCP/IP stack?"}
        message="This resets low-level networking settings to defaults and requires a restart to fully take effect. VPN/proxy configs may need to be reconfigured afterward."
        confirmLabel="Reset"
        onConfirm={() => doReset(resetConfirm)}
        onCancel={() => setResetConfirm(null)}
      />

      <DnsModal adapter={dnsAdapter} onClose={() => setDnsAdapter(null)} onApplied={() => setDnsAdapter(null)} />
    </div>
  );
}
