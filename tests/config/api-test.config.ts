/**
 * API Test Configuration
 * 
 * Configuration settings specifically for RRC API integration tests
 */

export const API_TEST_CONFIG = {
  // RRC API endpoints
  baseUrl: process.env.RRC_TEST_API_URL || 'https://mft.rrc.texas.gov',
  
  // Authentication (test credentials)
  auth: {
    username: process.env.RRC_TEST_USER || 'test_user',
    password: process.env.RRC_TEST_PASS || 'test_pass',
  },
  
  // Rate limiting (conservative for testing)
  rateLimit: {
    requestsPerMinute: 10,
    burstAllowance: 2,
  },
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
  
  // Timeouts
  timeout: {
    connect: 10000,    // 10 seconds
    read: 60000,       // 60 seconds
    download: 300000,  // 5 minutes for large files
  },
  
  // Test files (small, for quick tests)
  testFiles: [
    { id: 'test-small', size: '10KB', permits: 10 },
    { id: 'test-medium', size: '1MB', permits: 500 },
  ]
};