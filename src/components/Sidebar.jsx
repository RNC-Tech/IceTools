import React from "react";
import { NAV_CATEGORIES } from "../lib/navConfig.js";
import AnimatedIcon from "./AnimatedIcon.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import { useIconHover } from "../lib/useIconHover.js";

function CategoryItem({ category, active, onSelect }) {
  const Icon = category.icon;
  const iconHover = useIconHover();

  return (
    <li>
      <button
        onClick={onSelect}
        onMouseEnter={iconHover.onMouseEnter}
        onMouseLeave={iconHover.onMouseLeave}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
          active
            ? "bg-blue-500/12 text-blue-400 border border-blue-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
        }`}
      >
        <AnimatedIcon
          ref={iconHover.ref}
          icon={Icon}
          size={16}
          className={`shrink-0 transition-colors ${active ? "text-blue-400" : "text-slate-400"}`}
        />
        <span className="truncate tracking-tight">{category.label}</span>
      </button>
    </li>
  );
}

export default function Sidebar({ active, onSelect }) {
  return (
    <aside
      className="w-52 shrink-0 h-full flex flex-col p-2.5 space-y-3 bg-[#070e1b]/70 backdrop-blur-xl border-r border-white/[0.06] select-none"
    >
      <div className="flex-1 overflow-y-auto pr-0.5 pt-1">
        <ul className="space-y-1">
          {NAV_CATEGORIES.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              active={active === category.id}
              onSelect={() => onSelect(category.id)}
            />
          ))}
        </ul>
      </div>

      <div className="pt-2 border-t border-white/[0.06]">
        <UpdateBanner />
      </div>
    </aside>
  );
}
