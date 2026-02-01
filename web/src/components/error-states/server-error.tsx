"use client";

/**
 * ServerError Component
 * 
 * Displayed when the server encounters an error (500).
 * Provides error ID for support and retry options.
 * 
 * @component
 * @example
 * ```tsx
 * <ServerError 
 *   errorId="err-12345"
 *   onRetry={() => refetch()}
 *   onContactSupport={() => openSupportChat()}
 * />
 * ```
 * 
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Server, RefreshCw, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ServerErrorProps {
  /** Unique error ID for support reference */
  errorId?: string;
  /** Callback to retry the failed operation */
  onRetry?: () => void;
  /** Callback to contact support */
  onContactSupport?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom error message */
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

/**
 * ServerError - Display when server encounters an error
 */
export function ServerError({
  errorId,
  onRetry,
  onContactSupport,
  className,
  message = "Something went wrong on our end",
}: ServerErrorProps) {
  const [copied, setCopied] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleCopyErrorId = React.useCallback(() => {
    if (errorId) {
      navigator.clipboard.writeText(errorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [errorId]);

  const handleRetry = React.useCallback(async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying]);

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
          <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
            <Server className="w-8 h-8 text-[var(--color-error)]" />
          </div>
        </div>
        
        {/* Decorative elements */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            y: [0, -4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--color-error)]"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            y: [0, -3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
          className="absolute top-2 -left-2 w-2 h-2 rounded-full bg-[var(--color-warning)]"
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 text-center"
      >
        Server Error
      </motion.h3>

      {/* Message */}
      <motion.p
        variants={itemVariants}
        className="text-[var(--color-text-secondary)] text-center mb-4 max-w-xs"
      >
        {message}
      </motion.p>

      {/* Error ID */}
      {errorId && (
        <motion.div
          variants={itemVariants}
          className="mb-6"
        >
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1 text-center">
            Error ID (for support)
          </p>
          <button
            onClick={handleCopyErrorId}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-raised)] rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <code className="font-mono">{errorId}</code>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-3 w-full"
      >
        {onRetry && (
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        )}
        
        {onContactSupport && (
          <Button
            variant="outline"
            onClick={onContactSupport}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        )}
      </motion.div>

      {/* Status message */}
      <motion.p
        variants={itemVariants}
        className="mt-6 text-xs text-[var(--color-text-tertiary)] text-center"
      >
        Our team has been notified and is working on a fix.
      </motion.p>
    </motion.div>
  );
}

export default ServerError;
