"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast Component
 * 
 * A comprehensive toast notification system with:
 * - Multiple variants (success, error, warning, info, loading)
 * - Progress indicator for auto-dismiss
 * - Action buttons support
 * - Accessible with ARIA live regions
 * - Smooth animations
 */

// Toast variants using design tokens
const toastVariants = cva(
  "relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]",
        success: "border-[var(--color-success)] bg-[var(--color-success-subtle)]",
        error: "border-[var(--color-error)] bg-[var(--color-error-subtle)]",
        warning: "border-[var(--color-warning)] bg-[var(--color-warning-subtle)]",
        info: "border-[var(--color-info)] bg-[var(--color-info-subtle)]",
        loading: "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Icon colors for each variant
const iconColors = {
  default: "text-[var(--color-text-primary)]",
  success: "text-[var(--color-success)]",
  error: "text-[var(--color-error)]",
  warning: "text-[var(--color-warning)]",
  info: "text-[var(--color-info)]",
  loading: "text-[var(--color-brand-primary)]",
};

// Icons for each variant
const variantIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  id?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
  };
  onDismiss?: () => void;
  duration?: number;
  showProgress?: boolean;
  className?: string;
}

export function Toast({
  id,
  title,
  description,
  variant = "default",
  action,
  onDismiss,
  duration = 5000,
  showProgress = true,
  className,
}: ToastProps) {
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);
  const Icon = variantIcons[variant || "default"];
  const isLoading = variant === "loading";

  // Auto-dismiss with progress
  React.useEffect(() => {
    if (isLoading || !duration || duration === Infinity) return;

    let startTime = Date.now();
    let remainingTime = duration;
    let animationFrame: number;

    const updateProgress = () => {
      if (isPaused) {
        startTime = Date.now() - (duration - remainingTime);
        animationFrame = requestAnimationFrame(updateProgress);
        return;
      }

      const elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
      remainingTime = duration - elapsed;

      setProgress(newProgress);

      if (newProgress > 0) {
        animationFrame = requestAnimationFrame(updateProgress);
      } else {
        onDismiss?.();
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [duration, isLoading, isPaused, onDismiss]);

  return (
    <div
      role="alert"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(toastVariants({ variant }), className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 mt-0.5", iconColors[variant || "default"])}>
        <Icon className={cn("h-5 w-5", isLoading && "animate-spin")} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h4>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}

        {/* Action Button */}
        {action && (
          <div className="mt-3">
            <button
              onClick={action.onClick}
              className={cn(
                "text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-3 py-1.5",
                action.variant === "danger" && [
                  "text-[var(--color-error)]",
                  "hover:bg-[var(--color-error-subtle)]",
                  "focus-visible:ring-[var(--color-error)]",
                ],
                action.variant === "secondary" && [
                  "text-[var(--color-text-secondary)]",
                  "hover:bg-[var(--color-surface-subtle)]",
                  "focus-visible:ring-[var(--color-brand-primary)]",
                ],
                (!action.variant || action.variant === "primary") && [
                  "text-[var(--color-brand-primary)]",
                  "hover:bg-[var(--color-brand-primary-subtle)]",
                  "focus-visible:ring-[var(--color-brand-primary)]",
                ]
              )}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      {onDismiss && !isLoading && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Progress Bar */}
      {showProgress && !isLoading && duration && duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-surface-subtle)]">
          <div
            className={cn(
              "h-full transition-all ease-linear",
              variant === "success" && "bg-[var(--color-success)]",
              variant === "error" && "bg-[var(--color-error)]",
              variant === "warning" && "bg-[var(--color-warning)]",
              variant === "info" && "bg-[var(--color-info)]",
              variant === "default" && "bg-[var(--color-brand-primary)]"
            )}
            style={{
              width: `${progress}%`,
              transitionDuration: isPaused ? "0ms" : "100ms",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  children: React.ReactNode;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  className?: string;
}

const positionClasses = {
  "top-left": "top-0 left-0",
  "top-center": "top-0 left-1/2 -translate-x-1/2",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-0 right-0",
};

export function ToastContainer({
  children,
  position = "bottom-right",
  className,
}: ToastContainerProps) {
  return (
    <div
      className={cn(
        "fixed z-[var(--z-toast)] flex flex-col gap-2 p-4 max-w-sm w-full pointer-events-none",
        positionClasses[position],
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {React.Children.map(children, (child) => (
        <div className="pointer-events-auto">{child}</div>
      ))}
    </div>
  );
}

// Toast Provider for managing toast state
interface ToastState {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info" | "loading";
  duration?: number;
  action?: ToastProps["action"];
}

interface ToastContextValue {
  toasts: ToastState[];
  addToast: (toast: Omit<ToastState, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<ToastState>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({
  children,
  position = "bottom-right",
}: {
  children: React.ReactNode;
  position?: ToastContainerProps["position"];
}) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastState, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = React.useCallback((id: string, updates: Partial<ToastState>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const value = React.useMemo(
    () => ({ toasts, addToast, removeToast, updateToast }),
    [toasts, addToast, removeToast, updateToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position={position}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

// Hook for using toast context
export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}
