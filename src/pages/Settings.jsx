import React, { useEffect, useState } from "react";
import { Rocket, Palette, PictureInPicture2, RefreshCw } from "lucide-react";
import { SlidersHorizontal } from "../components/icons/index.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import { useTheme, LIGHT_THEME, DARK_THEME, SYSTEM_MODE } from "../lib/useTheme.js";

const THEME_OPTIONS = [
  { value: SYSTEM_MODE, label: "System" },
  { value: LIGHT_THEME, label: "Light" },
  { value: DARK_THEME, label: "Dark" },
];

function SettingRow({ title, description, checked, onChange, tip }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg bg-base-200 cursor-pointer gap-4">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs opacity-50">{description}</div>
      </div>
      <input
        type="checkbox"
        className="toggle toggle-success tooltip tooltip-left shrink-0"
        data-tip={tip}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const toast = useToast();
  const { mode, setMode } = useTheme();

  useEffect(() => {
    call(window.api.settings.get())
      .then(setSettings)
      .catch((err) => toast.error(`Failed to load settings: ${err.message}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-xl font-black flex items-center gap-2">
        <SlidersHorizontal size={20} />
        Settings
      </h2>

      <section>
        <h3 className="text-sm font-medium opacity-70 mb-2 flex items-center gap-1.5">
          <AnimatedIcon icon={Rocket} size={16} />
          Startup
        </h3>
        <SettingRow
          title="Run IceTools at Windows startup"
          description="Launches IceTools automatically when you sign in to Windows."
          checked={settings.runAtStartup}
          tip={settings.runAtStartup ? "Disable auto-start" : "Enable auto-start"}
          onChange={(value) => updateSetting("runAtStartup", value)}
        />
      </section>

      <section>
        <h3 className="text-sm font-medium opacity-70 mb-2 flex items-center gap-1.5">
          <AnimatedIcon icon={Palette} size={16} />
          Appearance
        </h3>
        <div className="flex items-center justify-between p-3 rounded-lg bg-base-200">
          <div>
            <div className="font-medium">Default theme</div>
            <div className="text-xs opacity-50">"System" follows your Windows light/dark setting automatically.</div>
          </div>
          <div className="join shrink-0">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn-xs join-item ${mode === opt.value ? "btn-active" : ""}`}
                onClick={() => setMode(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium opacity-70 mb-2 flex items-center gap-1.5">
          <AnimatedIcon icon={PictureInPicture2} size={16} />
          System Tray
        </h3>
        <div className="space-y-2">
          <SettingRow
            title="Minimize to tray"
            description="Clicking the minimize button hides IceTools to the system tray instead of the taskbar."
            checked={settings.minimizeToTray}
            tip={settings.minimizeToTray ? "Minimize to taskbar instead" : "Minimize to tray instead"}
            onChange={(value) => updateSetting("minimizeToTray", value)}
          />
          <SettingRow
            title="Close to tray"
            description="Clicking the close button hides IceTools to the system tray instead of quitting."
            checked={settings.closeToTray}
            tip={settings.closeToTray ? "Quit on close instead" : "Keep running in tray on close"}
            onChange={(value) => updateSetting("closeToTray", value)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium opacity-70 mb-2 flex items-center gap-1.5">
          <AnimatedIcon icon={RefreshCw} size={16} />
          Updates
        </h3>
        <SettingRow
          title="Automatically check for updates"
          description="Checks GitHub Releases for a newer version shortly after IceTools starts."
          checked={settings.autoCheckUpdates}
          tip={settings.autoCheckUpdates ? "Disable auto-check" : "Enable auto-check"}
          onChange={(value) => updateSetting("autoCheckUpdates", value)}
        />
      </section>
    </div>
  );
}
