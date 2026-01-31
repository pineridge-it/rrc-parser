/**
 * DataFreshnessService - Provides data freshness information for the UI
 */

import { DataFreshness, FreshnessStatus, ETLRunRecord } from './types';

export interface DataFreshnessServiceConfig {
  staleThresholdHours: number;
  criticalThresholdHours: number;
  databaseUrl?: string;
}

export const DEFAULT_FRESHNESS_CONFIG: DataFreshnessServiceConfig = {
  staleThresholdHours: 4,
  criticalThresholdHours: 24,
};

export class DataFreshnessService {
  private config: DataFreshnessServiceConfig;

  constructor(config: Partial<DataFreshnessServiceConfig> = {}) {
    this.config = { ...DEFAULT_FRESHNESS_CONFIG, ...config };
  }

  /**
   * Get the current data freshness status
   */
  async getDataFreshness(): Promise<DataFreshness> {
    try {
      // Query the database for the latest successful ETL run
      const latestRun = await this.queryLatestRun();
      
      if (!latestRun) {
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

      const hoursAgo = this.calculateHoursAgo(latestRun.completedAt || latestRun.startedAt);
      const status = this.determineStatus(hoursAgo);
      const message = this.getStatusMessage(status, hoursAgo);

      return {
        lastUpdated: latestRun.completedAt || latestRun.startedAt,
        hoursAgo,
        permitsNew: latestRun.permitsNew,
        permitsUpdated: latestRun.permitsUpdated,
        permitsProcessed: latestRun.permitsProcessed,
        status,
        message,
      };
    } catch (error) {
      return {
        lastUpdated: null,
        hoursAgo: null,
        permitsNew: 0,
        permitsUpdated: 0,
        permitsProcessed: 0,
        status: 'unknown',
        message: `Error checking freshness: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get freshness status for display in UI
   */
  getFreshnessDisplay(freshness: DataFreshness): {
    label: string;
    color: string;
    icon: string;
    tooltip: string;
  } {
    switch (freshness.status) {
      case 'fresh':
        return {
          label: 'Fresh',
          color: '#22c55e', // green-500
          icon: '✓',
          tooltip: `Data updated ${freshness.hoursAgo?.toFixed(1)} hours ago`,
        };
      case 'stale':
        return {
          label: 'Stale',
          color: '#eab308', // yellow-500
          icon: '⚠',
          tooltip: `Data is ${freshness.hoursAgo?.toFixed(1)} hours old. Expected update within 4 hours.`,
        };
      case 'critical':
        return {
          label: 'Critical',
          color: '#ef4444', // red-500
          icon: '✕',
          tooltip: `Data is ${freshness.hoursAgo?.toFixed(1)} hours old. Please check ETL pipeline.`,
        };
      case 'unknown':
      default:
        return {
          label: 'Unknown',
          color: '#6b7280', // gray-500
          icon: '?',
          tooltip: freshness.message || 'Unable to determine data freshness',
        };
    }
  }

  /**
   * Format the last updated time for display
   */
  formatLastUpdated(freshness: DataFreshness): string {
    if (!freshness.lastUpdated) {
      return 'Never';
    }

    const now = new Date();
    const diff = now.getTime() - freshness.lastUpdated.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ${minutes}m ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ago`;
    }
  }

  /**
   * Query the database for the latest successful ETL run
   * 
   * NOTE: This is a placeholder implementation. In production, this would
   * query the actual database using the configured database connection.
   */
  private async queryLatestRun(): Promise<ETLRunRecord | null> {
    // TODO: Implement actual database query
    // Example query:
    // SELECT * FROM etl_runs 
    // WHERE status = 'success' 
    // ORDER BY completed_at DESC 
    // LIMIT 1
    
    // For now, return null to indicate no data
    return null;
  }

  /**
   * Calculate hours ago from a given date
   */
  private calculateHoursAgo(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff / (1000 * 60 * 60);
  }

  /**
   * Determine freshness status based on hours ago
   */
  private determineStatus(hoursAgo: number): FreshnessStatus {
    if (hoursAgo < this.config.staleThresholdHours) {
      return 'fresh';
    } else if (hoursAgo < this.config.criticalThresholdHours) {
      return 'stale';
    } else {
      return 'critical';
    }
  }

  /**
   * Get a human-readable status message
   */
  private getStatusMessage(status: FreshnessStatus, hoursAgo: number): string {
    switch (status) {
      case 'fresh':
        return `Data is fresh (updated ${hoursAgo.toFixed(1)} hours ago)`;
      case 'stale':
        return `Data is stale (${hoursAgo.toFixed(1)} hours since last update)`;
      case 'critical':
        return `Data is critically stale (${hoursAgo.toFixed(1)} hours since last update)`;
      case 'unknown':
      default:
        return 'Data freshness status unknown';
    }
  }
}

// Export singleton instance
export const dataFreshnessService = new DataFreshnessService();
