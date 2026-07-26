import React from "react";
import { TriangleAlert } from "lucide-react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-black text-lg flex items-center gap-2">
          {danger && <TriangleAlert size={18} className="text-warning shrink-0" />}
          {title}
        </h3>
        <p className="py-4 text-sm opacity-80 whitespace-pre-line">{message}</p>
        <div className="modal-action">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className={`btn ${danger ? "btn-error" : "btn-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel}></div>
    </div>
  );
}
