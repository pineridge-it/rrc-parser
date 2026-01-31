"use client";

import { useEffect, useState } from "react";

/**
 * useReducedMotion Hook
 * 
 * Detects if the user prefers reduced motion (accessibility).
 * Returns true if the user has requested reduced motion,
 * which should disable or simplify animations.
 * 
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * 
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { scale: 1.1 }}
 * >
 *   Content
 * </motion.div>
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
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

/**
 * useAnimationPreference Hook
 * 
 * Returns animation settings based on user preferences.
 * Useful for conditionally applying animations.
 */
export function useAnimationPreference() {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,
    shouldAnimate: !prefersReducedMotion,
    transition: prefersReducedMotion ? { duration: 0 } : undefined,
    instant: { duration: 0 },
  };
}
