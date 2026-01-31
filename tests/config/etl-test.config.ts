/**
 * ETL Test Configuration
 * 
 * Configuration settings specifically for ETL integration tests
 */

export const ETL_TEST_CONFIG = {
  // File paths
  inputDir: 'tests/fixtures/files',
  outputDir: 'tests/tmp/transformed',
  checkpointDir: 'tests/tmp/checkpoints',
  
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