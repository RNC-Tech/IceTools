import React, { useEffect, useState } from "react";
import { LayoutDashboard, MemoryStick, HardDrive, Gpu } from "lucide-react";
import { Cpu } from "../components/icons/index.js";
import StatCard from "../components/StatCard.jsx";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { Skeleton, StatCardSkeleton } from "../components/Skeleton.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";

const LIVE_POLL_MS = 2000;
const SLOW_REFRESH_EVERY_N_POLLS = 10; // disks/GPU refreshed roughly every 20s

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [gpu, setGpu] = useState(null);
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
        <StatCard
          icon={Cpu}
          label="CPU Load"
          value={`${stats.cpu.loadPercent}%`}
          sub={`${stats.cpu.cores} cores · ${stats.cpu.model}`}
          progress={stats.cpu.loadPercent}
        />
        <StatCard
          icon={MemoryStick}
          label="Memory Used"
          value={`${stats.memory.usedPercent}%`}
          sub={`${formatBytes(stats.memory.usedBytes)} / ${formatBytes(stats.memory.totalBytes)}`}
          progress={stats.memory.usedPercent}
        />
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
            <StatCard
              key={d.mount}
              icon={HardDrive}
              label={d.mount}
              value={`${d.usedPercent}%`}
              sub={`${formatBytes(d.usedBytes)} / ${formatBytes(d.totalBytes)}`}
              progress={d.usedPercent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
