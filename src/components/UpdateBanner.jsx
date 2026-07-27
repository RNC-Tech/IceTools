import React from "react";
import { DownloadCloud, RotateCw, CheckCircle2 } from "lucide-react";
import { useUpdater } from "../lib/useUpdater.js";
import { useToast } from "./ToastProvider.jsx";

export default function UpdateBanner() {
  const { status, version, percent, error, download, install } = useUpdater();
  const toast = useToast();

  if (status === "idle" || status === "checking") return null;

  if (status === "up-to-date") {
    return (
      <div className="text-xs text-success/80 px-1 flex items-center gap-1.5">
        <CheckCircle2 size={13} />
        Up to date
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-xs text-error/80 px-1" title={error}>
        Update check failed
      </div>
    );
  }

  if (status === "available") {
    return (
      <button
        className="btn btn-outline btn-xs w-full gap-1.5"
        onClick={() => download().catch((err) => toast.error(`Download failed: ${err.message}`))}
      >
        <DownloadCloud size={13} />v{version} available
      </button>
    );
  }

  if (status === "downloading") {
    return (
      <div className="space-y-1 px-1">
        <span className="text-xs opacity-60">Downloading update... {percent}%</span>
        <progress className="progress progress-primary w-full h-1.5" value={percent} max="100"></progress>
      </div>
    );
  }

  if (status === "downloaded") {
    return (
      <button
        className="btn btn-primary btn-xs w-full gap-1.5"
        onClick={() => install().catch((err) => toast.error(`Install failed: ${err.message}`))}
      >
        <RotateCw size={13} />
        Restart & Install
      </button>
    );
  }

  return null;
}
