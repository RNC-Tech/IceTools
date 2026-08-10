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
    ? "text-rose-400 bg-rose-500/15 border-rose-500/30"
    : isWarn
    ? "text-amber-300 bg-amber-500/15 border-amber-500/30"
    : "text-blue-400 bg-blue-500/15 border-blue-500/30";

  return (
    <SpotlightCard
      className="p-5 flex flex-col justify-between transition-all glass-card-hover"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            {IconComponent && (
              <div className={`p-1.5 rounded-xl border ${iconColorClass}`}>
                <AnimatedIcon icon={IconComponent} size={15} />
              </div>
            )}
            <span>{label}</span>
          </div>
          {isHigh ? (
            <span className="badge badge-xs badge-error gap-1 font-bold rounded-full">Critical</span>
          ) : isWarn ? (
            <span className="badge badge-xs badge-warning gap-1 font-bold rounded-full">High</span>
          ) : typeof progress === "number" ? (
            <span className="badge badge-xs badge-ghost opacity-60 font-medium rounded-full">Optimal</span>
          ) : null}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-white">{value}</span>
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
