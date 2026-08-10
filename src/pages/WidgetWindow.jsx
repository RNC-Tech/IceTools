import React, { useCallback, useEffect, useState } from "react";
import { MemoryStick, Trash2, Terminal, Download, Activity, Sparkles, X, Zap } from "lucide-react";
import { call, formatBytes } from "../lib/api.js";
import { useTheme } from "../lib/useTheme.js";
import { useToast } from "../components/ToastProvider.jsx";
import { useIconHover } from "../lib/useIconHover.js";

const POLL_MS = 3000;
const TEMP_FILES_SCALE_BYTES = 2 * 1024 * 1024 * 1024;

export default function WidgetWindow() {
  useTheme();
  const toast = useToast();
  const [memory, setMemory] = useState(null);
  const [processCount, setProcessCount] = useState(null);
  const [tempBytes, setTempBytes] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [launching, setLaunching] = useState(null);
  const clearIconHover = useIconHover();
  const cttIconHover = useIconHover();
  const downloadIconHover = useIconHover();
  const fastIconHover = useIconHover();

  const poll = useCallback(async () => {
    try {
      const [live, count, temp] = await Promise.all([
        call(window.api.system.getLiveStats()),
        call(window.api.system.getProcessCount()),
        call(window.api.cleanup.getTempFilesSize()),
      ]);
      setMemory(live.memory);
      setProcessCount(count.count);
      setTempBytes(temp.sizeBytes);
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    let interval;
    function start() {
      poll();
      interval = setInterval(poll, POLL_MS);
    }
    function stop() {
      clearInterval(interval);
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") start();
      else stop();
    }
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [poll]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") call(window.api.widget.hide()).catch(() => {});
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleClearMemory() {
    setClearing(true);
    try {
      const [memResult] = await Promise.all([
        call(window.api.memory.cleanMemory([])),
        call(window.api.cleanup.clean(["userTemp", "winTemp", "sysLogs"])),
      ]);
      toast.success(`Freed ~${formatBytes(memResult.freedBytes)} RAM & cleared temp junk files.`);
      poll();
    } catch (err) {
      toast.error(`Clear failed: ${err.message}`);
    } finally {
      setClearing(false);
    }
  }

  async function handleLaunchCtt() {
    setLaunching("ctt");
    try {
      await call(window.api.tools.runCttWinUtil());
    } catch (err) {
      toast.error(`Could not launch CTT Windows Utility: ${err.message}`);
    } finally {
      setLaunching(null);
    }
  }

  async function handleOpenDownloader() {
    setLaunching("downloader");
    try {
      await call(window.api.app.showMainWindow());
    } catch (err) {
      toast.error(`Could not open IceTools: ${err.message}`);
    } finally {
      setLaunching(null);
    }
  }

  async function handleOpenFastCom() {
    setLaunching("fastcom");
    try {
      await call(window.api.app.openSpeedTestModal("https://fast.com", "Fast.com Speed Test (Netflix)"));
    } catch (err) {
      toast.error(`Could not launch Fast.com: ${err.message}`);
    } finally {
      setLaunching(null);
    }
  }

  const tempPercent = tempBytes === null ? 0 : Math.min(100, Math.round((tempBytes / TEMP_FILES_SCALE_BYTES) * 100));

  return (
    <div className="h-screen w-screen app-bg-gradient text-slate-100 flex flex-col overflow-hidden border border-blue-500/20 rounded-2xl select-none">
      {/* Draggable Top Title Bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-500/20 shrink-0 window-drag-region">
        <button
          className="shrink-0 hover:opacity-80 transition-opacity window-no-drag p-1 rounded-xl bg-blue-500/10 border border-blue-500/20"
          onClick={() => call(window.api.app.showMainWindow()).catch(() => {})}
          title="Open IceTools"
        >
          <img src="./icetools.svg" alt="IceTools Logo" className="w-5 h-5 object-contain" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black leading-tight text-white tracking-wide">IceTools Widget</h1>
          <p className="text-[10px] text-slate-400">Click logo to open app · drag to move</p>
        </div>
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors window-no-drag shrink-0"
          onClick={() => call(window.api.widget.hide()).catch(() => {})}
          title="Close Widget"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
        <div className="glass-card p-3.5 space-y-2 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-300 font-semibold">
              <MemoryStick size={14} className="text-blue-400" />
              Memory Used
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">{memory ? `${memory.usedPercent}%` : "-"}</span>
          </div>
          <progress className="progress progress-primary w-full h-2 rounded-full" value={memory?.usedPercent ?? 0} max="100"></progress>
          {memory && (
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>{formatBytes(memory.usedBytes)}</span>
              <span>{formatBytes(memory.totalBytes)}</span>
            </div>
          )}
          <button
            className="btn btn-primary btn-sm w-full gap-1.5 mt-1 rounded-full text-xs shadow-lg shadow-blue-500/30 font-bold"
            onClick={handleClearMemory}
            onMouseEnter={clearIconHover.onMouseEnter}
            onMouseLeave={clearIconHover.onMouseLeave}
            disabled={clearing}
          >
            {clearing ? <span className="loading loading-spinner loading-xs"></span> : <Sparkles ref={clearIconHover.ref} size={14} />}
            Clear Memory & Temp Files
          </button>
        </div>

        <div className="glass-card p-3.5 flex items-center justify-between border border-blue-500/20">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-300 font-semibold">
            <Activity size={14} className="text-blue-400" />
            Running Processes
          </span>
          <span className="text-base font-mono font-black text-white">{processCount ?? "-"}</span>
        </div>

        <div className="glass-card p-3.5 space-y-2 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-300 font-semibold">
              <Trash2 size={14} className="text-blue-400" />
              Temporary Files
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">{tempBytes === null ? "-" : formatBytes(tempBytes)}</span>
          </div>
          <progress className="progress progress-warning w-full h-2 rounded-full" value={tempPercent} max="100"></progress>
        </div>

        <div className="pt-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Extra Utilities</h3>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              className="btn btn-outline btn-xs gap-1 rounded-full text-[11px] px-2 border-blue-500/30 text-blue-300 hover:text-white"
              onClick={handleOpenFastCom}
              onMouseEnter={fastIconHover.onMouseEnter}
              onMouseLeave={fastIconHover.onMouseLeave}
              disabled={launching === "fastcom"}
            >
              {launching === "fastcom" ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Zap ref={fastIconHover.ref} size={12} className="text-amber-400" />
              )}
              Fast.com
            </button>
            <button
              className="btn btn-outline btn-xs gap-1 rounded-full text-[11px] px-2 border-blue-500/30 text-slate-300"
              onClick={handleLaunchCtt}
              onMouseEnter={cttIconHover.onMouseEnter}
              onMouseLeave={cttIconHover.onMouseLeave}
              disabled={launching === "ctt"}
            >
              {launching === "ctt" ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Terminal ref={cttIconHover.ref} size={12} />
              )}
              CTT Utility
            </button>
            <button
              className="btn btn-outline btn-xs gap-1 rounded-full text-[11px] px-2 border-blue-500/30 text-slate-300"
              onClick={handleOpenDownloader}
              onMouseEnter={downloadIconHover.onMouseEnter}
              onMouseLeave={downloadIconHover.onMouseLeave}
              disabled={launching === "downloader"}
            >
              {launching === "downloader" ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Download ref={downloadIconHover.ref} size={12} />
              )}
              Downloader
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
