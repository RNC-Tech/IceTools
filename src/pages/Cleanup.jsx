import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
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
        toast.success("Selected junk categories cleaned.");
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2">
          <AnimatedIcon icon={Trash2} size={20} spin />
          Disk & Junk Cleanup
        </h2>
        <button className="btn btn-sm tooltip tooltip-left" data-tip="Re-scan disk usage" onClick={scan} disabled={loading}>
          Rescan
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-base-200">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-base-200 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm tooltip tooltip-right"
                  data-tip="Include this category in the next cleanup"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelected(c.id)}
                />
                <div>
                  <div className="font-medium">{c.label}</div>
                  <div className="text-xs opacity-50">{c.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{c.sizeBytes === null ? "—" : formatBytes(c.sizeBytes)}</div>
                {c.fileCount !== null && <div className="text-xs opacity-50">{c.fileCount} files</div>}
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-base-300">
        <div className="text-sm opacity-70">
          {selected.size > 0 ? `${selected.size} selected · ~${formatBytes(totalSelectedBytes)}` : "Select categories to clean"}
        </div>
        <button
          className="btn btn-primary tooltip tooltip-left"
          data-tip="Permanently delete files in the selected categories"
          disabled={selected.size === 0 || cleaning}
          onClick={() => setConfirmOpen(true)}
        >
          {cleaning ? <span className="loading loading-spinner loading-sm"></span> : "Clean Selected"}
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete selected junk files?"
        message="This permanently deletes files in the selected categories (not moved to Recycle Bin, except the Recycle Bin category itself which empties it). Locked/in-use files are skipped automatically."
        confirmLabel="Delete"
        onConfirm={handleClean}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
