import { MetricsCollector } from '../../src/metrics/MetricsCollector';
import { BusinessMetricsCollector } from '../../src/metrics/BusinessMetrics';

describe('BusinessMetricsCollector', () => {
  let collector: MetricsCollector;
  let businessMetrics: BusinessMetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector({
      serviceName: 'test-service',
      serviceVersion: '1.0.0'
    });
    businessMetrics = new BusinessMetricsCollector(collector);
  });

  afterEach(() => {
    collector.clear();
  });

  describe('Permit metrics', () => {
    it('should record permit ingested', () => {
      businessMetrics.recordPermitIngested();

      const metric = collector.getMetric('permits_ingested_total') as any;
      expect(metric.values.length).toBe(1);
      expect(metric.values[0].value).toBe(1);
    });

    it('should record permit with all labels', () => {
      businessMetrics.recordPermitIngested('approved', 'Operator A', 'Midland', 'Oil');

      const statusMetric = collector.getMetric('permits_by_status') as any;
      expect(statusMetric.values[0].labels).toEqual({ status: 'approved' });

      const operatorMetric = collector.getMetric('permits_by_operator') as any;
      expect(operatorMetric.values[0].labels).toEqual({ operator: 'Operator A' });

      const countyMetric = collector.getMetric('permits_by_county') as any;
      expect(countyMetric.values[0].labels).toEqual({ county: 'Midland' });

      const wellTypeMetric = collector.getMetric('permits_by_well_type') as any;
      expect(wellTypeMetric.values[0].labels).toEqual({ well_type: 'Oil' });
    });
  });

  describe('Alert metrics', () => {
    it('should record alert triggered', () => {
      businessMetrics.recordAlertTriggered();

      const metric = collector.getMetric('alerts_triggered_total') as any;
      expect(metric.values.length).toBe(1);
    });

    it('should record alert delivered by channel', () => {
      businessMetrics.recordAlertDelivered('email');
      businessMetrics.recordAlertDelivered('sms');

      const totalMetric = collector.getMetric('alerts_delivered_total') as any;
      expect(totalMetric.values.length).toBe(2);

      const channelMetric = collector.getMetric('alerts_by_channel') as any;
      expect(channelMetric.values[0].labels).toEqual({ channel: 'email' });
      expect(channelMetric.values[1].labels).toEqual({ channel: 'sms' });
    });

    it('should record alert failed', () => {
      businessMetrics.recordAlertFailed();

      const metric = collector.getMetric('alerts_failed_total') as any;
      expect(metric.values.length).toBe(1);
    });
  });

  describe('User metrics', () => {
    it('should set active users', () => {
      businessMetrics.setActiveUsers(100);

      const metric = collector.getMetric('active_users') as any;
      expect(metric.values[0].value).toBe(100);
    });

    it('should set active workspaces', () => {
      businessMetrics.setActiveWorkspaces(25);

      const metric = collector.getMetric('active_workspaces') as any;
      expect(metric.values[0].value).toBe(25);
    });

    it('should set active alert rules', () => {
      businessMetrics.setActiveAlertRules(50);

      const metric = collector.getMetric('active_alert_rules') as any;
      expect(metric.values[0].value).toBe(50);
    });

    it('should record search', () => {
      businessMetrics.recordSearch('map');
      businessMetrics.recordSearch('list');

      const totalMetric = collector.getMetric('searches_performed') as any;
      expect(totalMetric.values.length).toBe(2);

      const typeMetric = collector.getMetric('searches_by_type') as any;
      expect(typeMetric.values[0].labels).toEqual({ type: 'map' });
      expect(typeMetric.values[1].labels).toEqual({ type: 'list' });
    });
  });

  describe('Export metrics', () => {
    it('should record export generated', () => {
      businessMetrics.recordExportGenerated('csv');
      businessMetrics.recordExportGenerated('json');

      const totalMetric = collector.getMetric('exports_generated_total') as any;
      expect(totalMetric.values.length).toBe(2);

      const formatMetric = collector.getMetric('exports_by_format') as any;
      expect(formatMetric.values[0].labels).toEqual({ format: 'csv' });
      expect(formatMetric.values[1].labels).toEqual({ format: 'json' });
    });
  });

  describe('API metrics', () => {
    it('should record API call', () => {
      businessMetrics.recordApiCall('/api/permits');

      const totalMetric = collector.getMetric('api_calls_total') as any;
      expect(totalMetric.values.length).toBe(1);

      const endpointMetric = collector.getMetric('api_calls_by_endpoint') as any;
      expect(endpointMetric.values[0].labels).toEqual({ endpoint: '/api/permits' });
    });

    it('should record API response size', () => {
      businessMetrics.recordApiResponseSize(1024);
      businessMetrics.recordApiResponseSize(2048);

      const metric = collector.getMetric('api_response_size_bytes') as any;
      expect(metric.count).toBe(2);
      expect(metric.sum).toBe(3072);
    });
  });
});
