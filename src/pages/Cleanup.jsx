import React, { useCallback, useEffect, useState } from "react";
import { Trash2, RotateCw, ShieldCheck, HardDrive } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

export default function Cleanup() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(window.api.cleanup.scan());
      setCategories(data);
      const autoSelected = new Set(data.filter((c) => c.sizeBytes && c.sizeBytes > 0).map((c) => c.id));
      setSelected(autoSelected);
    } catch (err) {
      toast.error(`Scan failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    scan();
  }, [scan]);

  function toggleSelected(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(categories.map((c) => c.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  const totalSelectedBytes = categories
    .filter((c) => selected.has(c.id) && typeof c.sizeBytes === "number")
    .reduce((sum, c) => sum + c.sizeBytes, 0);

  async function handleClean() {
    setConfirmOpen(false);
    setCleaning(true);
    try {
      const outcomes = await call(window.api.cleanup.clean(Array.from(selected)));
      const failed = outcomes.filter((o) => !o.success);
      if (failed.length === 0) {
        toast.success("Selected junk categories cleaned successfully!");
      } else {
        toast.error(`Some categories failed: ${failed.map((f) => f.id).join(", ")}`);
      }
      setSelected(new Set());
      await scan();
    } catch (err) {
      toast.error(`Cleanup failed: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Trash2}
        title="Disk & Junk Cleanup"
        description="Scans and removes temporary files, system logs, cache leftovers, and Recycle Bin items."
        badge="Storage Optimizer"
        actions={
          <button className="btn btn-sm btn-outline rounded-full px-4 gap-2 border-blue-500/30" onClick={scan} disabled={loading}>
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
            Rescan Junk
          </button>
        }
      />

      <div className="glass-card p-4 rounded-2xl border border-blue-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <ShieldCheck size={16} className="text-blue-400" />
          <span>All cleanup actions only target temporary caches and are 100% safe for your system.</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-xs btn-ghost text-xs text-slate-300 hover:text-white" onClick={selectAll}>Select All</button>
          <span className="opacity-30 text-slate-500">|</span>
          <button className="btn btn-xs btn-ghost text-xs text-slate-300 hover:text-white" onClick={deselectAll}>Deselect All</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl glass-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((c) => {
            const isChecked = selected.has(c.id);
            return (
              <div
                key={c.id}
                onClick={() => toggleSelected(c.id)}
                className={`glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                  isChecked ? "border-blue-500/50 bg-blue-500/10" : "border-blue-500/15"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm rounded-md"
                    checked={isChecked}
                    onChange={() => {}}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{c.label}</span>
                      <span className="badge badge-xs bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] uppercase font-semibold rounded-md">Safe</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold text-blue-400">
                    {c.sizeBytes === null ? "—" : formatBytes(c.sizeBytes)}
                  </div>
                  {c.fileCount !== null && (
                    <div className="text-xs text-slate-400">{c.fileCount} files</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between border border-blue-500/30 bg-[#0b172a]/95 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <HardDrive size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Selected for Cleanup</span>
            <div className="text-lg font-black text-white font-mono">
              {selected.size > 0 ? `~${formatBytes(totalSelectedBytes)}` : "0 Bytes"}
              <span className="text-xs font-normal text-slate-400 ml-2">({selected.size} categories selected)</span>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary rounded-full gap-2 px-6 shadow-lg shadow-blue-500/30 font-bold"
          disabled={selected.size === 0 || cleaning}
          onClick={() => setConfirmOpen(true)}
        >
          {cleaning ? <span className="loading loading-spinner loading-sm"></span> : <Trash2 size={16} />}
          Clean Selected Files
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete selected junk files?"
        message="This permanently deletes temporary files in selected categories (and empties Recycle Bin if selected). Active locked files are safely skipped."
        confirmLabel="Clean Files"
        onConfirm={handleClean}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
