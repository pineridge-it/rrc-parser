/**
 * Common types used across the application
 */

/**
 * Field type for validation
 */
export type FieldType = 'string' | 'number' | 'int' | 'float' | 'date' | 'boolean' | 'flag';

/**
 * Validator type for field validation
 */
export type ValidatorType = 
  | 'api_number' 
  | 'permit_number' 
  | 'operator_number' 
  | 'county' 
  | 'district' 
  | 'date' 
  | 'depth' 
  | 'coordinate'
  | string;

/**
 * Range validation configuration
 */
export interface RangeValidation {
  min?: number;
  max?: number;
  message?: string;
  description?: string;
}

/**
 * Operator number validation configuration
 */
export interface OperatorNumberValidation {
  required?: boolean;
  allowWildcard?: boolean;
  message?: string;
  numeric_only?: boolean;
  min_length?: number;
  max_length?: number;
}

/**
 * Flag validation configuration
 */
export interface FlagValidation {
  validValues: string[];
  message?: string;
}

/**
 * Represents a raw record from the source file
 */
export interface RecordData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Console-based logger implementation
 */
export class ConsoleLogger implements ILogger {
  debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * Storage key type for checkpoint management
 */
export type StorageKey = string;
