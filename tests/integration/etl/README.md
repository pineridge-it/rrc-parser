# ETL Pipeline Integration Tests

This directory contains comprehensive integration tests for the ETL (Extract, Transform, Load) Pipeline, ensuring the complete data flow works correctly with real file operations.

## Test Structure

The tests are organized into several categories:

1. `Pipeline.test.ts` - Main ETL pipeline integration tests covering complete data flow
2. `checkpoint.test.ts` - Checkpoint creation, resumption, and cleanup functionality
3. `transformer.test.ts` - Data transformation and enrichment tests

## Test Fixtures

Test data is stored in `tests/fixtures/files/` with the following structure:

```
tests/fixtures/files/
├── single-permit.txt          # Single permit for basic testing
├── empty.txt                  # Empty file handling
├── malformed.txt              # Completely unparseable file
├── malformed-sections.txt     # File with malformed sections
├── medium-permit-file.txt     # ~100 permits for performance testing
└── large-permit-file.txt      # ~100,000 permits for stress testing (generated)
```

## Key Integration Scenarios

### Pipeline Flow
- Complete ETL pipeline execution with real files
- Small, medium, and large file processing
- Performance and memory usage monitoring
- Error handling for malformed files
- QA gate integration
- Monitoring system integration

### Checkpoint System
- Checkpoint file creation during processing
- Periodic checkpoint updates
- Resumption from checkpoint
- Checkpoint retention policy enforcement
- Graceful handling of checkpoint corruption

### Data Transformation
- Permit data parsing and structuring
- Complex permit transformation handling
- Schema validation of transformed data
- Data enrichment with additional fields
- Consistency checks between raw and transformed data

## Configuration

Tests use the configuration defined in `tests/config/etl-test.config.ts`:

```typescript
export const ETL_TEST_CONFIG = {
  // Performance thresholds
  performance: {
    smallFileMaxTime: 5000,      // 5 seconds for 100 permits
    mediumFileMaxTime: 30000,    // 30 seconds for 10k permits
    largeFileMaxTime: 300000,    // 5 minutes for 100k permits
    maxMemoryMB: 512,
  },
  
  // Checkpoint settings
  checkpoint: {
    interval: 1000,              // Every 1000 records
    retention: 3,                // Keep last 3 checkpoints
  },
  
  // Batch settings
  batch: {
    size: 100,
    retryAttempts: 3,
  }
};
```

## Test Philosophy

Following the no-mocks principle, all tests use:
- Real file operations (no mocked filesystem)
- Actual ETL pipeline execution
- Real data transformations
- Genuine error conditions
- Deterministic test cases

## Performance Targets

- Small files (< 100 permits): < 5 seconds
- Medium files (~10k permits): < 30 seconds
- Large files (~100k permits): < 5 minutes
- Memory usage: < 512MB for any file size
- Checkpoint operations: < 100ms overhead

## Coverage Goals

- Pipeline stages: 100%
- Error handling paths: 100%
- Checkpoint functionality: 100%
- Memory management: 100%
- Performance requirements: 100%