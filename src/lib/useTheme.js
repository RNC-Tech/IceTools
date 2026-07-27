import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "icetools-theme";
export const LIGHT_THEME = "rnclabs";
export const DARK_THEME = "rnclabsdark";
export const SYSTEM_MODE = "system";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(mode) {
  if (mode === LIGHT_THEME || mode === DARK_THEME) return mode;
  return systemPrefersDark() ? DARK_THEME : LIGHT_THEME;
}

function initialMode() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === LIGHT_THEME || stored === DARK_THEME || stored === SYSTEM_MODE ? stored : SYSTEM_MODE;
}

// Each top-level window (main app, standalone Downloader, widget) is its own
// document, so every window that calls this hook sets its own <html>
// data-theme independently - there's no shared renderer state to sync here.
// "mode" is what's persisted/selected (System/Light/Dark); "theme" is the
// resolved DaisyUI theme name actually applied to the page.
export function useTheme() {
  const [mode, setMode] = useState(initialMode);
  const theme = resolveTheme(mode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Only relevant in System mode - live-follows OS theme changes instead of
  // requiring a restart or manual toggle to pick up the new preference.
  useEffect(() => {
    if (mode !== SYSTEM_MODE) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      document.documentElement.setAttribute("data-theme", systemPrefersDark() ? DARK_THEME : LIGHT_THEME);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((m) => (resolveTheme(m) === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  }, []);

  return { theme, mode, setMode, toggle };
}
