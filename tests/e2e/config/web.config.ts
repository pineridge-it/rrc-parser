/**
 * Web E2E Test Configuration
 * 
 * Configuration settings specifically for web application E2E tests
 */

export const WEB_E2E_CONFIG = {
  // Test environment
  baseUrl: process.env.WEB_TEST_URL || 'http://localhost:3000',
  
  // Authentication
  testUser: {
    email: process.env.WEB_TEST_USER_EMAIL || 'test@example.com',
    password: process.env.WEB_TEST_USER_PASSWORD || 'testpass123',
  },
  
  // Timeouts
  pageLoadTimeout: 30000,
  actionTimeout: 10000,
  
  // Test data
  testPermits: 100,
  testAlerts: 10
};