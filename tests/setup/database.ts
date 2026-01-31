/**
 * Database Test Setup
 * 
 * Setup and teardown for database integration tests
 */

import { TestDatabase } from '../helpers/testcontainers';
import { DatabaseHelper } from '../helpers/db-helper';
import { DB_TEST_CONFIG } from '../config/db-test.config';

let testDatabase: TestDatabase;

/**
 * Setup database before all tests
 */
beforeAll(async () => {
  testDatabase = new TestDatabase();
  await testDatabase.start();
  
  // Set connection string for tests
  process.env.TEST_DATABASE_URL = testDatabase.getConnectionString();
}, DB_TEST_CONFIG.containerStartupTimeout);

/**
 * Teardown database after all tests
 */
afterAll(async () => {
  await testDatabase.stop();
});

/**
 * Clean database before each test
 */
beforeEach(async () => {
  // Clean database before each test
  const helper = new DatabaseHelper();
  await helper.cleanDatabase();
});

/**
 * Get the test database instance
 */
export function getTestDatabase(): TestDatabase {
  return testDatabase;
}