import React from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import AppShowcaseMock from "./components/AppShowcaseMock.jsx";
import FeatureGrid from "./components/FeatureGrid.jsx";
import DownloadSection from "./components/DownloadSection.jsx";
import ChangelogSection from "./components/ChangelogSection.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <div className="min-h-screen app-bg-gradient text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AppShowcaseMock />
        <FeatureGrid />
        <DownloadSection />
        <ChangelogSection />
      </main>
      <Footer />
    </div>
  );
}
