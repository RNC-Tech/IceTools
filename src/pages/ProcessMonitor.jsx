import React, { useEffect, useState } from "react";
import { XCircle, Search, Activity, Cpu, MemoryStick } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";

const PRIORITIES = ["Idle", "BelowNormal", "Normal", "AboveNormal", "High", "RealTime"];

export default function ProcessMonitor() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("memory"); // "memory" | "cpu" | "name"
  const [killTarget, setKillTarget] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function poll() {
      try {
        const data = await call(window.api.system.getProcesses());
        if (!cancelled) setProcesses(data);
      } catch (err) {
        if (!cancelled) toast.error(`Failed to list processes: ${err.message}`);
      } finally {
        if (!cancelled) setLoading(false);
        if (!cancelled) timer = setTimeout(poll, 2500);
      }
    }
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  async function handleKill() {
    if (!killTarget) return;
    try {
      await call(window.api.system.killProcess(killTarget.pid));
      toast.success(`Ended ${killTarget.name} (PID ${killTarget.pid})`);
    } catch (err) {
      toast.error(`Could not end process: ${err.message}`);
    } finally {
      setKillTarget(null);
    }
  }

  async function handlePriority(pid, name, priority) {
    try {
      await call(window.api.system.setPriority(pid, priority));
      toast.success(`Set ${name} priority to ${priority}`);
    } catch (err) {
      toast.error(`Could not change priority: ${err.message}`);
    }
  }

  const sortedProcesses = [...processes].sort((a, b) => {
    if (sortBy === "memory") return b.memBytes - a.memBytes;
    if (sortBy === "cpu") return (b.cpu || 0) - (a.cpu || 0);
    return a.name.localeCompare(b.name);
  });

  const filtered = sortedProcesses.filter(
    (p) => p.name.toLowerCase().includes(filter.toLowerCase()) || p.pid.toString().includes(filter)
  );

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Activity}
        title="Process Monitor"
        description="Inspect running system tasks, monitor real-time CPU & Memory consumption, adjust priorities, or terminate unresponsive tasks."
        badge="Task Manager"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input input-sm input-bordered w-full pl-9 rounded-xl bg-slate-900/60 border-blue-500/20 text-xs text-white"
            placeholder="Search processes or PID..."
            value={filter}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <span className="text-slate-400">Sort By:</span>
          <button
            className={`btn btn-xs rounded-full px-3 ${sortBy === "memory" ? "btn-primary" : "btn-ghost text-slate-300"}`}
            onClick={() => setSortBy("memory")}
          >
            <MemoryStick size={12} /> Memory
          </button>
          <button
            className={`btn btn-xs rounded-full px-3 ${sortBy === "cpu" ? "btn-primary" : "btn-ghost text-slate-300"}`}
            onClick={() => setSortBy("cpu")}
          >
            <Cpu size={12} /> CPU
          </button>
          <button
            className={`btn btn-xs rounded-full px-3 ${sortBy === "name" ? "btn-primary" : "btn-ghost text-slate-300"}`}
            onClick={() => setSortBy("name")}
          >
            Name
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-blue-500/15 shadow-xl">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="table table-sm w-full">
              <thead className="bg-[#0b172a]/90 text-xs text-slate-300 sticky top-0 backdrop-blur-md border-b border-blue-500/20">
                <tr>
                  <th className="w-20">PID</th>
                  <th>Process Name</th>
                  <th className="w-24 text-right">CPU Load</th>
                  <th className="w-32 text-right">Memory Used</th>
                  <th className="w-36 text-center">Priority</th>
                  <th className="w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.pid} className="border-b border-white/5 hover:bg-blue-500/5 transition-colors">
                    <td className="font-mono text-xs text-slate-400">{p.pid}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <AppIcon src={p.icon} />
                        <span className="font-medium text-xs text-slate-100 truncate max-w-[200px]">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-xs font-semibold">
                      {p.cpu > 0 ? (
                        <span className="text-amber-400 font-bold">{p.cpu}%</span>
                      ) : (
                        <span className="text-slate-500">0%</span>
                      )}
                    </td>
                    <td className="text-right font-mono text-xs font-bold text-blue-400">
                      {formatBytes(p.memBytes)}
                    </td>
                    <td className="text-center">
                      <select
                        className="select select-xs select-bordered rounded-lg bg-slate-900/80 border-blue-500/20 text-xs text-slate-200"
                        value={p.priority || "Normal"}
                        onChange={(e) => handlePriority(p.pid, p.name, e.target.value)}
                      >
                        {PRIORITIES.map((pr) => (
                          <option key={pr} value={pr}>
                            {pr}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-xs rounded-lg bg-rose-500/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold transition-all gap-1.5 px-3 py-1 shadow-sm hover:shadow-rose-500/30"
                        onClick={() => setKillTarget(p)}
                      >
                        <XCircle size={12} />
                        <span>End Process</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                      No processes matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(killTarget)}
        title="End process?"
        message={
          killTarget
            ? `This will forcibly terminate "${killTarget.name}" (PID ${killTarget.pid}). Any unsaved data in this process will be lost.`
            : ""
        }
        confirmLabel="End Process"
        onConfirm={handleKill}
        onCancel={() => setKillTarget(null)}
      />
    </div>
  );
}
