import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Flame, ExternalLink } from "lucide-react";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";

function StatusBadge({ ok, unknownLabel, okLabel, badLabel }) {
  if (ok === null) {
    return (
      <span className="badge badge-ghost gap-1">
        <ShieldQuestion size={12} />
        {unknownLabel}
      </span>
    );
  }
  return (
    <span className={`badge gap-1 ${ok ? "badge-success" : "badge-error"}`}>
      {ok ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-7 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const privacyTweaks = tweaks.filter((t) => t.category === "privacy");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2">
          <AnimatedIcon icon={ShieldCheck} size={20} />
          Privacy & Security
        </h2>
        <button className="btn btn-sm gap-1.5 tooltip tooltip-left" data-tip="Opens the Windows Security app" onClick={openWindowsSecurity}>
          <ExternalLink size={14} />
          Open Windows Security
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body gap-2">
            <h3 className="font-black text-lg flex items-center gap-2">
              <ShieldCheck size={18} />
              Windows Defender
            </h3>
            {defender && defender.available ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Antivirus</span>
                  <StatusBadge ok={defender.antivirusEnabled} okLabel="Enabled" badLabel="Disabled" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Real-time protection</span>
                  <StatusBadge ok={defender.realTimeProtectionEnabled} okLabel="On" badLabel="Off" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Anti-spyware</span>
                  <StatusBadge ok={defender.antispywareEnabled} okLabel="Enabled" badLabel="Disabled" />
                </div>
                {defender.signatureAgeDays !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-70">Signature age</span>
                    <span className="text-sm">{defender.signatureAgeDays} day(s)</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm opacity-60">
                Status unavailable - a third-party antivirus may have taken over, or Defender's PowerShell module
                isn't present.
              </p>
            )}
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body gap-2">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Flame size={18} />
              Windows Firewall
            </h3>
            {firewall && firewall.available ? (
              <div className="space-y-1.5">
                {firewall.profiles.map((p) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <span className="text-sm opacity-70">{p.name}</span>
                    <StatusBadge ok={p.enabled} okLabel="On" badLabel="Off" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-60">Firewall status unavailable.</p>
            )}
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-sm font-medium opacity-70 mb-2">Privacy Tweaks</h3>
        <div className="space-y-2">
          {privacyTweaks.map((t) => (
            <label key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-base-200 cursor-pointer gap-4">
              <div>
                <div className="font-medium">{t.label}</div>
                <div className="text-xs opacity-50">{t.description}</div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success tooltip tooltip-left shrink-0"
                data-tip={t.enabled ? "Revert this tweak" : "Apply this tweak"}
                checked={t.enabled}
                onChange={() => toggleTweak(t)}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
