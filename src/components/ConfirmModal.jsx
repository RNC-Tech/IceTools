import React from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onCancel} />
      <div className="relative z-10 glass-card bg-[#070f1e]/95 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] rounded-2xl p-6 shadow-2xl text-white max-w-md w-full">
        <h3 className="font-bold text-base flex items-center gap-2 text-white">
          {danger && <TriangleAlert size={18} className="text-amber-400 shrink-0" />}
          {title}
        </h3>
        <p className="py-4 text-xs text-slate-300 whitespace-pre-line leading-relaxed">{message}</p>
        <div className="modal-action border-t border-white/[0.06] pt-3.5 flex justify-end gap-2">
          <button className="btn btn-sm btn-ghost rounded-lg px-4 text-slate-300 hover:text-white" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn btn-sm rounded-lg px-4 font-medium shadow-sm ${
              danger ? "btn-error" : "btn-primary"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
