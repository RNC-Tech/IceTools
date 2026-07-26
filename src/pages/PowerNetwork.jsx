import React, { useCallback, useEffect, useState } from "react";
import { Zap, Wifi, SlidersHorizontal } from "../components/icons/index.js";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { Skeleton, TableSkeleton } from "../components/Skeleton.jsx";

export default function PowerNetwork() {
  const [plans, setPlans] = useState([]);
  const [adapters, setAdapters] = useState([]);
  const [tweaks, setTweaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(null); // "winsock" | "tcpip" | null
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, adaptersData, tweaksData] = await Promise.all([
        call(window.api.power.listPlans()),
        call(window.api.network.listAdapters()),
        call(window.api.tweaks.list()),
      ]);
      setPlans(plansData);
      setAdapters(adaptersData);
      setTweaks(tweaksData);
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
          <button className="btn btn-sm" onClick={enableUltimate}>
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
                  <button className="btn btn-xs btn-outline w-fit" onClick={() => activatePlan(p.guid)}>
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

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
                  <td>
                    <button className="btn btn-xs btn-outline" onClick={() => toggleAdapter(a)}>
                      {a.status === "Up" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn btn-sm" onClick={flushDns}>
            Flush DNS
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setResetConfirm("winsock")}>
            Reset Winsock
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setResetConfirm("tcpip")}>
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
                className="toggle toggle-success"
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
    </div>
  );
}
