"use client";

/**
 * Accessibility Utilities
 * 
 * A collection of utilities and hooks for WCAG 2.1 AA compliance
 */

import * as React from "react";

// Focus management utilities
export function focusFirstFocusable(element: HTMLElement): void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  focusableElements[0]?.focus();
}

export function focusLastFocusable(element: HTMLElement): void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  focusableElements[focusableElements.length - 1]?.focus();
}

export function trapFocus(element: HTMLElement, event: KeyboardEvent): void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.key === "Tab") {
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite"): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Skip link component
export function SkipLink({ targetId, children = "Skip to main content" }: { targetId: string; children?: React.ReactNode }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-brand-primary)] focus:text-white focus:rounded-md"
    >
      {children}
    </a>
  );
}

// Visually hidden component for screen readers
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// Hook for reduced motion preference
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for high contrast preference
export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersHighContrast;
}

// Hook for keyboard navigation detection
export function useKeyboardNavigation(): boolean {
  const [isKeyboardNavigation, setIsKeyboardNavigation] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardNavigation(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return isKeyboardNavigation;
}

// Generate unique IDs for accessibility
export function useUniqueId(prefix: string = "id"): string {
  const [id] = React.useState(() => `${prefix}-${Math.random().toString(36).substring(2, 11)}`);
  return id;
}

// ARIA label utilities
export function getAriaLabelProps(label: string, description?: string) {
  return {
    "aria-label": label,
    ...(description && { "aria-describedby": description }),
  };
}

// Error message utilities
export function getErrorProps(error?: string) {
  return {
    "aria-invalid": !!error,
    "aria-errormessage": error,
  };
}

// Focus visible utility
export function useFocusVisible(): boolean {
  const [focusVisible, setFocusVisible] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return focusVisible;
}

// Page title management
export function usePageTitle(title: string): void {
  React.useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | RealRate`;

    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}

// Live region for dynamic content
export function LiveRegion({ children, priority = "polite" }: { children: React.ReactNode; priority?: "polite" | "assertive" }) {
  return (
    <div role="status" aria-live={priority} aria-atomic="true" className="sr-only">
      {children}
    </div>
  );
}

// Accessible button with proper keyboard handling
export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  isLoading,
  loadingText,
  disabled,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="sr-only">{loadingText || "Loading"}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
