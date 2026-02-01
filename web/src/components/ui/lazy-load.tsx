"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component for lazy loading with Suspense
 * Provides a consistent loading state while components are being loaded
 */
export function LazyLoad({ children, fallback, className }: LazyLoadProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className={cn("animate-pulse bg-muted rounded-lg", className)}>
            <div className="h-full w-full bg-muted/50" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

// Loading spinner component for lazy loading states
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className={cn(
          "border-4 border-primary/30 border-t-primary rounded-full",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Skeleton loader for lazy loading
interface LazySkeletonProps {
  className?: string;
  lines?: number;
}

export function LazySkeleton({ className, lines = 3 }: LazySkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

// Error boundary for lazy loading failures
interface LazyErrorProps {
  error?: Error;
  reset?: () => void;
  className?: string;
}

export function LazyError({ error, reset, className }: LazyErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center",
        className
      )}
    >
      <div className="text-destructive mb-2">
        <svg
          className="h-12 w-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1">Failed to load</h3>
      <p className="text-muted-foreground text-sm mb-4">
        {error?.message || "There was an error loading this component."}
      </p>
      {reset && (
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// Higher-order component for lazy loading pages/components
export function withLazyLoad<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    errorComponent?: React.ComponentType<{ error?: Error; reset?: () => void }>;
  } = {}
) {
  const { fallback, errorComponent: ErrorComponent = LazyError } = options;

  return function LazyLoadedComponent(props: P) {
    const [hasError, setHasError] = React.useState(false);
    const [error, setError] = React.useState<Error | undefined>();

    const handleError = (err: Error) => {
      setHasError(true);
      setError(err);
    };

    const reset = () => {
      setHasError(false);
      setError(undefined);
    };

    if (hasError) {
      return <ErrorComponent error={error} reset={reset} />;
    }

    return (
      <LazyLoad fallback={fallback}>
        <Component {...props} />
      </LazyLoad>
    );
  };
}
