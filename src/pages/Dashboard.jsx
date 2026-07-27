import React, { useEffect, useState } from "react";
import { LayoutDashboard, MemoryStick, HardDrive, Gpu, Sparkles, HardDriveDownload } from "lucide-react";
import { Cpu } from "../components/icons/index.js";
import StatCard from "../components/StatCard.jsx";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { Skeleton, StatCardSkeleton } from "../components/Skeleton.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const LIVE_POLL_MS = 2000;
const SLOW_REFRESH_EVERY_N_POLLS = 10; // disks/GPU refreshed roughly every 20s

function CpuDetailModal({ open, onClose, perCore }) {
  if (!open) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-black text-lg">Per-Core Load</h3>
        <div className="grid grid-cols-2 gap-3 py-4">
          {(perCore || []).map((load, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs opacity-70">
                <span>Core {i}</span>
                <span>{load}%</span>
              </div>
              <progress className="progress progress-primary w-full" value={load} max="100"></progress>
            </div>
          ))}
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

function MemoryDetailModal({ open, onClose }) {
  const [processes, setProcesses] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setProcesses(null);
    call(window.api.system.getProcesses())
      .then((data) => setProcesses([...data].sort((a, b) => b.memBytes - a.memBytes).slice(0, 10)))
      .catch((err) => toast.error(`Failed to load processes: ${err.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-black text-lg">Top Memory Consumers</h3>
        <div className="py-4">
          {processes === null ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <table className="table table-sm">
              <tbody>
                {processes.map((p) => (
                  <tr key={p.pid}>
                    <td className="truncate max-w-[200px]">{p.name}</td>
                    <td className="text-right font-mono">{formatBytes(p.memBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [trimming, setTrimming] = useState(false);
  const [optimizing, setOptimizing] = useState(new Set());
  const [optimizeTarget, setOptimizeTarget] = useState(null);
  const [detailModal, setDetailModal] = useState(null); // "cpu" | "memory" | null
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    let timer;
    let pollCount = 0;

    async function poll() {
      try {
        if (pollCount % SLOW_REFRESH_EVERY_N_POLLS === 0) {
          const [full, gpuStats] = await Promise.all([
            call(window.api.system.getStats()),
            call(window.api.system.getGpuStats()),
          ]);
          if (!cancelled) {
            setStats(full);
            setGpu(gpuStats);
          }
        } else {
          const live = await call(window.api.system.getLiveStats());
          if (!cancelled) {
            setStats((prev) => (prev ? { ...prev, cpu: { ...prev.cpu, ...live.cpu }, memory: live.memory } : prev));
          }
        }
      } catch (err) {
        if (!cancelled) toast.error(`Failed to read system stats: ${err.message}`);
      } finally {
        pollCount += 1;
        if (!cancelled) timer = setTimeout(poll, LIVE_POLL_MS);
      }
    }
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleQuickTrim() {
    setTrimming(true);
    try {
      const result = await call(window.api.memory.cleanMemory([]));
      toast.success(`Freed ~${formatBytes(result.freedBytes)} of RAM.`);
    } catch (err) {
      toast.error(`Trim failed: ${err.message}`);
    } finally {
      setTrimming(false);
    }
  }

  async function handleOptimize(mount) {
    setOptimizeTarget(null);
    setOptimizing((prev) => new Set(prev).add(mount));
    try {
      await call(window.api.system.optimizeDisk(mount));
      toast.success(`${mount} optimized.`);
    } catch (err) {
      toast.error(`Optimize failed for ${mount}: ${err.message}`);
    } finally {
      setOptimizing((prev) => {
        const next = new Set(prev);
        next.delete(mount);
        return next;
      });
    }
  }

  if (!stats) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-7 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-black flex items-center gap-2">
        <AnimatedIcon icon={LayoutDashboard} size={20} />
        System Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cursor-pointer" onClick={() => setDetailModal("cpu")}>
          <StatCard
            icon={Cpu}
            label="CPU Load"
            value={`${stats.cpu.loadPercent}%`}
            sub={`${stats.cpu.cores} cores · ${stats.cpu.model} · click for per-core`}
            progress={stats.cpu.loadPercent}
          />
        </div>

        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4 gap-2">
            <div className="cursor-pointer" onClick={() => setDetailModal("memory")}>
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-60">
                <MemoryStick size={13} />
                Memory Used
              </span>
              <span className="text-2xl font-black">{stats.memory.usedPercent}%</span>
              <span className="text-xs opacity-60 block">
                {formatBytes(stats.memory.usedBytes)} / {formatBytes(stats.memory.totalBytes)} · click for top processes
              </span>
              <progress className="progress progress-primary w-full mt-1" value={stats.memory.usedPercent} max="100"></progress>
            </div>
            <button
              className="btn btn-xs btn-outline gap-1 w-fit tooltip"
              data-tip="Reclaims idle RAM - always safe"
              onClick={handleQuickTrim}
              disabled={trimming}
            >
              {trimming ? <span className="loading loading-spinner loading-xs"></span> : <Sparkles size={12} />}
              Quick Trim
            </button>
          </div>
        </div>

        {gpu && gpu.available ? (
          <StatCard
            icon={Gpu}
            label="GPU Load"
            value={`${gpu.loadPercent}%`}
            sub={`${gpu.name} · ${gpu.temperatureC}°C`}
            progress={gpu.loadPercent}
          />
        ) : (
          <StatCard icon={Gpu} label="GPU Load" value="N/A" sub="No NVIDIA GPU detected" />
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium opacity-70 mb-2">Disks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.disks.map((d) => (
            <div key={d.mount} className="card bg-base-200 shadow-sm">
              <div className="card-body p-4 gap-2">
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-60">
                  <HardDrive size={13} />
                  {d.mount}
                </span>
                <span className="text-2xl font-black">{d.usedPercent}%</span>
                <span className="text-xs opacity-60">
                  {formatBytes(d.usedBytes)} / {formatBytes(d.totalBytes)}
                </span>
                <progress className="progress progress-primary w-full mt-1" value={d.usedPercent} max="100"></progress>
                <button
                  className="btn btn-xs btn-outline gap-1 w-fit tooltip"
                  data-tip="Defragments HDDs or TRIMs SSDs - can take a while"
                  onClick={() => setOptimizeTarget(d.mount)}
                  disabled={optimizing.has(d.mount)}
                >
                  {optimizing.has(d.mount) ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <HardDriveDownload size={12} />
                  )}
                  {optimizing.has(d.mount) ? "Optimizing..." : "Optimize"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CpuDetailModal open={detailModal === "cpu"} onClose={() => setDetailModal(null)} perCore={stats.cpu.perCore} />
      <MemoryDetailModal open={detailModal === "memory"} onClose={() => setDetailModal(null)} />

      <ConfirmModal
        open={Boolean(optimizeTarget)}
        title="Optimize drive?"
        message={`This runs Windows' drive optimizer on ${optimizeTarget} - defragmenting an HDD or TRIMing an SSD as appropriate. It can take several minutes and will use disk I/O heavily while running.`}
        confirmLabel="Optimize"
        danger={false}
        onConfirm={() => handleOptimize(optimizeTarget)}
        onCancel={() => setOptimizeTarget(null)}
      />
    </div>
  );
}
