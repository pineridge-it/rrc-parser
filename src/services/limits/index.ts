import { UUID } from '../../types/common';
import { UsageService } from '../usage';
import { PLAN_LIMITS, PlanType } from '../../types/usage';
import { createDatabaseClient, Database } from '../../lib/database';
import { createLogger } from '../logger';
import { Logger } from '../../types/logging';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  upgradeRequired: boolean;
  message: string;
}

export interface FreeTierConfig {
  enforceStrictly: boolean;
  softWarningThreshold: number;
  cacheTTLMs: number;
}

const DEFAULT_CONFIG: FreeTierConfig = {
  enforceStrictly: true,
  softWarningThreshold: 0.8,
  cacheTTLMs: 60000,
};

export class FreeTierLimitExceededError extends Error {
  public resource: string;
  public current: number;
  public limit: number;

  constructor(resource: string, current: number, limit: number) {
    super(`Free tier limit exceeded for ${resource}: ${current}/${limit}. Upgrade required.`);
    this.name = 'FreeTierLimitExceededError';
    this.resource = resource;
    this.current = current;
    this.limit = limit;
  }
}

export class ApiAccessDeniedError extends Error {
  constructor() {
    super('API access is not available on the free tier. Please upgrade to access the API.');
    this.name = 'ApiAccessDeniedError';
  }
}

export class LimitsEnforcer {
  private config: FreeTierConfig;
  private usageService: UsageService;
  private planCache = new Map<string, { plan: PlanType; expiresAt: number }>();
  private logger: Logger;
  private db?: Database;

  constructor(
    config: Partial<FreeTierConfig> = {},
    db?: Database,
    logger?: Logger,
    usageService?: UsageService
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.usageService = usageService ?? new UsageService();
    this.db = db;
    this.logger = logger ?? createLogger({ service: 'limits-enforcer' });
  }

  async checkLimit(
    workspaceId: UUID,
    resource: 'aois' | 'alerts' | 'exports' | 'apiAccess',
    amount: number = 1
  ): Promise<LimitCheckResult> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const limits = PLAN_LIMITS[plan];

    if (resource === 'apiAccess') {
      const allowed = limits.apiCallsPerMonth > 0;
      return {
        allowed,
        current: allowed ? 0 : 1,
        limit: allowed ? 1 : 0,
        percentage: allowed ? 0 : 100,
        upgradeRequired: !allowed,
        message: allowed
          ? 'API access allowed'
          : 'API access is not available on the free tier. Please upgrade.',
      };
    }

    const usage = await this.usageService.getUsage(workspaceId);

    let current: number;
    let limit: number;

    switch (resource) {
      case 'aois':
        current = usage.aois.current;
        limit = limits.aois;
        break;
      case 'alerts':
        current = usage.alertsThisMonth.current;
        limit = limits.alertsPerMonth;
        break;
      case 'exports':
        current = usage.exportsThisMonth.current;
        limit = limits.exportsPerMonth;
        break;
      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    const newTotal = current + amount;
    const percentage = limit > 0 ? (newTotal / limit) * 100 : 0;
    const wouldExceed = newTotal > limit;
    const atSoftLimit = percentage >= this.config.softWarningThreshold * 100;

    let message: string;
    if (wouldExceed) {
      message = `You have reached your free tier limit for ${resource} (${current}/${limit}). Please upgrade to continue.`;
    } else if (atSoftLimit) {
      message = `You are approaching your free tier limit for ${resource} (${current}/${limit}). Consider upgrading.`;
    } else {
      message = `${resource} usage: ${current}/${limit}`;
    }

    return {
      allowed: !wouldExceed,
      current,
      limit,
      percentage,
      upgradeRequired: wouldExceed,
      message,
    };
  }

  async enforceLimit(
    workspaceId: UUID,
    resource: 'aois' | 'alerts' | 'exports' | 'apiAccess',
    amount: number = 1
  ): Promise<void> {
    if (!this.config.enforceStrictly) {
      return;
    }

    const result = await this.checkLimit(workspaceId, resource, amount);

    if (!result.allowed) {
      this.logger.warn('Limit exceeded', {
        workspaceId,
        resource,
        current: result.current,
        limit: result.limit,
        amount,
      });
      if (resource === 'apiAccess') {
        throw new ApiAccessDeniedError();
      }
      throw new FreeTierLimitExceededError(resource, result.current, result.limit);
    }
  }

