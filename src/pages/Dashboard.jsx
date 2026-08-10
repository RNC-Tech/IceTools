import React, { useEffect, useState } from "react";
import { LayoutDashboard, MemoryStick, HardDrive, Gpu, HardDriveDownload, HeartPulse, ShieldQuestion, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Cpu, Sparkles } from "../components/icons/index.js";
import PageHeader from "../components/PageHeader.jsx";
import MetricCard from "../components/MetricCard.jsx";
import SpotlightCard from "../components/SpotlightCard.jsx";
import MagnetButton from "../components/MagnetButton.jsx";
import CountUp from "../components/CountUp.jsx";
import { Skeleton, StatCardSkeleton } from "../components/Skeleton.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useIconHover } from "../lib/useIconHover.js";

const LIVE_POLL_MS = 2000;
const SLOW_REFRESH_EVERY_N_POLLS = 10;

function CpuDetailModal({ open, onClose, perCore }) {
  if (!open) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box glass-card bg-[#0b172a]/95 border border-blue-500/20 rounded-3xl max-w-md text-white">
        <div className="flex items-center justify-between border-b border-blue-500/15 pb-3">
          <h3 className="font-bold text-base flex items-center gap-2 text-blue-400">
            <Cpu size={18} /> Per-Core Load Breakdown
          </h3>
          <button className="btn btn-sm btn-ghost btn-circle text-slate-400" onClick={onClose}>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3 py-4">
          {(perCore || []).map((load, i) => (
            <div key={i} className="p-2.5 rounded-2xl bg-black/30 border border-blue-500/10 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Core {i}</span>
                <span className="font-mono text-blue-400">{load}%</span>
              </div>
              <progress
                className={`progress w-full h-1.5 ${load > 80 ? "progress-warning" : "progress-primary"}`}
                value={load}
                max="100"
              ></progress>
            </div>
          ))}
        </div>
        <div className="modal-action border-t border-blue-500/15 pt-3">
          <button className="btn btn-sm btn-primary rounded-full px-5" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/60 backdrop-blur-md" onClick={onClose}></div>
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
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box glass-card bg-[#0b172a]/95 border border-blue-500/20 rounded-3xl max-w-lg text-white">
        <div className="flex items-center justify-between border-b border-blue-500/15 pb-3">
          <h3 className="font-bold text-base flex items-center gap-2 text-blue-400">
            <MemoryStick size={18} /> Top Memory Consumers
          </h3>
          <button className="btn btn-sm btn-ghost btn-circle text-slate-400" onClick={onClose}>✕</button>
        </div>
        <div className="py-3">
          {processes === null ? (
            <div className="flex justify-center p-6">
              <span className="loading loading-spinner loading-md text-blue-400"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-blue-500/15">
                    <th>Process Name</th>
                    <th className="text-right">Memory Used</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((p) => (
                    <tr key={p.pid} className="border-b border-white/5 hover:bg-blue-500/5">
                      <td className="font-medium truncate max-w-[240px] text-xs text-slate-200">{p.name}</td>
                      <td className="text-right font-mono text-xs font-bold text-blue-400">
                        {formatBytes(p.memBytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-action border-t border-blue-500/15 pt-3">
          <button className="btn btn-sm btn-primary rounded-full px-5" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/60 backdrop-blur-md" onClick={onClose}></div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [trimming, setTrimming] = useState(false);
  const [optimizing, setOptimizing] = useState(new Set());
  const [optimizeTarget, setOptimizeTarget] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const toast = useToast();
  const trimIcon = useIconHover();

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
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  const diskAvg = stats.disks.reduce((sum, d) => sum + d.usedPercent, 0) / (stats.disks.length || 1);
  const healthScore = Math.max(10, Math.round(100 - (stats.cpu.loadPercent * 0.35 + stats.memory.usedPercent * 0.45 + diskAvg * 0.2)));

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Sub-Zero Performance Center"
        description="Real-time telemetry, hardware load meters, and single-click RAM & Disk optimization."
        badge="Live Telemetry"
        actions={
          <MagnetButton
            onClick={handleQuickTrim}
            disabled={trimming}
            className="btn btn-sm btn-primary rounded-full px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-blue-500/35 font-bold"
          >
            {trimming ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <>
                <Sparkles ref={trimIcon.ref} size={15} />
                <span>Sub-Zero Quick Trim</span>
                <ArrowRight size={15} />
              </>
            )}
          </MagnetButton>
        }
      />

      {/* Glacial Health Hero Banner with SpotlightCard & Volumetric Light Overlay */}
      <SpotlightCard className="p-6 border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900/50 to-sky-950/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="8" className="text-slate-900" fill="transparent" />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 * (1 - healthScore / 100)}
                  strokeLinecap="round"
                  className="text-blue-400 transition-all duration-1000 ease-out"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black font-mono text-blue-400">
                  <CountUp to={healthScore} suffix="%" />
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Index</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">Glacial Performance Index</h3>
                <span className="badge badge-sm badge-success gap-1 font-semibold rounded-full px-3">
                  <CheckCircle2 size={11} /> {healthScore >= 75 ? "Optimal" : healthScore >= 50 ? "Moderate" : "High Load"}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Calculated live from CPU workload, RAM allocation, and storage status. Click Sub-Zero Quick Trim to reclaim idle resources instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button className="btn btn-sm btn-outline rounded-full px-5 border-blue-500/40 text-blue-300 flex items-center gap-2" onClick={handleQuickTrim} disabled={trimming}>
              <Zap size={14} />
              <span>Reclaim Idle RAM</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </SpotlightCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          icon={Cpu}
          label="CPU Load"
          value={`${stats.cpu.loadPercent}%`}
          sub={`${stats.cpu.cores} cores · ${stats.cpu.model} (click for per-core)`}
          progress={stats.cpu.loadPercent}
          warnAt={80}
          onClick={() => setDetailModal("cpu")}
        />

        <MetricCard
          icon={MemoryStick}
          label="Memory Used"
          value={`${stats.memory.usedPercent}%`}
          sub={`${formatBytes(stats.memory.usedBytes)} / ${formatBytes(stats.memory.totalBytes)} (click for process list)`}
          progress={stats.memory.usedPercent}
          warnAt={80}
          onClick={() => setDetailModal("memory")}
        />

        {gpu && gpu.available ? (
          <MetricCard
            icon={Gpu}
            label="GPU Load"
            value={`${gpu.loadPercent}%`}
            sub={`${gpu.name} · ${gpu.temperatureC}°C`}
            progress={gpu.loadPercent}
            warnAt={80}
          />
        ) : (
          <MetricCard icon={Gpu} label="GPU Load" value="N/A" sub="No NVIDIA GPU detected" />
        )}
      </div>

      <div className="pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
            <HardDrive size={16} className="text-blue-400" /> Storage Drives ({stats.disks.length})
          </h3>
          <span className="text-xs text-slate-400">Auto-refreshed periodically</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stats.disks.map((d) => {
            const diskWarn = d.usedPercent >= 80;
            return (
              <SpotlightCard key={d.mount} className="p-5 space-y-3 glass-card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <HardDrive size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-base text-white">{d.mount} Drive</span>
                      <p className="text-xs text-slate-400">
                        {formatBytes(d.usedBytes)} used of {formatBytes(d.totalBytes)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`badge badge-sm gap-1 font-semibold rounded-full ${
                      d.healthStatus === "Healthy"
                        ? "badge-success bg-success/15 text-success border-success/30"
                        : d.healthStatus === "Unknown"
                        ? "badge-ghost opacity-70"
                        : "badge-error bg-error/15 text-error border-error/30"
                    }`}
                  >
                    {d.healthStatus === "Unknown" ? <ShieldQuestion size={12} /> : <HeartPulse size={12} />}
                    {d.healthStatus}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Space Allocation</span>
                    <span className={`font-mono ${diskWarn ? "text-warning" : "text-blue-400 font-bold"}`}>
                      {d.usedPercent}% Used
                    </span>
                  </div>
                  <progress
                    className={`progress w-full h-2 rounded-full ${diskWarn ? "progress-warning" : "progress-primary"}`}
                    value={d.usedPercent}
                    max="100"
                  ></progress>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    className="btn btn-xs btn-outline rounded-full px-4 text-blue-300 border-blue-500/30 hover:bg-blue-500/10 flex items-center gap-1.5"
                    onClick={() => setOptimizeTarget(d.mount)}
                    disabled={optimizing.has(d.mount)}
                  >
                    {optimizing.has(d.mount) ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <HardDriveDownload size={13} />
                    )}
                    <span>{optimizing.has(d.mount) ? "Optimizing..." : "Optimize Drive"}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>

      <CpuDetailModal open={detailModal === "cpu"} onClose={() => setDetailModal(null)} perCore={stats.cpu.perCore} />
      <MemoryDetailModal open={detailModal === "memory"} onClose={() => setDetailModal(null)} />

      <ConfirmModal
        open={Boolean(optimizeTarget)}
        title="Optimize drive?"
        message={`This runs Windows' drive optimizer on ${optimizeTarget} (defragmenting HDDs or TRIMing SSDs). It can take several minutes.`}
        confirmLabel="Optimize Drive"
        danger={false}
        onConfirm={() => handleOptimize(optimizeTarget)}
        onCancel={() => setOptimizeTarget(null)}
      />
    </div>
  );
}
