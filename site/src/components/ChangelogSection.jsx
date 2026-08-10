import React, { useState } from "react";
import { ChevronDown, Layers, Sparkles } from "lucide-react";

const RELEASES = [
  {
    version: "1.2.0",
    date: "August 10, 2026",
    title: "v1.2.0 — Major Feature Release & Enhancements",
    badge: "Latest Release",
    changes: [
      "Official App Branding & Custom Icons: Added high-resolution custom IceTools logo icons for Taskbar, BrowserWindow frame, and System Tray.",
      "Sub-Zero Memory & Junk Cleaner: Combined 1-click RAM optimization and temporary junk files cleanup into a single unified action.",
      "Embedded Speed Test Windows: Dedicated Fast.com and Speedtest.net windows with full throughput testing and zero CSP blocking.",
      "Elevated Administrator Relaunch: UAC elevation prompt and app restart when triggering Administrator mode.",
      "System Tray Widget Controls: Added top close button, Fast.com launcher option, and official IceTools logo.",
      "Sage Downloader Controls: Video thumbnail previews, file location opener, item deletion controls, and clear download history option.",
      "Theme Refinements: Electric Sapphire styling for Windows Defender & Firewall profiles with high-contrast status pills.",
    ],
  },
  {
    version: "1.0.0",
    date: "August 1, 2026",
    title: "v1.0.0 — Initial Release",
    badge: "Initial Build",
    changes: [
      "Core Hardware Telemetry: Live CPU, Memory, GPU load, and Disk drive capacity monitoring.",
      "Startup Apps & Windows Services Manager: Toggle startup apps and background services.",
      "Power Plan Manager: Unlock Windows Ultimate Performance power profile.",
      "Privacy Hardening: Toggle Windows telemetry and tracking tweaks.",
      "Deep Uninstaller Engine: Scan desktop apps and clean leftover files and registry entries.",
    ],
  },
];

export default function ChangelogSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="changelog" className="py-16 px-4 sm:px-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/30">
          <Layers size={14} className="text-blue-400" /> Release History
        </div>
        <h2 className="text-3xl font-black text-white">Changelog & Updates</h2>
        <p className="text-xs sm:text-sm text-slate-400">Track all improvements, bug fixes, and feature additions across builds.</p>
      </div>

      <div className="space-y-4">
        {RELEASES.map((rel, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={rel.version} className="glass-card border border-blue-500/20 overflow-hidden text-left shadow-lg">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full p-5 flex items-center justify-between hover:bg-blue-500/10 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-extrabold text-sm text-white">{rel.title}</span>
                  <span className="badge badge-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold">
                    v{rel.version}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{rel.date}</span>
                </div>
                <div className={`p-1.5 rounded-lg text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-400" : ""}`}>
                  <ChevronDown size={18} />
                </div>
              </button>

              {isOpen && (
                <div className="p-5 pt-2 border-t border-blue-500/15 bg-slate-950/40 space-y-2">
                  <ul className="space-y-2 text-xs text-slate-300">
                    {rel.changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
