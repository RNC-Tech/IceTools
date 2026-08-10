import React from "react";
import { Download, ShieldCheck, CheckCircle2, Cpu, HardDrive, Monitor, Zap } from "lucide-react";

export default function DownloadSection() {
  return (
    <section id="requirements" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto space-y-10">
      <div className="glass-card p-8 sm:p-12 border border-blue-500/25 shadow-2xl text-center space-y-8 relative overflow-hidden">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 mx-auto">
            <img src="/icetools.svg" alt="IceTools Logo" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Get IceTools Today</h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Download the official NSIS installer for Windows 10 and 11 x64.
          </p>
        </div>

        {/* Big Download Button */}
        <div>
          <a
            href="https://github.com/RNC-Tech/IceTools/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg btn-primary rounded-full px-10 py-4 gap-3 shadow-xl shadow-blue-500/40 font-extrabold text-base inline-flex items-center"
          >
            <Download size={22} />
            <span>Download IceTools Setup 1.2.0 (.exe)</span>
          </a>
          <p className="text-xs text-slate-400 mt-2.5 font-mono">Size: ~75 MB · Version 1.2.0 · Windows 10 / 11 x64</p>
        </div>

        {/* Requirements Table */}
        <div className="pt-6 border-t border-blue-500/15 text-left max-w-3xl mx-auto space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Minimum System Requirements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
              <Monitor size={16} className="text-blue-400 mb-1" />
              <div className="text-xs font-bold text-white">Windows 10 / 11</div>
              <div className="text-[10px] text-slate-400">64-bit Architecture</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
              <Cpu size={16} className="text-cyan-400 mb-1" />
              <div className="text-xs font-bold text-white">Dual Core CPU</div>
              <div className="text-[10px] text-slate-400">1.6 GHz or faster</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
              <Zap size={16} className="text-emerald-400 mb-1" />
              <div className="text-xs font-bold text-white">2 GB RAM</div>
              <div className="text-[10px] text-slate-400">Low System Overhead</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/15">
              <HardDrive size={16} className="text-indigo-400 mb-1" />
              <div className="text-xs font-bold text-white">150 MB Storage</div>
              <div className="text-[10px] text-slate-400">Disk Installation</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
