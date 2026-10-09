import React from "react";
import AnimatedIcon from "./AnimatedIcon.jsx";
import SpotlightCard from "./SpotlightCard.jsx";

export default function MetricCard({
  icon: IconComponent,
  label,
  value,
  sub,
  progress,
  warnAt = 80,
  actionButton,
  onClick,
}) {
  const isWarn = typeof progress === "number" && progress >= warnAt;
  const isHigh = typeof progress === "number" && progress >= 90;

  const progressColorClass = isHigh
    ? "progress-error"
    : isWarn
    ? "progress-warning"
    : "progress-primary";

  const iconColorClass = isHigh
    ? "text-rose-400"
    : isWarn
    ? "text-amber-400"
    : "text-blue-400";

  return (
    <SpotlightCard
      className="p-5 flex flex-col justify-between transition-all glass-card-hover"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            {IconComponent && (
              <AnimatedIcon icon={IconComponent} size={16} className={`${iconColorClass} shrink-0`} />
            )}
            <span>{label}</span>
          </div>
          {isHigh ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-2 py-0.5">Critical</span>
          ) : isWarn ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-0.5">High</span>
          ) : typeof progress === "number" ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-0.5">Optimal</span>
          ) : null}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{value}</span>
        </div>

        {sub && <p className="text-xs text-slate-400 mt-1 leading-normal">{sub}</p>}
      </div>

      <div className="mt-4 space-y-3">
        {typeof progress === "number" && (
          <div className="space-y-1">
            <progress
              className={`progress ${progressColorClass} w-full h-2 rounded-full`}
              value={progress}
              max="100"
            ></progress>
          </div>
        )}

        {actionButton && <div className="pt-1">{actionButton}</div>}
      </div>
    </SpotlightCard>
  );
}
