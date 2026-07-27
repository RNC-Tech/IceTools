import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProcessMonitor from "./pages/ProcessMonitor.jsx";
import MemoryCleaner from "./pages/MemoryCleaner.jsx";
import Startup from "./pages/Startup.jsx";
import Services from "./pages/Services.jsx";
import Cleanup from "./pages/Cleanup.jsx";
import Uninstaller from "./pages/Uninstaller.jsx";
import Privacy from "./pages/Privacy.jsx";
import PowerNetwork from "./pages/PowerNetwork.jsx";
import ExtraTools from "./pages/ExtraTools.jsx";
import SettingsPage from "./pages/Settings.jsx";
import About from "./pages/About.jsx";
import AdminRequiredModal from "./components/AdminRequiredModal.jsx";
import { call } from "./lib/api.js";
import { useTheme } from "./lib/useTheme.js";

const PAGES = {
  dashboard: Dashboard,
  processes: ProcessMonitor,
  memory: MemoryCleaner,
  startup: Startup,
  services: Services,
  cleanup: Cleanup,
  uninstaller: Uninstaller,
  privacy: Privacy,
  power: PowerNetwork,
  extra: ExtraTools,
  settings: SettingsPage,
  about: About,
};

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    call(window.api.app.isAdmin())
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  const Page = PAGES[active];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base-100 text-base-content">
      <Sidebar active={active} onSelect={setActive} isAdmin={isAdmin} theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Page />
          </motion.div>
        </AnimatePresence>
      </main>
      <AdminRequiredModal />
    </div>
  );
}
