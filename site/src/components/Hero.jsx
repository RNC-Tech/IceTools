import React from "react";
import { Download, Sparkles, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-12 pb-16 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-8">
      {/* Release Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold shadow-lg shadow-blue-500/10">
        <Sparkles size={14} className="text-amber-400" />
        <span>v1.2.0 Officially Released for Windows 10 & 11</span>
        <span className="badge badge-xs bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono">x64</span>
      </div>

      {/* Main Headline */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
          Sub-Zero Speed for Your{" "}
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            Windows PC
          </span>
        </h1>
        <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          IceTools is an all-in-one desktop optimization suite. Clean RAM & temporary junk files in 1 click, monitor hardware telemetry, manage startup services, and test network speeds.
        </p>
      </div>

      {/* Primary CTA Buttons */}
      <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
        <a
          href="https://github.com/RNC-Tech/IceTools/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-lg btn-primary rounded-full px-8 py-3.5 gap-2.5 shadow-xl shadow-blue-500/35 font-extrabold text-sm"
        >
          <Download size={18} />
          <span>Download IceTools v1.2.0</span>
        </a>

        <a
          href="#demo"
          className="btn btn-lg btn-outline rounded-full px-7 py-3.5 gap-2 text-slate-300 hover:text-white font-bold text-sm"
        >
          <span>Explore Interactive Demo</span>
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
