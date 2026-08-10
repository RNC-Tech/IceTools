import React from "react";
import { motion } from "motion/react";

export function Skeleton({ className = "" }) {
  return (
    <motion.div
      className={`bg-[#0b172a]/80 border border-blue-500/10 rounded-xl ${className}`}
      animate={{ opacity: [0.4, 0.85, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Generic shimmering placeholder for a list/table page: a header bar plus N skeleton rows. */
export function TableSkeleton({ rows = 8, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className={`h-4 ${j === 0 ? "w-6 shrink-0" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Shimmering placeholder shaped like a StatCard, for dashboard-style stat grids. */
export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 border border-blue-500/15 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}
