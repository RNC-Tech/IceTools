import React from "react";
import { Sparkles, Activity, Gauge, Terminal, Trash2, Download, ShieldCheck, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    borderColor: "border-blue-500/30",
    title: "Sub-Zero RAM & Junk Cleaner",
    description: "Reclaim lost memory and clear temporary system logs, Windows cache, and junk files in a single click.",
  },
  {
    icon: Activity,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
    borderColor: "border-cyan-500/30",
    title: "Live Hardware Telemetry",
    description: "Monitor real-time CPU, Memory, GPU load, and Disk drive capacity with high-frequency updates.",
  },
  {
    icon: Gauge,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    borderColor: "border-emerald-500/30",
    title: "Network Speed Tester",
    description: "Launch Fast.com and Speedtest.net in embedded native windows with zero browser tab clutter.",
  },
  {
    icon: Terminal,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
    title: "Startup & Services Manager",
    description: "Control background Windows services and startup apps to accelerate PC boot times.",
  },
  {
    icon: Trash2,
    color: "text-rose-400",
    bgColor: "bg-rose-500/15",
    borderColor: "border-rose-500/30",
    title: "Deep Leftover Uninstaller",
    description: "Scan installed applications and clean leftover files, orphaned folders, and registry entries.",
  },
  {
    icon: Download,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15",
    borderColor: "border-indigo-500/30",
    title: "Sage Media Downloader",
    description: "Download YouTube videos & web audio with video thumbnail previews, file opening, and history management.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <span className="badge badge-sm bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold px-3 uppercase tracking-wider">
          Complete Feature Suite
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white">Built for Maximum Performance</h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Every tool inside IceTools is built for precision, high speed, and low overhead.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="glass-card glass-card-hover p-6 space-y-3 border border-blue-500/20 text-left flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className={`p-3 rounded-2xl ${f.bgColor} ${f.color} border ${f.borderColor} w-fit`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-extrabold text-white">{f.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{f.description}</p>
            </div>

            <div className="pt-3 border-t border-blue-500/15 flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
              <span>Optimized for Windows 10/11</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
