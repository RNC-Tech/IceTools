import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, Sparkles, Minus, Square, X, ArrowRight } from "lucide-react";
import IceLogo from "./IceLogo.jsx";
import { call, formatBytes } from "../lib/api.js";
import { useToast } from "./ToastProvider.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import MagnetButton from "./MagnetButton.jsx";

export default function TopBar({ isAdmin }) {
  const [trimming, setTrimming] = useState(false);
  const [confirmAdminOpen, setConfirmAdminOpen] = useState(false);
  const toast = useToast();

  async function handleQuickTrim() {
    setTrimming(true);
    try {
      const result = await call(window.api.memory.cleanMemory([]));
      toast.success(`Sub-Zero Trim freed ~${formatBytes(result.freedBytes)} RAM.`);
    } catch (err) {
      toast.error(`Trim failed: ${err.message}`);
    } finally {
      setTrimming(false);
    }
  }

  async function handleRelaunchAdmin() {
    setConfirmAdminOpen(false);
    try {
      await call(window.api.app.relaunchAsAdmin());
    } catch (err) {
      toast.error(err.message);
    }
  }

  function handleMinimize() {
    call(window.api.window.minimize()).catch(() => {});
  }

  function handleMaximize() {
    call(window.api.window.maximize()).catch(() => {});
  }

  function handleClose() {
    call(window.api.window.close()).catch(() => {});
  }

  return (
    <header className="h-14 shrink-0 border-b border-blue-500/15 bg-[#070f1e]/80 backdrop-blur-md px-4 flex items-center justify-between window-drag-region select-none border-t-0 border-x-0">
      {/* Merged IceLogo Header on Top Left */}
      <div className="flex items-center gap-3 window-no-drag">
        <IceLogo size="sm" showSubtitle={true} />
      </div>

      {/* Right Action Tools & Frameless Window Control Buttons */}
      <div className="flex items-center gap-3 window-no-drag">
        <MagnetButton
          onClick={handleQuickTrim}
          disabled={trimming}
          className="btn btn-xs btn-primary rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-lg shadow-blue-500/30 text-xs font-bold"
        >
          {trimming ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Sub-Zero Trim</span>
              <ArrowRight size={13} />
            </>
          )}
        </MagnetButton>

        {isAdmin ? (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            <ShieldCheck size={12} />
            <span>Elevated Admin</span>
          </div>
        ) : (
          <button
            className="btn btn-xs btn-outline rounded-full px-3 text-[11px] flex items-center gap-1"
            onClick={() => setConfirmAdminOpen(true)}
          >
            <ShieldAlert size={12} />
            <span>Restart as Admin</span>
          </button>
        )}

        {/* Custom Window Controls Divider */}
        <div className="h-4 w-px bg-blue-500/20 mx-1"></div>

        {/* Custom Window Control Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Maximize / Restore"
          >
            <Square size={12} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmAdminOpen}
        title="Restart ICE Tools as Administrator?"
        message="ICE Tools will restart with a UAC prompt to gain administrative access."
        confirmLabel="Restart Elevated"
        onConfirm={handleRelaunchAdmin}
        onCancel={() => setConfirmAdminOpen(false)}
      />
    </header>
  );
}
