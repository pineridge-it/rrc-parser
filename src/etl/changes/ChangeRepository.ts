import { createLogger } from '../../services/logger';
import { PermitChange, ChangeType, UnprocessedChangesQuery } from './types';

const logger = createLogger({ name: 'ChangeRepository' });

/**
 * Repository for permit change persistence operations
 */
export class ChangeRepository {
  private db: any; // Database client

  constructor(dbClient: any) {
    this.db = dbClient;
    logger.info('ChangeRepository initialized');
  }

  /**
   * Saves a permit change to the database
   * @param change - The permit change to save
   * @returns The saved change with ID
   */
  async save(change: PermitChange): Promise<PermitChange> {
    try {
      const query = `
        INSERT INTO permit_changes (
          permit_id, change_type, previous_value, new_value,
          detected_at, etl_run_id, processed_for_alerts, alert_event_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
      `;

      const values = [
        change.permitId,
        change.changeType,
        change.previousValue ? JSON.stringify(change.previousValue) : null,
        JSON.stringify(change.newValue),
        change.detectedAt,
        change.etlRunId || null,
        change.processedForAlerts,
        change.alertEventId || null,
      ];

      const result = await this.db.query(query, values);
      const saved = result.rows[0];

      logger.debug('Saved permit change', {
        changeId: saved.id,
        permitId: change.permitId,
        changeType: change.changeType,
      });

      return {
        ...change,
        id: saved.id,
        createdAt: saved.created_at,
      };
    } catch (error) {
      logger.error('Failed to save permit change', {
        error: error instanceof Error ? error.message : String(error),
        permitId: change.permitId,
        changeType: change.changeType,
      });
      throw error;
    }
  }

