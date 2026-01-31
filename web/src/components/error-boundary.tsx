"use client";

import React from "react";
import { toast } from "sonner";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Base Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
class BaseErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-lg bg-[var(--color-error-subtle)] border border-[var(--color-error)]">
          <h3 className="text-lg font-semibold text-[var(--color-error)] mb-2">
            Something went wrong
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-md hover:bg-[var(--color-brand-primary-hover)] transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * App Error Boundary
 * 
 * For top-level error handling. Shows a full-screen error message.
 */
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = React.useCallback((error: Error) => {
    toast.error("Application Error", {
      description: error.message || "An unexpected error occurred",
    });
  }, []);

  return (
    <BaseErrorBoundary
      onError={handleError}
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] shadow-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-error-subtle)] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[var(--color-error)]"
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
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Application Error
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Something went wrong. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[var(--color-brand-primary)] text-white rounded-md hover:bg-[var(--color-brand-primary-hover)] transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Section Error Boundary
 * 
 * For section-level error handling. Shows an error message within the layout.
 */
export function SectionErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = React.useCallback((error: Error) => {
    toast.error("Section Error", {
      description: error.message || "Failed to load section",
    });
  }, []);

  return (
    <BaseErrorBoundary
      onError={handleError}
      fallback={
        <div className="p-6 rounded-lg bg-[var(--color-error-subtle)] border border-[var(--color-error)]">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[var(--color-error)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-error)] mb-1">
                Failed to load section
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                There was a problem loading this section. Please try refreshing.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Card Error Boundary
 * 
 * For card-level error handling. Shows a compact error message.
 */
export function CardErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = React.useCallback((error: Error) => {
    toast.error("Component Error", {
      description: error.message || "A component failed to load",
    });
  }, []);

  return (
    <BaseErrorBoundary
      onError={handleError}
      fallback={
        <div className="p-4 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border-default)]">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-[var(--color-error)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-[var(--color-text-secondary)]">
              Failed to load content
            </span>
          </div>
        </div>
      }
    >
      {children}
    </BaseErrorBoundary>
  );
}
