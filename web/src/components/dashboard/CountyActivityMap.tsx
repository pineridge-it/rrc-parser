"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export interface CountyActivity {
  name: string;
  permitCount: number;
  recentCount: number;
  percentage: number;
}

interface CountyActivityMapProps {
  counties: CountyActivity[];
  loading?: boolean;
  maxDisplay?: number;
}

function CountySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-full bg-[var(--color-surface-subtle)] rounded-full overflow-hidden">
        <div className="h-full w-0 bg-[var(--color-surface-subtle)]" />
      </div>
      <div className="flex justify-between mt-1.5">
        <div className="h-3 w-20 bg-[var(--color-surface-subtle)] rounded" />
        <div className="h-3 w-8 bg-[var(--color-surface-subtle)] rounded" />
      </div>
    </div>
  );
}

function getIntensityClass(percentage: number): string {
  if (percentage >= 80) return "bg-[var(--color-brand-primary)]";
  if (percentage >= 60) return "bg-[var(--color-brand-primary)]/80";
  if (percentage >= 40) return "bg-[var(--color-brand-primary)]/60";
  if (percentage >= 20) return "bg-[var(--color-brand-primary)]/40";
  return "bg-[var(--color-brand-primary)]/20";
}

export function CountyActivityMap({ counties, loading, maxDisplay = 6 }: CountyActivityMapProps) {
  const displayCounties = useMemo(() => {
    return counties.slice(0, maxDisplay);
  }, [counties, maxDisplay]);

  const maxCount = useMemo(() => {
    return Math.max(...counties.map((c) => c.permitCount), 1);
  }, [counties]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CountySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!counties.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--color-text-tertiary)]">No county activity data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayCounties.map((county, index) => {
        const widthPercent = (county.permitCount / maxCount) * 100;
        const intensityClass = getIntensityClass(county.percentage);

        return (
          <motion.div
            key={county.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {county.name}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums">
                {county.permitCount}
              </span>
            </div>
            <div className="relative h-2 bg-[var(--color-surface-subtle)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPercent}%` }}
                transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 rounded-full ${intensityClass}`}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {county.percentage.toFixed(1)}% of total
              </span>
              <span className="text-xs text-[var(--color-success)]">
                +{county.recentCount} this week
              </span>
            </div>
          </motion.div>
        );
      })}

      {counties.length > maxDisplay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-2 text-xs text-[var(--color-text-tertiary)] text-center"
        >
          +{counties.length - maxDisplay} more counties
        </motion.div>
      )}
    </div>
  );
}
