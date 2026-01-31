/**
 * E2E Pipeline Test Configuration
 * 
 * Configuration settings specifically for E2E pipeline tests
 */

export const E2E_PIPELINE_CONFIG = {
  // Test file paths
  fixturesDir: 'tests/e2e/fixtures/pipeline',
  
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