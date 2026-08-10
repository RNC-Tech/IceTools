import React from "react";
import AnimatedIcon from "./AnimatedIcon.jsx";

export default function PageHeader({ icon: IconComponent, title, description, badge, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-500/15 mb-6">
      <div className="flex items-start sm:items-center gap-3.5">
        {IconComponent && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-md shadow-blue-500/15 shrink-0">
            <AnimatedIcon icon={IconComponent} size={20} />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
            {badge && (
              <span className="badge badge-sm bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold tracking-wide rounded-md px-2.5 py-0.5">
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
