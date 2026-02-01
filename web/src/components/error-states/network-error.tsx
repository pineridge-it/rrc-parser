"use client";

/**
 * NetworkError Component
 * 
 * Displayed when the application cannot connect to the server.
 * Provides a retry mechanism with countdown and helpful troubleshooting tips.
 * 
 * @component
 * @example
 * ```tsx
 * <NetworkError 
 *   onRetry={() => refetch()}
 *   autoRetry={true}
 *   retryDelay={5000}
 * />
 * ```
 * 
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NetworkErrorProps {
  /** Callback to retry the failed operation */
  onRetry?: () => void;
  /** Whether to automatically retry after a delay */
  autoRetry?: boolean;
  /** Delay in milliseconds before auto-retry */
  retryDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom error message */
  message?: string;
  /** Show troubleshooting tips */
  showTroubleshooting?: boolean;
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

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

/**
 * NetworkError - Display when unable to connect to server
 */
export function NetworkError({
  onRetry,
  autoRetry = true,
  retryDelay = 5000,
  className,
  message = "Unable to connect to the server",
  showTroubleshooting = true,
}: NetworkErrorProps) {
  const [countdown, setCountdown] = React.useState(Math.ceil(retryDelay / 1000));
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [showTips, setShowTips] = React.useState(false);
  const onRetryRef = React.useRef(onRetry);

  // Keep ref in sync
  React.useEffect(() => {
    onRetryRef.current = onRetry;
  }, [onRetry]);

  const handleRetry = React.useCallback(async () => {
    if (!onRetryRef.current || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetryRef.current();
    } finally {
      setIsRetrying(false);
      setCountdown(Math.ceil(retryDelay / 1000));
    }
  }, [isRetrying, retryDelay]);

  React.useEffect(() => {
    if (!autoRetry || !onRetry) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRetry, retryDelay, onRetry, handleRetry]);

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
        {/* Pulsing background ring */}
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="absolute inset-0 rounded-full bg-[var(--color-warning-subtle)]"
        />
        
        {/* Icon container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-[var(--color-warning)]" />
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 text-center"
      >
        Connection Lost
      </motion.h3>

      {/* Message */}
      <motion.p
        variants={itemVariants}
        className="text-[var(--color-text-secondary)] text-center mb-6 max-w-xs"
      >
        {message}
      </motion.p>

      {/* Auto-retry countdown */}
      {autoRetry && onRetry && !isRetrying && countdown > 0 && (
        <motion.p
          variants={itemVariants}
          className="text-sm text-[var(--color-text-tertiary)] mb-4"
        >
          Retrying in {countdown}s...
        </motion.p>
      )}

      {/* Retry button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="min-w-[140px]"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Now
            </>
          )}
        </Button>
      </motion.div>

      {/* Troubleshooting toggle */}
      {showTroubleshooting && (
        <motion.div variants={itemVariants} className="mt-6">
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            {showTips ? "Hide tips" : "Connection tips"}
          </button>
        </motion.div>
      )}

      {/* Troubleshooting tips */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] p-4 rounded-lg">
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-[var(--color-brand-primary)]" />
                Check your internet connection
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-[var(--color-brand-primary)]" />
                Disable VPN or proxy temporarily
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-[var(--color-brand-primary)]" />
                Clear browser cache and cookies
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-[var(--color-brand-primary)]" />
                Try again in a few minutes
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default NetworkError;
