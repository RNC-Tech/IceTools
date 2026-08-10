import React, { useCallback, useEffect, useState } from "react";
import { Package, Trash2, FolderX, Search, ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

export default function Uninstaller() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [working, setWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leftovers, setLeftovers] = useState(null);
  const [selectedLeftovers, setSelectedLeftovers] = useState(new Set());
  const [confirmLeftoversOpen, setConfirmLeftoversOpen] = useState(false);
  const toast = useToast();

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(window.api.uninstaller.listApps());
      setApps(data);
    } catch (err) {
      toast.error(`Failed to list installed apps: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  function toggleSelected(keyPath) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(keyPath)) next.delete(keyPath);
      else next.add(keyPath);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filteredApps.map((a) => a.keyPath)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function runUninstall() {
    setConfirmOpen(false);
    const targets = apps.filter((a) => selected.has(a.keyPath));
    setWorking(true);
    setLeftovers(null);
    const succeeded = [];
    try {
      for (const app of targets) {
        try {
          await call(window.api.uninstaller.uninstallApp(app.keyPath));
          toast.success(`Uninstalled "${app.displayName}".`);
          succeeded.push(app);
        } catch (err) {
          toast.error(`Failed to uninstall "${app.displayName}": ${err.message}`);
        }
      }

      if (succeeded.length > 0) {
        try {
          const found = await call(window.api.uninstaller.scanLeftovers(succeeded));
          if (found.length > 0) {
            setLeftovers(found);
            setSelectedLeftovers(new Set(found.map((_, i) => i)));
          } else {
            toast.info("No leftover files or registry entries found.");
          }
        } catch (err) {
          toast.error(`Leftover scan failed: ${err.message}`);
        }
      }
    } finally {
      setSelected(new Set());
      setWorking(false);
      loadApps();
    }
  }

  function toggleLeftover(index) {
    setSelectedLeftovers((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function deleteSelectedLeftovers() {
    setConfirmLeftoversOpen(false);
    const items = leftovers.filter((_, i) => selectedLeftovers.has(i));
    setWorking(true);
    try {
      const outcomes = await call(window.api.uninstaller.deleteLeftovers(items));
      const failed = outcomes.filter((o) => !o.success);
      if (failed.length === 0) {
        toast.success(`Removed ${outcomes.length} leftover item(s).`);
      } else {
        toast.error(`Removed ${outcomes.length - failed.length} of ${outcomes.length} - some items failed.`);
      }
      setLeftovers(null);
    } catch (err) {
      toast.error(`Failed to remove leftovers: ${err.message}`);
    } finally {
      setWorking(false);
    }
  }

  const filteredApps = apps.filter(
    (a) =>
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (a.publisher || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedApps = apps.filter((a) => selected.has(a.keyPath));

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Package}
        title="Application Uninstaller"
        description="Cleanly uninstall installed applications and automatically scan & remove lingering leftover files or registry items."
        badge="App Manager"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search installed applications..."
            className="input input-sm input-bordered w-full pl-9 rounded-xl bg-slate-900/60 border-blue-500/20 text-xs text-white"
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
          <button className="btn btn-xs btn-outline rounded-full px-3 border-blue-500/30 text-blue-300" onClick={loadApps} disabled={loading || working}>
            Rescan
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-blue-500/15 shadow-xl">
          <div className="overflow-x-auto max-h-[50vh]">
            <table className="table table-sm w-full">
              <thead className="bg-[#0b172a]/90 text-xs text-slate-300 sticky top-0 backdrop-blur-md border-b border-blue-500/20">
                <tr>
                  <th className="w-10"></th>
                  <th>Application</th>
                  <th className="w-48">Publisher</th>
                  <th className="w-28 text-center">Version</th>
                  <th className="w-32 text-right">Disk Size</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((a) => {
                  const isChecked = selected.has(a.keyPath);
                  return (
                    <tr
                      key={a.keyPath}
                      onClick={() => toggleSelected(a.keyPath)}
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
                          disabled={working}
                        />
                      </td>
                      <td className="font-bold text-xs text-white">
                        <div className="flex items-center gap-2.5">
                          <AppIcon src={a.icon} />
                          <span className="truncate max-w-[240px]">{a.displayName}</span>
                        </div>
                      </td>
                      <td className="text-xs text-slate-400 truncate max-w-[180px]">
                        {a.publisher || "—"}
                      </td>
                      <td className="text-center font-mono text-xs text-slate-400">{a.version || "—"}</td>
                      <td className="text-right font-mono text-xs font-bold text-blue-400">
                        {a.sizeBytes ? formatBytes(a.sizeBytes) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                      No matching installed applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {leftovers && leftovers.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-500/10 space-y-3">
          <h3 className="font-bold text-base flex items-center gap-2 text-amber-400">
            <FolderX size={18} /> Leftover Files & Registry Items Detected
          </h3>
          <p className="text-xs text-slate-300">
            Review lingering folders or registry entries left behind by the uninstaller before proceeding with cleanup.
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {leftovers.map((item, i) => (
              <label
                key={`${item.type}-${item.path}`}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-blue-500/15 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-warning checkbox-xs mt-0.5 rounded"
                  checked={selectedLeftovers.has(i)}
                  onChange={() => toggleLeftover(i)}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white">{item.appName}</div>
                  <div className="font-mono text-[11px] text-slate-400 truncate" title={item.path}>
                    {item.type === "registry" ? "[Registry] " : "[Folder] "}
                    {item.path}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-xs btn-ghost text-slate-300" onClick={() => setLeftovers(null)}>
              Dismiss
            </button>
            <button
              className="btn btn-xs btn-warning rounded-full px-3 gap-1"
              onClick={() => setConfirmLeftoversOpen(true)}
              disabled={selectedLeftovers.size === 0 || working}
            >
              <Trash2 size={12} />
              Delete {selectedLeftovers.size} Leftovers
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-500/20 bg-[#0b172a]/95 shadow-xl">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-400 shrink-0" />
          <span>
            {selected.size > 0
              ? `${selected.size} application(s) selected for uninstallation`
              : "Select applications above to begin bulk uninstallation"}
          </span>
        </div>

        <button
          className="btn btn-error btn-sm rounded-full gap-2 px-6 shadow-lg shadow-rose-500/25"
          disabled={selected.size === 0 || working}
          onClick={() => setConfirmOpen(true)}
        >
          {working ? <span className="loading loading-spinner loading-sm"></span> : <Trash2 size={15} />}
          Uninstall Selected ({selected.size})
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Uninstall selected applications?"
        message={`This will execute the uninstaller for ${selectedApps.length} app(s): ${selectedApps
          .map((a) => a.displayName)
          .join(", ")}. Follow any prompts displayed by their uninstallers.`}
        confirmLabel="Uninstall Apps"
        onConfirm={runUninstall}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmModal
        open={confirmLeftoversOpen}
        title="Delete leftover files & registry keys?"
        message={`This permanently deletes ${selectedLeftovers.size} leftover folder(s) or registry item(s).`}
        confirmLabel="Delete Leftovers"
        onConfirm={deleteSelectedLeftovers}
        onCancel={() => setConfirmLeftoversOpen(false)}
      />
    </div>
  );
}
