import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import CategoryTabs from "./components/CategoryTabs.jsx";
import { NAV_CATEGORIES, findCategoryForItem } from "./lib/navConfig.js";
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
import Downloader from "./pages/Downloader.jsx";
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
  downloader: Downloader,
  settings: SettingsPage,
  about: About,
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState(NAV_CATEGORIES[0].id);
  const [activeTab, setActiveTab] = useState(NAV_CATEGORIES[0].items[0].id);
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    call(window.api.app.isAdmin())
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  function handleCategorySelect(categoryId) {
    setActiveCategory(categoryId);
    const category = NAV_CATEGORIES.find((c) => c.id === categoryId);
    setActiveTab(category.items[0].id);
  }

  const category = findCategoryForItem(activeTab) || NAV_CATEGORIES[0];
  const Page = PAGES[activeTab];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden app-bg-gradient text-base-content font-sans">
      {/* Full-Width Unified Header Titlebar */}
      <TopBar isAdmin={isAdmin} theme={theme} onToggleTheme={toggleTheme} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeCategory} onSelect={handleCategorySelect} />

        <main className="flex-1 flex flex-col overflow-hidden">
          {category.items.length > 1 && (
            <CategoryTabs category={category} activeTab={activeTab} onSelect={setActiveTab} />
          )}

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
              >
                <Page />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AdminRequiredModal />
    </div>
  );
}
