/**
 * Database Test Configuration
 * 
 * Configuration settings specifically for database integration tests
 */

export const DB_TEST_CONFIG = {
  // Database connection
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/rrc_test',
  
  // Test isolation
  isolationStrategy: 'transaction', // 'transaction', 'truncate', or 'template'
  
  // Cleanup
  cleanupAfterEach: true,
  
  // Timeout settings
  containerStartupTimeout: 60000, // 60 seconds
  queryTimeout: 30000, // 30 seconds
  
  // Test data
  seed: {
    permitCount: 100,
    workspaceCount: 5,
    userCount: 20
  }
};