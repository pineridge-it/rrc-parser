"use client";

/**
 * SearchEmpty Component
 * 
 * Displayed when search returns no results. Provides helpful suggestions
 * and options to refine the search or clear filters.
 * 
 * @component
 * @example
 * ```tsx
 * <SearchEmpty 
 *   searchTerm="oil permits texas"
 *   onClearSearch={() => setSearchTerm('')}
 *   suggestions={["Try 'permits'", "Search by county", "Use broader terms"]}
 * />
 * ```
 * 
 * @author WhiteHill
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Search, X, RotateCcw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SearchEmptyProps {
  /** The search term that returned no results */
  searchTerm?: string;
  /** Callback to clear the current search */
  onClearSearch?: () => void;
  /** Callback to modify search with a suggestion */
  onTrySuggestion?: (suggestion: string) => void;
  /** List of helpful suggestions */
  suggestions?: string[];
  /** Additional CSS classes */
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

/**
 * SearchEmpty - Display when search returns no results
 */
export function SearchEmpty({
  searchTerm,
  onClearSearch,
  onTrySuggestion,
  suggestions = [
    "Check your spelling",
    "Try more general keywords",
    "Use fewer filters",
  ],
  className,
}: SearchEmptyProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center p-8",
        "bg-[var(--color-surface-subtle)] rounded-lg",
        "border border-[var(--color-border-default)]",
        className
      )}
    >
      {/* Illustration */}
      <motion.div
        variants={itemVariants}
        className="relative w-28 h-28 mb-6"
      >
        {/* Search Circle */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        >
          <div className="w-24 h-24 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] flex items-center justify-center">
            <Search className="w-10 h-10 text-[var(--color-text-tertiary)]" />
          </div>
        </motion.div>

        {/* Animated X */}
        <motion.div
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 200,
          }}
        >
          <X className="w-4 h-4 text-[var(--color-error)]" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants} className="text-center">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          No Results Found
        </h3>
        {searchTerm ? (
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
            We couldn't find any matches for{" "}
            <span className="font-medium text-[var(--color-text-primary)]">
              “{searchTerm}”
            </span>
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
            No results match your current filters.
          </p>
        )}
      </motion.div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="mt-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3 text-xs text-[var(--color-text-tertiary)]">
            <Lightbulb className="w-3 h-3" />
            <span>Try these tips:</span>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                {onTrySuggestion ? (
                  <button
                    onClick={() => onTrySuggestion(suggestion)}
                    className="text-sm text-[var(--color-brand-primary)] hover:underline text-left"
                  >
                    {suggestion}
                  </button>
                ) : (
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {suggestion}
                  </span>
                )}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Actions */}
      {onClearSearch && (
        <motion.div variants={itemVariants}>
          <Button
            variant="secondary"
            onClick={onClearSearch}
            className="group"
          >
            <RotateCcw className="w-4 h-4 mr-2 transition-transform group-hover:-rotate-180" />
            Clear Search
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
