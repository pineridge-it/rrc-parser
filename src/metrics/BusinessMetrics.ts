import { MetricsCollector, getMetricsCollector } from './MetricsCollector';

/**
 * Business metrics for tracking KPIs and user activity
 */
export class BusinessMetricsCollector {
  private collector: MetricsCollector;

  constructor(collector?: MetricsCollector) {
    this.collector = collector || getMetricsCollector();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Permit metrics
    this.collector.counter('permits_ingested_total', 'Total number of permits ingested');
    this.collector.counter('permits_by_status', 'Permits ingested by status');
    this.collector.counter('permits_by_operator', 'Permits ingested by operator');
    this.collector.counter('permits_by_county', 'Permits ingested by county');
    this.collector.counter('permits_by_well_type', 'Permits ingested by well type');

    // Alert metrics
    this.collector.counter('alerts_triggered_total', 'Total number of alerts triggered');
    this.collector.counter('alerts_delivered_total', 'Total number of alerts delivered');
    this.collector.counter('alerts_failed_total', 'Total number of failed alert deliveries');
    this.collector.counter('alerts_by_channel', 'Alerts delivered by channel (sms, email, in-app)');

    // User metrics
    this.collector.gauge('active_users', 'Number of currently active users');
    this.collector.gauge('active_workspaces', 'Number of active workspaces');
    this.collector.gauge('active_alert_rules', 'Number of active alert rules');
    this.collector.counter('searches_performed', 'Total number of searches performed');
    this.collector.counter('searches_by_type', 'Searches by type (map, list, api)');

    // Export metrics
    this.collector.counter('exports_generated_total', 'Total number of data exports');
    this.collector.counter('exports_by_format', 'Exports by format (csv, json, xlsx)');

    // API usage metrics
    this.collector.counter('api_calls_total', 'Total API calls');
    this.collector.counter('api_calls_by_endpoint', 'API calls by endpoint');
    this.collector.histogram('api_response_size_bytes', 'API response size in bytes');
  }

  // Permit metrics
  recordPermitIngested(status?: string, operator?: string, county?: string, wellType?: string): void {
    this.collector.inc('permits_ingested_total');
    if (status) {
      this.collector.inc('permits_by_status', 1, { status });
    }
    if (operator) {
      this.collector.inc('permits_by_operator', 1, { operator });
    }
    if (county) {
      this.collector.inc('permits_by_county', 1, { county });
    }
    if (wellType) {
      this.collector.inc('permits_by_well_type', 1, { well_type: wellType });
    }
  }

  // Alert metrics
  recordAlertTriggered(): void {
    this.collector.inc('alerts_triggered_total');
  }

  recordAlertDelivered(channel: 'sms' | 'email' | 'in-app'): void {
    this.collector.inc('alerts_delivered_total');
    this.collector.inc('alerts_by_channel', 1, { channel });
  }

  recordAlertFailed(): void {
    this.collector.inc('alerts_failed_total');
  }

  // User metrics
  setActiveUsers(count: number): void {
    this.collector.set('active_users', count);
  }

  setActiveWorkspaces(count: number): void {
    this.collector.set('active_workspaces', count);
  }

  setActiveAlertRules(count: number): void {
    this.collector.set('active_alert_rules', count);
  }

  recordSearch(searchType: 'map' | 'list' | 'api'): void {
    this.collector.inc('searches_performed');
    this.collector.inc('searches_by_type', 1, { type: searchType });
  }

  // Export metrics
  recordExportGenerated(format: 'csv' | 'json' | 'xlsx'): void {
    this.collector.inc('exports_generated_total');
    this.collector.inc('exports_by_format', 1, { format });
  }

  // API metrics
  recordApiCall(endpoint: string): void {
    this.collector.inc('api_calls_total');
    this.collector.inc('api_calls_by_endpoint', 1, { endpoint });
  }

  recordApiResponseSize(bytes: number): void {
    this.collector.observe('api_response_size_bytes', bytes);
  }
}

/**
 * Singleton instance
 */
let businessMetrics: BusinessMetricsCollector | null = null;

export function initializeBusinessMetrics(collector?: MetricsCollector): BusinessMetricsCollector {
  businessMetrics = new BusinessMetricsCollector(collector);
  return businessMetrics;
}

export function getBusinessMetrics(): BusinessMetricsCollector {
  if (!businessMetrics) {
    businessMetrics = new BusinessMetricsCollector();
  }
  return businessMetrics;
}
