import React, { useCallback, useEffect, useState } from "react";
import { MemoryStick, XCircle } from "lucide-react";
import { Sparkles } from "../components/icons/index.js";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import AppIcon from "../components/AppIcon.jsx";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";

// There's no natural "100%" for a pile of junk files - 2GB is treated as a
// visually "full" bar. Byte-accurate totals per category live on Disk Cleanup.
const TEMP_FILES_SCALE_BYTES = 2 * 1024 * 1024 * 1024;
const SUMMARY_POLL_MS = 5000;

export default function MemoryCleaner() {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memoryPercent, setMemoryPercent] = useState(null);
  const [tempBytes, setTempBytes] = useState(null);
  const toast = useToast();

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
      // non-critical - summary bars just stay blank until the next poll
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
    setSelected(new Set(apps.map((a) => a.pid)));
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

  const selectedApps = apps.filter((a) => selected.has(a.pid));
  const selectedBytes = selectedApps.reduce((sum, a) => sum + a.memBytes, 0);
  const tempPercent = tempBytes === null ? 0 : Math.min(100, Math.round((tempBytes / TEMP_FILES_SCALE_BYTES) * 100));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-black flex items-center gap-2">
          <AnimatedIcon icon={MemoryStick} size={20} />
          Memory Cleaner
        </h2>
        <p className="text-sm opacity-60 mt-1">
          Trimming reclaims idle RAM from every process without closing anything - always safe. Closing background
          apps frees more, but ends those apps - only select ones you recognize as your own (updaters, chat apps,
          tray utilities). This list excludes core Windows, security, and virtualization processes, but can't know
          every dev tool or IDE you might have open.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body p-4 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide opacity-60">Memory Usage</span>
              <span className="text-sm font-medium">{memoryPercent === null ? "-" : `${memoryPercent}%`}</span>
            </div>
            <progress className="progress progress-primary w-full" value={memoryPercent ?? 0} max="100"></progress>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body p-4 gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide opacity-60">Temporary Files</span>
              <span className="text-sm font-medium">{tempBytes === null ? "-" : formatBytes(tempBytes)}</span>
            </div>
            <progress className="progress progress-secondary w-full" value={tempPercent} max="100"></progress>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-base-300">
        <div className="text-sm opacity-70">
          {selected.size > 0 ? `${selected.size} selected · ~${formatBytes(selectedBytes)}` : "Select background apps to close, or just trim"}
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline gap-2 tooltip tooltip-top"
            data-tip="Reclaims idle RAM from every process - never closes anything"
            onClick={() => runClean([])}
            disabled={working}
          >
            {working ? <span className="loading loading-spinner loading-sm"></span> : <Sparkles size={16} />}
            Quick Trim (safe)
          </button>
          <button
            className="btn btn-error gap-2 tooltip tooltip-top"
            data-tip="Force-closes the selected apps, then trims memory"
            disabled={selected.size === 0 || working}
            onClick={() => setConfirmOpen(true)}
          >
            <XCircle size={16} />
            Close Selected & Trim Memory
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-medium opacity-70">Background Apps</h3>
        <div className="flex gap-2">
          <button
            className="btn btn-xs tooltip tooltip-top"
            data-tip="Select every background app"
            onClick={selectAll}
            disabled={loading || apps.length === 0}
          >
            Select All
          </button>
          <button
            className="btn btn-xs tooltip tooltip-top"
            data-tip="Clear the current selection"
            onClick={clearSelection}
            disabled={selected.size === 0}
          >
            Clear
          </button>
          <button
            className="btn btn-xs tooltip tooltip-top"
            data-tip="Refresh the background apps list"
            onClick={loadApps}
            disabled={loading}
          >
            Rescan
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : (
        <div className="overflow-x-auto max-h-[50vh]">
          <table className="table table-sm table-fixed w-full">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Name</th>
                <th className="w-24">PID</th>
                <th className="w-32">Memory</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.pid}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selected.has(a.pid)}
                      onChange={() => toggleSelected(a.pid)}
                    />
                  </td>
                  <td className="truncate">
                    <div className="flex items-center gap-2">
                      <AppIcon src={a.icon} />
                      {a.name}
                    </div>
                  </td>
                  <td className="opacity-60">{a.pid}</td>
                  <td>{formatBytes(a.memBytes)}</td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center opacity-60 py-6">
                    No background apps detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Close selected background apps?"
        message={`This will forcibly end ${selected.size} app(s) and trim memory for everything else. Unsaved data in those apps will be lost.`}
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
