import React from "react";
import AnimatedIcon from "./AnimatedIcon.jsx";

export default function PageHeader({ icon: IconComponent, title, description, badge, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-6">
      <div className="flex items-start sm:items-center gap-3.5">
        {IconComponent && (
          <div className="text-blue-400 shrink-0 mt-0.5 sm:mt-0">
            <AnimatedIcon icon={IconComponent} size={22} />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
            {badge && (
              <span className="text-[11px] font-semibold tracking-wide rounded-md px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
