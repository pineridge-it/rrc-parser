/**
 * Error States Components
 * 
 * This module provides a collection of error state components for various error scenarios
 * throughout the application. Each component is designed to be visually appealing,
 * informative, and actionable, guiding users on what to do next.
 * 
 * @module error-states
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

export { NetworkError } from "./network-error";
export { ServerError } from "./server-error";
export { NotFound } from "./not-found";
export { PermissionDenied } from "./permission-denied";
export { RateLimit } from "./rate-limit";

// Re-export types for consumers
export type { NetworkErrorProps } from "./network-error";
export type { ServerErrorProps } from "./server-error";
export type { NotFoundProps } from "./not-found";
export type { PermissionDeniedProps } from "./permission-denied";
export type { RateLimitProps } from "./rate-limit";
