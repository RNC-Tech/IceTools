import React, { useCallback, useEffect, useState } from "react";
import { MemoryStick, Trash2 } from "lucide-react";
import { Snowflake, Sparkles, Terminal, Download, Activity } from "../components/icons/index.js";
import { call, formatBytes } from "../lib/api.js";
import { useTheme } from "../lib/useTheme.js";
import { useToast } from "../components/ToastProvider.jsx";
import { useIconHover } from "../lib/useIconHover.js";

const POLL_MS = 3000;
// Matches the same "2GB looks full" visual scale used on Memory Cleaner - a
// pile of temp files has no natural 100%.
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
      // Transient failure - the widget just keeps showing its last known
      // values until the next successful poll.
    }
  }, []);

  // The widget window is hidden/shown rather than destroyed between toggles,
  // so pause polling while it's not visible instead of running forever in
  // the background.
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
      const result = await call(window.api.memory.cleanMemory([]));
      toast.success(`Freed ~${formatBytes(result.freedBytes)} of RAM.`);
      poll();
    } catch (err) {
      toast.error(`Clear memory failed: ${err.message}`);
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
      await call(window.api.tools.openDownloaderWindow());
    } catch (err) {
      toast.error(`Could not open Downloader: ${err.message}`);
    } finally {
      setLaunching(null);
    }
  }

  const tempPercent = tempBytes === null ? 0 : Math.min(100, Math.round((tempBytes / TEMP_FILES_SCALE_BYTES) * 100));

  return (
    <div className="h-screen w-screen bg-base-100 text-base-content flex flex-col overflow-hidden border border-base-300">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300 shrink-0" style={{ WebkitAppRegion: "drag" }}>
        <button
          className="shrink-0 hover:opacity-80 transition-opacity"
          style={{ WebkitAppRegion: "no-drag" }}
          onClick={() => call(window.api.app.showMainWindow()).catch(() => {})}
          title="Open IceTools"
        >
          <Snowflake size={18} className="text-primary" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black leading-tight">IceTools</h1>
          <p className="text-[10px] opacity-60">Click the logo to open the app - drag here to move</p>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <div className="card bg-base-200">
          <div className="card-body p-3 gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-60">
                <MemoryStick size={13} />
                Memory Used
              </span>
              <span className="text-sm font-medium">{memory ? `${memory.usedPercent}%` : "-"}</span>
            </div>
            <progress className="progress progress-primary w-full" value={memory?.usedPercent ?? 0} max="100"></progress>
            {memory && (
              <span className="text-[11px] opacity-60">
                {formatBytes(memory.usedBytes)} / {formatBytes(memory.totalBytes)}
              </span>
            )}
            <button
              className="btn btn-primary btn-sm gap-1.5 mt-1 tooltip"
              data-tip="Reclaims idle RAM - always safe"
              onClick={handleClearMemory}
              onMouseEnter={clearIconHover.onMouseEnter}
              onMouseLeave={clearIconHover.onMouseLeave}
              disabled={clearing}
            >
              {clearing ? <span className="loading loading-spinner loading-xs"></span> : <Sparkles ref={clearIconHover.ref} size={14} />}
              Clear Memory
            </button>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-3 flex-row items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-60">
              <Activity size={13} />
              Running Processes
            </span>
            <span className="text-lg font-black">{processCount ?? "-"}</span>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-3 gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-60">
                <Trash2 size={13} />
                Temporary Files
              </span>
              <span className="text-sm font-medium">{tempBytes === null ? "-" : formatBytes(tempBytes)}</span>
            </div>
            <progress className="progress progress-secondary w-full" value={tempPercent} max="100"></progress>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium opacity-60 mb-2">Extra Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn btn-outline btn-sm gap-1.5 tooltip"
              data-tip="Chris Titus Tech's debloat/tweak toolkit"
              onClick={handleLaunchCtt}
              onMouseEnter={cttIconHover.onMouseEnter}
              onMouseLeave={cttIconHover.onMouseLeave}
              disabled={launching === "ctt"}
            >
              {launching === "ctt" ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Terminal ref={cttIconHover.ref} size={14} />
              )}
              CTT Utility
            </button>
            <button
              className="btn btn-outline btn-sm gap-1.5 tooltip"
              data-tip="Download video/audio via yt-dlp"
              onClick={handleOpenDownloader}
              onMouseEnter={downloadIconHover.onMouseEnter}
              onMouseLeave={downloadIconHover.onMouseLeave}
              disabled={launching === "downloader"}
            >
              {launching === "downloader" ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Download ref={downloadIconHover.ref} size={14} />
              )}
              Downloader
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
