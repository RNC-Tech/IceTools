import { LayoutDashboard, MemoryStick, Trash2, Info, Package, HardDrive, Layers } from "lucide-react";
import { Cpu, Activity, Rocket, Settings, Zap, Wrench, ShieldCheck, SlidersHorizontal, Download } from "../components/icons/index.js";

export const NAV_CATEGORIES = [
  {
    id: "system",
    label: "System Tools",
    icon: Cpu,
    animated: true,
    items: [
      { id: "dashboard", label: "System Monitor", icon: LayoutDashboard, animated: false },
      { id: "processes", label: "Process Monitor", icon: Activity, animated: true },
      { id: "memory", label: "Memory Cleaner", icon: MemoryStick, animated: false },
      { id: "startup", label: "Startup Manager", icon: Rocket, animated: true },
      { id: "services", label: "Services", icon: Settings, animated: true },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: HardDrive,
    animated: false,
    items: [
      { id: "cleanup", label: "Disk Cleanup", icon: Trash2, animated: false },
      { id: "uninstaller", label: "Uninstaller", icon: Package, animated: false },
      { id: "power", label: "Power & Network", icon: Zap, animated: true },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    icon: Layers,
    animated: false,
    items: [
      { id: "extra", label: "Extra Tools", icon: Wrench, animated: true },
      { id: "privacy", label: "Privacy & Security", icon: ShieldCheck, animated: true },
    ],
  },
  {
    id: "downloader",
    label: "Sage Downloader",
    icon: Download,
    animated: true,
    items: [{ id: "downloader", label: "Sage Downloader", icon: Download, animated: true }],
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: Settings,
    animated: true,
    items: [
      { id: "settings", label: "Settings", icon: SlidersHorizontal, animated: true },
      { id: "about", label: "About", icon: Info, animated: false },
    ],
  },
];

export function findCategoryForItem(itemId) {
  return NAV_CATEGORIES.find((category) => category.items.some((item) => item.id === itemId));
}
