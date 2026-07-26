import React from "react";

export default function StatCard({ icon: Icon, label, value, sub, progress }) {
  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-60">
          {Icon && <Icon size={13} />}
          {label}
        </span>
        <span className="text-2xl font-black">{value}</span>
        {sub && <span className="text-xs opacity-60">{sub}</span>}
        {typeof progress === "number" && (
          <progress className="progress progress-primary w-full mt-1" value={progress} max="100"></progress>
        )}
      </div>
    </div>
  );
}
