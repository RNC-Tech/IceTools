import React from "react";
import { motion } from "motion/react";

// A lightweight, generic stand-in for lucide-animated.com's bespoke
// per-icon Motion components: that project ships a hand-tuned animation per
// icon via a shadcn-style registry (no npm package, and its CLI wants to
// bootstrap its own Tailwind theme/path-alias scaffold, which would fight
// with this app's existing DaisyUI theme system). This wraps any existing
// lucide-react icon with the same underlying library (Motion) and a tasteful
// hover animation instead, so every icon in the app gets the same animated
// feel without adopting a second, conflicting component system.
export default function AnimatedIcon({ icon: Icon, size = 16, className = "", spin = false, ...props }) {
  return (
    <motion.span
      className={`inline-flex ${className}`}
      style={{ display: "inline-flex" }}
      whileHover={{ scale: 1.15, rotate: spin ? 15 : 0 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <Icon size={size} {...props} />
    </motion.span>
  );
}
