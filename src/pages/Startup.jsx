import React, { useCallback, useEffect, useState } from "react";
import { Search, Rocket } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { TableSkeleton } from "../components/Skeleton.jsx";
import { call } from "../lib/api.js";
import { useToast } from "../components/ToastProvider.jsx";

export default function Startup() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
      toast.error(`Could not toggle "${item.name}": ${err.message} (HKLM entries require Admin)`);
    }
  }

  const filtered = items.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.command.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Rocket}
        title="Startup Manager"
        description="Control apps that launch automatically when Windows boots. Disabling unnecessary startup apps reduces boot times and frees RAM."
        badge="Boot Accelerator"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search startup apps or commands..."
            className="input input-sm input-bordered w-full pl-9 rounded-xl bg-slate-900/60 border-blue-500/20 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-bold text-blue-400">{items.filter((i) => i.enabled).length} Enabled</span>
          <span>·</span>
          <span>{items.filter((i) => !i.enabled).length} Disabled</span>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={4} />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-blue-500/15 shadow-xl">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="table table-sm w-full">
              <thead className="bg-[#0b172a]/90 text-xs text-slate-300 sticky top-0 backdrop-blur-md border-b border-blue-500/20">
                <tr>
                  <th className="w-56">Application Name</th>
                  <th>Command / File Path</th>
                  <th className="w-36">Registry Origin</th>
                  <th className="w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-blue-500/5 transition-colors">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <AppIcon src={item.icon} />
                        <span className="font-bold text-xs text-white truncate max-w-[180px]" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-400">
                      <div className="truncate max-w-[320px]" title={item.command}>
                        {item.command}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-xs bg-slate-800 text-slate-300 border-blue-500/20 text-[10px] uppercase font-semibold rounded-md">
                        {item.origin}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={item.enabled}
                          onChange={() => handleToggle(item)}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            item.enabled ? "text-blue-400 font-bold" : "text-slate-500"
                          }`}
                        >
                          {item.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                      No startup entries match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
