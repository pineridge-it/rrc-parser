/**
 * RRC Parser Error Classes
 */

export class RrcParseError extends Error {
  public readonly lineNumber: number;
  public readonly recordType: string;
  public readonly rawRecord?: string;
  public readonly fieldName?: string;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    lineNumber: number,
    recordType: string,
    options: {
      rawRecord?: string;
      fieldName?: string;
      recoverable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'RrcParseError';
    this.lineNumber = lineNumber;
    this.recordType = recordType;
    this.rawRecord = options.rawRecord;
    this.fieldName = options.fieldName;
    this.recoverable = options.recoverable ?? true;
    // Store cause as a property for debugging
    if (options.cause) {
      (this as Error & { cause?: Error }).cause = options.cause;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      lineNumber: this.lineNumber,
      recordType: this.recordType,
      fieldName: this.fieldName,
      recoverable: this.recoverable,
      rawRecord: this.rawRecord?.substring(0, 100) // Truncate for safety
    };
  }
}

export class RrcValidationError extends RrcParseError {
  public readonly validationRule: string;
  public readonly fieldValue: string;

  constructor(
    message: string,
    lineNumber: number,
    recordType: string,
    fieldName: string,
    fieldValue: string,
    validationRule: string
  ) {
    super(message, lineNumber, recordType, {
      fieldName,
      recoverable: true
    });
    this.name = 'RrcValidationError';
    this.validationRule = validationRule;
    this.fieldValue = fieldValue;
  }
}

export class RrcMalformedRecordError extends RrcParseError {
  public readonly malformedReason: string;

  constructor(
    message: string,
    lineNumber: number,
    rawRecord: string,
    malformedReason: string
  ) {
    super(message, lineNumber, 'unknown', {
      rawRecord,
      recoverable: true
    });
    this.name = 'RrcMalformedRecordError';
    this.malformedReason = malformedReason;
  }
}

export class RrcOrphanRecordError extends RrcParseError {
  public readonly orphanType: string;

  constructor(
    message: string,
    lineNumber: number,
    recordType: string,
    orphanType: string
  ) {
    super(message, lineNumber, recordType, { recoverable: true });
    this.name = 'RrcOrphanRecordError';
    this.orphanType = orphanType;
  }
}

export class RrcParserConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RrcParserConfigurationError';
  }
}
