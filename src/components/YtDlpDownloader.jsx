import React, { useCallback, useEffect, useState } from "react";
import { ListVideo, History, FolderOpen, Music, Video, Clock, Maximize2, ImageOff, User, Trash2, FileX, Eraser } from "lucide-react";
import { Download } from "./icons/index.js";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "./ToastProvider.jsx";
import { useIconHover } from "../lib/useIconHover.js";
import ConfirmModal from "./ConfirmModal.jsx";

function formatOptionLabel(f) {
  const parts = [];
  if (f.resolution) parts.push(f.resolution);
  parts.push(f.ext);
  if (!f.hasVideo) parts.push("audio only");
  if (f.abr) parts.push(`${f.abr}kbps`);
  if (f.filesizeBytes) parts.push(formatBytes(f.filesizeBytes));
  return `${f.formatId} · ${parts.join(" · ")}`;
}

function isValidUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

function formatRelativeTime(isoString) {
  if (!isoString) return "";
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
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMode, setDeleteMode] = useState("entryOnly"); // "entryOnly" | "fileAndEntry" | "clearAll"
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

  useEffect(() => {
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      call(window.api.ytdlp.getInfo(trimmed))
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 600);
    return () => clearTimeout(timer);
  }, [url]);

  async function handleInstall() {
    setInstalling(true);
    try {
      await call(window.api.ytdlp.install());
      setInstalled(true);
      toast.success("yt-dlp installed successfully.");
    } catch (err) {
      toast.error(`Failed to install yt-dlp: ${err.message}`);
    } finally {
      setInstalling(false);
    }
  }

  async function handleCheckFormats() {
    if (!url.trim()) {
      toast.error("Enter a valid URL first.");
      return;
    }
    setFetchingFormats(true);
    setFormats(null);
    setFormatId("");
    try {
      const result = await call(window.api.ytdlp.listFormats(url.trim()));
      if (result.formats.length === 0) {
        toast.info("No selectable formats found - automatic quality picker will be used.");
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
      toast.error("Enter a valid URL first.");
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
      await call(
        window.api.ytdlp.download({
          url: url.trim(),
          mode,
          formatId: formatId || undefined,
          thumbnailUrl: preview?.thumbnail || undefined,
        })
      );
      toast.success("Download complete - saved to Downloads folder.");
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
      toast.error(`Could not open folder: ${err.message}`);
    }
  }

  async function handleConfirmDelete() {
    if (deleteMode === "clearAll") {
      try {
        await call(window.api.ytdlp.clearHistory());
        toast.success("Cleared all download history.");
        loadHistory();
      } catch (err) {
        toast.error(`Could not clear history: ${err.message}`);
      } finally {
        setDeleteTarget(null);
      }
      return;
    }

    if (!deleteTarget) return;
    try {
      if (deleteMode === "fileAndEntry") {
        await call(window.api.ytdlp.deleteFileAndHistoryItem(deleteTarget.id || deleteTarget.filePath, deleteTarget.filePath));
        toast.success(`Deleted file and removed download entry.`);
      } else {
        await call(window.api.ytdlp.removeHistoryItem(deleteTarget.id || deleteTarget.filePath));
        toast.success(`Removed download entry from history.`);
      }
      loadHistory();
    } catch (err) {
      toast.error(`Deletion failed: ${err.message}`);
    } finally {
      setDeleteTarget(null);
    }
  }

  const visibleFormats = (formats || []).filter((f) => (mode === "audio" ? !f.hasVideo : f.hasVideo));

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 border border-blue-500/20 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Download size={18} className="text-blue-400" /> Video & Audio Downloader
        </h3>

        {installed === null ? (
          <div className="flex justify-center p-4">
            <span className="loading loading-spinner loading-md text-blue-400"></span>
          </div>
        ) : !installed ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-blue-500/15">
            <span className="text-xs font-medium text-slate-300">yt-dlp is required to download media files.</span>
            <button className="btn btn-sm btn-primary rounded-full px-5" onClick={handleInstall} disabled={installing}>
              {installing ? <span className="loading loading-spinner loading-xs"></span> : "Install yt-dlp Core"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(preview || previewLoading) && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/15 flex items-start gap-4">
                <div className="w-44 aspect-video rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950 shrink-0 flex items-center justify-center">
                  {preview?.thumbnail ? (
                    <img
                      src={preview.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setPreview((p) => (p ? { ...p, thumbnail: null } : p))}
                    />
                  ) : previewLoading && !preview ? (
                    <span className="loading loading-spinner loading-sm text-blue-400 opacity-60"></span>
                  ) : (
                    <ImageOff size={22} className="text-slate-600" />
                  )}
                </div>
                {preview && (
                  <div className="min-w-0 space-y-1 pt-0.5">
                    <p className="text-xs font-bold text-white line-clamp-2">{preview.title || "Untitled Video"}</p>
                    {preview.uploader && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <User size={12} /> {preview.uploader}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      {preview.resolution && (
                        <span className="flex items-center gap-1">
                          <Maximize2 size={11} /> {preview.resolution}
                        </span>
                      )}
                      {preview.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {preview.duration}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <input
                className="input input-bordered w-full rounded-xl bg-slate-900/60 border-blue-500/20 text-xs text-white font-mono placeholder:text-slate-500 focus:border-blue-500/50"
                placeholder="Paste video URL (YouTube, Vimeo, Twitter, etc.)..."
                value={url}
                onChange={handleUrlChange}
                disabled={downloading}
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  className={`btn btn-xs rounded-full px-3.5 ${mode === "video" ? "btn-primary" : "btn-ghost text-slate-300"}`}
                  onClick={() => {
                    setMode("video");
                    setFormatId("");
                  }}
                  disabled={downloading}
                >
                  <Video size={13} /> Video (MP4)
                </button>
                <button
                  className={`btn btn-xs rounded-full px-3.5 ${mode === "audio" ? "btn-primary" : "btn-ghost text-slate-300"}`}
                  onClick={() => {
                    setMode("audio");
                    setFormatId("");
                  }}
                  disabled={downloading}
                >
                  <Music size={13} /> Audio Only (MP3)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn btn-xs btn-outline rounded-full px-3.5 gap-1 border-blue-500/30 text-blue-300"
                  onClick={handleCheckFormats}
                  disabled={downloading || fetchingFormats}
                >
                  {fetchingFormats ? <span className="loading loading-spinner loading-xs"></span> : <ListVideo size={13} />}
                  Check Formats
                </button>

                <button
                  className="btn btn-sm btn-primary rounded-full px-5 gap-2 shadow-lg shadow-blue-500/30 font-bold"
                  onClick={handleDownload}
                  onMouseEnter={downloadIconHover.onMouseEnter}
                  onMouseLeave={downloadIconHover.onMouseLeave}
                  disabled={downloading}
                >
                  {downloading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Download ref={downloadIconHover.ref} size={15} />
                  )}
                  Download Media
                </button>
              </div>
            </div>

            {formats && (
              <select
                className="select select-sm select-bordered w-full rounded-xl bg-slate-900/60 border-blue-500/20 text-xs text-slate-200 font-mono"
                value={formatId}
                onChange={(e) => setFormatId(e.target.value)}
                disabled={downloading}
              >
                <option value="">Auto (Best Quality {mode === "audio" ? "Audio" : "Video"})</option>
                {visibleFormats.map((f) => (
                  <option key={f.formatId} value={f.formatId}>
                    {formatOptionLabel(f)}
                  </option>
                ))}
              </select>
            )}

            {downloading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="truncate max-w-[280px]">{progressLine}</span>
                  <span className="font-mono text-blue-400">{progress ?? 0}%</span>
                </div>
                <progress className="progress progress-primary w-full h-2 rounded-full" value={progress ?? 0} max="100"></progress>
              </div>
            )}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-tight uppercase text-slate-300 flex items-center gap-1.5">
              <History size={14} className="text-blue-400" /> Download History ({history.length})
            </h3>
            <button
              className="btn btn-xs btn-outline rounded-full px-3 text-slate-400 border-slate-700/60 hover:text-rose-400 hover:border-rose-500/40 flex items-center gap-1"
              onClick={() => {
                setDeleteTarget({ title: "All Download History" });
                setDeleteMode("clearAll");
              }}
            >
              <Eraser size={12} />
              <span>Clear All History</span>
            </button>
          </div>

          <div className="space-y-2">
            {history.map((item, i) => (
              <div key={item.id || i} className="glass-card rounded-2xl p-3 flex items-center justify-between gap-3 border border-blue-500/15">
                <div className="flex items-center gap-3 min-w-0">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-blue-500/20 shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      {item.mode === "audio" ? <Music size={18} /> : <Video size={18} />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="truncate text-xs font-bold text-white block" title={item.title}>
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {formatRelativeTime(item.downloadedAt)} · {item.mode === "audio" ? "Audio MP3" : "Video MP4"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="btn btn-ghost btn-xs rounded-lg gap-1 text-slate-300 hover:text-white"
                    title="Show file in folder"
                    onClick={() => handleOpenHistoryItem(item)}
                  >
                    <FolderOpen size={13} />
                    <span className="hidden sm:inline">Folder</span>
                  </button>

                  <button
                    className="btn btn-ghost btn-xs rounded-lg text-slate-400 hover:text-rose-400"
                    title="Delete download entry from history"
                    onClick={() => {
                      setDeleteTarget(item);
                      setDeleteMode("entryOnly");
                    }}
                  >
                    <Trash2 size={13} />
                  </button>

                  <button
                    className="btn btn-ghost btn-xs rounded-lg text-slate-400 hover:text-rose-400"
                    title="Delete file from disk and entry"
                    onClick={() => {
                      setDeleteTarget(item);
                      setDeleteMode("fileAndEntry");
                    }}
                  >
                    <FileX size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={
          deleteMode === "clearAll"
            ? "Clear all download history?"
            : deleteMode === "fileAndEntry"
            ? "Delete file & entry?"
            : "Delete history entry?"
        }
        message={
          deleteMode === "clearAll"
            ? "This clears all entries from your download history log. Files saved on disk will not be deleted."
            : deleteMode === "fileAndEntry"
            ? `Permanently delete "${deleteTarget?.title}" from disk AND remove entry from download history?`
            : `Remove "${deleteTarget?.title}" from download history log? (File on disk will not be deleted).`
        }
        confirmLabel={
          deleteMode === "clearAll"
            ? "Clear All History"
            : deleteMode === "fileAndEntry"
            ? "Delete File & Entry"
            : "Remove Entry"
        }
        danger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
