"use client";

import { toast as sonnerToast } from "sonner";
import { useToastContext } from "./toast";

// Types for toast options
type ToastType = "success" | "error" | "warning" | "info" | "loading" | "default";
type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}

interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
  icon?: React.ReactNode;
  action?: ToastAction;
  description?: string;
}

interface ToastPromiseOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
  description?: {
    loading?: string;
    success?: string | ((data: T) => string);
    error?: string | ((error: Error) => string);
  };
}

// Custom hook for toast notifications
export function useToast() {
  // Try to use the context-based toast system first
  let contextToast;
  try {
    contextToast = useToastContext();
  } catch {
    // Context not available, fall back to sonner
    contextToast = null;
  }

  const showToast = (
    type: ToastType,
    title: string,
    options: ToastOptions = {}
  ) => {
    const { description, duration, action, ...restOptions } = options;

    // If context is available, use it for custom toasts
    if (contextToast) {
      return contextToast.addToast({
        title,
        description,
        variant: type === "default" ? undefined : type,
        duration: duration ?? 5000,
        action,
      });
    }

    // Fall back to sonner
    const toastOptions = {
      duration: duration ?? 5000,
      dismissible: options.dismissible ?? true,
      icon: options.icon,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
      description,
      ...restOptions,
    };

    switch (type) {
      case "success":
        return sonnerToast.success(title, toastOptions);
      case "error":
        return sonnerToast.error(title, toastOptions);
      case "warning":
        return sonnerToast.warning(title, toastOptions);
      case "info":
        return sonnerToast.info(title, toastOptions);
      case "loading":
        return sonnerToast.loading(title, toastOptions);
      default:
        return sonnerToast(title, toastOptions);
    }
  };

  // Promise-based toast for async operations
  const promise = <T,>(
    promise: Promise<T>,
    options: ToastPromiseOptions<T>
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: (data) =>
        typeof options.success === "function"
          ? options.success(data)
          : options.success,
      error: (error) =>
        typeof options.error === "function"
          ? options.error(error as Error)
          : options.error,
    });
  };

  // Dismiss a specific toast or all toasts
  const dismiss = (toastId?: string) => {
    if (contextToast && toastId) {
      contextToast.removeToast(toastId);
    } else {
      sonnerToast.dismiss(toastId);
    }
  };

  // Update an existing toast
  const update = (toastId: string, options: Partial<ToastOptions>) => {
    if (contextToast) {
      contextToast.updateToast(toastId, {
        title: options.description || "",
        description: options.description,
        duration: options.duration,
        action: options.action,
      });
    }
  };

  return {
    toast: showToast,
    success: (title: string, options?: ToastOptions) =>
      showToast("success", title, options),
    error: (title: string, options?: ToastOptions) =>
      showToast("error", title, options),
    warning: (title: string, options?: ToastOptions) =>
      showToast("warning", title, options),
    info: (title: string, options?: ToastOptions) =>
      showToast("info", title, options),
    loading: (title: string, options?: ToastOptions) =>
      showToast("loading", title, options),
    default: (title: string, options?: ToastOptions) =>
      showToast("default", title, options),
    promise,
    dismiss,
    update,
  };
}

// Standalone toast functions for use outside of React components
export const toast = {
  success: (title: string, options?: Omit<ToastOptions, "description"> & { description?: string }) =>
    sonnerToast.success(title, options),
  error: (title: string, options?: Omit<ToastOptions, "description"> & { description?: string }) =>
    sonnerToast.error(title, options),
  warning: (title: string, options?: Omit<ToastOptions, "description"> & { description?: string }) =>
    sonnerToast.warning(title, options),
  info: (title: string, options?: Omit<ToastOptions, "description"> & { description?: string }) =>
    sonnerToast.info(title, options),
  loading: (title: string, options?: Omit<ToastOptions, "description"> & { description?: string }) =>
    sonnerToast.loading(title, options),
  default: (title: string, options?: Omit<ToastOptions, "description"> & { description?: string }) =>
    sonnerToast(title, options),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};

// Export types
export type { ToastType, ToastPosition, ToastAction, ToastOptions, ToastPromiseOptions };
