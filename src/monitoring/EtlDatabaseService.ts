/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import type { Pool } from 'pg';
import {
  ETLRunRecord,
  DataFreshness,
  Alert,
} from './types';

// Dynamic import for pg to avoid hard dependency
let PoolClass: typeof Pool | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pg = require('pg');
  PoolClass = pg.Pool;
} catch {
  // pg not installed, will throw error when trying to use
}

export interface EtlDatabaseConfig {
  connectionString: string;
}

export class EtlDatabaseService {
  private pool: InstanceType<typeof Pool> | null;

  constructor(config: EtlDatabaseConfig) {
    if (!PoolClass) {
      throw new Error('pg module not installed. Run: npm install pg');
    }
    this.pool = new PoolClass({
      connectionString: config.connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Get the pool instance, throwing if not initialized
   */
  private getPool(): NonNullable<typeof this.pool> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return this.pool;
  }

  /**
   * Create a new ETL run record
   */
  async createRun(run: Omit<ETLRunRecord, 'id' | 'durationMs'>): Promise<ETLRunRecord> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query(
        `INSERT INTO etl_runs (
          run_type, status, started_at, completed_at,
          permits_processed, permits_new, permits_updated, permits_failed,
          source_files, error_message, error_stack
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          run.runType,
          run.status,
          run.startedAt,
          run.completedAt,
          run.permitsProcessed,
          run.permitsNew,
          run.permitsUpdated,
          run.permitsFailed,
          run.sourceFiles,
          run.errorMessage,
          run.errorStack
        ]
      );
      
      return this.mapRowToETLRunRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing ETL run record
   */
  async updateRun(id: string, updates: Partial<ETLRunRecord>): Promise<ETLRunRecord | null> {
    const client = await this.getPool().connect();
    try {
      const fields = [];
      const values = [];
      let index = 1;
      
      // Build dynamic update query
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id') {
          fields.push(`${this.camelToSnake(key)} = $${index}`);
          values.push(value);
          index++;
        }
      }
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      values.push(id); // Add id for WHERE clause
      
      const query = `
        UPDATE etl_runs 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${index}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToETLRunRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Get the latest successful ETL run
   */
  async getLatestSuccessfulRun(): Promise<ETLRunRecord | null> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query(
        `SELECT * FROM etl_runs 
         WHERE status = 'success' 
         ORDER BY completed_at DESC 
         LIMIT 1`
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToETLRunRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Get recent ETL runs for dashboard
   */
  async getRecentRuns(limit: number = 50): Promise<ETLRunRecord[]> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query(
        `SELECT * FROM etl_runs 
         ORDER BY started_at DESC 
         LIMIT $1`,
        [limit]
      );
      
      return result.rows.map((row: Record<string, unknown>) => this.mapRowToETLRunRecord(row));
    } finally {
      client.release();
    }
  }

  /**
   * Get data freshness information
   */
  async getDataFreshness(): Promise<DataFreshness> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query(
        `SELECT * FROM data_freshness_status`
      );
      
      if (result.rows.length === 0) {
        return {
          lastUpdated: null,
          hoursAgo: null,
          permitsNew: 0,
          permitsUpdated: 0,
          permitsProcessed: 0,
          status: 'unknown',
          message: 'No ETL runs recorded yet',
        };
      }
      
      const row = result.rows[0];
      return {
        lastUpdated: row.last_updated,
        hoursAgo: row.hours_ago,
        permitsNew: row.permits_new,
        permitsUpdated: row.permits_updated,
        permitsProcessed: row.permits_processed,
        status: row.freshness_status,
        message: this.getStatusMessage(row.freshness_status, row.hours_ago),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create a new alert
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'triggeredAt'>): Promise<Alert> {
    const client = await this.getPool().connect();
    try {
      const triggeredAt = new Date();
      const result = await client.query(
        `INSERT INTO alerts (
          severity, metric, current_value, threshold, message, triggered_at, acknowledged
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          alertData.severity,
          alertData.metric,
          alertData.currentValue,
          alertData.threshold,
          alertData.message,
          triggeredAt,
          alertData.acknowledged ?? false,
        ]
      );

      return this.mapRowToAlert(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query(
        `SELECT * FROM alert_events 
         WHERE status IN ('pending', 'processing')
         ORDER BY created_at DESC 
         LIMIT 50`
      );

      return result.rows.map((row: Record<string, unknown>) => this.mapRowToAlert(row));
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.getPool().end();
  }

  /**
   * Helper method to convert database row to ETLRunRecord
   */
  private mapRowToETLRunRecord(row: Record<string, unknown>): ETLRunRecord {
    return {
      id: row.id as string,
      runType: row.run_type as ETLRunRecord['runType'],
      status: row.status as ETLRunRecord['status'],
      startedAt: row.started_at as Date,
      completedAt: row.completed_at as Date | undefined,
      permitsProcessed: row.permits_processed as number,
      permitsNew: row.permits_new as number,
      permitsUpdated: row.permits_updated as number,
      permitsFailed: row.permits_failed as number,
      sourceFiles: row.source_files as string[] | undefined,
      errorMessage: row.error_message as string | undefined,
      errorStack: row.error_stack as string | undefined,
      durationMs: row.duration_ms as number | undefined,
    };
  }

  /**
   * Helper method to convert database row to Alert
   */
  private mapRowToAlert(row: Record<string, unknown>): Alert {
    return {
      id: row.id as string,
      severity: (row.severity as Alert['severity']) || 'info',
      metric: (row.metric as string) || 'unknown',
      currentValue: (row.current_value as number) || 0,
      threshold: (row.threshold as number) || 0,
      message: (row.message as string) || 'Alert triggered',
      triggeredAt: new Date(row.triggered_at as string),
      acknowledged: (row.acknowledged as boolean) || false,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
    };
  }

  /**
   * Helper method to convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Helper method to get status message
   */
  private getStatusMessage(status: string, hoursAgo: number): string {
    switch (status) {
      case 'fresh':
        return `Data is fresh (updated ${hoursAgo.toFixed(1)} hours ago)`;
      case 'stale':
        return `Data is stale (${hoursAgo.toFixed(1)} hours since last update)`;
      case 'critical':
        return `Data is critically stale (${hoursAgo.toFixed(1)} hours since last update)`;
      default:
        return 'Data freshness status unknown';
    }
  }
}