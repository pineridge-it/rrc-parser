"use client";

/**
 * AlertsEmpty Component
 * 
 * Displayed when there are no notifications or alerts for the user.
 * Provides reassurance and guidance on how alerts work.
 * 
 * @component
 * @example
 * ```tsx
 * <AlertsEmpty 
 *   onViewSettings={() => router.push('/settings/notifications')}
 * />
 * ```
 * 
 * @author WhiteHill
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AlertsEmptyProps {
  /** Callback when user wants to view notification settings */
  onViewSettings?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the "all caught up" variant (true) or "no alerts set up" variant (false) */
  allCaughtUp?: boolean;
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
 * AlertsEmpty - Display when no alerts/notifications exist
 */
export function AlertsEmpty({
  onViewSettings,
  className,
  allCaughtUp = true,
}: AlertsEmptyProps) {
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
        {allCaughtUp ? (
          // All Caught Up Variant
          <>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            >
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </motion.div>
            
            {/* Floating check marks */}
            <motion.div
              className="absolute top-0 right-0"
              animate={{
                y: [0, -4, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const,
                delay: 0.5,
              }}
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
            </motion.div>
          </>
        ) : (
          // No Alerts Set Up Variant
          <>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            >
              <div className="w-24 h-24 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] flex items-center justify-center">
                <BellOff className="w-10 h-10 text-[var(--color-text-tertiary)]" />
              </div>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants} className="text-center">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          {allCaughtUp ? "All Caught Up!" : "No Alerts Configured"}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">
          {allCaughtUp
            ? "You have no new notifications. We'll alert you when new permits match your areas of interest."
            : "Set up notification preferences to receive alerts about new permits and regulatory changes."}
        </p>
      </motion.div>

      {/* Action */}
      {onViewSettings && (
        <motion.div variants={itemVariants}>
          <Button
            variant="secondary"
            onClick={onViewSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Notification Settings
          </Button>
        </motion.div>
      )}

      {/* Info Text */}
      {allCaughtUp && (
        <motion.p
          variants={itemVariants}
          className="mt-4 text-xs text-[var(--color-text-tertiary)] flex items-center gap-1"
        >
          <Bell className="w-3 h-3" />
          Checks for new permits every hour
        </motion.p>
      )}
    </motion.div>
  );
}
