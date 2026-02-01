"use client";

/**
 * PermissionDenied Component
 * 
 * Displayed when user doesn't have access to a resource or feature.
 * Provides options to request access, contact admin, or upgrade plan.
 * 
 * @component
 * @example
 * ```tsx
 * <PermissionDenied 
 *   resource="premium feature"
 *   onRequestAccess={() => requestAccess()}
 *   onUpgrade={() => router.push('/upgrade')}
 * />
 * ```
 * 
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Lock, ArrowUpRight, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PermissionDeniedProps {
  /** Type of resource that requires permission */
  resource?: string;
  /** Current plan level */
  currentPlan?: string;
  /** Required plan level */
  requiredPlan?: string;
  /** Callback to request access */
  onRequestAccess?: () => void;
  /** Callback to contact admin */
  onContactAdmin?: () => void;
  /** Callback to upgrade plan */
  onUpgrade?: () => void;
  /** Callback to go back */
  onGoBack?: () => void;
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

/**
 * PermissionDenied - Display when user lacks access
 */
export function PermissionDenied({
  resource = "this resource",
  currentPlan,
  requiredPlan,
  onRequestAccess,
  onContactAdmin,
  onUpgrade,
  onGoBack,
  className,
  message: customMessage,
}: PermissionDeniedProps) {
  const message = customMessage || `You don't have permission to access ${resource}`;

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
            <ShieldAlert className="w-8 h-8 text-[var(--color-warning)]" />
          </div>
        </div>
        
        {/* Lock icon overlay */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-surface-raised)] border-2 border-[var(--color-border-default)] flex items-center justify-center"
        >
          <Lock className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 text-center"
      >
        Access Denied
      </motion.h3>

      {/* Message */}
      <motion.p
        variants={itemVariants}
        className="text-[var(--color-text-secondary)] text-center mb-4 max-w-xs"
      >
        {message}
      </motion.p>

      {/* Plan information */}
      {(currentPlan || requiredPlan) && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-3 bg-[var(--color-surface-raised)] rounded-lg text-sm text-center"
        >
          {currentPlan && (
            <p className="text-[var(--color-text-tertiary)]">
              Current plan: <span className="text-[var(--color-text-secondary)] font-medium">{currentPlan}</span>
            </p>
          )}
          {requiredPlan && (
            <p className="text-[var(--color-text-tertiary)]">
              Required: <span className="text-[var(--color-brand-primary)] font-medium">{requiredPlan}</span>
            </p>
          )}
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col w-full gap-3"
      >
        {onUpgrade && (
          <Button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
        
        {onRequestAccess && (
          <Button
            variant="outline"
            onClick={onRequestAccess}
            className="w-full flex items-center justify-center"
          >
            <Users className="w-4 h-4 mr-2" />
            Request Access
          </Button>
        )}
        
        {onContactAdmin && (
          <Button
            variant="ghost"
            onClick={onContactAdmin}
            className="w-full flex items-center justify-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Admin
          </Button>
        )}
        
        {onGoBack && (
          <Button
            variant="ghost"
            onClick={onGoBack}
            className="w-full"
          >
            Go Back
          </Button>
        )}
      </motion.div>

      {/* Help text */}
      <motion.p
        variants={itemVariants}
        className="mt-6 text-xs text-[var(--color-text-tertiary)] text-center"
      >
        Need help? Contact your administrator or{" "}
        <a href="/support" className="text-[var(--color-brand-primary)] hover:underline">
          reach out to support
        </a>
        .
      </motion.p>
    </motion.div>
  );
}

export default PermissionDenied;
