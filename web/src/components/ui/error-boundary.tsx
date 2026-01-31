"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

// Error types for categorization
export type ErrorSeverity = "error" | "warning" | "info";

// Props for error fallback UI
export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
  resetErrorBoundary?: () => void;
  severity?: ErrorSeverity;
  title?: string;
  description?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

// Error fallback UI component
export function ErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
  severity = "error",
  title,
  description,
  showDetails = process.env.NODE_ENV === "development",
  showHomeButton = true,
  showBackButton = false,
  onBack,
  className,
}: ErrorFallbackProps) {
  const severityConfig = {
    error: {
      icon: AlertCircle,
      iconColor: "text-[var(--color-error)]",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-[var(--color-error)]",
      title: title || "Something went wrong",
      description: description || "We apologize for the inconvenience. Please try again.",
    },
    warning: {
      icon: AlertCircle,
      iconColor: "text-[var(--color-warning)]",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-[var(--color-warning)]",
      title: title || "Warning",
      description: description || "There was a minor issue, but you can continue.",
    },
    info: {
      icon: AlertCircle,
      iconColor: "text-[var(--color-brand-primary)]",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-[var(--color-brand-primary)]",
      title: title || "Information",
      description: description || "Something happened that you should know about.",
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-6",
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        <div className={cn("flex-shrink-0", config.iconColor)}>
          <Icon className="w-8 h-8" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            {config.title}
          </h3>

          <p className="text-[var(--color-text-secondary)] mb-4">
            {config.description}
          </p>

          {/* Error details (development only) */}
          {showDetails && (
            <div className="mb-4 p-3 bg-black/5 rounded text-sm font-mono overflow-auto">
              <p className="text-[var(--color-error)] font-semibold">{error.message}</p>
              {error.stack && (
                <pre className="mt-2 text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
              {errorInfo?.componentStack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[var(--color-text-tertiary)]">
                    Component Stack
                  </summary>
                  <pre className="mt-2 text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {resetErrorBoundary && (
              <Button
                onClick={resetErrorBoundary}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
            )}

            {showBackButton && onBack && (
              <Button variant="secondary" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Go Back
              </Button>
            )}

            {showHomeButton && (
              <Button variant="ghost" onClick={() => window.location.href = "/"} leftIcon={<Home className="w-4 h-4" />}>
                Go Home
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Base Error Boundary Props
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  showDetails?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

// Base Error Boundary State
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// App-level Error Boundary (catches all errors)
export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("AppErrorBoundary caught an error:", error, errorInfo);
    }

    // TODO: Send to error tracking service (Sentry, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails, showHomeButton, showBackButton, onBack, className } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <ErrorFallback
              error={error}
              errorInfo={errorInfo || undefined}
              resetErrorBoundary={this.resetErrorBoundary}
              severity="error"
              showDetails={showDetails}
              showHomeButton={showHomeButton}
              showBackButton={showBackButton}
              onBack={onBack}
              className={className}
            />
          </div>
        </div>
      );
    }

    return children;
  }
}

// Section-level Error Boundary (for feature-level recovery)
export class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === "development") {
      console.error("SectionErrorBoundary caught an error:", error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails, className } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo || undefined}
          resetErrorBoundary={this.resetErrorBoundary}
          severity="warning"
          title="Section Error"
          description="This section encountered an error. You can try again or continue using other parts of the app."
          showDetails={showDetails}
          showHomeButton={false}
          showBackButton={false}
          className={className}
        />
      );
    }

    return children;
  }
}

// Card-level Error Boundary (for component-level fallback)
export class CardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === "development") {
      console.error("CardErrorBoundary caught an error:", error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails, className } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <ErrorFallback
            error={error}
            errorInfo={errorInfo || undefined}
            resetErrorBoundary={this.resetErrorBoundary}
            severity="info"
            title="Component Error"
            description="This component failed to load."
            showDetails={showDetails}
            showHomeButton={false}
            showBackButton={false}
            className={cn("border-0 bg-transparent p-0", className)}
          />
        </div>
      );
    }

    return children;
  }
}

// Hook for async error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    if (process.env.NODE_ENV === "development") {
      console.error("useErrorHandler caught an error:", error);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// Async Error Boundary wrapper for data fetching
export function AsyncErrorBoundary({
  children,
  error,
  onRetry,
  className,
}: {
  children: ReactNode;
  error: Error | null;
  onRetry?: () => void;
  className?: string;
}) {
  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={onRetry}
        severity="error"
        title="Failed to load data"
        description="We couldn't load the requested data. Please try again."
        showHomeButton={false}
        showBackButton={false}
        className={className}
      />
    );
  }

  return <>{children}</>;
}
