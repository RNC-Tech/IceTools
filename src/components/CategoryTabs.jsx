import React from "react";
import AnimatedIcon from "./AnimatedIcon.jsx";

function TabItem({ item, active, onSelect }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all ${
        active
          ? "bg-gradient-to-r from-blue-500 to-sky-400 text-white font-bold shadow-lg shadow-blue-500/30"
          : "text-slate-300 hover:text-white hover:bg-blue-500/10"
      }`}
    >
      <AnimatedIcon icon={Icon} size={14} />
      <span>{item.label}</span>
    </button>
  );
}

export default function CategoryTabs({ category, activeTab, onSelect }) {
  return (
    <div className="shrink-0 border-b border-blue-500/20 bg-slate-950/30 px-6 py-2.5">
      <div className="flex items-center gap-2 overflow-x-auto">
        {category.items.map((item) => (
          <TabItem key={item.id} item={item} active={activeTab === item.id} onSelect={() => onSelect(item.id)} />
        ))}
      </div>
    </div>
  );
}
