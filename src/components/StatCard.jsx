import React from "react";

export default function StatCard({ icon: Icon, label, value, sub, progress, warnAt = Infinity }) {
  const isWarn = typeof progress === "number" && progress >= warnAt;
  const iconClass = isWarn ? "text-warning" : "text-primary";
  const progressClass = isWarn ? "progress-warning" : "progress-primary";
  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-5 gap-1.5">
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
          {Icon && <Icon size={13} className={`${iconClass} shrink-0`} />}
          <span className="opacity-60">{label}</span>
        </span>
        <span className="text-3xl font-black">{value}</span>
        {sub && <span className="text-xs opacity-60">{sub}</span>}
        {typeof progress === "number" && (
          <progress className={`progress ${progressClass} w-full mt-1.5`} value={progress} max="100"></progress>
        )}
      </div>
    </div>
  );
}
