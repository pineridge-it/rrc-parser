import * as crypto from 'crypto';

export enum ErrorCategory {
  CONFIGURATION = 'CFG',
  VALIDATION = 'VAL',
  PARSING = 'PAR',
  PERMISSION = 'PER',
  NETWORK = 'NET',
  UNKNOWN = 'UNK',
}

export interface AutoFix {
  description: string;
  apply: () => void;
}

export interface UserErrorOptions {
  code: string;
  category: ErrorCategory;
  title: string;
  message: string;
  suggestion?: string;
  autoFix?: AutoFix;
  learnMoreUrl?: string;
  requestId?: string;
  cause?: Error;
}

export class UserError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly title: string;
  readonly suggestion?: string;
  readonly autoFix?: AutoFix;
  readonly learnMoreUrl?: string;
  readonly requestId: string;
  readonly cause?: Error;

  constructor(opts: UserErrorOptions) {
    super(opts.message);
    this.name = 'UserError';
    this.code = opts.code;
    this.category = opts.category;
    this.title = opts.title;
    this.suggestion = opts.suggestion;
    this.autoFix = opts.autoFix;
    this.learnMoreUrl = opts.learnMoreUrl;
    this.requestId = opts.requestId ?? generateRequestId();
    this.cause = opts.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserError);
    }
  }

  isFixable(): boolean {
    return this.autoFix !== undefined;
  }

  applyFix(): void {
    if (!this.autoFix) {
      throw new Error(`No auto-fix available for ${this.code}`);
    }
    this.autoFix.apply();
  }

  toString(): string {
    let out = `[${this.code}] ${this.title}: ${this.message}`;
    if (this.suggestion) {
      out += `\n  Fix: ${this.suggestion}`;
    }
    if (this.requestId) {
      out += `\n  Request ID: ${this.requestId}`;
    }
    return out;
  }
}

export class ConfigUserError extends UserError {
  constructor(opts: Omit<UserErrorOptions, 'category'> & { category?: ErrorCategory }) {
    super({ ...opts, category: opts.category ?? ErrorCategory.CONFIGURATION });
    this.name = 'ConfigUserError';
  }
}

export class ValidationUserError extends UserError {
  readonly fieldName?: string;
  readonly fieldValue?: string;

  constructor(
    opts: Omit<UserErrorOptions, 'category'> & {
      category?: ErrorCategory;
      fieldName?: string;
      fieldValue?: string;
    }
  ) {
    super({ ...opts, category: opts.category ?? ErrorCategory.VALIDATION });
    this.name = 'ValidationUserError';
    this.fieldName = opts.fieldName;
    this.fieldValue = opts.fieldValue;
  }
}

export class ParseUserError extends UserError {
  readonly lineNumber?: number;
  readonly recordType?: string;

  constructor(
    opts: Omit<UserErrorOptions, 'category'> & {
      category?: ErrorCategory;
      lineNumber?: number;
      recordType?: string;
    }
  ) {
    super({ ...opts, category: opts.category ?? ErrorCategory.PARSING });
    this.name = 'ParseUserError';
    this.lineNumber = opts.lineNumber;
    this.recordType = opts.recordType;
  }
}

export function generateRequestId(): string {
  return `req_${crypto.randomBytes(8).toString('hex')}`;
}

export function isUserError(err: unknown): err is UserError {
  return err instanceof UserError;
}
