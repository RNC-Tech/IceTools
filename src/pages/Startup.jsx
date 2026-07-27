import React, { useCallback, useEffect, useState } from "react";
import { Rocket } from "../components/icons/index.js";
import AppIcon from "../components/AppIcon.jsx";
import { Skeleton, TableSkeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";

export default function Startup() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(window.api.startup.list());
      setItems(data);
    } catch (err) {
      toast.error(`Failed to load startup items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(item) {
    try {
      await call(window.api.startup.toggle({ id: item.id, enabled: !item.enabled }));
      toast.success(`${!item.enabled ? "Enabled" : "Disabled"} "${item.name}"`);
      load();
    } catch (err) {
      toast.error(`Could not toggle "${item.name}": ${err.message} (HKLM/all-users entries need admin)`);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <TableSkeleton rows={8} columns={4} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-black flex items-center gap-2">
        <Rocket size={20} />
        Startup Manager
      </h2>
      <p className="text-sm opacity-60">
        Disabling an item removes it from the startup location and stores it so it can be re-enabled later - nothing is
        deleted permanently.
      </p>

      <div className="overflow-x-auto">
        <table className="table table-sm table-fixed w-full">
          <thead>
            <tr>
              <th className="w-48">Name</th>
              <th>Command / Path</th>
              <th className="w-32">Origin</th>
              <th className="w-20">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="font-medium truncate" title={item.name}>
                  <div className="flex items-center gap-2">
                    <AppIcon src={item.icon} />
                    <span className="truncate">{item.name}</span>
                  </div>
                </td>
                <td className="text-xs opacity-70">
                  <div className="truncate" title={item.command}>
                    {item.command}
                  </div>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">{item.origin}</span>
                </td>
                <td>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm tooltip tooltip-left"
                    data-tip={item.enabled ? "Disable this startup item" : "Enable this startup item"}
                    checked={item.enabled}
                    onChange={() => handleToggle(item)}
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center opacity-60 py-6">
                  No startup entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
