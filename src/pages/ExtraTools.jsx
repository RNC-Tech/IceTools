import React, { useState } from "react";
import { Terminal, ExternalLink, Wrench } from "../components/icons/index.js";
import PageHeader from "../components/PageHeader.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import { useIconHover } from "../lib/useIconHover.js";

function CttWinUtilCard() {
  const [launching, setLaunching] = useState(false);
  const toast = useToast();
  const iconHover = useIconHover();

  async function handleLaunch() {
    setLaunching(true);
    try {
      await call(window.api.tools.runCttWinUtil());
      toast.success("CTT Windows Utility launched in a new window.");
    } catch (err) {
      toast.error(`Could not launch CTT Windows Utility: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-base-content/10">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Terminal size={18} />
            </div>
            <h3 className="font-bold text-base text-base-content">CTT Windows Utility</h3>
          </div>
          <span className="badge badge-sm badge-warning font-semibold">Internet Required</span>
        </div>

        <p className="text-xs text-base-content/70 leading-relaxed">
          Chris Titus Tech's open-source debloat, tweak, and configuration toolkit. Launches in an isolated window so you can select specific Windows system customizations.
        </p>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          className="btn btn-sm btn-primary gap-2 rounded-xl shadow-lg shadow-primary/20"
          onClick={handleLaunch}
          onMouseEnter={iconHover.onMouseEnter}
          onMouseLeave={iconHover.onMouseLeave}
          disabled={launching}
        >
          {launching ? <span className="loading loading-spinner loading-xs"></span> : <ExternalLink ref={iconHover.ref} size={14} />}
          Launch Utility
        </button>
      </div>
    </div>
  );
}

function MassGraveActivationCard() {
  const [launching, setLaunching] = useState(false);
  const toast = useToast();
  const iconHover = useIconHover();

  async function handleLaunch() {
    setLaunching(true);
    try {
      await call(window.api.tools.runMassGraveActivation());
      toast.success("Mass Grave Script launched in a new window.");
    } catch (err) {
      toast.error(`Could not launch Mass Grave Script: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-base-content/10">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Terminal size={18} />
            </div>
            <h3 className="font-bold text-base text-base-content">MAS Script Launcher</h3>
          </div>
          <span className="badge badge-sm badge-warning font-semibold">Internet Required</span>
        </div>

        <p className="text-xs text-base-content/70 leading-relaxed">
          Runs the Microsoft Activation Scripts (MAS) tool in its own command window. Review all options before applying.
        </p>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          className="btn btn-sm btn-primary gap-2 rounded-xl shadow-lg shadow-primary/20"
          onClick={handleLaunch}
          onMouseEnter={iconHover.onMouseEnter}
          onMouseLeave={iconHover.onMouseLeave}
          disabled={launching}
        >
          {launching ? <span className="loading loading-spinner loading-xs"></span> : <ExternalLink ref={iconHover.ref} size={14} />}
          Launch MAS
        </button>
      </div>
    </div>
  );
}

export default function ExtraTools() {
  return (
    <div className="p-8 space-y-8">
      <PageHeader
        icon={Wrench}
        title="Extra Tools & Utilities"
        description="Optional third-party scripts and administrative toolkits to complement your Windows optimization workflow."
        badge="Utilities Hub"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CttWinUtilCard />
        <MassGraveActivationCard />
      </div>
    </div>
  );
}
