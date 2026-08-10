import React, { useCallback, useEffect, useState } from "react";
import { MemoryStick, XCircle, Search, ShieldCheck, HardDrive } from "lucide-react";
import { Sparkles } from "../components/icons/index.js";
import PageHeader from "../components/PageHeader.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";
import { useIconHover } from "../lib/useIconHover.js";

const TEMP_FILES_SCALE_BYTES = 2 * 1024 * 1024 * 1024;
const SUMMARY_POLL_MS = 5000;

export default function MemoryCleaner() {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memoryPercent, setMemoryPercent] = useState(null);
  const [tempBytes, setTempBytes] = useState(null);
  const toast = useToast();
  const trimIcon = useIconHover();

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(window.api.memory.listBackgroundApps());
      setApps(data);
    } catch (err) {
      toast.error(`Failed to list background apps: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadSummary = useCallback(async () => {
    try {
      const [live, temp] = await Promise.all([
        call(window.api.system.getLiveStats()),
        call(window.api.cleanup.getTempFilesSize()),
      ]);
      setMemoryPercent(live.memory.usedPercent);
      setTempBytes(temp.sizeBytes);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadApps();
    loadSummary();
    const timer = setInterval(loadSummary, SUMMARY_POLL_MS);
    return () => clearInterval(timer);
  }, [loadApps, loadSummary]);

  function toggleSelected(pid) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filteredApps.map((a) => a.pid)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function runClean(pids) {
    setWorking(true);
    try {
      const result = await call(window.api.memory.cleanMemory(pids));
      const closedText = result.closedCount > 0 ? `Closed ${result.closedCount} app(s). ` : "";
      toast.success(`${closedText}Freed ~${formatBytes(result.freedBytes)} of RAM.`);
      setSelected(new Set());
      await Promise.all([loadApps(), loadSummary()]);
    } catch (err) {
      toast.error(`Memory cleanup failed: ${err.message}`);
    } finally {
      setWorking(false);
    }
  }

  const filteredApps = apps.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.pid.toString().includes(search)
  );

  const selectedApps = apps.filter((a) => selected.has(a.pid));
  const selectedBytes = selectedApps.reduce((sum, a) => sum + a.memBytes, 0);

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={MemoryStick}
        title="Memory Cleaner"
        description="Reclaims idle system RAM from applications without closing essential processes."
        badge="RAM Optimizer"
        actions={
          <button
            className="btn btn-sm btn-primary rounded-full px-5 gap-2 shadow-lg shadow-blue-500/30 font-bold"
            onClick={() => runClean([])}
            onMouseEnter={trimIcon.onMouseEnter}
            onMouseLeave={trimIcon.onMouseLeave}
            disabled={working}
          >
            {working ? <span className="loading loading-spinner loading-xs"></span> : <Sparkles ref={trimIcon.ref} size={15} />}
            Quick Trim (Always Safe)
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MetricCard
          icon={MemoryStick}
          label="RAM Usage"
          value={memoryPercent === null ? "—" : `${memoryPercent}%`}
          sub="Live System RAM load"
          progress={memoryPercent ?? 0}
          warnAt={80}
        />
        <MetricCard
          icon={HardDrive}
          label="Temporary Cache"
          value={tempBytes === null ? "—" : formatBytes(tempBytes)}
          sub="Cleanable temporary cache space"
          progress={tempBytes === null ? 0 : Math.min(100, Math.round((tempBytes / TEMP_FILES_SCALE_BYTES) * 100))}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search background apps..."
            className="input input-sm input-bordered w-full pl-9 rounded-xl bg-slate-900/60 border-blue-500/20 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button className="btn btn-xs btn-ghost text-slate-300 hover:text-white" onClick={selectAll} disabled={loading || filteredApps.length === 0}>
            Select All
          </button>
          <button className="btn btn-xs btn-ghost text-slate-300 hover:text-white" onClick={clearSelection} disabled={selected.size === 0}>
            Clear
          </button>
          <button className="btn btn-xs btn-outline rounded-full px-3.5 border-blue-500/30 text-blue-300" onClick={loadApps} disabled={loading}>
            Rescan Apps
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-blue-500/15 shadow-xl">
          <div className="overflow-x-auto max-h-[45vh]">
            <table className="table table-sm w-full">
              <thead className="bg-[#0b172a]/90 text-xs text-slate-300 sticky top-0 backdrop-blur-md border-b border-blue-500/20">
                <tr>
                  <th className="w-10"></th>
                  <th>Application Name</th>
                  <th className="w-28 text-right">PID</th>
                  <th className="w-36 text-right">Memory Used</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((a) => {
                  const isChecked = selected.has(a.pid);
                  return (
                    <tr
                      key={a.pid}
                      onClick={() => toggleSelected(a.pid)}
                      className={`border-b border-white/5 cursor-pointer hover:bg-blue-500/5 transition-colors ${
                        isChecked ? "bg-blue-500/10" : ""
                      }`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm rounded-md"
                          checked={isChecked}
                          onChange={() => {}}
                        />
                      </td>
                      <td className="font-semibold text-xs text-white">
                        <div className="flex items-center gap-2.5">
                          <AppIcon src={a.icon} />
                          <span>{a.name}</span>
                        </div>
                      </td>
                      <td className="text-right font-mono text-xs text-slate-400">{a.pid}</td>
                      <td className="text-right font-mono text-xs font-bold text-blue-400">
                        {formatBytes(a.memBytes)}
                      </td>
                    </tr>
                  );
                })}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                      No matching background applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-500/20 bg-[#0b172a]/95 shadow-xl">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-400 shrink-0" />
          <span>
            {selected.size > 0
              ? `${selected.size} background apps selected (~${formatBytes(selectedBytes)} RAM)`
              : "Select background apps above to force-close and trim RAM"}
          </span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            className="btn btn-error btn-sm rounded-full px-5 gap-2 w-full sm:w-auto shadow-lg shadow-rose-500/25 font-bold"
            disabled={selected.size === 0 || working}
            onClick={() => setConfirmOpen(true)}
          >
            <XCircle size={15} />
            Close Selected & Trim
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Close selected apps?"
        message={`This will forcibly close ${selected.size} background application(s) and trim system memory. Save open work in those applications before proceeding.`}
        confirmLabel="Close & Clean"
        onConfirm={() => {
          setConfirmOpen(false);
          runClean(Array.from(selected));
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
