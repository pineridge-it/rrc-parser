"use client";

/**
 * RateLimit Component
 * 
 * Displayed when user has exceeded rate limits.
 * Shows countdown timer and option to upgrade for higher limits.
 * 
 * @component
 * @example
 * ```tsx
 * <RateLimit 
 *   resetTime={Date.now() + 60000}
 *   currentLimit={100}
 *   onUpgrade={() => router.push('/upgrade')}
 * />
 * ```
 * 
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Gauge, Clock, ArrowUpRight, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RateLimitProps {
  /** Timestamp when rate limit resets */
  resetTime: number;
  /** Current rate limit */
  currentLimit?: number;
  /** Higher tier limit */
  upgradeLimit?: number;
  /** Callback to upgrade plan */
  onUpgrade?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom message */
  message?: string;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

function formatDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * RateLimit - Display when rate limit is exceeded
 */
export function RateLimit({
  resetTime,
  currentLimit,
  upgradeLimit,
  onUpgrade,
  className,
  message: customMessage,
}: RateLimitProps) {
  const [timeRemaining, setTimeRemaining] = React.useState(() => resetTime - Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => {
      const remaining = resetTime - Date.now();
      setTimeRemaining(Math.max(0, remaining));
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [resetTime]);

  const message = customMessage || "You've reached the request limit for your current plan";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center p-8",
        "bg-[var(--color-surface-subtle)] rounded-xl",
        "border border-[var(--color-border-default)]",
        "max-w-md mx-auto",
        className
      )}
    >
      {/* Illustration */}
      <motion.div
        variants={itemVariants}
        className="relative w-24 h-24 mb-6"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center">
            <Gauge className="w-8 h-8 text-[var(--color-warning)]" />
          </div>
        </div>
        
        {/* Animated hourglass */}
        <motion.div
          animate={{
            rotate: [0, 180, 180, 360],
            scale: [1, 1, 0.8, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.4, 0.5, 1],
          }}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--color-surface-raised)] border-2 border-[var(--color-border-default)] flex items-center justify-center"
        >
          <Hourglass className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 text-center"
      >
        Too Many Requests
      </motion.h3>

      {/* Message */}
      <motion.p
        variants={itemVariants}
        className="text-[var(--color-text-secondary)] text-center mb-4 max-w-xs"
      >
        {message}
      </motion.p>

      {/* Countdown timer */}
      <motion.div
        variants={itemVariants}
        className="mb-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          <span className="text-sm text-[var(--color-text-tertiary)]">
            Resets in
          </span>
        </div>
        <motion.div
          key={timeRemaining}
          initial={{ scale: 1.1, color: "var(--color-warning)" }}
          animate={{ scale: 1, color: "var(--color-text-primary)" }}
          className="text-3xl font-bold font-mono"
        >
          {formatDuration(timeRemaining)}
        </motion.div>
      </motion.div>

      {/* Limit information */}
      {(currentLimit || upgradeLimit) && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-3 bg-[var(--color-surface-raised)] rounded-lg text-sm w-full"
        >
          <div className="flex justify-between items-center">
            {currentLimit && (
              <div className="text-center flex-1">
                <p className="text-[var(--color-text-tertiary)] text-xs">Current limit</p>
                <p className="text-[var(--color-text-secondary)] font-medium">{currentLimit}/hr</p>
              </div>
            )}
            {upgradeLimit && (
              <>
                <div className="w-px h-8 bg-[var(--color-border-default)]" />
                <div className="text-center flex-1">
                  <p className="text-[var(--color-text-tertiary)] text-xs">With upgrade</p>
                  <p className="text-[var(--color-brand-primary)] font-medium">{upgradeLimit}/hr</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Upgrade button */}
      {onUpgrade && (
        <motion.div variants={itemVariants} className="w-full">
          <Button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Upgrade for Higher Limits
          </Button>
        </motion.div>
      )}

      {/* Help text */}
      <motion.p
        variants={itemVariants}
        className="mt-6 text-xs text-[var(--color-text-tertiary)] text-center"
      >
        Rate limits help ensure fair usage for all users.
        {" "}
        <a href="/docs/rate-limits" className="text-[var(--color-brand-primary)] hover:underline">
          Learn more
        </a>
      </motion.p>
    </motion.div>
  );
}

export default RateLimit;
