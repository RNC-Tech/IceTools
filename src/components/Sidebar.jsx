import React from "react";
import { motion } from "motion/react";
import { LayoutDashboard, MemoryStick, Trash2, ShieldAlert } from "lucide-react";
import { Snowflake, Activity, Rocket, Settings, Zap, Wrench, ShieldCheck, Sun, Moon } from "./icons/index.js";
import { DARK_THEME } from "../lib/useTheme.js";
import AnimatedIcon from "./AnimatedIcon.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, animated: false },
  { id: "processes", label: "Process Monitor", icon: Activity, animated: true },
  { id: "memory", label: "Memory Cleaner", icon: MemoryStick, animated: false },
  { id: "startup", label: "Startup Manager", icon: Rocket, animated: true },
  { id: "services", label: "Services", icon: Settings, animated: true },
  { id: "cleanup", label: "Disk Cleanup", icon: Trash2, animated: false },
  { id: "power", label: "Power & Network", icon: Zap, animated: true },
  { id: "extra", label: "Extra Tools", icon: Wrench, animated: true },
];

export default function Sidebar({ active, onSelect, isAdmin, theme, onToggleTheme }) {
  const isDark = theme === DARK_THEME;

  return (
    <aside className="w-56 shrink-0 bg-base-200 h-full flex flex-col border-r border-base-300">
      <div className="p-4 flex items-center gap-2">
        <Snowflake size={20} className="text-primary shrink-0" />
        <div className="flex-1">
          <h1 className="text-lg font-black tracking-wide leading-tight">IceTools</h1>
          <p className="text-xs opacity-60">Windows Optimizer</p>
        </div>
        <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm" title={isDark ? "Switch to light theme" : "Switch to dark theme"}>
          <input type="checkbox" checked={isDark} onChange={onToggleTheme} />
          <Sun size={18} className="swap-off" />
          <Moon size={18} className="swap-on" />
        </label>
      </div>
      <ul className="menu w-full flex-1 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <motion.a
                className={active === item.id ? "active" : ""}
                onClick={() => onSelect(item.id)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {item.animated ? <Icon size={16} /> : <AnimatedIcon icon={Icon} size={16} />}
                {item.label}
              </motion.a>
            </li>
          );
        })}
      </ul>
      <div className="p-3">
        <div className={`badge w-full gap-1 ${isAdmin ? "badge-success" : "badge-warning"}`}>
          {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          {isAdmin ? "Running as Administrator" : "Limited (not elevated)"}
        </div>
      </div>
    </aside>
  );
}
