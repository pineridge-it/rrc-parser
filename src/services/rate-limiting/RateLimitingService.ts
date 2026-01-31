import {
  UUID
} from '../../types/common';

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

/**
 * Service for implementing comprehensive rate limiting for alerts
 */
export class RateLimitingService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: RateLimitingServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check if an alert is allowed based on all rate limits
   */
  async checkRateLimit(
    workspaceId: UUID,
    channelId: UUID,
    ruleId: UUID,
    channelType: string
  ): Promise<RateLimitCheckResult> {
    const response = await this.fetchWithAuth('/rate-limit/check', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, channelId, ruleId, channelType })
    });

    return response.json();
  }

  /**
   * Record usage when an alert is sent
   */
  async recordUsage(
    workspaceId: UUID,
    channelId: UUID,
    ruleId: UUID,
    channelType: string
  ): Promise<void> {
    const response = await this.fetchWithAuth('/rate-limit/record', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, channelId, ruleId, channelType })
    });

    if (!response.ok) {
      throw new Error(`Failed to record usage: ${response.status}`);
    }
  }

  /**
   * Get current usage statistics for a workspace
   */
  async getUsage(workspaceId: UUID): Promise<UsageStats> {
    const response = await this.fetchWithAuth(`/rate-limit/usage/${workspaceId}`);
    return response.json();
  }

  /**
   * Get current rate limit status for a workspace
   */
  async getRateLimitStatus(workspaceId: UUID): Promise<RateLimitStatus> {
    const response = await this.fetchWithAuth(`/rate-limit/status/${workspaceId}`);
    return response.json();
  }

  /**
   * Reset rate limit counters (admin only)
   */
  async resetRateLimits(workspaceId: UUID): Promise<void> {
    const response = await this.fetchWithAuth(`/rate-limit/reset/${workspaceId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to reset rate limits: ${response.status}`);
    }
  }

  /**
   * Update rate limit configuration for a workspace
   */
  async updateRateLimitConfig(
    workspaceId: UUID,
    config: Partial<RateLimitConfig>
  ): Promise<RateLimitConfig> {
    const response = await this.fetchWithAuth(`/rate-limit/config/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(config)
    });

    return response.json();
  }

  /**
   * Get rate limit configuration for a workspace
   */
  async getRateLimitConfig(workspaceId: UUID): Promise<RateLimitConfig> {
    const response = await this.fetchWithAuth(`/rate-limit/config/${workspaceId}`);
    return response.json();
  }

  /**
   * Check if a specific rule is in cooldown period
   */
  async isRuleInCooldown(ruleId: UUID): Promise<{ inCooldown: boolean; cooldownEndsAt?: string }> {
    const response = await this.fetchWithAuth(`/rate-limit/rule-cooldown/${ruleId}`);
    return response.json();
  }

  /**
   * Get warnings for approaching rate limits
   */
  async getRateLimitWarnings(workspaceId: UUID): Promise<string[]> {
    const response = await this.fetchWithAuth(`/rate-limit/warnings/${workspaceId}`);
    const result = await response.json();
    return result.warnings;
  }
}