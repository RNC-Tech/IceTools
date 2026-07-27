import React, { useCallback, useEffect, useState } from "react";
import { Settings } from "../components/icons/index.js";
import AppIcon from "../components/AppIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const START_TYPES = ["Automatic", "AutomaticDelayedStart", "Manual", "Disabled"];

export default function Services() {
  const [services, setServices] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [stopTarget, setStopTarget] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(window.api.services.list());
      setServices(data);
    } catch (err) {
      toast.error(`Failed to load services: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(name, action) {
    try {
      await call(window.api.services.setStatus(name, action));
      toast.success(`${action} sent to "${name}"`);
      load();
    } catch (err) {
      toast.error(`Failed to ${action} "${name}": ${err.message}`);
    }
  }

  async function handleStartType(name, startType) {
    try {
      await call(window.api.services.setStartType(name, startType));
      toast.success(`"${name}" startup type set to ${startType}`);
      load();
    } catch (err) {
      toast.error(`Failed to update startup type: ${err.message}`);
    }
  }

  const filtered = services.filter(
    (s) => s.name.toLowerCase().includes(filter.toLowerCase()) || (s.displayName || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Settings size={20} />
          Services
        </h2>
        <input
          className="input input-sm input-bordered w-64"
          placeholder="Filter services..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <TableSkeleton rows={10} columns={4} />
      ) : (
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="table table-sm table-pin-rows">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Startup Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.name}>
                  <td>
                    <div className="flex items-center gap-2">
                      <AppIcon src={s.icon} />
                      <div>
                        <div className="font-medium">{s.displayName || s.name}</div>
                        <div className="text-xs opacity-50">{s.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${s.status === "Running" ? "badge-success" : "badge-ghost"}`}>{s.status}</span>
                  </td>
                  <td>
                    <select
                      className="select select-xs select-bordered tooltip"
                      data-tip="When this service starts"
                      value={s.startType}
                      onChange={(e) => handleStartType(s.name, e.target.value)}
                    >
                      {START_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="flex gap-1">
                    {s.status === "Running" ? (
                      <button
                        className="btn btn-xs btn-outline tooltip tooltip-left"
                        data-tip="Stop this service"
                        onClick={() => setStopTarget(s)}
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs btn-outline btn-success tooltip tooltip-left"
                        data-tip="Start this service"
                        onClick={() => runAction(s.name, "start")}
                      >
                        Start
                      </button>
                    )}
                    <button
                      className="btn btn-xs btn-outline tooltip tooltip-left"
                      data-tip="Stop then start this service"
                      onClick={() => runAction(s.name, "restart")}
                    >
                      Restart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(stopTarget)}
        title="Stop service?"
        message={
          stopTarget
            ? `Stopping "${stopTarget.displayName || stopTarget.name}" may affect Windows features or other apps that depend on it.`
            : ""
        }
        confirmLabel="Stop service"
        onConfirm={() => {
          runAction(stopTarget.name, "stop");
          setStopTarget(null);
        }}
        onCancel={() => setStopTarget(null)}
      />
    </div>
  );
}
