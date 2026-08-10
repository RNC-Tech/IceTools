import React from "react";
import { Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-blue-500/15 bg-[#050b14] py-12 px-4 sm:px-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-blue-500/15 border border-blue-500/30">
            <img src="/icetools.svg" alt="IceTools Logo" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm">IceTools Sub-Zero Optimizer</div>
            <div className="text-[11px] text-slate-500">© 2026 RNC-Tech. All rights reserved.</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 font-semibold">
          <a
            href="https://github.com/RNC-Tech/IceTools"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
          >
            <Github size={14} />
            <span>GitHub Repository</span>
          </a>
          <a
            href="https://github.com/RNC-Tech/IceTools/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            Releases
          </a>
          <a
            href="https://github.com/RNC-Tech/IceTools/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            License
          </a>
        </div>

        {/* Vercel Hosting Notice */}
        <div className="text-[11px] text-slate-500">
          Hosted on <span className="text-white font-bold">Vercel</span> · Built with React & Tailwind CSS
        </div>
      </div>
    </footer>
  );
}
