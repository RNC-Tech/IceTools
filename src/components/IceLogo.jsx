import React from "react";

export default function IceLogo({ size = "md", showSubtitle = true }) {
  const iconSizeClass = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const textSize = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative p-2 rounded-2xl bg-blue-500/15 border border-blue-500/35 text-blue-400 shadow-lg shadow-blue-500/25 shrink-0 group flex items-center justify-center">
        <img
          src="./icetools.svg"
          alt="IceTools Logo"
          className={`${iconSizeClass} transition-transform group-hover:scale-110 duration-300 object-contain`}
        />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400"></span>
      </div>

      <div>
        <div className={`font-black tracking-wider leading-none uppercase ${textSize}`}>
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            ICE
          </span>{" "}
          <span className="text-slate-100 font-extrabold">TOOLS</span>
        </div>
        {showSubtitle && (
          <div className="text-[10px] font-semibold tracking-widest text-blue-400/80 uppercase mt-1">
            Sub-Zero Optimizer
          </div>
        )}
      </div>
    </div>
  );
}
