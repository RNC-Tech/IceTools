import React from "react";

export default function IceLogo({ size = "md", showSubtitle = true }) {
  const iconSizeClass = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const textSize = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2.5 select-none group">
      <img
        src="./icetools.svg"
        alt="IceTools Logo"
        className={`${iconSizeClass} shrink-0 object-contain`}
      />

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
