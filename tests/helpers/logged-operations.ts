/**
 * Logged Operations
 * 
 * Provides wrapped versions of common operations that automatically log
 * their execution time, success/failure, and context.
 */

import { logger, TestLogger } from './logger';
import * as fs from 'fs';

const testLogger = TestLogger.getInstance();

interface PipelineContext {
  filePath?: string;
  recordCount?: number;
  phase?: string;
  [key: string]: unknown;
}

/**
 * Wrap an operation with logging
 */
export async function loggedOperation<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  testLogger.logPhase('execute', `${name}_start`, context);

  try {
    const result = await operation();
    const duration = Date.now() - start;
    testLogger.logPerformance(name, duration, { success: true, ...context });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    testLogger.logError(name, error as Error, { duration, ...context });
    throw error;
  }
}

/**
 * Wrap a synchronous operation with logging
 */
export function loggedOperationSync<T>(
  name: string,
  operation: () => T,
  context?: Record<string, unknown>
): T {
  const start = Date.now();
  testLogger.logPhase('execute', `${name}_start`, context);

  try {
    const result = operation();
    const duration = Date.now() - start;
    testLogger.logPerformance(name, duration, { success: true, ...context });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    testLogger.logError(name, error as Error, { duration, ...context });
    throw error;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Execute a database query with logging
 */
export async function loggedQuery<T>(
  client: { query: (sql: string, params?: unknown[]) => Promise<T> },
  sql: string,
  params?: unknown[]
): Promise<T> {
  return loggedOperation(
    'database_query',
    () => client.query(sql, params),
    {
      sql: sql.substring(0, 100), // Truncate long SQL
      paramCount: params?.length,
    }
  );
}

/**
 * Execute a database insert with logging
 */
export async function loggedInsert<T>(
  client: { query: (sql: string, params?: unknown[]) => Promise<T> },
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  return loggedOperation(
    'database_insert',
    () => {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
      return client.query(sql, Object.values(data));
    },
    { table, fieldCount: Object.keys(data).length }
  );
}

/**
 * Execute a batch database insert with logging
 */
export async function loggedBatchInsert<T>(
  client: { query: (sql: string, params?: unknown[]) => Promise<T> },
  table: string,
  records: Record<string, unknown>[],
  batchSize: number = 1000
): Promise<T[]> {
  return loggedOperation(
    'database_batch_insert',
    async () => {
      const results: T[] = [];
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]).join(', ');
        const values = batch.map((_, rowIndex) => {
          const placeholders = Object.keys(batch[0]).map((_, colIndex) =>
            `$${rowIndex * Object.keys(batch[0]).length + colIndex + 1}`
          ).join(', ');
          return `(${placeholders})`;
        }).join(', ');
        
        const sql = `INSERT INTO ${table} (${columns}) VALUES ${values} RETURNING *`;
        const params = batch.flatMap(record => Object.values(record));
        const result = await client.query(sql, params);
        results.push(result as T);
      }
      return results;
    },
    { table, recordCount: records.length, batchSize }
  );
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Read a file with logging
 */
export async function loggedFileRead(path: string): Promise<string> {
  return loggedOperation(
    'file_read',
    () => fs.promises.readFile(path, 'utf-8'),
    { path, operation: 'read' }
  );
}

/**
 * Write a file with logging
 */
export async function loggedFileWrite(path: string, content: string): Promise<void> {
  return loggedOperation(
    'file_write',
    () => fs.promises.writeFile(path, content, 'utf-8'),
    { path, contentLength: content.length, operation: 'write' }
  );
}

/**
 * Delete a file with logging
 */
export async function loggedFileDelete(path: string): Promise<void> {
  return loggedOperation(
    'file_delete',
    () => fs.promises.unlink(path),
    { path, operation: 'delete' }
  );
}

/**
 * Check if file exists with logging
 */
export async function loggedFileExists(path: string): Promise<boolean> {
  return loggedOperation(
    'file_exists',
    async () => {
      try {
        await fs.promises.access(path);
        return true;
      } catch {
        return false;
      }
    },
    { path }
  );
}

/**
 * Create directory with logging
 */
export async function loggedMkdir(path: string, recursive: boolean = true): Promise<void> {
  await loggedOperation(
    'directory_create',
    () => fs.promises.mkdir(path, { recursive }),
    { path, recursive }
  );
}

/**
 * Read directory with logging
 */
export async function loggedReaddir(path: string): Promise<string[]> {
  return loggedOperation(
    'directory_read',
    () => fs.promises.readdir(path),
    { path }
  );
}

// ============================================================================
// HTTP Operations
// ============================================================================

/**
 * Make an HTTP request with logging
 */
export async function loggedHttpRequest(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return loggedOperation(
    'http_request',
    () => fetch(url, options),
    {
      url,
      method: options?.method || 'GET',
      hasBody: !!options?.body,
    }
  );
}

/**
 * Make an HTTP GET request with logging
 */
export async function loggedHttpGet(url: string, headers?: Record<string, string>): Promise<Response> {
  return loggedHttpRequest(url, { method: 'GET', headers });
}

/**
 * Make an HTTP POST request with logging
 */
export async function loggedHttpPost(
  url: string,
  body: unknown,
  headers?: Record<string, string>
): Promise<Response> {
  return loggedHttpRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Pipeline Operations
// ============================================================================

/**
 * Log pipeline phase start
 */
export function logPipelineStart(phase: string, context: PipelineContext): void {
  testLogger.logPhase('execute', `${phase}_start`, context);
}

/**
 * Log pipeline phase completion
 */
export function logPipelineComplete(phase: string, durationMs: number, context: PipelineContext): void {
  testLogger.logPerformance(phase, durationMs, { ...context, completed: true });
}

/**
 * Log pipeline error
 */
export function logPipelineError(phase: string, error: Error, context: PipelineContext): void {
  testLogger.logError(phase, error, context);
}

// ============================================================================
// Timing Utilities
// ============================================================================

/**
 * Time an operation and log the result
 */
export async function timeOperation<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return loggedOperation(name, operation, context);
}

/**
 * Time a synchronous operation and log the result
 */
export function timeOperationSync<T>(
  name: string,
  operation: () => T,
  context?: Record<string, unknown>
): T {
  return loggedOperationSync(name, operation, context);
}

/**
 * Create a timer that logs when stopped
 */
export function createTimer(name: string, context?: Record<string, unknown>): () => void {
  const start = Date.now();
  testLogger.logPhase('execute', `${name}_start`, context);

  return () => {
    const duration = Date.now() - start;
    testLogger.logPerformance(name, duration, { ...context, completed: true });
  };
}
