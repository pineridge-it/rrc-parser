"use client";

/**
 * AoiEmpty Component
 * 
 * Displayed when the user has no Areas of Interest (AOIs) configured.
 * Provides guidance on what AOIs are and how to create them.
 * 
 * @component
 * @example
 * ```tsx
 * <AoiEmpty 
 *   onCreateAoi={() => setShowCreateModal(true)}
 * />
 * ```
 * 
 * @author WhiteHill
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { Map, Plus, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AoiEmptyProps {
  /** Callback when user clicks to create a new AOI */
  onCreateAoi: () => void;
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
 * AoiEmpty - Guide users to create their first Area of Interest
 */
export function AoiEmpty({ onCreateAoi, className }: AoiEmptyProps) {
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
        className="relative w-32 h-32 mb-6"
      >
        {/* Map Background */}
        <div className="absolute inset-0 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: `
                linear-gradient(to right, var(--color-border-strong) 1px, transparent 1px),
                linear-gradient(to bottom, var(--color-border-strong) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          {/* Animated Map Pin */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full"
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          >
            <MapPin className="w-10 h-10 text-[var(--color-brand-primary)]" />
          </motion.div>
        </div>

        {/* Floating Icons */}
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-brand-accent)]/20 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        >
          <Layers className="w-4 h-4 text-[var(--color-brand-accent)]" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants} className="text-center">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          No Areas Monitored
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">
          Create an Area of Interest to start receiving alerts about
          new permits and regulatory changes in your region.
        </p>
      </motion.div>

      {/* Action */}
      <motion.div variants={itemVariants}>
        <Button
          variant="primary"
          onClick={onCreateAoi}
          className="group"
        >
          <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
          Create AOI
        </Button>
      </motion.div>

      {/* Feature List */}
      <motion.div
        variants={itemVariants}
        className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-[var(--color-text-tertiary)]"
      >
        <span className="flex items-center gap-1">
          <Map className="w-3 h-3" />
          Draw on map
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Set radius
        </span>
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          Multiple areas
        </span>
      </motion.div>
    </motion.div>
  );
}
