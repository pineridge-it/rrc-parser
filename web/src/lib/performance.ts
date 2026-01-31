"use client";

import * as React from "react";

// ============================================
// Performance Monitoring Types
// ============================================

interface PerformanceMetrics {
  // Navigation timing
  dnsLookupTime: number;
  connectionTime: number;
  ttfb: number; // Time to first byte
  downloadTime: number;
  domProcessingTime: number;
  loadTime: number;
  
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  tti?: number; // Time to Interactive
  
  // Resource timing
  resources: PerformanceResourceTiming[];
}

interface PerformanceObserverEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  processingStart?: number;
  value?: number;
}

// ============================================
// Performance Monitoring Hook
// ============================================

export function usePerformanceMonitoring(enabled: boolean = true) {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Wait for load event
    const handleLoad = () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          setMetrics((prev) => ({
            ...prev,
            dnsLookupTime: navigation.domainLookupEnd - navigation.domainLookupStart,
            connectionTime: navigation.connectEnd - navigation.connectStart,
            ttfb: navigation.responseStart - navigation.requestStart,
            downloadTime: navigation.responseEnd - navigation.responseStart,
            domProcessingTime: navigation.domComplete - navigation.domInteractive,
            loadTime: navigation.loadEventEnd - navigation.startTime,
          }));
        }
      }, 0);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, [enabled]);

  // Observe Core Web Vitals
  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        setMetrics((prev) => ({ ...prev, lcp: lastEntry.startTime }));
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === "first-input") {
          const fidEntry = entry as PerformanceEventTiming;
          setMetrics((prev) => ({
            ...prev,
            fid: fidEntry.processingStart - fidEntry.startTime,
          }));
        }
      });
    });

    try {
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          setMetrics((prev) => ({ ...prev, cls: clsValue }));
        }
      });
    });

    try {
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      // CLS not supported
    }

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          setMetrics((prev) => ({ ...prev, fcp: entry.startTime }));
        }
      });
    });

    try {
      fcpObserver.observe({ entryTypes: ["paint"] });
    } catch (e) {
      // Paint not supported
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
    };
  }, [enabled]);

  return metrics;
}

// ============================================
// Resource Loading Monitor
// ============================================

export function useResourceLoading(enabled: boolean = true) {
  const [slowResources, setSlowResources] = React.useState<PerformanceResourceTiming[]>([]);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      const slow = entries.filter((entry) => {
        const duration = entry.responseEnd - entry.startTime;
        return duration > 1000; // Resources taking more than 1 second
      });
      
      if (slow.length > 0) {
        setSlowResources((prev) => [...prev, ...slow]);
      }
    });

    try {
      observer.observe({ entryTypes: ["resource"] });
    } catch (e) {
      // Resource timing not supported
    }

    return () => observer.disconnect();
  }, [enabled]);

  return slowResources;
}

// ============================================
// Image Loading Optimizer
// ============================================

interface ImageLoadingOptions {
  src: string;
  sizes?: string;
  priority?: boolean;
}

export function useImageOptimizer(options: ImageLoadingOptions) {
  const { src, sizes = "100vw", priority = false } = options;
  const [optimizedSrc, setOptimizedSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    // For Next.js Image component optimization hints
    const img = new Image();
    
    if (priority) {
      img.fetchPriority = "high";
    }

    img.onload = () => {
      setOptimizedSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`));
      setIsLoading(false);
    };

    img.src = src;
  }, [src, priority]);

  return {
    src: optimizedSrc,
    isLoading,
    error,
    sizes,
    priority,
  };
}

// ============================================
// Bundle Size Monitor
// ============================================

export function useBundleSize() {
  const [bundleSize, setBundleSize] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Calculate approximate bundle size from performance entries
    const calculateSize = () => {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      let totalSize = 0;

      resources.forEach((resource) => {
        // Transfer size is available in some browsers
        if ("transferSize" in resource) {
          totalSize += (resource as any).transferSize;
        }
      });

      setBundleSize(totalSize);
    };

    // Wait for resources to load
    setTimeout(calculateSize, 1000);
  }, []);

  return bundleSize;
}

// ============================================
// Prefetch Utilities
// ============================================

export function prefetchRoute(href: string): void {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

export function prefetchImage(src: string): void {
  if (typeof window === "undefined") return;

  const img = new Image();
  img.src = src;
}

// ============================================
// Debounce/Throttle Utilities
// ============================================

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// Memory Monitor
// ============================================

export function useMemoryMonitor(enabled: boolean = true) {
  const [memory, setMemory] = React.useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const performanceMemory = (performance as any).memory;
    if (!performanceMemory) return;

    const updateMemory = () => {
      setMemory({
        usedJSHeapSize: performanceMemory.usedJSHeapSize,
        totalJSHeapSize: performanceMemory.totalJSHeapSize,
        jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit,
      });
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000);

    return () => clearInterval(interval);
  }, [enabled]);

  return memory;
}

// ============================================
// Performance Budget Check
// ============================================

interface PerformanceBudget {
  maxLoadTime?: number;
  maxBundleSize?: number;
  maxLCP?: number;
  maxFID?: number;
  maxCLS?: number;
}

export function checkPerformanceBudget(
  metrics: Partial<PerformanceMetrics>,
  budget: PerformanceBudget
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (budget.maxLoadTime && metrics.loadTime && metrics.loadTime > budget.maxLoadTime) {
    violations.push(`Load time ${metrics.loadTime}ms exceeds budget ${budget.maxLoadTime}ms`);
  }

  if (budget.maxLCP && metrics.lcp && metrics.lcp > budget.maxLCP) {
    violations.push(`LCP ${metrics.lcp}ms exceeds budget ${budget.maxLCP}ms`);
  }

  if (budget.maxFID && metrics.fid && metrics.fid > budget.maxFID) {
    violations.push(`FID ${metrics.fid}ms exceeds budget ${budget.maxFID}ms`);
  }

  if (budget.maxCLS && metrics.cls && metrics.cls > budget.maxCLS) {
    violations.push(`CLS ${metrics.cls} exceeds budget ${budget.maxCLS}`);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
