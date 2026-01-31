import { UUID } from './common';

export interface RateLimitConfig {
  alertsPerDay: number;
  smsPerMonth: number;
  alertsPerHourPerRule: number;
  cooldownMinutes: number;
}

export interface RateLimitStatus {
  alertsToday: number;
  smsThisMonth: number;
  isLimited: boolean;
  limitReason?: string;
  resetsAt?: string;
}

export interface UsageStats {
  alertsToday: number;
  alertsThisHour: number;
  smsThisMonth: number;
  ruleAlertCounts: Map<UUID, number>;
  lastAlertTimestamps: Map<UUID, string>;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  resetTime?: string;
  currentUsage?: {
    alertsToday: number;
    smsThisMonth: number;
    ruleAlertsThisHour: number;
  };
}

export interface RateLimitingServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface RateLimitCheckRequest {
  workspaceId: UUID;
  channelId: UUID;
  ruleId: UUID;
  channelType: string;
}

export interface RecordUsageRequest {
  workspaceId: UUID;
  channelId: UUID;
  ruleId: UUID;
  channelType: string;
}

export interface UpdateRateLimitConfigRequest {
  config: Partial<RateLimitConfig>;
}

export interface RuleCooldownResponse {
  inCooldown: boolean;
  cooldownEndsAt?: string;
}

export interface RateLimitWarningsResponse {
  warnings: string[];
}