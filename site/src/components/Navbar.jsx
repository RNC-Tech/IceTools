import React from "react";
import { Download, Github, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#050b14]/80 border-b border-blue-500/15 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="p-2 rounded-2xl bg-blue-500/15 border border-blue-500/35 text-blue-400 shadow-lg shadow-blue-500/25 shrink-0 transition-transform group-hover:scale-105">
            <img src="/icetools.svg" alt="IceTools Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <div className="font-black tracking-wider leading-none uppercase text-base text-white">
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                ICE
              </span>{" "}
              <span className="text-slate-100 font-extrabold">TOOLS</span>
            </div>
            <div className="text-[10px] font-semibold tracking-widest text-blue-400/80 uppercase mt-0.5">
              Sub-Zero Optimizer
            </div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
          <a href="#demo" className="hover:text-blue-400 transition-colors">Interactive Demo</a>
          <a href="#requirements" className="hover:text-blue-400 transition-colors">Requirements</a>
          <a href="#changelog" className="hover:text-blue-400 transition-colors">Changelog</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/RNC-Tech/IceTools"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xs sm:btn-sm btn-outline gap-1.5 rounded-full text-slate-300 hover:text-white"
            title="Star on GitHub"
          >
            <Github size={15} />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <a
            href="https://github.com/RNC-Tech/IceTools/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xs sm:btn-sm btn-primary gap-1.5 rounded-full font-bold shadow-lg shadow-blue-500/30"
          >
            <Download size={15} />
            <span>Download v1.2.0</span>
          </a>
        </div>
      </div>
    </header>
  );
}
