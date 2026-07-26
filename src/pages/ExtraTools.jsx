import React, { useState } from "react";
import { Terminal, Download, ExternalLink, Wrench } from "../components/icons/index.js";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";

function CttWinUtilCard() {
  const [launching, setLaunching] = useState(false);
  const toast = useToast();

  async function handleLaunch() {
    setLaunching(true);
    try {
      await call(window.api.tools.runCttWinUtil());
      toast.success("CTT Windows Utility launched in a new window.");
    } catch (err) {
      toast.error(`Could not launch CTT Windows Utility: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title text-base gap-2">
          <Terminal size={18} />
          CTT Windows Utility
        </h3>
        <p className="text-sm opacity-70">
          Chris Titus Tech's open-source debloat/tweak/config toolkit. Opens in its own window - review what it
          offers before applying anything.
        </p>
        <div className="badge badge-ghost badge-sm w-fit">Needs internet access</div>
        <div className="card-actions justify-end mt-2">
          <button className="btn btn-primary btn-sm gap-2" onClick={handleLaunch} disabled={launching}>
            {launching ? <span className="loading loading-spinner loading-xs"></span> : <ExternalLink size={14} />}
            Launch
          </button>
        </div>
      </div>
    </div>
  );
}

function YtDlpLauncherCard() {
  const [opening, setOpening] = useState(false);
  const toast = useToast();

  async function handleOpen() {
    setOpening(true);
    try {
      await call(window.api.tools.openDownloaderWindow());
    } catch (err) {
      toast.error(`Could not open Downloader window: ${err.message}`);
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title text-base gap-2">
          <Download size={18} />
          Video/Audio Downloader
        </h3>
        <p className="text-sm opacity-70">
          Download video or audio from a URL, powered by yt-dlp. Opens in its own window so it keeps running
          independently of the rest of IceTools.
        </p>
        <div className="card-actions justify-end mt-2">
          <button className="btn btn-primary btn-sm gap-2" onClick={handleOpen} disabled={opening}>
            {opening ? <span className="loading loading-spinner loading-xs"></span> : <ExternalLink size={14} />}
            Open Downloader
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExtraTools() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-black flex items-center gap-2">
        <Wrench size={20} />
        Extra Tools
      </h2>
      <p className="text-sm opacity-60">Optional third-party utilities and helpers.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CttWinUtilCard />
        <YtDlpLauncherCard />
      </div>
    </div>
  );
}
