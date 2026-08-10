import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import WidgetWindow from "./pages/WidgetWindow.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";
import "./index.css";

const windowName = new URLSearchParams(window.location.search).get("window");
const ROOT_PAGES = { widget: WidgetWindow };
const RootPage = ROOT_PAGES[windowName] || App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <RootPage />
    </ToastProvider>
  </React.StrictMode>
);