  async incrementUsage(
    workspaceId: UUID,
    resource: 'alerts' | 'exports',
    amount: number = 1
  ): Promise<void> {
    await this.usageService.incrementUsage(workspaceId, resource, amount);
  }

  async getFreeTierUsage(workspaceId: UUID): Promise<{
    aois: { current: number; limit: number; percentage: number };
    alerts: { current: number; limit: number; percentage: number };
    exports: { current: number; limit: number; percentage: number };
    apiAccess: { allowed: boolean };
    anyLimitReached: boolean;
    anySoftLimitReached: boolean;
  }> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const limits = PLAN_LIMITS[plan];
    const usage = await this.usageService.getUsage(workspaceId);

    const aoiPercentage = limits.aois > 0 ? (usage.aois.current / limits.aois) * 100 : 0;
    const alertsPercentage = limits.alertsPerMonth > 0
      ? (usage.alertsThisMonth.current / limits.alertsPerMonth) * 100
      : 0;
    const exportsPercentage = limits.exportsPerMonth > 0
      ? (usage.exportsThisMonth.current / limits.exportsPerMonth) * 100
      : 0;

    const anyLimitReached =
      usage.aois.current >= limits.aois ||
      usage.alertsThisMonth.current >= limits.alertsPerMonth ||
      usage.exportsThisMonth.current >= limits.exportsPerMonth;

    const anySoftLimitReached =
      aoiPercentage >= this.config.softWarningThreshold * 100 ||
      alertsPercentage >= this.config.softWarningThreshold * 100 ||
      exportsPercentage >= this.config.softWarningThreshold * 100;

    return {
      aois: {
        current: usage.aois.current,
        limit: limits.aois,
        percentage: aoiPercentage,
      },
      alerts: {
        current: usage.alertsThisMonth.current,
        limit: limits.alertsPerMonth,
        percentage: alertsPercentage,
      },
      exports: {
        current: usage.exportsThisMonth.current,
        limit: limits.exportsPerMonth,
        percentage: exportsPercentage,
      },
      apiAccess: {
        allowed: limits.apiCallsPerMonth > 0,
      },
      anyLimitReached,
      anySoftLimitReached,
    };
  }

  async isFreeTier(workspaceId: UUID): Promise<boolean> {
    const plan = await this.getWorkspacePlan(workspaceId);
    return plan === 'free';
  }

  private async getWorkspacePlan(workspaceId: UUID): Promise<keyof typeof PLAN_LIMITS> {
    const cached = this.planCache.get(workspaceId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.plan;
    }

    try {
      const db = this.db ?? createDatabaseClient();
      const { data, error } = await db
        .from('workspaces')
        .select('plan')
        .eq('id', workspaceId)
        .maybeSingle();

      if (error) {
        this.logger.error('Failed to fetch workspace plan', error, { workspaceId });
        return 'free';
      }

      const plan = this.normalizePlan(data?.plan);
      this.planCache.set(workspaceId, { plan, expiresAt: now + this.config.cacheTTLMs });
      return plan;
    } catch (error) {
      this.logger.error('Failed to resolve workspace plan', error as Error, { workspaceId });
      return 'free';
    }
  }

  private normalizePlan(plan: string | null | undefined): PlanType {
    const value = (plan ?? 'free').toLowerCase();
    if (value in PLAN_LIMITS) {
      return value as PlanType;
    }
    if (value === 'basic' || value === 'starter') {
      return 'free';
    }
    if (value === 'professional') {
      return 'pro';
    }
    if (value === 'business') {
      return 'team';
    }
    return 'free';
  }

  clearCache(workspaceId?: UUID): void {
    if (workspaceId) {
      this.planCache.delete(workspaceId);
    } else {
      this.planCache.clear();
    }
  }
}

export default LimitsEnforcer;
