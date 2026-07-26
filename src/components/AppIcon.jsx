import React from "react";
import { AppWindow } from "lucide-react";

export default function AppIcon({ src, size = 16 }) {
  if (!src) {
    return <AppWindow size={size} className="opacity-40 shrink-0" />;
  }
  return <img src={src} width={size} height={size} className="shrink-0" alt="" />;
}
