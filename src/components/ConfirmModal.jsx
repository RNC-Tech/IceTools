import React from "react";
import { TriangleAlert } from "lucide-react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal modal-open z-50">
      <div className="modal-box glass-card bg-[#0b172a]/95 border border-blue-500/25 rounded-2xl p-6 shadow-2xl text-white">
        <h3 className="font-black text-base flex items-center gap-2 text-white">
          {danger && <TriangleAlert size={18} className="text-amber-400 shrink-0" />}
          {title}
        </h3>
        <p className="py-4 text-xs text-slate-300 whitespace-pre-line leading-relaxed">{message}</p>
        <div className="modal-action border-t border-blue-500/15 pt-3">
          <button className="btn btn-sm btn-ghost rounded-full px-5 text-slate-300 hover:text-white" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn btn-sm rounded-full px-5 font-bold shadow-lg ${
              danger ? "btn-error shadow-rose-500/25" : "btn-primary shadow-blue-500/30"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-slate-950/70 backdrop-blur-sm" onClick={onCancel}></div>
    </div>
  );
}
