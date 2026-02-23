/**
 * Comprehensive Error Handling Framework
 * Provides error categorization, retry logic, and user-friendly error messages
 */

export enum ErrorCategory {
  TRANSIENT = 'transient',
  PERMANENT = 'permanent',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  operation?: string;
  resource?: string;
  details?: Record<string, unknown>;
  originalError?: Error;
}

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    userMessage: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    this.userMessage = userMessage;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.retryable = category === ErrorCategory.TRANSIENT;
    this.timestamp = new Date();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class TransientError extends AppError {
  constructor(message: string, userMessage: string, context?: ErrorContext) {
    super(message, userMessage, ErrorCategory.TRANSIENT, ErrorSeverity.MEDIUM, context);
    this.name = 'TransientError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage: string, context?: ErrorContext) {
    super(message, userMessage, ErrorCategory.VALIDATION, ErrorSeverity.LOW, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, userMessage: string, context?: ErrorContext) {
    super(message, userMessage, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, userMessage: string, context?: ErrorContext) {
    super(message, userMessage, ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, userMessage: string, context?: ErrorContext) {
    super(message, userMessage, ErrorCategory.NOT_FOUND, ErrorSeverity.LOW, context);
    this.name = 'NotFoundError';
  }
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  onRetry: () => {},
  shouldRetry: (error: Error) => {
    if (error instanceof AppError) {
      return error.retryable;
    }
    return isTransientError(error);
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt >= opts.maxRetries || !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      opts.onRetry(lastError, attempt + 1);
      
      const delay = calculateDelay(attempt, opts.initialDelay, opts.maxDelay, opts.backoffMultiplier, opts.jitter);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  jitter: boolean
): number {
  let delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
  
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.floor(delay);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isTransientError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const transientPatterns = [
    'timeout',
    'network',
    'connection',
    'econnrefused',
    'enotfound',
    'etimedout',
    'socket',
    'fetch failed',
    'service unavailable',
    '503',
    '504',
    '429',
    'rate limit',
    'too many requests',
  ];
  
  return transientPatterns.some(pattern => message.includes(pattern));
}

export function categorizeError(error: Error): ErrorCategory {
  if (error instanceof AppError) {
    return error.category;
  }
  
  const message = error.message.toLowerCase();
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  if (message.includes('forbidden') || message.includes('403')) {
    return ErrorCategory.AUTHORIZATION;
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return ErrorCategory.NOT_FOUND;
  }
  
  if (message.includes('invalid') || message.includes('validation') || message.includes('400')) {
    return ErrorCategory.VALIDATION;
  }
  
  if (isTransientError(error)) {
    return ErrorCategory.TRANSIENT;
  }
  
  return ErrorCategory.UNKNOWN;
}

export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  
  const category = categorizeError(error);
  
  switch (category) {
    case ErrorCategory.TRANSIENT:
      return 'A temporary issue occurred. Please try again in a moment.';
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';
    case ErrorCategory.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    case ErrorCategory.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorCategory.VALIDATION:
      return 'The provided data is invalid. Please check your input.';
    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitorInterval?: number;
}

enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      monitorInterval: 60000,
      ...options,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new TransientError(
          'Circuit breaker is open',
          'This service is temporarily unavailable. Please try again later.',
          { operation: 'circuit_breaker', details: { state: this.state } }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.options.resetTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = undefined;
  }
}

export function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new ValidationError(
      `Missing required environment variable: ${name}`,
      'Application configuration is incomplete. Please contact support.',
      { operation: 'env_validation', details: { variable: name } }
    );
  }
  return value;
}

export function logError(error: Error, context?: ErrorContext): void {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...(error instanceof AppError && {
      category: error.category,
      severity: error.severity,
      userMessage: error.userMessage,
      retryable: error.retryable,
    }),
    ...context,
  };

  if (error instanceof AppError && error.severity === ErrorSeverity.CRITICAL) {
    console.error('[CRITICAL ERROR]', JSON.stringify(errorInfo, null, 2));
  } else if (error instanceof AppError && error.severity === ErrorSeverity.HIGH) {
    console.error('[HIGH SEVERITY ERROR]', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
  }
}
