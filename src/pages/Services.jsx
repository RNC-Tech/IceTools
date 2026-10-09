import React, { useCallback, useEffect, useState } from "react";
import { Search, Play, Square, RotateCw, ShieldAlert } from "lucide-react";
import { Settings } from "../components/icons/index.js";
import PageHeader from "../components/PageHeader.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const START_TYPES = ["Automatic", "AutomaticDelayedStart", "Manual", "Disabled"];

export default function Services({ isAdmin }) {
  const [services, setServices] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "running" | "stopped"
  const [loading, setLoading] = useState(true);
  const [stopTarget, setStopTarget] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(window.api.services.list());
      setServices(data);
    } catch (err) {
      toast.error(`Failed to load services: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(name, action) {
    try {
      await call(window.api.services.setStatus(name, action));
      toast.success(`${action} sent to "${name}"`);
      load();
    } catch (err) {
      toast.error(`Failed to ${action} "${name}": ${err.message}`);
    }
  }

  async function handleStartType(name, startType) {
    try {
      await call(window.api.services.setStartType(name, startType));
      toast.success(`"${name}" startup type set to ${startType}`);
      load();
    } catch (err) {
      toast.error(`Failed to update startup type: ${err.message}`);
    }
  }

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      (s.displayName || "").toLowerCase().includes(filter.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "running") return s.status === "Running";
    if (statusFilter === "stopped") return s.status !== "Running";
    return true;
  });

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Settings}
        title="Windows Services"
        description="View and control Windows background services, start types, and runtime states."
        badge="System Control"
      />

      {!isAdmin && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={16} className="shrink-0 text-amber-400" />
            <span>Administrator privileges are required to start, stop, or change startup types of Windows services.</span>
          </div>
          <button
            onClick={() => call(window.api.app.relaunchAsAdmin()).catch((err) => toast.error(err.message))}
            className="btn btn-xs rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 shrink-0 ml-3 shadow-sm"
          >
            Restart as Admin
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input input-sm input-bordered w-full pl-9 rounded-lg bg-slate-900/60 border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50"
            placeholder="Search services by name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="inline-flex p-1 bg-black/25 rounded-xl border border-white/[0.06] gap-1 w-full sm:w-auto justify-end">
          <button
            className={`btn btn-xs rounded-lg px-3 font-medium transition-all ${statusFilter === "all" ? "bg-blue-600 text-white font-semibold shadow-sm" : "btn-ghost text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({services.length})
          </button>
          <button
            className={`btn btn-xs rounded-lg px-3 font-medium transition-all ${statusFilter === "running" ? "bg-blue-600 text-white font-semibold shadow-sm" : "btn-ghost text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}
            onClick={() => setStatusFilter("running")}
          >
            Running ({services.filter((s) => s.status === "Running").length})
          </button>
          <button
            className={`btn btn-xs rounded-lg px-3 font-medium transition-all ${statusFilter === "stopped" ? "bg-blue-600 text-white font-semibold shadow-sm" : "btn-ghost text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}
            onClick={() => setStatusFilter("stopped")}
          >
            Stopped ({services.filter((s) => s.status !== "Running").length})
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="table table-sm w-full">
              <thead className="bg-slate-900/90 text-xs text-slate-300 sticky top-0 backdrop-blur-md border-b border-white/[0.06]">
                <tr>
                  <th>Service Details</th>
                  <th className="w-28 text-center">Status</th>
                  <th className="w-40 text-center">Startup Type</th>
                  <th className="w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.name} className="border-b border-white/5 hover:bg-blue-500/5 transition-colors">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <AppIcon src={s.icon} />
                        <div>
                          <div className="font-bold text-xs text-white">{s.displayName || s.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{s.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge badge-xs font-semibold rounded-md px-2.5 py-1 ${
                          s.status === "Running"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <select
                        className="select select-xs select-bordered rounded-lg bg-slate-900/80 border-blue-500/20 text-xs text-slate-200"
                        value={s.startType}
                        onChange={(e) => handleStartType(s.name, e.target.value)}
                      >
                        {START_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === "Running" ? (
                          <button
                            className="btn btn-xs rounded-lg bg-amber-500/20 hover:bg-amber-600 border border-amber-500/40 text-amber-300 hover:text-white font-bold gap-1 px-2.5"
                            onClick={() => setStopTarget(s)}
                          >
                            <Square size={11} /> Stop
                          </button>
                        ) : (
                          <button
                            className="btn btn-xs rounded-lg bg-emerald-500/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold gap-1 px-2.5"
                            onClick={() => runAction(s.name, "start")}
                          >
                            <Play size={11} /> Start
                          </button>
                        )}
                        <button
                          className="btn btn-xs rounded-lg bg-blue-500/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white font-bold gap-1 px-2.5"
                          onClick={() => runAction(s.name, "restart")}
                        >
                          <RotateCw size={11} /> Restart
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                      No services match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(stopTarget)}
        title="Stop service?"
        message={
          stopTarget
            ? `Stopping "${stopTarget.displayName || stopTarget.name}" may temporarily disable features that rely on it.`
            : ""
        }
        confirmLabel="Stop Service"
        onConfirm={() => {
          runAction(stopTarget.name, "stop");
          setStopTarget(null);
        }}
        onCancel={() => setStopTarget(null)}
      />
    </div>
  );
}
