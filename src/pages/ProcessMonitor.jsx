import React, { useEffect, useState } from "react";
import { Square } from "lucide-react";
import { Activity } from "../components/icons/index.js";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filtered = processes.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Activity size={20} />
          Process Monitor
        </h2>
        <input
          className="input input-sm input-bordered w-64"
          placeholder="Filter by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : (
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="table table-sm table-pin-rows">
          <thead>
            <tr>
              <th>PID</th>
              <th>Name</th>
              <th>CPU %</th>
              <th>Memory</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.pid}>
                <td className="opacity-60">{p.pid}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <AppIcon src={p.icon} />
                    {p.name}
                  </div>
                </td>
                <td>{p.cpu}</td>
                <td>{formatBytes(p.memBytes)}</td>
                <td>
                  <select
                    className="select select-xs select-bordered"
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
                <td>
                  <button className="btn btn-xs btn-error btn-outline gap-1" onClick={() => setKillTarget(p)}>
                    <Square size={12} />
                    End
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <ConfirmModal
        open={Boolean(killTarget)}
        title="End process?"
        message={killTarget ? `This will forcibly terminate "${killTarget.name}" (PID ${killTarget.pid}) and its child processes. Unsaved data in that process will be lost.` : ""}
        confirmLabel="End process"
        onConfirm={handleKill}
        onCancel={() => setKillTarget(null)}
      />
    </div>
  );
}
