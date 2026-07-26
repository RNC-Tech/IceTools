import React, { useEffect, useState } from "react";
import { Info, RefreshCw, CheckCircle2 } from "lucide-react";
import { Snowflake, ExternalLink } from "../components/icons/index.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { call } from "../lib/api.js";
import { useUpdater } from "../lib/useUpdater.js";
import { useToast } from "../components/ToastProvider.jsx";

export default function About() {
  const [version, setVersion] = useState(null);
  const { status, version: updateVersion, percent, error, check, download, install } = useUpdater();
  const toast = useToast();

  useEffect(() => {
    call(window.api.app.getVersion())
      .then(setVersion)
      .catch(() => setVersion(null));
  }, []);

  async function handleCheck() {
    try {
      await check();
    } catch (err) {
      toast.error(`Update check failed: ${err.message}`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-black flex items-center gap-2">
        <AnimatedIcon icon={Info} size={20} />
        About
      </h2>

      <div className="card bg-base-200 max-w-md">
        <div className="card-body items-center text-center gap-1">
          <Snowflake size={40} className="text-primary" />
          <h3 className="text-2xl font-black">IceTools</h3>
          <p className="text-sm opacity-60">Windows Optimizer</p>
          <div className="badge badge-neutral mt-2">{version ? `v${version}` : "..."}</div>
          <p className="text-xs opacity-60 mt-3">
            An all-in-one Windows optimizer - process monitor, memory cleaner, startup manager, services,
            disk cleanup, power &amp; network tools, and a few extras.
          </p>
          <button
            className="link link-hover text-xs mt-2 flex items-center gap-1"
            onClick={() => window.api.app.openExternal("https://github.com/RNC-Tech/IceTools")}
          >
            <ExternalLink size={12} />
            github.com/RNC-Tech/IceTools
          </button>
        </div>
      </div>

      <div className="card bg-base-200 max-w-md">
        <div className="card-body gap-3">
          <h4 className="font-medium text-sm">Updates</h4>

          {status === "idle" && (
            <button className="btn btn-sm btn-primary gap-2 w-fit" onClick={handleCheck}>
              <RefreshCw size={14} />
              Check for Updates
            </button>
          )}

          {status === "checking" && (
            <span className="text-sm opacity-70 flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              Checking for updates...
            </span>
          )}

          {status === "up-to-date" && (
            <div className="space-y-2">
              <span className="text-sm text-success flex items-center gap-2">
                <CheckCircle2 size={16} />
                You're up to date{version ? ` (v${version})` : ""}.
              </span>
              <button className="btn btn-sm btn-outline gap-2 w-fit" onClick={handleCheck}>
                <RefreshCw size={14} />
                Check Again
              </button>
            </div>
          )}

          {status === "available" && (
            <div className="space-y-2">
              <span className="text-sm">Version {updateVersion} is available.</span>
              <button
                className="btn btn-sm btn-primary gap-2 w-fit"
                onClick={() => download().catch((err) => toast.error(`Download failed: ${err.message}`))}
              >
                Download Update
              </button>
            </div>
          )}

          {status === "downloading" && (
            <div className="space-y-1">
              <span className="text-sm opacity-70">Downloading update... {percent}%</span>
              <progress className="progress progress-primary w-full" value={percent} max="100"></progress>
            </div>
          )}

          {status === "downloaded" && (
            <div className="space-y-2">
              <span className="text-sm text-success">Update downloaded and ready to install.</span>
              <button
                className="btn btn-sm btn-primary gap-2 w-fit"
                onClick={() => install().catch((err) => toast.error(`Install failed: ${err.message}`))}
              >
                Restart & Install
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <span className="text-sm text-error" title={error}>
                Update check failed.
              </span>
              <button className="btn btn-sm btn-outline gap-2 w-fit" onClick={handleCheck}>
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