  /**
   * Saves multiple permit changes in a batch
   * @param changes - Array of permit changes to save
   * @returns Array of saved changes
   */
  async saveBatch(changes: PermitChange[]): Promise<PermitChange[]> {
    if (changes.length === 0) {
      return [];
    }

    const saved: PermitChange[] = [];

    // Use transaction for batch insert
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      for (const change of changes) {
        const query = `
          INSERT INTO permit_changes (
            permit_id, change_type, previous_value, new_value,
            detected_at, etl_run_id, processed_for_alerts, alert_event_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, created_at
        `;

        const values = [
          change.permitId,
          change.changeType,
          change.previousValue ? JSON.stringify(change.previousValue) : null,
          JSON.stringify(change.newValue),
          change.detectedAt,
          change.etlRunId || null,
          change.processedForAlerts,
          change.alertEventId || null,
        ];

        const result = await client.query(query, values);
        const row = result.rows[0];

        saved.push({
          ...change,
          id: row.id,
          createdAt: row.created_at,
        });
      }

      await client.query('COMMIT');

      logger.info('Saved batch of permit changes', {
        count: saved.length,
      });

      return saved;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to save batch of permit changes', {
        error: error instanceof Error ? error.message : String(error),
        count: changes.length,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Gets unprocessed changes for alert generation
   * @param query - Query options
   * @returns Array of unprocessed changes
   */
  async getUnprocessed(query: UnprocessedChangesQuery = {}): Promise<PermitChange[]> {
    try {
      const conditions: string[] = ['processed_for_alerts = false'];
      const values: (string | number | Date)[] = [];
      let paramIndex = 1;

      if (query.changeTypes && query.changeTypes.length > 0) {
        const typePlaceholders = query.changeTypes
          .map((_, i) => `$${paramIndex + i}`)
          .join(', ');
        conditions.push(`change_type IN (${typePlaceholders})`);
        values.push(...query.changeTypes);
        paramIndex += query.changeTypes.length;
      }

      if (query.since) {
        conditions.push(`detected_at >= $${paramIndex}`);
        values.push(query.since);
        paramIndex++;
      }

      const limit = query.limit || 1000;
      values.push(limit);

      const sqlQuery = `
        SELECT 
          id, permit_id, change_type, previous_value, new_value,
          detected_at, etl_run_id, processed_for_alerts, alert_event_id, created_at
        FROM permit_changes
        WHERE ${conditions.join(' AND ')}
        ORDER BY detected_at ASC
        LIMIT $${paramIndex}
      `;

      const result = await this.db.query(sqlQuery, values);

      return result.rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        permitId: row.permit_id as string,
        changeType: row.change_type as ChangeType,
        previousValue: row.previous_value as Record<string, unknown> | null,
        newValue: row.new_value as Record<string, unknown>,
        detectedAt: new Date(row.detected_at as string),
        etlRunId: row.etl_run_id as string | undefined,
        processedForAlerts: row.processed_for_alerts as boolean,
        alertEventId: row.alert_event_id as string | undefined,
        createdAt: new Date(row.created_at as string),
      }));
    } catch (error) {
      logger.error('Failed to get unprocessed changes', {
        error: error instanceof Error ? error.message : String(error),
        query,
      });
      throw error;
    }
  }

  /**
   * Marks changes as processed for alerts
   * @param changeIds - Array of change IDs to mark
   * @param alertEventId - The ID of the generated alert event
   */
  async markProcessed(changeIds: string[], alertEventId?: string): Promise<void> {
    if (changeIds.length === 0) {
      return;
    }

    try {
      const placeholders = changeIds.map((_, i) => `$${i + 2}`).join(', ');
      const query = `
        UPDATE permit_changes
        SET processed_for_alerts = true,
            alert_event_id = $1
        WHERE id IN (${placeholders})
      `;

      await this.db.query(query, [alertEventId || null, ...changeIds]);

      logger.debug('Marked changes as processed', {
        count: changeIds.length,
        alertEventId,
      });
    } catch (error) {
      logger.error('Failed to mark changes as processed', {
        error: error instanceof Error ? error.message : String(error),
        count: changeIds.length,
      });
      throw error;
    }
  }

  /**
   * Gets changes for a specific permit
   * @param permitId - The permit ID
   * @param limit - Maximum number of changes to return
   * @returns Array of changes for the permit
   */
  async getChangesForPermit(
    permitId: string,
    limit: number = 100
  ): Promise<PermitChange[]> {
    try {
      const query = `
        SELECT 
          id, permit_id, change_type, previous_value, new_value,
          detected_at, etl_run_id, processed_for_alerts, alert_event_id, created_at
        FROM permit_changes
        WHERE permit_id = $1
        ORDER BY detected_at DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [permitId, limit]);

      return result.rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        permitId: row.permit_id as string,
        changeType: row.change_type as ChangeType,
        previousValue: row.previous_value as Record<string, unknown> | null,
        newValue: row.new_value as Record<string, unknown>,
        detectedAt: new Date(row.detected_at as string),
        etlRunId: row.etl_run_id as string | undefined,
        processedForAlerts: row.processed_for_alerts as boolean,
        alertEventId: row.alert_event_id as string | undefined,
        createdAt: new Date(row.created_at as string),
      }));
    } catch (error) {
      logger.error('Failed to get changes for permit', {
        error: error instanceof Error ? error.message : String(error),
        permitId,
      });
      throw error;
    }
  }

  /**
   * Gets change statistics for a time period
   * @param startDate - Start of period
   * @param endDate - End of period
   * @returns Statistics by change type
   */
  async getStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<Record<ChangeType | 'total', number>> {
    try {
      const query = `
        SELECT 
          change_type,
          COUNT(*) as count
        FROM permit_changes
        WHERE detected_at >= $1 AND detected_at < $2
        GROUP BY change_type
      `;

      const result = await this.db.query(query, [startDate, endDate]);

      const stats: Record<string, number> = {
        new: 0,
        status_change: 0,
        amendment: 0,
        operator_change: 0,
        location_update: 0,
        total: 0,
      };

      for (const row of result.rows) {
        const type = row.change_type as string;
        const count = parseInt(row.count as string, 10);
        stats[type] = count;
        stats.total += count;
      }

      return stats as Record<ChangeType | 'total', number>;
    } catch (error) {
      logger.error('Failed to get change statistics', {
        error: error instanceof Error ? error.message : String(error),
        startDate,
        endDate,
      });
      throw error;
    }
  }
}

/**
 * Factory function to create a ChangeRepository instance
 */
export function createChangeRepository(dbClient: any): ChangeRepository {
  return new ChangeRepository(dbClient);
}
