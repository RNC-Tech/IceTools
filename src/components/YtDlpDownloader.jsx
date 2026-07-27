import React, { useCallback, useEffect, useState } from "react";
import { ListVideo, History, FolderOpen, Music, Video } from "lucide-react";
import { Download } from "./icons/index.js";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "./ToastProvider.jsx";
import { useIconHover } from "../lib/useIconHover.js";

function formatOptionLabel(f) {
  const parts = [];
  if (f.resolution) parts.push(f.resolution);
  parts.push(f.ext);
  if (!f.hasVideo) parts.push("audio only");
  if (f.abr) parts.push(`${f.abr}kbps`);
  if (f.filesizeBytes) parts.push(formatBytes(f.filesizeBytes));
  return `${f.formatId} · ${parts.join(" · ")}`;
}

function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function YtDlpDownloader() {
  const [installed, setInstalled] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("video");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [progressLine, setProgressLine] = useState("");
  const [formats, setFormats] = useState(null);
  const [formatId, setFormatId] = useState("");
  const [fetchingFormats, setFetchingFormats] = useState(false);
  const [history, setHistory] = useState([]);
  const toast = useToast();
  const downloadIconHover = useIconHover();

  const loadHistory = useCallback(() => {
    call(window.api.ytdlp.getHistory())
      .then(setHistory)
      .catch(() => {});
  }, []);

  useEffect(() => {
    call(window.api.ytdlp.isInstalled())
      .then(setInstalled)
      .catch(() => setInstalled(false));
    loadHistory();
  }, [loadHistory]);

  function handleUrlChange(e) {
    setUrl(e.target.value);
    setFormats(null);
    setFormatId("");
  }

  async function handleInstall() {
    setInstalling(true);
    try {
      await call(window.api.ytdlp.install());
      setInstalled(true);
      toast.success("yt-dlp installed.");
    } catch (err) {
      toast.error(`Failed to install yt-dlp: ${err.message}`);
    } finally {
      setInstalling(false);
    }
  }

  async function handleCheckFormats() {
    if (!url.trim()) {
      toast.error("Enter a URL first.");
      return;
    }
    setFetchingFormats(true);
    setFormats(null);
    setFormatId("");
    try {
      const result = await call(window.api.ytdlp.listFormats(url.trim()));
      if (result.formats.length === 0) {
        toast.info("No selectable formats found for this URL - the automatic quality picker will be used.");
      }
      setFormats(result.formats);
    } catch (err) {
      toast.error(`Could not fetch formats: ${err.message}`);
    } finally {
      setFetchingFormats(false);
    }
  }

  async function handleDownload() {
    if (!url.trim()) {
      toast.error("Enter a URL first.");
      return;
    }
    setDownloading(true);
    setProgress(0);
    setProgressLine("Starting...");
    const unsubscribe = window.api.ytdlp.onProgress((data) => {
      setProgress(data.percent);
      setProgressLine(data.line || "");
    });
    try {
      await call(window.api.ytdlp.download({ url: url.trim(), mode, formatId: formatId || undefined }));
      toast.success("Download complete - saved to your Downloads folder.");
      setUrl("");
      setFormats(null);
      setFormatId("");
      loadHistory();
    } catch (err) {
      toast.error(`Download failed: ${err.message}`);
    } finally {
      unsubscribe();
      setDownloading(false);
      setProgress(null);
      setProgressLine("");
    }
  }

  async function handleOpenHistoryItem(item) {
    try {
      await call(window.api.ytdlp.openHistoryItem(item.filePath));
    } catch (err) {
      toast.error(`Could not open file: ${err.message}`);
    }
  }

  const visibleFormats = (formats || []).filter((f) => (mode === "audio" ? !f.hasVideo : f.hasVideo));

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title text-base gap-2">
          <Download size={18} />
          Video/Audio Downloader
        </h3>
        <p className="text-sm opacity-70">
          Powered by{" "}
          <button className="link link-hover" onClick={() => window.api.app.openExternal("https://github.com/yt-dlp/yt-dlp")}>
            yt-dlp
          </button>
          . Only download content you have the right to save - respect creators' rights and each site's terms of
          service.
        </p>

        {installed === null ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : !installed ? (
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-70">yt-dlp isn't installed yet.</span>
            <button className="btn btn-sm btn-primary" onClick={handleInstall} disabled={installing}>
              {installing ? <span className="loading loading-spinner loading-xs"></span> : "Install yt-dlp"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              className="input input-sm input-bordered w-full"
              placeholder="Paste a video URL..."
              value={url}
              onChange={handleUrlChange}
              disabled={downloading}
            />
            <div className="flex items-center justify-between">
              <div className="join">
                <button
                  className={`btn btn-xs join-item ${mode === "video" ? "btn-active" : ""}`}
                  onClick={() => {
                    setMode("video");
                    setFormatId("");
                  }}
                  disabled={downloading}
                >
                  Video
                </button>
                <button
                  className={`btn btn-xs join-item ${mode === "audio" ? "btn-active" : ""}`}
                  onClick={() => {
                    setMode("audio");
                    setFormatId("");
                  }}
                  disabled={downloading}
                >
                  Audio only
                </button>
              </div>
              <button className="btn btn-xs btn-outline gap-1" onClick={handleCheckFormats} disabled={downloading || fetchingFormats}>
                {fetchingFormats ? <span className="loading loading-spinner loading-xs"></span> : <ListVideo size={12} />}
                Check formats
              </button>
            </div>

            {formats && (
              <select
                className="select select-sm select-bordered w-full"
                value={formatId}
                onChange={(e) => setFormatId(e.target.value)}
                disabled={downloading}
              >
                <option value="">Auto (best {mode === "audio" ? "audio" : "video"})</option>
                {visibleFormats.map((f) => (
                  <option key={f.formatId} value={f.formatId}>
                    {formatOptionLabel(f)}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end">
              <button
                className="btn btn-sm btn-primary gap-2"
                onClick={handleDownload}
                onMouseEnter={downloadIconHover.onMouseEnter}
                onMouseLeave={downloadIconHover.onMouseLeave}
                disabled={downloading}
              >
                {downloading ? <span className="loading loading-spinner loading-xs"></span> : <Download ref={downloadIconHover.ref} size={14} />}
                Download
              </button>
            </div>
            {downloading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs opacity-60">
                  <span className="truncate">{progressLine}</span>
                  <span className="shrink-0 ml-2">{progress ?? 0}%</span>
                </div>
                <progress className="progress progress-primary w-full" value={progress ?? 0} max="100"></progress>
              </div>
            )}

            {history.length > 0 && (
              <div className="pt-3 mt-2 border-t border-base-300 space-y-1.5">
                <h4 className="text-xs font-medium opacity-60 flex items-center gap-1.5">
                  <History size={13} />
                  Recently Downloaded
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {history.slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs bg-base-100 rounded-md px-2 py-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.mode === "audio" ? (
                          <Music size={12} className="shrink-0 opacity-60" />
                        ) : (
                          <Video size={12} className="shrink-0 opacity-60" />
                        )}
                        <span className="truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="opacity-50">{formatRelativeTime(item.downloadedAt)}</span>
                        <button
                          className="btn btn-ghost btn-xs btn-circle"
                          title="Show in folder"
                          onClick={() => handleOpenHistoryItem(item)}
                        >
                          <FolderOpen size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
