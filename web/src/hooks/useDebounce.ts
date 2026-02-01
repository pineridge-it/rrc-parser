"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for debouncing a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debouncing a callback function
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Hook for debouncing a value with leading/trailing options
 * @param value - The value to debounce
 * @param options - Configuration options
 * @returns The debounced value and control functions
 */
interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}

export function useDebounceAdvanced<T>(
  value: T,
  options: UseDebounceOptions = {}
): {
  debouncedValue: T;
  flush: () => void;
  cancel: () => void;
  pending: () => boolean;
} {
  const { delay = 300, leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leadingRef = useRef(true);
  const pendingRef = useRef(false);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      pendingRef.current = false;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setDebouncedValue(value);
      pendingRef.current = false;
    }
  }, [value]);

  const pending = useCallback(() => pendingRef.current, []);

  useEffect(() => {
    if (leading && leadingRef.current) {
      setDebouncedValue(value);
      leadingRef.current = false;
      return;
    }

    pendingRef.current = true;

    timeoutRef.current = setTimeout(() => {
      if (trailing) {
        setDebouncedValue(value);
      }
      pendingRef.current = false;
      leadingRef.current = true;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing]);

  return { debouncedValue, flush, cancel, pending };
}
