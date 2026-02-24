import pino, { Logger } from 'pino';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  correlationId?: string;
  service: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface StructuredLoggerOptions {
  service: string;
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  pretty?: boolean;
  redact?: string[];
}

export class StructuredLogger {
  private logger: Logger;
  private service: string;
  private correlationId?: string;

  constructor(options: StructuredLoggerOptions) {
    this.service = options.service;

    const pinoOptions: pino.LoggerOptions = {
      level: options.level || 'info',
      base: {
        service: this.service,
        pid: process.pid,
      },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      redact: options.redact || ['password', 'token', 'apiKey', 'secret'],
    };

    if (options.pretty && process.env.NODE_ENV !== 'production') {
      this.logger = pino({
        ...pinoOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      });
    } else {
      this.logger = pino(pinoOptions);
    }
  }

  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  clearCorrelationId(): void {
    this.correlationId = undefined;
  }

  private buildContext(context?: Record<string, unknown>): Record<string, unknown> {
    return {
      ...context,
      ...(this.correlationId && { correlationId: this.correlationId }),
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(this.buildContext(context), message);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(this.buildContext(context), message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(this.buildContext(context), message);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : {};

    this.logger.error(
      {
        ...this.buildContext(context),
        ...errorContext,
      },
      message
    );
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : {};

    this.logger.fatal(
      {
        ...this.buildContext(context),
        ...errorContext,
      },
      message
    );
  }

  child(bindings: Record<string, unknown>): StructuredLogger {
    const childLogger = new StructuredLogger({
      service: this.service,
      level: this.logger.level as any,
    });
    childLogger.logger = this.logger.child(bindings);
    childLogger.correlationId = this.correlationId;
    return childLogger;
  }
}

const defaultLogger = new StructuredLogger({
  service: 'rrc-app',
  pretty: process.env.NODE_ENV !== 'production',
});

export default defaultLogger;
