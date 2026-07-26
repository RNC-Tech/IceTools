import React from "react";
import YtDlpDownloader from "../components/YtDlpDownloader.jsx";
import { useTheme } from "../lib/useTheme.js";

export default function DownloaderWindow() {
  useTheme();

  return (
    <div className="h-screen w-screen bg-base-100 text-base-content p-4">
      <YtDlpDownloader />
    </div>
  );
}
