/**
 * Structured logging types with correlation ID support
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId: string;
  service: string;
  version: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  durationMs?: number;
}

export interface LoggerConfig {
  service: string;
  version: string;
  minLevel: LogLevel;
  output: 'console' | 'file' | 'both';
  filePath?: string;
  includeTimestamp: boolean;
  includeCorrelationId: boolean;
}

export interface RequestContext {
  correlationId: string;
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  path?: string;
  method?: string;
}

export type LogFormatter = (entry: LogEntry) => string;

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
  withCorrelationId(correlationId: string): Logger;
}
