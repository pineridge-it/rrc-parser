import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import {
  LogLevel,
  LogEntry,
  LoggerConfig,
  RequestContext,
  Logger,
  LogFormatter,
} from '../types/logging';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

const defaultFormatter: LogFormatter = (entry: LogEntry): string => {
  return JSON.stringify(entry);
};

const consoleFormatter: LogFormatter = (entry: LogEntry): string => {
  const { timestamp, level, message, correlationId, context, error, durationMs } = entry;
  const parts: string[] = [
    `[${timestamp}]`,
    level.toUpperCase().padEnd(5),
    `[${correlationId}]`,
    message,
  ];
  
  if (durationMs !== undefined) {
    parts.push(`(${durationMs}ms)`);
  }
  
  if (context && Object.keys(context).length > 0) {
    parts.push(JSON.stringify(context));
  }
  
  if (error) {
    parts.push(`Error: ${error.name}: ${error.message}`);
    if (error.stack) {
      parts.push(error.stack);
    }
  }
  
  return parts.join(' ');
};

class StructuredLogger implements Logger {
  private config: LoggerConfig;
  private baseContext: Record<string, unknown>;

  constructor(config: Partial<LoggerConfig> = {}, baseContext: Record<string, unknown> = {}) {
    this.config = {
      service: config.service ?? 'unknown-service',
      version: config.version ?? '0.0.0',
      minLevel: config.minLevel ?? 'info',
      output: config.output ?? 'console',
      filePath: config.filePath,
      includeTimestamp: config.includeTimestamp ?? true,
      includeCorrelationId: config.includeCorrelationId ?? true,
    };
    this.baseContext = baseContext;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): LogEntry {
    const requestContext = asyncLocalStorage.getStore();
    const correlationId = requestContext?.correlationId ?? randomUUID();
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      service: this.config.service,
      version: this.config.version,
      context: {
        ...this.baseContext,
        ...requestContext,
        ...context,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private outputLog(entry: LogEntry): void {
    const formatter = this.config.output === 'console' ? consoleFormatter : defaultFormatter;
    const formatted = formatter(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted);
        break;
    }
  }

  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, error, context);
    this.outputLog(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, undefined, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, undefined, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, undefined, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, error, context);
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('fatal', message, error, context);
  }

  child(context: Record<string, unknown>): Logger {
    return new StructuredLogger(this.config, { ...this.baseContext, ...context });
  }

  withCorrelationId(correlationId: string): Logger {
    return this.child({ correlationId });
  }
}

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new StructuredLogger(config);
}

export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

export function runWithContextAsync<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

export function generateCorrelationId(): string {
  return randomUUID();
}

export { asyncLocalStorage };
