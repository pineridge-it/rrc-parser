"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export interface OperatorStats {
  id: string;
  name: string;
  permitCount: number;
  recentCount: number;
  trend: "up" | "down" | "neutral";
  primaryCounty: string;
}

interface TopOperatorsProps {
  operators: OperatorStats[];
  loading?: boolean;
  maxDisplay?: number;
}

function OperatorSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-subtle)]" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-[var(--color-surface-subtle)] rounded" />
          <div className="h-3 w-20 bg-[var(--color-surface-subtle)] rounded" />
        </div>
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-4 w-12 bg-[var(--color-surface-subtle)] rounded" />
        <div className="h-3 w-16 bg-[var(--color-surface-subtle)] rounded" />
      </div>
    </div>
  );
}

export function TopOperators({ operators, loading, maxDisplay = 5 }: TopOperatorsProps) {
  const displayOperators = operators.slice(0, maxDisplay);

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return (
          <svg className="w-3.5 h-3.5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case "down":
        return (
          <svg className="w-3.5 h-3.5 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <OperatorSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!operators.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--color-text-tertiary)]">No operator activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayOperators.map((operator, index) => (
        <motion.div
          key={operator.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ x: 4 }}
        >
          <Link
            href={`/operators/${encodeURIComponent(operator.name)}`}
            className="flex items-center justify-between py-3.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-surface-subtle)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-brand-primary)]/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-[var(--color-brand-primary)]">
                  {operator.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-primary)] transition-colors">
                  {operator.name}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {operator.primaryCounty}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                  {operator.permitCount}
                </p>
                <div className="flex items-center justify-end gap-1">
                  {getTrendIcon(operator.trend)}
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    +{operator.recentCount} this week
                  </span>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </motion.div>
      ))}
      
      {operators.length > maxDisplay && (
        <div className="pt-2">
          <Link
            href="/operators"
            className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors flex items-center gap-1"
          >
            View all operators
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
