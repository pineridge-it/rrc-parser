"use client";

/**
 * DashboardEmpty Component
 * 
 * Displays an engaging empty state for new users who haven't set up their
 * dashboard yet. Includes an illustration, welcoming message, and clear
 * call-to-action to start creating their first Area of Interest (AOI).
 * 
 * @component
 * @example
 * ```tsx
 * <DashboardEmpty 
 *   onCreateAoi={() => router.push('/onboarding')}
 * />
 * ```
 * 
 * @author WhiteHill
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DashboardEmptyProps {
  /** Callback when user clicks to create their first AOI */
  onCreateAoi: () => void;
  /** Optional callback for exploring demo data */
  onExploreDemo?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animation variants for staggered entrance
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
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
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

/**
 * DashboardEmpty - Welcome new users and guide them to create their first AOI
 */
export function DashboardEmpty({
  onCreateAoi,
  onExploreDemo,
  className,
}: DashboardEmptyProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center min-h-[500px] px-6 py-12",
        "bg-[var(--color-surface-default)] rounded-xl",
        "border border-dashed border-[var(--color-border-default)]",
        className
      )}
    >
      {/* Animated Illustration */}
      <motion.div
        variants={itemVariants}
        className="relative w-48 h-48 mb-8"
      >
        {/* Background Circle */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-brand-primary)]/10 to-[var(--color-brand-accent)]/10"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
        
        {/* Map Pin Icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        >
          <div className="relative">
            <MapPin className="w-20 h-20 text-[var(--color-brand-primary)]" strokeWidth={1.5} />
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/10 rounded-full blur-sm"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            />
          </div>
        </motion.div>

        {/* Orbiting Elements */}
        <motion.div
          className="absolute top-4 right-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Compass className="w-8 h-8 text-[var(--color-brand-accent)]/60" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants} className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
          Welcome to RRC!
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-2">
          Start monitoring regulatory changes by creating your first
          Area of Interest (AOI).
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-8">
          An AOI is a geographic area where you want to track new permits
          and regulatory updates.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={onCreateAoi}
          className="group"
        >
          <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
          Create Your First AOI
        </Button>
        
        {onExploreDemo && (
          <Button
            variant="secondary"
            size="lg"
            onClick={onExploreDemo}
          >
            <Compass className="w-5 h-5 mr-2" />
            Explore Demo Data
          </Button>
        )}
      </motion.div>

      {/* Helper Text */}
      <motion.p
        variants={itemVariants}
        className="mt-6 text-xs text-[var(--color-text-tertiary)]"
      >
        Takes less than 2 minutes • No credit card required
      </motion.p>
    </motion.div>
  );
}
