/**
 * DataFreshnessIndicator - UI component for displaying data freshness status
 * 
 * Shows when data was last updated with color-coded status indicators:
 * - Green: Fresh (< 4 hours)
 * - Yellow: Stale (4-24 hours)
 * - Red: Critical (> 24 hours)
 */

import React, { useState, useEffect } from 'react';
import { DataFreshness, FreshnessStatus } from '../monitoring/types';
import { dataFreshnessService } from '../monitoring/DataFreshnessService';

export interface DataFreshnessIndicatorProps {
  /** Optional CSS class name */
  className?: string;
  /** Whether to show detailed information (permits processed, etc.) */
  showDetails?: boolean;
  /** Polling interval in milliseconds (default: 60000 = 1 minute) */
  pollInterval?: number;
}

interface FreshnessDisplayConfig {
  label: string;
  color: string;
  backgroundColor: string;
  icon: string;
}

const STATUS_CONFIG: Record<FreshnessStatus, FreshnessDisplayConfig> = {
  fresh: {
    label: 'Fresh',
    color: '#166534', // green-800
    backgroundColor: '#dcfce7', // green-100
    icon: '✓',
  },
  stale: {
    label: 'Stale',
    color: '#854d0e', // yellow-800
    backgroundColor: '#fef9c3', // yellow-100
    icon: '⚠',
  },
  critical: {
    label: 'Critical',
    color: '#991b1b', // red-800
    backgroundColor: '#fee2e2', // red-100
    icon: '✕',
  },
  unknown: {
    label: 'Unknown',
    color: '#374151', // gray-700
    backgroundColor: '#f3f4f6', // gray-100
    icon: '?',
  },
};

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  className = '',
  showDetails = false,
  pollInterval = 60000,
}) => {
  const [freshness, setFreshness] = useState<DataFreshness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFreshness = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataFreshnessService.getDataFreshness();
      setFreshness(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch freshness');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshness();
    
    // Set up polling
    const interval = setInterval(fetchFreshness, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  if (loading && !freshness) {
    return (
      <div className={`data-freshness-indicator ${className}`} style={styles.container}>
        <span style={styles.loading}>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`data-freshness-indicator ${className}`} style={styles.container}>
        <span style={styles.error} title={error}>Error</span>
      </div>
    );
  }

  if (!freshness) {
    return (
      <div className={`data-freshness-indicator ${className}`} style={styles.container}>
        <span style={styles.unknown}>No data</span>
      </div>
    );
  }

  const config = STATUS_CONFIG[freshness.status];
  const timeDisplay = dataFreshnessService.formatLastUpdated(freshness);

  return (
    <div 
      className={`data-freshness-indicator ${className}`} 
      style={{
        ...styles.container,
        backgroundColor: config.backgroundColor,
        borderColor: config.color,
      }}
      title={freshness.message}
    >
      <div style={styles.mainRow}>
        <span style={{ ...styles.icon, color: config.color }}>{config.icon}</span>
        <span style={{ ...styles.label, color: config.color }}>
          Data: {timeDisplay}
        </span>
        <span 
          style={{ 
            ...styles.statusBadge, 
            backgroundColor: config.color,
            color: '#fff',
          }}
        >
          {config.label}
        </span>
      </div>
      
      {showDetails && freshness.lastUpdated && (
        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Last updated:</span>
            <span>{freshness.lastUpdated.toLocaleString()}</span>
          </div>
          {freshness.hoursAgo !== null && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Hours ago:</span>
              <span>{freshness.hoursAgo.toFixed(1)}h</span>
            </div>
          )}
          {freshness.permitsNew > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>New permits:</span>
              <span>{freshness.permitsNew.toLocaleString()}</span>
            </div>
          )}
          {freshness.permitsUpdated > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Updated permits:</span>
              <span>{freshness.permitsUpdated.toLocaleString()}</span>
            </div>
          )}
          {freshness.permitsProcessed > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Total processed:</span>
              <span>{freshness.permitsProcessed.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Inline styles for simplicity (can be replaced with CSS classes)
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'inline-flex',
    flexDirection: 'column',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minWidth: '200px',
  },
  mainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  label: {
    flex: 1,
    fontWeight: 500,
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  details: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    fontSize: '12px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  detailLabel: {
    opacity: 0.7,
  },
  loading: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  error: {
    color: '#dc2626',
  },
  unknown: {
    color: '#6b7280',
  },
};

export default DataFreshnessIndicator;
