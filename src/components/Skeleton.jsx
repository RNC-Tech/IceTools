import React from "react";
import { motion } from "motion/react";

export function Skeleton({ className = "" }) {
  return (
    <motion.div
      className={`bg-base-300 rounded-md ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
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
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4 gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}
