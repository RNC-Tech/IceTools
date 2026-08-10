import React from "react";
import { Download } from "../components/icons/index.js";
import PageHeader from "../components/PageHeader.jsx";
import YtDlpDownloader from "../components/YtDlpDownloader.jsx";

export default function Downloader() {
  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Download}
        title="Sage Downloader"
        description="Download online videos and audio directly to your Downloads folder using yt-dlp."
        badge="Media Grabber"
      />
      <YtDlpDownloader />
    </div>
  );
}
