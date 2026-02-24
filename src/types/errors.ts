/**
 * User-facing error types for actionable error messages
 * Location: src/types/errors.ts
 */

/**
 * Error categories with unique prefixes
 */
export enum ErrorCategory {
  CONFIGURATION = 'CFG',
  VALIDATION = 'VAL',
  PARSING = 'PAR',
  PERMISSION = 'PER',
  NETWORK = 'NET',
  FILE_SYSTEM = 'FS',
  UNKNOWN = 'UNK'
}

/**
 * Severity level for errors
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Interface for user-facing errors with actionable guidance
 */
export interface UserError {
  /** Unique error code (e.g., CFG-001, VAL-042) */
  code: string;
  /** Error category for grouping */
  category: ErrorCategory;
  /** Human-readable title */
  title: string;
  /** What happened - user-friendly description */
  message: string;
  /** How to fix it - actionable suggestion */
  suggestion: string;
  /** Optional auto-fix function */
  autoFix?: AutoFixFunction;
  /** Documentation URL */
  learnMoreUrl?: string;
  /** Request ID for support tracking */
  requestId: string;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Additional context for debugging */
  context?: Record<string, unknown>;
  /** Stack trace (only shown with --verbose) */
  stack?: string;
  /** Severity level */
  severity: ErrorSeverity;
}

/**
 * Auto-fix function type
 */
export type AutoFixFunction = () => Promise<AutoFixResult> | AutoFixResult;

/**
 * Result of an auto-fix operation
 */
export interface AutoFixResult {
  /** Whether the fix was applied successfully */
  success: boolean;
  /** Description of what was fixed */
  message: string;
  /** Any additional changes made */
  changes?: string[];
}

/**
 * Error code registry entry
 */
export interface ErrorCodeDefinition {
  code: string;
  category: ErrorCategory;
  title: string;
  defaultMessage: string;
  defaultSuggestion: string;
  learnMoreUrl?: string;
  autoFixAvailable: boolean;
}

/**
 * Error report for support
 */
export interface ErrorReport {
  requestId: string;
  generatedAt: Date;
  errors: UserError[];
  systemInfo: {
    platform: string;
    nodeVersion: string;
    packageVersion: string;
    cwd: string;
  };
  config?: Record<string, unknown>;
}
