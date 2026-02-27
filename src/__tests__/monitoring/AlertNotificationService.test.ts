/**
 * Tests for AlertNotificationService
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  AlertNotificationService,
  ConsoleChannel,
  EmailChannel,
  SlackChannel,
  PagerDutyChannel,
  DEFAULT_NOTIFICATION_CONFIG
} from '../../monitoring/AlertNotificationService';
import type { Alert } from '../../monitoring/types';

describe('AlertNotificationService', () => {
  let service: AlertNotificationService;

  beforeEach(() => {
    service = new AlertNotificationService();
  });

  const createTestAlert = (severity: 'info' | 'warning' | 'critical' = 'warning'): Alert => ({
    id: 'test-alert-1',
    severity,
    metric: 'error_rate',
    currentValue: 15,
    threshold: 10,
    message: 'Error rate exceeded threshold',
    triggeredAt: new Date(),
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(service.getChannels()).toContain('console');
    });

    it('should initialize with custom config', () => {
      const customService = new AlertNotificationService({
        minSeverity: 'critical',
        throttleMinutes: 10,
        enabledChannels: ['console']
      });
      
      expect(customService.getChannels()).toContain('console');
    });
  });

  describe('sendAlert', () => {
    it('should send alert through console channel', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await service.sendAlert(createTestAlert());
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARNING]')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not send alerts below minSeverity', async () => {
      const criticalService = new AlertNotificationService({
        minSeverity: 'critical',
        enabledChannels: ['console']
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Warning alert should not be sent
      await criticalService.sendAlert(createTestAlert('warning'));
      
      // Should not log anything for throttled/ignored alerts
      consoleSpy.mockRestore();
    });

    it('should send critical alerts when minSeverity is critical', async () => {
      const criticalService = new AlertNotificationService({
        minSeverity: 'critical',
        enabledChannels: ['console']
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await criticalService.sendAlert(createTestAlert('critical'));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL]')
      );
      
      consoleSpy.mockRestore();
    });

    it('should throttle duplicate alerts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const alert = createTestAlert();
      
      // First alert should be sent
      await service.sendAlert(alert);
      
      // Second alert with same metric should be throttled
      await service.sendAlert({ ...alert, id: 'test-alert-2' });
      
      // Should only see the first alert and throttling message
      const alertCalls = consoleSpy.mock.calls.filter(
        call => call[0] && typeof call[0] === 'string' && call[0].includes('[WARNING]')
      );
      expect(alertCalls).toHaveLength(1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('channel management', () => {
    it('should add custom channel', () => {
      const customChannel = {
        name: 'custom',
        enabled: true,
        send: async () => true
      };
      
      service.addChannel(customChannel);
      
      expect(service.getChannels()).toContain('custom');
    });

    it('should enable/disable channels', () => {
      service.setChannelEnabled('console', false);
      
      // Channel still exists but is disabled
      expect(service.getChannels()).toContain('console');
    });
  });
});

describe('ConsoleChannel', () => {
  it('should send alert to console', async () => {
    const channel = new ConsoleChannel();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const alert: Alert = {
      id: 'test-1',
      severity: 'warning',
      metric: 'error_rate',
      currentValue: 15,
      threshold: 10,
      message: 'Test alert',
      triggeredAt: new Date(),
    };
    
    const result = await channel.send(alert);
    
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test alert')
    );
    
    consoleSpy.mockRestore();
  });

  it('should use correct icons for different severities', async () => {
    const channel = new ConsoleChannel();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    await channel.send({
      id: 'test-1',
      severity: 'critical',
      metric: 'test',
      currentValue: 1,
      threshold: 0,
      message: 'Critical',
      triggeredAt: new Date(),
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🔴')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('EmailChannel', () => {
  it('should log email notification', async () => {
    const config = {
      smtpHost: 'smtp.test.com',
      smtpPort: 587,
      fromAddress: 'alerts@test.com',
      toAddresses: ['admin@test.com']
    };
    
    const channel = new EmailChannel(config);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const alert: Alert = {
      id: 'test-1',
      severity: 'critical',
      metric: 'error_rate',
      currentValue: 20,
      threshold: 10,
      message: 'High error rate',
      triggeredAt: new Date(),
    };
    
    const result = await channel.send(alert);
    
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Email]')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('SlackChannel', () => {
  it('should send formatted message to Slack', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true } as Response)
    ) as jest.Mock;
    
    const config = {
      webhookUrl: 'https://hooks.slack.com/test',
      channel: '#alerts',
      username: 'ETL Bot'
    };
    
    const channel = new SlackChannel(config);
    
    const alert: Alert = {
      id: 'test-1',
      severity: 'critical',
      metric: 'error_rate',
      currentValue: 20,
      threshold: 10,
      message: 'High error rate',
      triggeredAt: new Date(),
    };
    
    const result = await channel.send(alert);
    
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      config.webhookUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('should handle fetch errors', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as jest.Mock;
    
    const config = {
      webhookUrl: 'https://hooks.slack.com/test'
    };
    
    const channel = new SlackChannel(config);
    
    const alert: Alert = {
      id: 'test-1',
      severity: 'warning',
      metric: 'test',
      currentValue: 1,
      threshold: 0,
      message: 'Test',
      triggeredAt: new Date(),
    };
    
    const result = await channel.send(alert);
    
    expect(result).toBe(false);
  });
});

describe('PagerDutyChannel', () => {
  it('should only send critical alerts to PagerDuty', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true } as Response)
    ) as jest.Mock;
    
    const config = {
      integrationKey: 'test-key',
      serviceName: 'ETL Service'
    };
    
    const channel = new PagerDutyChannel(config);
    
    // Warning alert should not trigger PagerDuty
    const warningAlert: Alert = {
      id: 'test-1',
      severity: 'warning',
      metric: 'error_rate',
      currentValue: 7,
      threshold: 5,
      message: 'Elevated error rate',
      triggeredAt: new Date(),
    };
    
    const warningResult = await channel.send(warningAlert);
    expect(warningResult).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Critical alert should trigger PagerDuty
    const criticalAlert: Alert = {
      id: 'test-2',
      severity: 'critical',
      metric: 'error_rate',
      currentValue: 20,
      threshold: 10,
      message: 'Critical error rate',
      triggeredAt: new Date(),
    };
    
    const criticalResult = await channel.send(criticalAlert);
    expect(criticalResult).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://events.pagerduty.com/v2/enqueue',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });
});
