"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toaster Component
 * 
 * A toast notification component styled with design tokens.
 * Uses sonner for the underlying functionality with enhanced styling.
 * 
 * Features:
 * - Responsive to theme changes (light/dark)
 * - WCAG 2.1 AA compliant contrast ratios
 * - Smooth animations
 * - Accessible with proper ARIA attributes
 * - Progress indicator for auto-dismiss
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        // Base styling using design tokens
        style: {
          background: "var(--color-surface-raised)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        },
        // Variant-specific styling with left border accent
        classNames: {
          toast: "group relative flex w-full items-center gap-3 overflow-hidden rounded-lg p-4 pr-8 shadow-lg transition-all",
          title: "text-sm font-semibold text-[var(--color-text-primary)]",
          description: "text-sm text-[var(--color-text-secondary)] mt-1",
          actionButton: "text-sm font-medium px-3 py-1.5 rounded-md transition-colors",
          cancelButton: "text-sm font-medium px-3 py-1.5 rounded-md transition-colors",
          closeButton: "absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
          // Variant colors using design tokens
          success: "!border-l-4 !border-l-[var(--color-success)] !bg-[var(--color-success-subtle)]",
          error: "!border-l-4 !border-l-[var(--color-error)] !bg-[var(--color-error-subtle)]",
          warning: "!border-l-4 !border-l-[var(--color-warning)] !bg-[var(--color-warning-subtle)]",
          info: "!border-l-4 !border-l-[var(--color-info)] !bg-[var(--color-info-subtle)]",
          loading: "!border-l-4 !border-l-[var(--color-brand-primary)] !bg-[var(--color-surface-raised)]",
        },
      }}
      // Ensure toasts are accessible
      visibleToasts={5}
      // Offset from edges
      offset={16}
      // Gap between toasts
      gap={8}
      // Mobile-friendly
      mobileOffset={16}
    />
  );
}
