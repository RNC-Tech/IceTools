import React, { useState } from "react";
import { MemoryStick, Trash2, Activity, Sparkles, Gauge, Zap, CheckCircle2, ShieldCheck, ArrowRight, Timer, ArrowDown, ArrowUp } from "lucide-react";

export default function AppShowcaseMock() {
  const [ramUsed, setRamUsed] = useState(76);
  const [ramBytes, setRamBytes] = useState(12.2);
  const [tempGb, setTempGb] = useState(3.8);
  const [trimming, setTrimming] = useState(false);
  const [activeSpeedTab, setActiveSpeedTab] = useState("ookla");
  const [toastMessage, setToastMessage] = useState(null);

  function triggerTrim() {
    setTrimming(true);
    setTimeout(() => {
      setRamUsed(38);
      setRamBytes(6.1);
      setTempGb(0.2);
      setTrimming(false);
      setToastMessage("Sub-Zero Trim freed ~6.1 GB RAM & cleared temp junk!");
      setTimeout(() => setToastMessage(null), 4000);
    }, 1200);
  }

  return (
    <section id="demo" className="py-12 px-4 sm:px-8 max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Interactive App Preview</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Test the live Sub-Zero Trim RAM & Junk Cleaner simulation right here in your browser.
        </p>
      </div>

      {/* Main Glass Mock Window */}
      <div className="glass-card rounded-2xl border border-blue-500/25 shadow-2xl overflow-hidden text-left relative">
        {/* Top Mock Window Titlebar */}
        <div className="bg-[#070f1e]/90 border-b border-blue-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-blue-500/15 border border-blue-500/30">
              <img src="/icetools.svg" alt="IceTools Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-white">IceTools Sub-Zero Optimizer v1.2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1 font-semibold rounded-md px-2 py-1">
              <ShieldCheck size={11} /> Elevated Admin
            </span>
            <div className="flex gap-1.5 ml-2">
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            </div>
          </div>
        </div>

        {/* Mock Toast Banner */}
        {toastMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs px-4 py-2 flex items-center gap-2 font-semibold">
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Mock Main Dashboard Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: RAM & Temp Cleaner */}
          <div className="glass-card p-5 space-y-4 border border-blue-500/20 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300 font-bold">
                <MemoryStick size={16} className="text-blue-400" /> RAM Memory Used
              </span>
              <span className="font-mono text-sm font-black text-blue-400">{ramUsed}%</span>
            </div>

            <progress className="progress progress-primary w-full h-2 rounded-full" value={ramUsed} max="100"></progress>

            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>{ramBytes} GB Used</span>
              <span>16.0 GB Total</span>
            </div>

            <div className="pt-2 border-t border-blue-500/15 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Trash2 size={14} className="text-amber-400" /> Temp Junk
              </span>
              <span className="font-mono text-xs font-bold text-amber-400">{tempGb} GB</span>
            </div>

            <button
              className="btn btn-primary btn-sm w-full gap-2 rounded-full text-xs font-bold shadow-lg shadow-blue-500/30"
              onClick={triggerTrim}
              disabled={trimming}
            >
              {trimming ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Sub-Zero Trim (1-Click Clean)</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Network Speed Tester Widget */}
          <div className="glass-card p-5 space-y-4 border border-blue-500/20 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300 font-bold">
                <Gauge size={16} className="text-blue-400" /> Speed Diagnostic
              </span>
              <div className="flex gap-1">
                <button
                  className={`btn btn-xs rounded-full px-2.5 text-[11px] ${
                    activeSpeedTab === "fast" ? "btn-primary font-bold" : "btn-outline text-slate-300"
                  }`}
                  onClick={() => setActiveSpeedTab("fast")}
                >
                  Fast.com
                </button>
                <button
                  className={`btn btn-xs rounded-full px-2.5 text-[11px] ${
                    activeSpeedTab === "ookla" ? "btn-primary font-bold" : "btn-outline text-slate-300"
                  }`}
                  onClick={() => setActiveSpeedTab("ookla")}
                >
                  Speedtest
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/60 text-center border border-blue-500/15">
              <div>
                <Timer size={14} className="mx-auto text-blue-400 mb-1" />
                <div className="text-base font-black font-mono text-white">12 ms</div>
                <div className="text-[10px] text-slate-400">Ping</div>
              </div>
              <div>
                <ArrowDown size={14} className="mx-auto text-emerald-400 mb-1" />
                <div className="text-base font-black font-mono text-emerald-400">480.5</div>
                <div className="text-[10px] text-slate-400">Mbps Down</div>
              </div>
              <div>
                <ArrowUp size={14} className="mx-auto text-sky-400 mb-1" />
                <div className="text-base font-black font-mono text-sky-400">120.2</div>
                <div className="text-[10px] text-slate-400">Mbps Up</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Launches in a dedicated embedded window without browser tab clutter or external URL redirects.
            </p>
          </div>

          {/* Card 3: Live Hardware Telemetry */}
          <div className="glass-card p-5 space-y-4 border border-blue-500/20 bg-slate-900/50">
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300 font-bold">
              <Activity size={16} className="text-blue-400" /> Hardware Telemetry
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Intel Core i9-13900K</span>
                  <span className="font-mono text-blue-400">18%</span>
                </div>
                <progress className="progress progress-primary w-full h-1.5 rounded-full" value={18} max="100"></progress>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">NVIDIA RTX 4090</span>
                  <span className="font-mono text-cyan-400">24%</span>
                </div>
                <progress className="progress progress-primary w-full h-1.5 rounded-full" value={24} max="100"></progress>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">NVMe SSD Storage</span>
                  <span className="font-mono text-emerald-400">42%</span>
                </div>
                <progress className="progress progress-success w-full h-1.5 rounded-full" value={42} max="100"></progress>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
