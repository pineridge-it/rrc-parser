"use client";

import { useCallback, useEffect, useState } from "react";

interface UseAccessibilityReturn {
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
  /** Whether high contrast is preferred */
  prefersHighContrast: boolean;
  /** Whether dark mode is preferred */
  prefersDarkMode: boolean;
  /** Current font size scale (1 = normal) */
  fontSizeScale: number;
  /** Announce a message to screen readers */
  announce: (message: string, priority?: "polite" | "assertive") => void;
  /** Trap focus within an element */
  trapFocus: (element: HTMLElement | null) => void;
  /** Release focus trap */
  releaseFocusTrap: () => void;
}

/**
 * Hook for accessibility features and user preferences
 * 
 * Detects user accessibility preferences and provides utilities
 * for creating accessible interactions.
 * 
 * @example
 * ```tsx
 * const { prefersReducedMotion, announce } = useAccessibility();
 * 
 * // Skip animation if user prefers reduced motion
 * const animationProps = prefersReducedMotion 
 *   ? {} 
 *   : { animate: { opacity: 1 } };
 * 
 * // Announce dynamic content
 * announce("New notification received", "polite");
 * ```
 */
export function useAccessibility(): UseAccessibilityReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [trappedElement, setTrappedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    motionQuery.addEventListener("change", handleMotionChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia("(prefers-contrast: high)");
    setPrefersHighContrast(contrastQuery.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    contrastQuery.addEventListener("change", handleContrastChange);

    // Check for dark mode preference
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDarkMode(darkModeQuery.matches);

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setPrefersDarkMode(e.matches);
    };

    darkModeQuery.addEventListener("change", handleDarkModeChange);

    // Check font size (approximate)
    const baseFontSize = parseFloat(
      window.getComputedStyle(document.documentElement).fontSize
    );
    setFontSizeScale(baseFontSize / 16);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      contrastQuery.removeEventListener("change", handleContrastChange);
      darkModeQuery.removeEventListener("change", handleDarkModeChange);
    };
  }, []);

  /**
   * Announce a message to screen readers via ARIA live region
   */
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement is read
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  /**
   * Trap focus within a specific element (for modals, dialogs, etc.)
   */
  const trapFocus = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    setTrappedElement(element);
    
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };
    
    element.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();
    
    // Store cleanup function
    (element as HTMLElement & { _cleanupFocusTrap?: () => void })._cleanupFocusTrap = () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /**
   * Release the focus trap
   */
  const releaseFocusTrap = useCallback(() => {
    if (trappedElement) {
      const cleanup = (trappedElement as HTMLElement & { _cleanupFocusTrap?: () => void })._cleanupFocusTrap;
      cleanup?.();
      setTrappedElement(null);
    }
  }, [trappedElement]);

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode,
    fontSizeScale,
    announce,
    trapFocus,
    releaseFocusTrap,
  };
}

/**
 * Hook for managing page title announcements
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    // Announce page change to screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = `Navigated to ${title}`;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * Hook for keyboard shortcut handling
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; alt?: boolean; shift?: boolean; preventDefault?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = options.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const altMatch = options.alt ? e.altKey : !e.altKey;
      const shiftMatch = options.shift ? e.shiftKey : !e.shiftKey;
      
      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        if (options.preventDefault) {
          e.preventDefault();
        }
        callback();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options.ctrl, options.alt, options.shift, options.preventDefault]);
}
