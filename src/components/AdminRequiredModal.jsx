import React, { useEffect, useState } from "react";
import { setAdminPromptHandler } from "../lib/adminPrompt.js";
import { call } from "../lib/api.js";
import { useToast } from "./ToastProvider.jsx";
import ConfirmModal from "./ConfirmModal.jsx";

export default function AdminRequiredModal() {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setAdminPromptHandler(() => setOpen(true));
    return () => setAdminPromptHandler(null);
  }, []);

  async function handleRelaunch() {
    setOpen(false);
    try {
      await call(window.api.app.relaunchAsAdmin());
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <ConfirmModal
      open={open}
      title="Administrator rights required"
      message="That action needs administrator privileges. Restart IceTools as Administrator to unlock it - a UAC prompt will appear."
      confirmLabel="Restart as Admin"
      danger={false}
      onConfirm={handleRelaunch}
      onCancel={() => setOpen(false)}
    />
  );
}
