import React from "react";
import { motion } from "motion/react";
import { NAV_CATEGORIES } from "../lib/navConfig.js";
import AnimatedIcon from "./AnimatedIcon.jsx";
import UpdateBanner from "./UpdateBanner.jsx";

function CategoryItem({ category, active, onSelect }) {
  const Icon = category.icon;

  return (
    <li>
      <motion.button
        onClick={onSelect}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
          active
            ? "active-cyan-pill text-white font-extrabold"
            : "text-slate-300 hover:text-white hover:bg-blue-500/10"
        }`}
      >
        <div className={`p-1.5 rounded-full ${active ? "bg-white/20 text-white" : "text-slate-400"}`}>
          <AnimatedIcon icon={Icon} size={15} />
        </div>
        <span>{category.label}</span>
      </motion.button>
    </li>
  );
}

export default function Sidebar({ active, onSelect }) {
  return (
    <aside
      style={{ borderRadius: 0 }}
      className="w-56 shrink-0 h-full flex flex-col p-3 space-y-4 bg-[#070f1e]/80 backdrop-blur-xl border-r border-blue-500/15 select-none rounded-none"
    >
      <div className="flex-1 overflow-y-auto pr-1 pt-1">
        <ul className="space-y-1.5">
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

      <div className="pt-2 border-t border-blue-500/20 space-y-2">
        <UpdateBanner />
      </div>
    </aside>
  );
}
