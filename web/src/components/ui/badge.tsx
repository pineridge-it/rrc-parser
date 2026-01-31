"use client";

import * as React from "react";
import classNames from "classnames";

// Status variants
export type BadgeStatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

// Priority variants
export type BadgePriorityVariant =
  | "low"
  | "medium"
  | "high"
  | "critical";

// Size variants
export type BadgeSize = "sm" | "md" | "lg";

// Props interface
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The variant of the badge - status or priority
   */
  variant?: BadgeStatusVariant | BadgePriorityVariant;
  /**
   * The size of the badge
   */
  size?: BadgeSize;
  /**
   * Whether the badge is dismissible
   */
  dismissible?: boolean;
  /**
   * Callback when the dismiss button is clicked
   */
  onDismiss?: () => void;
  /**
   * Icon to display in the badge
   */
  icon?: React.ReactNode;
  /**
   * Whether to show a pulse animation for attention states
   */
  pulse?: boolean;
}

/**
 * A versatile badge component for displaying status, priority, categories, and counts.
 * Supports various visual variants, sizes, and interactive features.
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      className,
      variant = "neutral",
      size = "md",
      dismissible = false,
      onDismiss,
      icon,
      pulse = false,
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = "inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    // Size classes
    const sizeClasses = {
      sm: "text-xs px-2 py-0.5 gap-1",
      md: "text-sm px-2.5 py-0.5 gap-1.5",
      lg: "text-base px-3 py-1 gap-2",
    };

    // Status variant classes
    const statusVariantClasses = {
      success: "bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success-subtle)]",
      warning: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning-subtle)]",
      error: "bg-[var(--color-error-subtle)] text-[var(--color-error)] border border-[var(--color-error-subtle)]",
      info: "bg-[var(--color-info-subtle)] text-[var(--color-info)] border border-[var(--color-info-subtle)]",
      neutral: "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]",
    };

    // Priority variant classes
    const priorityVariantClasses = {
      low: "bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success-subtle)]",
      medium: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning-subtle)]",
      high: "bg-[var(--color-error-subtle)] text-[var(--color-error)] border border-[var(--color-error-subtle)]",
      critical: "bg-[var(--color-error)] text-white border border-[var(--color-error)]",
    };

    // Determine which variant classes to use
    const variantClasses = 
      variant === "low" || variant === "medium" || variant === "high" || variant === "critical"
        ? priorityVariantClasses[variant as BadgePriorityVariant]
        : statusVariantClasses[variant as BadgeStatusVariant];

    // Pulse animation classes
    const pulseClasses = pulse ? "animate-pulse" : "";

    // Combine all classes
    const classes = classNames(
      baseClasses,
      sizeClasses[size],
      variantClasses,
      pulseClasses,
      className
    );

    // Handle dismiss click
    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss?.();
    };

    return (
      <span
        ref={ref}
        className={classes}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-1 flex-shrink-0 rounded-full hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };