import { useEffect, useState } from "react";

const STORAGE_KEY = "icetools-theme";
export const LIGHT_THEME = "rnclabs";
export const DARK_THEME = "rnclabsdark";

function initialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === LIGHT_THEME || stored === DARK_THEME) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME;
}

// Each top-level window (main app, standalone Downloader) is its own
// document, so every window that calls this hook sets its own <html>
// data-theme independently - there's no shared renderer state to sync here.
export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  }

  return { theme, toggle };
}
