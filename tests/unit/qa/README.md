# QA Gates Unit Tests

This directory contains comprehensive unit tests for the QA Gates system, which validates data quality at different stages of the ETL pipeline.

## Test Structure

The tests are organized into four main files:

1. `VolumeChecks.test.ts` - Tests for volume-based validations (record counts, duplicates)
2. `SchemaChecks.test.ts` - Tests for schema validations (required fields, type checking, schema drift)
3. `ValueChecks.test.ts` - Tests for value validations (null rates, date sanity, coordinate bounds)
4. `QAGate.test.ts` - Integration tests for the main QAGate orchestrator

## Test Fixtures

Test data is stored in `tests/fixtures/qa/` with the following structure:

```
tests/fixtures/qa/
├── volume/
│   ├── valid-records.json
│   ├── empty-records.json
│   ├── small-batch.json
│   └── large-batch.json
├── schema/
│   ├── records-valid-schema.json
│   ├── records-missing-fields.json
│   ├── records-type-mismatch.json
│   ├── records-null-violations.json
│   └── records-schema-drift.json
└── value/
    ├── records-valid-values.json
    ├── records-excessive-nulls.json
    ├── records-invalid-dates.json
    ├── records-invalid-coordinates.json
    ├── records-duplicates.json
    └── records-invalid-enums.json
```

## Key Validation Scenarios

### Volume Checks
- Valid record counts within expected bounds
- Detection of zero records when not allowed
- Identification of duplicate records
- Volume delta detection compared to previous runs

### Schema Checks
- Verification of required fields presence
- Detection of schema drift (new/missing fields)
- Type validation against expected schemas
- Handling of missing schemas gracefully

### Value Checks
- Null rate validation across all fields
- Date sanity checking (no future dates, reasonable past dates)
- Coordinate bounds validation (latitude/longitude limits)
- Handling of edge cases and invalid values

## Configuration Testing

Tests cover various configuration scenarios:
- Default threshold values
- Custom threshold overrides
- Failure behavior (fail on error, fail on critical)
- Stage-specific validation rules

All tests use real data fixtures and zero mocked dependencies, following the no-mocks philosophy.