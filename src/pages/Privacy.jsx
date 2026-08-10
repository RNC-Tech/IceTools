import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Flame, ExternalLink, Shield } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";

function StatusBadge({ ok, unknownLabel, okLabel, badLabel }) {
  if (ok === null) {
    return (
      <span className="badge badge-xs bg-slate-800 text-slate-400 border border-slate-700 font-semibold gap-1 rounded-md px-2.5 py-1">
        <ShieldQuestion size={11} />
        {unknownLabel}
      </span>
    );
  }
  return (
    <span
      className={`badge badge-xs font-semibold gap-1 rounded-md px-2.5 py-1 ${
        ok
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
      }`}
    >
      {ok ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
      {ok ? okLabel : badLabel}
    </span>
  );
}

export default function Privacy() {
  const [defender, setDefender] = useState(null);
  const [firewall, setFirewall] = useState(null);
  const [tweaks, setTweaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [defenderData, firewallData, tweaksData] = await Promise.all([
        call(window.api.security.getDefenderStatus()),
        call(window.api.security.getFirewallStatus()),
        call(window.api.tweaks.list()),
      ]);
      setDefender(defenderData);
      setFirewall(firewallData);
      setTweaks(tweaksData);
    } catch (err) {
      toast.error(`Failed to load privacy & security info: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function openWindowsSecurity() {
    try {
      await call(window.api.security.openWindowsSecurity());
    } catch (err) {
      toast.error(`Could not open Windows Security: ${err.message}`);
    }
  }

  async function toggleTweak(tweak) {
    try {
      await call(window.api.tweaks.apply(tweak.id, !tweak.enabled));
      toast.success(`${!tweak.enabled ? "Applied" : "Reverted"} "${tweak.label}"`);
      load();
    } catch (err) {
      toast.error(`Could not update tweak: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const privacyTweaks = tweaks.filter((t) => t.category === "privacy");

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        icon={Shield}
        title="Privacy & Security"
        description="Inspect Windows Defender and Firewall statuses, and toggle privacy options to disable telemetry and tracking."
        badge="System Protection"
        actions={
          <button className="btn btn-sm btn-outline rounded-full px-4 gap-1.5 border-blue-500/30 text-blue-300" onClick={openWindowsSecurity}>
            <ExternalLink size={14} />
            Open Windows Security
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Defender Card */}
        <div className="glass-card rounded-2xl p-5 border border-blue-500/15 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-bold text-base text-white">Windows Defender</h3>
          </div>

          {defender && defender.available ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-blue-500/15">
                <span className="text-xs font-semibold text-slate-300">Antivirus Protection</span>
                <StatusBadge ok={defender.antivirusEnabled} okLabel="Enabled" badLabel="Disabled" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-blue-500/15">
                <span className="text-xs font-semibold text-slate-300">Real-time Scanner</span>
                <StatusBadge ok={defender.realTimeProtectionEnabled} okLabel="Active" badLabel="Inactive" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-blue-500/15">
                <span className="text-xs font-semibold text-slate-300">Anti-Spyware Shield</span>
                <StatusBadge ok={defender.antispywareEnabled} okLabel="Enabled" badLabel="Disabled" />
              </div>
              {defender.signatureAgeDays !== null && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-blue-500/15 text-xs">
                  <span className="font-semibold text-slate-300">Definition Age</span>
                  <span className="font-mono text-blue-400 font-bold">{defender.signatureAgeDays} day(s) ago</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Status unavailable - a third-party antivirus may be active or Defender PowerShell module is omitted.
            </p>
          )}
        </div>

        {/* Firewall Card */}
        <div className="glass-card rounded-2xl p-5 border border-blue-500/15 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Flame size={18} />
            </div>
            <h3 className="font-bold text-base text-white">Windows Firewall Profiles</h3>
          </div>

          {firewall && firewall.available ? (
            <div className="space-y-2.5">
              {firewall.profiles.map((p) => (
                <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-blue-500/15">
                  <span className="text-xs font-semibold text-slate-300">{p.name} Profile</span>
                  <StatusBadge ok={p.enabled} okLabel="Protected" badLabel="Unprotected" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-2">Firewall status unavailable.</p>
          )}
        </div>
      </div>

      {/* Privacy Tweaks */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300 flex items-center gap-2">
          <Shield size={16} className="text-blue-400" /> Privacy & Telemetry Hardening
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privacyTweaks.map((t) => (
            <div
              key={t.id}
              onClick={() => toggleTweak(t)}
              className={`glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all border ${
                t.enabled ? "border-blue-500/50 bg-blue-500/10" : "border-blue-500/15"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{t.label}</span>
                  <span className="badge badge-xs bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] uppercase font-semibold rounded-md">Recommended</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{t.description}</div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm shrink-0 ml-3"
                checked={t.enabled}
                onChange={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
