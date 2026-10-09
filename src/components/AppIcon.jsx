import React, { useState } from "react";
import { AppWindow } from "lucide-react";

export default function AppIcon({ src, size = 16 }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <AppWindow size={size} className="opacity-40 shrink-0" />;
  }
  return (
    <img
      src={src}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      alt=""
      onError={() => setError(true)}
    />
  );
}
