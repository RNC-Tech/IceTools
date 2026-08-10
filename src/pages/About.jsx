import React, { useEffect, useState } from "react";
import { Info, RefreshCw, CheckCircle2, ChevronDown, Layers, Zap, ExternalLink } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { call } from "../lib/api.js";
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
  const toast = useToast();

  useEffect(() => {
    call(window.api.app.getVersion())
      .then(setVersion)
      .catch(() => setVersion(null));
    call(window.api.changelog.get())
      .then(setChangelog)
      .catch(() => setChangelog([]));
  }, []);

  function handleOpenGitHubReleases() {
    call(window.api.app.openExternal("https://github.com/RNC-Tech/IceTools/releases")).catch((err) => toast.error(err.message));
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <PageHeader
        icon={Info}
        title="About IceTools"
        description="Comprehensive system information, release history, and software release links."
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

        {/* Software Updates Card */}
        <div className="glass-card rounded-2xl p-6 space-y-4 border border-blue-500/20 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-blue-400" /> Software Releases
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Check the official GitHub repository for new release packages, feature updates, and performance patches.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              className="btn btn-sm btn-disabled opacity-50 cursor-not-available rounded-full w-full gap-2 font-semibold text-slate-400 border-slate-700 bg-slate-800/40"
              disabled
              title="In-app automatic background check is disabled"
            >
              <RefreshCw size={14} />
              Check for Updates (Disabled)
            </button>

            <button
              className="btn btn-sm btn-primary rounded-full w-full gap-2 font-bold shadow-lg shadow-blue-500/30"
              onClick={handleOpenGitHubReleases}
            >
              <ExternalLink size={14} />
              View Releases on GitHub
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="glass-card rounded-2xl p-5 border border-blue-500/15 space-y-3 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Zap size={16} className="text-amber-400" /> Key Features & Capabilities
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
            Live CPU, RAM, GPU & Disk hardware monitoring telemetry
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
            Sub-Zero One-Click RAM and Temporary Junk File Cleaner
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
            Integrated Windows Services and Startup app manager
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
            Network speed tester with embedded Fast.com & Speedtest.net
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
            App Uninstaller with deep leftover file & registry scanner
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
            Sage Downloader for YouTube & web media with history controls
          </li>
        </ul>
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
