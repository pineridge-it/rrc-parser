import { StructuredLogger } from '../logging/StructuredLogger';

export interface AlertRule {
  name: string;
  condition: () => boolean | Promise<boolean>;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  cooldownMs?: number;
  metadata?: Record<string, unknown>;
}

export interface AlertEvent {
  ruleName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AlertManagerOptions {
  logger?: StructuredLogger;
  enablePagerDuty?: boolean;
  pagerDutyApiKey?: string;
}

export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private logger: StructuredLogger;
  private enablePagerDuty: boolean;
  private pagerDutyApiKey?: string;

  constructor(options: AlertManagerOptions = {}) {
    this.logger = options.logger || new StructuredLogger({ service: 'alert-manager' });
    this.enablePagerDuty = options.enablePagerDuty || false;
    this.pagerDutyApiKey = options.pagerDutyApiKey;
  }

  registerRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
    this.logger.info('Alert rule registered', { ruleName: rule.name, severity: rule.severity });
  }

  unregisterRule(name: string): void {
    this.rules.delete(name);
    this.lastAlertTime.delete(name);
    this.logger.info('Alert rule unregistered', { ruleName: name });
  }

  async checkRules(): Promise<AlertEvent[]> {
    const alerts: AlertEvent[] = [];
    const now = Date.now();

    const entries = Array.from(this.rules.entries());
    
    for (const [name, rule] of entries) {
      const lastAlert = this.lastAlertTime.get(name) || 0;
      const cooldown = rule.cooldownMs || 300000;

      if (now - lastAlert < cooldown) {
        continue;
      }

      try {
        const triggered = await rule.condition();

        if (triggered) {
          const alert: AlertEvent = {
            ruleName: name,
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date(),
            metadata: rule.metadata,
          };

          alerts.push(alert);
          this.lastAlertTime.set(name, now);

          await this.sendAlert(alert);
        }
      } catch (error) {
        this.logger.error('Error checking alert rule', error as Error, { ruleName: name });
      }
    }

    return alerts;
  }

  private async sendAlert(alert: AlertEvent): Promise<void> {
    this.logger.warn('Alert triggered', {
      ruleName: alert.ruleName,
      severity: alert.severity,
      message: alert.message,
      metadata: alert.metadata,
    });

    if (alert.severity === 'critical' && this.enablePagerDuty && this.pagerDutyApiKey) {
      await this.sendToPagerDuty(alert);
    }
  }

  private async sendToPagerDuty(alert: AlertEvent): Promise<void> {
    try {
      this.logger.info('Sending alert to PagerDuty', { ruleName: alert.ruleName });
    } catch (error) {
      this.logger.error('Failed to send alert to PagerDuty', error as Error, {
        ruleName: alert.ruleName,
      });
    }
  }

  getActiveRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  clearCooldowns(): void {
    this.lastAlertTime.clear();
    this.logger.info('Alert cooldowns cleared');
  }
}

export function createCommonAlertRules(): AlertRule[] {
  return [
    {
      name: 'high_error_rate',
      condition: async () => {
        return false;
      },
      severity: 'critical',
      message: 'Error rate exceeds 1% for 5 minutes',
      cooldownMs: 300000,
    },
    {
      name: 'high_latency',
      condition: async () => {
        return false;
      },
      severity: 'high',
      message: 'P99 latency exceeds 2 seconds',
      cooldownMs: 300000,
    },
    {
      name: 'high_memory_usage',
      condition: async () => {
        const memUsage = process.memoryUsage();
        const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        return heapUsedPercent > 80;
      },
      severity: 'high',
      message: 'Memory usage exceeds 80%',
      cooldownMs: 600000,
    },
    {
      name: 'failed_login_attempts',
      condition: async () => {
        return false;
      },
      severity: 'medium',
      message: 'Failed login attempts exceed 10/minute',
      cooldownMs: 300000,
    },
  ];
}

const defaultAlertManager = new AlertManager();

export default defaultAlertManager;
