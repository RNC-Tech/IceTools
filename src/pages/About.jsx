import React, { useEffect, useState } from "react";
import { Info, RefreshCw, CheckCircle2, ChevronDown, Cpu, Layers, ShieldCheck, Zap, Download, Code2, Globe } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { call } from "../lib/api.js";
import { useUpdater } from "../lib/useUpdater.js";
import { useToast } from "../components/ToastProvider.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

function ChangelogItem({ release, isDefaultOpen }) {
  const [open, setOpen] = useState(isDefaultOpen);

  return (
    <div className="rounded-xl border border-blue-500/20 bg-slate-900/60 overflow-hidden transition-all shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-blue-500/10 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="font-bold text-xs text-white">{release.name || `Release v${release.version}`}</span>
          {release.version && (
            <span className="badge badge-xs bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono">
              v{release.version}
            </span>
          )}
          {release.prerelease && (
            <span className="badge badge-xs bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold uppercase text-[10px]">
              Pre-release
            </span>
          )}
          {release.publishedAt && (
            <span className="text-[11px] text-slate-400 font-mono">
              {new Date(release.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className={`p-1 rounded-lg text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-blue-400" : ""}`}>
          <ChevronDown size={15} />
        </div>
      </button>

      {open && (
        <div className="p-4 pt-1 border-t border-blue-500/15 bg-slate-950/40">
          <pre className="text-xs font-sans text-slate-300 whitespace-pre-wrap leading-relaxed">
            {release.notes || "No detailed release notes provided for this build."}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function About() {
  const [version, setVersion] = useState(null);
  const [changelog, setChangelog] = useState(null);
  const { status, version: updateVersion, releaseNotes, percent, check, download, install } = useUpdater();
  const toast = useToast();

  useEffect(() => {
    call(window.api.app.getVersion())
      .then(setVersion)
      .catch(() => setVersion(null));
    call(window.api.changelog.get())
      .then(setChangelog)
      .catch(() => setChangelog([]));
  }, []);

  async function handleCheck() {
    try {
      await check();
    } catch (err) {
      toast.error(`Update check failed: ${err.message}`);
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <PageHeader
        icon={Info}
        title="About IceTools"
        description="Comprehensive system information, release history, technology stack, and software update status."
        badge="System Information"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* App Hero Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-blue-500/20 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/30 shadow-lg shadow-blue-500/20 shrink-0">
              <img src="./icetools.svg" alt="IceTools Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">IceTools</h3>
              <p className="text-xs text-blue-400 font-semibold tracking-wide uppercase">Sub-Zero Windows Optimizer</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge badge-sm bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono font-bold px-2.5">
                  {version ? `v${version}` : "v1.0.0"}
                </span>
                <span className="badge badge-sm bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">
                  Official Build
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            An all-in-one utility designed for Windows power users. Monitor live system hardware load, optimize RAM & disk storage, manage background apps, configure power plans, test network connectivity, and uninstall left-over files.
          </p>

          <div className="pt-2 border-t border-blue-500/15 flex items-center justify-between text-xs text-slate-400">
            <span>Publisher: RNC-Tech</span>
            <span>Platform: Windows 10 / 11 x64</span>
          </div>
        </div>

        {/* Software Updater Card */}
        <div className="glass-card rounded-2xl p-6 space-y-4 border border-blue-500/20 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-blue-400" /> Software Updates
            </h4>
            <p className="text-xs text-slate-400">
              IceTools checks GitHub Releases automatically to keep your system optimizer updated with the latest performance patches.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {status === "idle" && (
              <button className="btn btn-sm btn-primary rounded-full w-full gap-2 font-bold shadow-lg shadow-blue-500/30" onClick={handleCheck}>
                <RefreshCw size={14} />
                Check for Updates
              </button>
            )}

            {status === "checking" && (
              <div className="flex items-center justify-center gap-2 text-xs text-blue-300 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <span className="loading loading-spinner loading-xs text-blue-400"></span>
                Checking GitHub Releases...
              </div>
            )}

            {status === "up-to-date" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 size={16} />
                  IceTools is up to date {version ? `(v${version})` : ""}.
                </div>
                <button className="btn btn-xs btn-outline rounded-full border-blue-500/30 text-blue-300 w-full" onClick={handleCheck}>
                  Check Again
                </button>
              </div>
            )}

            {status === "available" && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-white">
                  New Version {updateVersion} is available!
                </div>
                {releaseNotes && (
                  <div className="bg-slate-900/80 rounded-xl p-3 max-h-36 overflow-y-auto border border-blue-500/20">
                    <pre className="text-[11px] whitespace-pre-wrap font-sans text-slate-300">{releaseNotes}</pre>
                  </div>
                )}
                <button
                  className="btn btn-sm btn-primary rounded-full w-full gap-2 font-bold shadow-lg shadow-blue-500/30"
                  onClick={() => download().catch((err) => toast.error(`Download failed: ${err.message}`))}
                >
                  Download Update
                </button>
              </div>
            )}

            {status === "downloading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Downloading update...</span>
                  <span className="font-mono text-blue-400 font-bold">{percent}%</span>
                </div>
                <progress className="progress progress-primary w-full h-2 rounded-full" value={percent} max="100"></progress>
              </div>
            )}

            {status === "downloaded" && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  Update downloaded and ready to install.
                </div>
                <button
                  className="btn btn-sm btn-primary rounded-full w-full gap-2 font-bold shadow-lg shadow-blue-500/30"
                  onClick={() => install().catch((err) => toast.error(`Install failed: ${err.message}`))}
                >
                  Restart & Install Update
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-2">
                <div className="text-xs text-rose-400 font-semibold p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  Update check failed.
                </div>
                <button className="btn btn-xs btn-outline rounded-full border-blue-500/30 text-blue-300 w-full" onClick={handleCheck}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Highlights & Tech Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-blue-500/15 space-y-3 shadow-xl">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Zap size={16} className="text-amber-400" /> Key Features & Capabilities
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Live CPU, RAM, GPU & Disk hardware monitoring telemetry
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Sub-Zero One-Click RAM and Temporary Junk File Cleaner
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Integrated Windows Services and Startup app manager
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Network speed tester with embedded Fast.com & Speedtest.net
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              App Uninstaller with deep leftover file & registry scanner
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Sage Downloader for YouTube & web media with history controls
            </li>
          </ul>
        </div>
      </div>

      {/* Release History & Changelog */}
      <div className="glass-card rounded-2xl p-6 space-y-4 border border-blue-500/15 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Layers size={16} className="text-blue-400" /> Release History & Changelog
          </h4>
          {changelog && changelog.length > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {changelog.length} build(s) recorded
            </span>
          )}
        </div>

        {changelog === null && (
          <div className="space-y-3 py-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        )}

        {changelog !== null && changelog.length === 0 && (
          <p className="text-xs text-slate-400 py-2">No release history available.</p>
        )}

        {changelog !== null && changelog.length > 0 && (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {changelog.map((release, i) => (
              <ChangelogItem key={release.version || i} release={release} isDefaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
