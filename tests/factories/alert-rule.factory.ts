/**
 * Alert Rule Factory
 * 
 * Generates realistic alert rule configurations for testing.
 */

import {
  randomId,
  randomTexasCounty,
  randomOperator,
  randomWellType,
  randomDateRange,
  randomNotificationChannel,
  randomArrayElements,
  randomInt,
  randomBoolean,
  randomSentence,
  randomWords,
} from './generators';

// ============================================================================
// Types
// ============================================================================

export interface AlertRuleFilters {
  counties?: string[];
  operators?: string[];
  wellTypes?: string[];
  formations?: string[];
  districts?: string[];
  drillTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  depthRange?: {
    min: number;
    max: number;
  };
  acreageRange?: {
    min: number;
    max: number;
  };
  horizontalOnly?: boolean;
  excludeCancelled?: boolean;
}

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // HH:mm format
  end: string;   // HH:mm format
  timezone: string;
  weekendDifferent: boolean;
  weekendStart?: string;
  weekendEnd?: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxPerHour: number;
  maxPerDay: number;
  burstLimit: number;
}

export interface AlertRule {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string;
  filters: AlertRuleFilters;
  channels: string[];
  quietHours: QuietHoursConfig;
  rateLimit: RateLimitConfig;
  active: boolean;
  emailSubject?: string;
  emailTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  triggerCount: number;
}

// ============================================================================
// Alert Rule Factory
// ============================================================================

export class AlertRuleFactory {
  /**
   * Create a single alert rule with realistic defaults
   */
  static create(overrides: Partial<AlertRule> = {}): AlertRule {
    const workspaceId = overrides.workspaceId || `ws-${randomId()}`;
    const userId = overrides.userId || `user-${randomId()}`;
    
    return {
      id: `rule-${randomId()}`,
      workspaceId,
      userId,
      name: `${randomWords(2)} Alert`,
      description: randomSentence(),
      filters: {
        counties: randomArrayElements(['Midland', 'Martin', 'Howard', 'Reeves'], randomInt(1, 3)),
        ...overrides.filters,
      },
      channels: ['email', 'in-app'],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '06:00',
        timezone: 'America/Chicago',
        weekendDifferent: false,
      },
      rateLimit: {
        enabled: true,
        maxPerHour: 10,
        maxPerDay: 50,
        burstLimit: 5,
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      triggerCount: 0,
      ...overrides,
    };
  }

  /**
   * Create multiple alert rules
   */
  static createMany(count: number, overrides?: Partial<AlertRule>): AlertRule[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create an alert rule matching specific permit criteria
   */
  static matchingPermitCriteria(criteria: {
    county?: string;
    operator?: string;
    wellType?: string;
  }, overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: `${criteria.county || criteria.operator || criteria.wellType} Alerts`,
      filters: {
        counties: criteria.county ? [criteria.county] : undefined,
        operators: criteria.operator ? [criteria.operator] : undefined,
        wellTypes: criteria.wellType ? [criteria.wellType] : undefined,
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule that won't match any permits (for negative testing)
   */
  static nonMatching(overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: 'Non-Matching Rule',
      filters: {
        counties: ['NonExistentCounty'],
        operators: ['NonExistentOperator'],
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule with county filter
   */
  static forCounties(counties: string[], overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: `${counties.join(', ')} County Alerts`,
      filters: {
        counties,
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule with operator filter
   */
  static forOperators(operators: string[], overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: `${operators.join(', ')} Operator Alerts`,
      filters: {
        operators,
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule with well type filter
   */
  static forWellTypes(wellTypes: string[], overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: `${wellTypes.join(', ')} Well Alerts`,
      filters: {
        wellTypes,
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule with quiet hours enabled
   */
  static withQuietHours(
    start: string = '22:00',
    end: string = '06:00',
    timezone: string = 'America/Chicago',
    overrides?: Partial<AlertRule>
  ): AlertRule {
    return this.create({
      name: 'Quiet Hours Alert Rule',
      quietHours: {
        enabled: true,
        start,
        end,
        timezone,
        weekendDifferent: false,
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule with rate limiting
   */
  static withRateLimit(
    maxPerHour: number = 5,
    maxPerDay: number = 20,
    overrides?: Partial<AlertRule>
  ): AlertRule {
    return this.create({
      name: 'Rate Limited Alert Rule',
      rateLimit: {
        enabled: true,
        maxPerHour,
        maxPerDay,
        burstLimit: Math.floor(maxPerHour / 2),
      },
      ...overrides,
    });
  }

  /**
   * Create an inactive alert rule
   */
  static inactive(overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: 'Inactive Alert Rule',
      active: false,
      ...overrides,
    });
  }

  /**
   * Create an alert rule with email only
   */
  static emailOnly(overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      channels: ['email'],
      ...overrides,
    });
  }

  /**
   * Create an alert rule with in-app only
   */
  static inAppOnly(overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      channels: ['in-app'],
      ...overrides,
    });
  }

  /**
   * Create an alert rule with all channels
   */
  static allChannels(overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      channels: ['email', 'in-app', 'sms'],
      ...overrides,
    });
  }

  /**
   * Create an alert rule with date range filter
   */
  static withDateRange(daysBack: number = 30, overrides?: Partial<AlertRule>): AlertRule {
    const end = new Date();
    const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    return this.create({
      name: `Last ${daysBack} Days Alerts`,
      filters: {
        dateRange: { start, end },
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule with depth range filter
   */
  static withDepthRange(min: number = 5000, max: number = 15000, overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: `${min}-${max}ft Depth Alerts`,
      filters: {
        depthRange: { min, max },
      },
      ...overrides,
    });
  }

  /**
   * Create an alert rule for horizontal wells only
   */
  static horizontalOnly(overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      name: 'Horizontal Well Alerts',
      filters: {
        horizontalOnly: true,
      },
      ...overrides,
    });
  }

  /**
   * Create a triggered alert rule (has been triggered before)
   */
  static triggered(triggerCount: number = 1, overrides?: Partial<AlertRule>): AlertRule {
    return this.create({
      triggerCount,
      lastTriggeredAt: new Date(Date.now() - randomInt(1, 24) * 60 * 60 * 1000),
      ...overrides,
    });
  }
}

export default AlertRuleFactory;
