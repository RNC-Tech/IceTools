import React, { useCallback, useEffect, useState } from "react";
import { Package, Trash2, FolderX, AlertTriangle } from "lucide-react";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

export default function Uninstaller() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
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
    setSelected(new Set(apps.map((a) => a.keyPath)));
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

  const selectedApps = apps.filter((a) => selected.has(a.keyPath));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-black flex items-center gap-2">
          <AnimatedIcon icon={Package} size={20} />
          Bulk Uninstaller
        </h2>
        <p className="text-sm opacity-60 mt-1">
          Select apps to uninstall using their own registered uninstaller. Some uninstallers show their own window -
          follow any prompts they display. After uninstalling, IceTools scans for leftover folders or registry
          entries and lets you review and remove them individually - nothing is deleted without your confirmation.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm opacity-70">
          {selected.size > 0 ? `${selected.size} selected` : `${apps.length} installed apps`}
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-xs tooltip tooltip-top"
            data-tip="Select every installed app"
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
            data-tip="Refresh the installed apps list"
            onClick={loadApps}
            disabled={loading || working}
          >
            Rescan
          </button>
          <button
            className="btn btn-xs btn-error gap-1 tooltip tooltip-top"
            data-tip="Runs each selected app's own uninstaller"
            onClick={() => setConfirmOpen(true)}
            disabled={selected.size === 0 || working}
          >
            <Trash2 size={12} />
            Uninstall Selected
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={10} columns={4} />
      ) : (
        <div className="overflow-x-auto max-h-[55vh]">
          <table className="table table-sm table-fixed w-full">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Name</th>
                <th className="w-40">Publisher</th>
                <th className="w-24">Version</th>
                <th className="w-28">Size</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.keyPath}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selected.has(a.keyPath)}
                      onChange={() => toggleSelected(a.keyPath)}
                      disabled={working}
                    />
                  </td>
                  <td className="truncate">
                    <div className="flex items-center gap-2">
                      <AppIcon src={a.icon} />
                      <span className="truncate">{a.displayName}</span>
                    </div>
                  </td>
                  <td className="truncate opacity-70">{a.publisher || "-"}</td>
                  <td className="opacity-70">{a.version || "-"}</td>
                  <td className="opacity-70">{a.sizeBytes ? formatBytes(a.sizeBytes) : "-"}</td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center opacity-60 py-6">
                    No installed apps detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {leftovers && leftovers.length > 0 && (
        <div className="card bg-base-200 mt-4">
          <div className="card-body gap-3">
            <h3 className="font-black text-lg flex items-center gap-2">
              <FolderX size={18} className="text-warning shrink-0" />
              Leftovers Found
            </h3>
            <p className="text-sm opacity-70">
              These weren't removed by the uninstaller(s) above. Review the list and uncheck anything you'd rather
              keep before deleting.
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {leftovers.map((item, i) => (
                <label key={`${item.type}-${item.path}`} className="flex items-start gap-2 p-2 rounded-md bg-base-100 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm mt-0.5"
                    checked={selectedLeftovers.has(i)}
                    onChange={() => toggleLeftover(i)}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.appName}</div>
                    <div className="text-xs opacity-60 truncate" title={item.path}>
                      {item.type === "registry" ? "Registry: " : "Folder: "}
                      {item.path}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-sm btn-ghost" onClick={() => setLeftovers(null)}>
                Dismiss
              </button>
              <button
                className="btn btn-sm btn-error gap-1.5"
                onClick={() => setConfirmLeftoversOpen(true)}
                disabled={selectedLeftovers.size === 0 || working}
              >
                <Trash2 size={14} />
                Delete Selected ({selectedLeftovers.size})
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Uninstall selected apps?"
        message={`This will run the uninstaller for ${selectedApps.length} app(s): ${selectedApps
          .map((a) => a.displayName)
          .join(", ")}. Some uninstallers may show their own window and need you to click through them.`}
        confirmLabel="Uninstall"
        onConfirm={runUninstall}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmModal
        open={confirmLeftoversOpen}
        title="Delete leftover files?"
        message={`This permanently deletes ${selectedLeftovers.size} leftover item(s) - folders are removed entirely, registry entries are deleted. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={deleteSelectedLeftovers}
        onCancel={() => setConfirmLeftoversOpen(false)}
      />

      {apps.length === 0 && !loading && (
        <div className="flex items-center gap-2 text-xs opacity-50 pt-2">
          <AlertTriangle size={13} />
          Some apps only register themselves for the signed-in user and won't appear when IceTools is run as a
          different account.
        </div>
      )}
    </div>
  );
}
