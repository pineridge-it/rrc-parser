"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface LazyLoadProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  fallback?: React.ReactNode;
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  threshold?: number;
  rootMargin?: string;
}

interface LazyComponentProps {
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  fallback?: React.ReactNode;
  className?: string;
}

// ============================================
// Lazy Load Component
// ============================================

export function LazyLoad({
  children,
  className,
  placeholder,
  threshold = 0.1,
  rootMargin = "50px",
  triggerOnce = true,
  delay = 0,
  fallback,
}: LazyLoadProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: triggerOnce,
    amount: threshold,
    margin: rootMargin as `${number}px`,
  });
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isInView && !hasLoaded) {
      const timer = setTimeout(() => {
        setHasLoaded(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, delay, hasLoaded]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {hasLoaded ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      ) : (
        placeholder || (
          <div className="animate-pulse bg-[var(--color-surface-subtle)] rounded min-h-[100px]" />
        )
      )}
    </div>
  );
}

// ============================================
// Lazy Image Component
// ============================================

export function LazyImage({
  src,
  alt,
  className,
  placeholderSrc,
  threshold = 0.1,
  rootMargin = "50px",
  ...props
}: LazyImageProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: threshold,
    margin: rootMargin as `${number}px`,
  });
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(placeholderSrc);

  React.useEffect(() => {
    if (isInView) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
    }
  }, [isInView, src]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <img
        src={imageSrc || src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-[var(--color-surface-subtle)]" />
      )}
    </div>
  );
}

// ============================================
// Lazy Component with Dynamic Import
// ============================================

export function LazyComponent({
  component: Component,
  props = {},
  fallback,
  className,
}: LazyComponentProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={className}>
        {fallback || (
          <div className="animate-pulse bg-[var(--color-surface-subtle)] rounded min-h-[100px]" />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Component {...props} />
    </div>
  );
}

// ============================================
// Intersection Observer Hook
// ============================================

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = false } = options;
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isIntersecting, hasIntersected };
}

// ============================================
// Below Fold Lazy Load
// ============================================

interface BelowFoldProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: React.ReactNode;
  priority?: "high" | "normal" | "low";
}

export function BelowFold({
  children,
  className,
  placeholder,
  priority = "normal",
}: BelowFoldProps) {
  const rootMarginMap = {
    high: "200px",
    normal: "100px",
    low: "50px",
  };

  return (
    <LazyLoad
      className={className}
      placeholder={placeholder}
      rootMargin={rootMarginMap[priority]}
      triggerOnce
    >
      {children}
    </LazyLoad>
  );
}
