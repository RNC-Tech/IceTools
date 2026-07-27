import { useEffect, useState } from "react";
import { call } from "./api.js";

// Mirrors the states electron/lib/updater.cjs emits: idle -> checking ->
// available -> downloading -> downloaded, or up-to-date/error at any point.
// "up-to-date" (as opposed to just resetting to "idle") exists so both the
// sidebar banner and the About page can give visible "Up to date"
// confirmation after a check, instead of silently going back to idle.
export function useUpdater() {
  const [status, setStatus] = useState("idle");
  const [version, setVersion] = useState(null);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = window.api.updater.onEvent((event) => {
      switch (event.type) {
        case "checking":
          setStatus("checking");
          break;
        case "available":
          setStatus("available");
          setVersion(event.version);
          break;
        case "not-available":
          setStatus("up-to-date");
          break;
        case "progress":
          setStatus("downloading");
          setPercent(event.percent);
          break;
        case "downloaded":
          setStatus("downloaded");
          break;
        case "error":
          setStatus("error");
          setError(event.message);
          break;
      }
    });
    return unsubscribe;
  }, []);

  return {
    status,
    version,
    percent,
    error,
    check: () => call(window.api.updater.check()),
    download: () => call(window.api.updater.download()),
    install: () => call(window.api.updater.install()),
  };
}
