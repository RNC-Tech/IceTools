import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import DownloaderWindow from "./pages/DownloaderWindow.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";
import "./index.css";

const windowName = new URLSearchParams(window.location.search).get("window");
const RootPage = windowName === "downloader" ? DownloaderWindow : App;

// Electron syncs each BrowserWindow's title to document.title once the page
// loads, which would otherwise clobber the "IceTools - Downloader" title set
// at window-creation time back to the shared index.html's default <title>.
if (windowName === "downloader") document.title = "IceTools - Downloader";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <RootPage />
    </ToastProvider>
  </React.StrictMode>
);
