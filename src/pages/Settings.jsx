import React, { useEffect, useState } from "react";
import { Rocket, PictureInPicture2, RefreshCw } from "lucide-react";
import { SlidersHorizontal } from "../components/icons/index.js";
import PageHeader from "../components/PageHeader.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";

function SettingRow({ title, description, checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-blue-500/15 transition-all"
    >
      <div>
        <div className="font-bold text-xs text-white">{title}</div>
        <div className="text-xs text-slate-400 mt-0.5">{description}</div>
      </div>
      <input
        type="checkbox"
        className="toggle toggle-primary toggle-sm shrink-0 ml-3"
        checked={checked}
        onChange={() => {}}
      />
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const toast = useToast();

  useEffect(() => {
    call(window.api.settings.get())
      .then(setSettings)
      .catch((err) => toast.error(`Failed to load settings: ${err.message}`));
  }, []);

  async function updateSetting(key, value) {
    const previous = settings;
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      const updated = await call(window.api.settings.set({ [key]: value }));
      setSettings(updated);
    } catch (err) {
      setSettings(previous);
      toast.error(`Failed to save setting: ${err.message}`);
    }
  }

  if (!settings) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <PageHeader
        icon={SlidersHorizontal}
        title="Application Settings"
        description="Configure startup behavior, system tray options, and auto-update checks."
        badge="Preferences"
      />

      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
          <Rocket size={16} className="text-blue-400" /> Windows Startup
        </h3>
        <SettingRow
          title="Run IceTools at Windows Startup"
          description="Launches IceTools automatically when you log into Windows."
          checked={settings.runAtStartup}
          onChange={(value) => updateSetting("runAtStartup", value)}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
          <PictureInPicture2 size={16} className="text-blue-400" /> System Tray Integration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingRow
            title="Minimize to System Tray"
            description="Minimizing hides IceTools to the Windows system tray."
            checked={settings.minimizeToTray}
            onChange={(value) => updateSetting("minimizeToTray", value)}
          />
          <SettingRow
            title="Close to System Tray"
            description="Closing the window keeps IceTools running in the tray."
            checked={settings.closeToTray}
            onChange={(value) => updateSetting("closeToTray", value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
          <RefreshCw size={16} className="text-blue-400" /> Automatic Updates
        </h3>
        <SettingRow
          title="Automatically Check for Updates"
          description="Checks GitHub Releases for new IceTools versions on launch."
          checked={settings.autoCheckUpdates}
          onChange={(value) => updateSetting("autoCheckUpdates", value)}
        />
      </div>
    </div>
  );
}
