import React from "react";
import AnimatedIcon from "./AnimatedIcon.jsx";
import { useIconHover } from "../lib/useIconHover.js";

function TabItem({ item, active, onSelect }) {
  const Icon = item.icon;
  const iconHover = useIconHover();

  return (
    <button
      onClick={onSelect}
      onMouseEnter={iconHover.onMouseEnter}
      onMouseLeave={iconHover.onMouseLeave}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
        active
          ? "bg-blue-600 text-white font-semibold shadow-sm shadow-black/20"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
      }`}
    >
      <AnimatedIcon ref={iconHover.ref} icon={Icon} size={14} />
      <span>{item.label}</span>
    </button>
  );
}

export default function CategoryTabs({ category, activeTab, onSelect }) {
  return (
    <div className="shrink-0 border-b border-white/[0.06] bg-slate-950/40 px-6 py-2">
      <div className="inline-flex p-1 bg-black/25 rounded-xl border border-white/[0.06] gap-1 overflow-x-auto max-w-full">
        {category.items.map((item) => (
          <TabItem key={item.id} item={item} active={activeTab === item.id} onSelect={() => onSelect(item.id)} />
        ))}
      </div>
    </div>
  );
}
