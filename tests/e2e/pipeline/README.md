# E2E Pipeline Tests

This directory contains comprehensive end-to-end tests for the complete ETL pipeline, verifying the entire data flow from RRC source files through to the database with real operations.

## Test Structure

The tests are organized into several categories:

1. `complete-ingestion.test.ts` - Complete ingestion flow tests covering small, medium, and large file processing
2. `error-recovery.test.ts` - Error recovery scenarios including malformed files and resource exhaustion
3. `performance.test.ts` - Performance benchmarks and throughput consistency tests
4. `concurrent.test.ts` - Concurrent processing and duplicate handling tests

## Test Fixtures

Test data is stored in `tests/e2e/fixtures/pipeline/` with the following structure:

```
tests/e2e/fixtures/pipeline/
├── small-1k.txt          # 1,000 permits - quick smoke test
├── medium-10k.txt        # 10,000 permits - standard test
├── large-100k.txt        # 100,000 permits - performance test
├── with-errors-10k.txt   # 10k with 10% errors
├── malformed.txt         # Completely unparseable
└── empty.txt             # Edge case
```

## Key E2E Scenarios

### Complete Ingestion Flow
- Small file processing (< 30 seconds for 1k permits)
- Medium file processing (< 3 minutes for 10k permits)
- Large file processing (< 10 minutes for 100k permits)
- Data integrity verification through the entire pipeline
- Memory usage monitoring (< 512MB peak heap)

### Error Recovery
- Malformed file handling
- Checkpoint resumption after interruption
- Corrupted checkpoint recovery
- Resource exhaustion handling (memory, disk)
- Graceful degradation under stress

### Performance Benchmarks
- Processing time verification for all file sizes
- Memory usage consistency
- Throughput measurement and consistency
- Linear scaling verification with file size
- Concurrent processing performance

### Concurrent Processing
- Multiple pipeline execution simultaneously
- Resource contention prevention
- Duplicate processing detection
- Load distribution across concurrent pipelines
- Data consistency with concurrent operations

## Configuration

Tests use the configuration defined in `tests/e2e/config/pipeline.config.ts`:

```typescript
export const E2E_PIPELINE_CONFIG = {
  // Performance thresholds
  performance: {
    smallFileTimeout: 30000,     // 30 seconds for 1k permits
    mediumFileTimeout: 180000,   // 3 minutes for 10k permits
    largeFileTimeout: 600000,    // 10 minutes for 100k permits
    maxMemoryMB: 512,
  },
  
  // Database settings for verification
  database: {
    connectionRetries: 3,
    queryTimeout: 30000,
  },
  
  // Concurrent processing settings
  concurrency: {
    maxConcurrentPipelines: 3,
    pipelineDelayMs: 1000,
  }
};
```

## Test Philosophy

Following the production-like data principle, all tests use:
- Real file operations (no mocked filesystem)
- Actual ETL pipeline execution
- Genuine error conditions
- Real resource constraints
- Deterministic test cases with verifiable outcomes

## Performance Targets

| Metric | Threshold | Notes |
|--------|-----------|-------|
| 1k permits | < 30 seconds | Smoke test |
| 10k permits | < 3 minutes | Standard batch |
| 100k permits | < 10 minutes | Large batch |
| Memory usage | < 512 MB | Peak heap |
| Concurrent pipelines | 3 simultaneous | Resource sharing |

## Coverage Goals

- End-to-end data integrity: 100%
- Error recovery scenarios: 100%
- Performance benchmarks: 100%
- Concurrent processing: 100%
- Resource management: 100%