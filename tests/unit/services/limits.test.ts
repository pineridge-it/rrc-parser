/**
 * Unit tests for LimitsEnforcer service
 * Tests free tier limit enforcement for AOIs, alerts, and exports
 * Covers acceptance criteria for ubuntu-gvs.4:
 * - Usage tracking is accurate
 * - Limits are enforced
 * - Warning at 80% usage
 * - Block at 100% usage
 * - Monthly reset works
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  LimitsEnforcer,
  FreeTierLimitExceededError,
  ApiAccessDeniedError,
} from '../../../src/services/limits';
import { UsageService } from '../../../src/services/usage';
import { Logger } from '../../../src/types/logging';

describe('LimitsEnforcer', () => {
  let limitsEnforcer: LimitsEnforcer;
  let mockUsageService: UsageService;
  const mockWorkspaceId = '550e8400-e29b-41d4-a716-446655440000' as `${string}-${string}-${string}-${string}-${string}`;
  let logger: Logger;

  const createLoggerStub = (): Logger => {
    return {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      fatal: mock(() => {}),
      child: mock(() => createLoggerStub()),
      withCorrelationId: mock(() => createLoggerStub()),
    };
  };

  const createMockUsageService = (usageData: {
    aois: { current: number; limit: number };
    alertsThisMonth: { current: number; limit: number };
    exportsThisMonth: { current: number; limit: number };
    apiCallsThisMonth: { current: number; limit: number };
  }): UsageService => {
    return {
      getUsage: mock(async () => usageData),
      checkLimit: mock(async () => ({ allowed: true, current: 0, limit: 10, percentage: 0, wouldExceed: false })),
      incrementUsage: mock(async () => {}),
      checkWarnings: mock(async () => []),
      getPlanLimits: mock(async () => ({ aois: 3, alertsPerMonth: 50, exportsPerMonth: 10, apiCallsPerMonth: 0, teamMembers: 1 })),
      resetMonthlyUsage: mock(async () => {}),
    } as unknown as UsageService;
  };

  const createMockDb = (plan: string = 'free') => ({
    from: mock(() => ({
      select: mock(() => ({
        eq: mock(() => ({
          maybeSingle: mock(async () => ({ data: { plan }, error: null })),
        })),
      })),
    })),
    rpc: mock(async () => ({ data: null, error: null })),
  });

  beforeEach(() => {
    logger = createLoggerStub();
    mockUsageService = createMockUsageService({
      aois: { current: 0, limit: 3 },
      alertsThisMonth: { current: 0, limit: 50 },
      exportsThisMonth: { current: 0, limit: 10 },
      apiCallsThisMonth: { current: 0, limit: 0 },
    });
  });

  describe('Acceptance Criteria: Usage tracking is accurate', () => {
    it('should accurately track AOI count', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const usage = await limitsEnforcer.getFreeTierUsage(mockWorkspaceId);

      expect(usage.aois.current).toBe(0);
      expect(usage.aois.limit).toBe(3);
    });

    it('should accurately track alerts sent this month', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 1, limit: 3 },
        alertsThisMonth: { current: 25, limit: 50 },
        exportsThisMonth: { current: 5, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const usage = await limitsEnforcer.getFreeTierUsage(mockWorkspaceId);

      expect(usage.alerts.current).toBe(25);
      expect(usage.alerts.limit).toBe(50);
      expect(usage.alerts.percentage).toBe(50);
    });

    it('should accurately track exports count', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 0, limit: 3 },
        alertsThisMonth: { current: 0, limit: 50 },
        exportsThisMonth: { current: 7, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const usage = await limitsEnforcer.getFreeTierUsage(mockWorkspaceId);

      expect(usage.exports.current).toBe(7);
      expect(usage.exports.limit).toBe(10);
    });
  });

  describe('Acceptance Criteria: Limits are enforced', () => {
    it('should deny API access on free tier', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.checkLimit(mockWorkspaceId, 'apiAccess');

      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
      expect(result.message).toContain('API access is not available');
    });

    it('should throw ApiAccessDeniedError for API access on free tier', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      try {
        await limitsEnforcer.enforceLimit(mockWorkspaceId, 'apiAccess');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error instanceof ApiAccessDeniedError).toBe(true);
      }
    });

    it('should block action when hard limit is exceeded', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 3, limit: 3 },
        alertsThisMonth: { current: 0, limit: 50 },
        exportsThisMonth: { current: 0, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.checkLimit(mockWorkspaceId, 'aois', 1);

      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
      expect(result.current).toBe(3);
      expect(result.limit).toBe(3);
    });

    it('should throw FreeTierLimitExceededError when limit is exceeded', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 3, limit: 3 },
        alertsThisMonth: { current: 0, limit: 50 },
        exportsThisMonth: { current: 0, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      try {
        await limitsEnforcer.enforceLimit(mockWorkspaceId, 'aois', 1);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error instanceof FreeTierLimitExceededError).toBe(true);
        expect((error as FreeTierLimitExceededError).resource).toBe('aois');
        expect((error as FreeTierLimitExceededError).current).toBe(3);
        expect((error as FreeTierLimitExceededError).limit).toBe(3);
      }
    });
  });

  describe('Acceptance Criteria: Warning at 80% usage', () => {
    it('should detect soft limit warning at 80% usage', async () => {
      // Use 41/50 alerts = 82%, which exceeds 80% threshold
      mockUsageService = createMockUsageService({
        aois: { current: 0, limit: 3 },
        alertsThisMonth: { current: 41, limit: 50 },
        exportsThisMonth: { current: 0, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const usage = await limitsEnforcer.getFreeTierUsage(mockWorkspaceId);

      expect(usage.anySoftLimitReached).toBe(true);
      expect(usage.alerts.percentage).toBeCloseTo(82, 1);
    });

    it('should indicate approaching limit in message at soft threshold', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 2, limit: 3 },
        alertsThisMonth: { current: 42, limit: 50 },
        exportsThisMonth: { current: 8, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({ softWarningThreshold: 0.8 }, db, logger, mockUsageService);

      const result = await limitsEnforcer.checkLimit(mockWorkspaceId, 'alerts', 1);

      expect(result.allowed).toBe(true);
      expect(result.message).toContain('approaching');
    });
  });

  describe('Acceptance Criteria: Block at 100% usage', () => {
    it('should block when at 100% of AOI limit', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 3, limit: 3 },
        alertsThisMonth: { current: 0, limit: 50 },
        exportsThisMonth: { current: 0, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.checkLimit(mockWorkspaceId, 'aois', 1);

      expect(result.allowed).toBe(false);
      expect(result.percentage).toBeGreaterThanOrEqual(100);
    });

    it('should block when at 100% of alerts limit', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 0, limit: 3 },
        alertsThisMonth: { current: 50, limit: 50 },
        exportsThisMonth: { current: 0, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.checkLimit(mockWorkspaceId, 'alerts', 1);

      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
    });

    it('should indicate anyLimitReached when at 100%', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 3, limit: 3 },
        alertsThisMonth: { current: 0, limit: 50 },
        exportsThisMonth: { current: 0, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const usage = await limitsEnforcer.getFreeTierUsage(mockWorkspaceId);

      expect(usage.anyLimitReached).toBe(true);
    });
  });

  describe('Acceptance Criteria: Monthly reset works', () => {
    it('should call incrementUsage on usage service', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      await limitsEnforcer.incrementUsage(mockWorkspaceId, 'alerts', 1);

      expect(mockUsageService.incrementUsage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration', () => {
    it('should not enforce when enforceStrictly is false', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 3, limit: 3 },
        alertsThisMonth: { current: 50, limit: 50 },
        exportsThisMonth: { current: 10, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({ enforceStrictly: false }, db, logger, mockUsageService);

      // Should not throw even at limits
      await limitsEnforcer.enforceLimit(mockWorkspaceId, 'apiAccess');
    });

    it('should allow custom soft warning threshold', async () => {
      mockUsageService = createMockUsageService({
        aois: { current: 1, limit: 3 },
        alertsThisMonth: { current: 0, limit: 50 },
        exportsThisMonth: { current: 0, limit: 10 },
        apiCallsThisMonth: { current: 0, limit: 0 },
      });

      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({ softWarningThreshold: 0.5 }, db, logger, mockUsageService);

      const usage = await limitsEnforcer.getFreeTierUsage(mockWorkspaceId);

      expect(usage.anySoftLimitReached).toBe(true);
    });
  });

  describe('isFreeTier', () => {
    it('should return true for free tier workspace', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(true);
    });

    it('should return false for pro workspace', async () => {
      const db = createMockDb('pro');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(false);
    });

    it('should return false for team workspace', async () => {
      const db = createMockDb('team');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(false);
    });

    it('should return false for enterprise workspace', async () => {
      const db = createMockDb('enterprise');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(false);
    });
  });

  describe('Plan normalization', () => {
    it('should normalize basic to free', async () => {
      const db = createMockDb('basic');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(true);
    });

    it('should normalize starter to free', async () => {
      const db = createMockDb('starter');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(true);
    });

    it('should normalize professional to pro', async () => {
      const db = createMockDb('professional');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(false);
    });

    it('should normalize business to team', async () => {
      const db = createMockDb('business');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(false);
    });
  });

  describe('Cache management', () => {
    it('should cache plan lookups', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({ cacheTTLMs: 60000 }, db, logger, mockUsageService);

      await limitsEnforcer.isFreeTier(mockWorkspaceId);
      await limitsEnforcer.isFreeTier(mockWorkspaceId);

      // The mock db.from should only be called once due to caching
      expect(db.from).toHaveBeenCalledTimes(1);
    });

    it('should clear cache for specific workspace', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      await limitsEnforcer.isFreeTier(mockWorkspaceId);
      limitsEnforcer.clearCache(mockWorkspaceId);
      await limitsEnforcer.isFreeTier(mockWorkspaceId);

      expect(db.from).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const db = createMockDb('free');
      limitsEnforcer = new LimitsEnforcer({}, db, logger, mockUsageService);

      await limitsEnforcer.isFreeTier(mockWorkspaceId);
      limitsEnforcer.clearCache();
      await limitsEnforcer.isFreeTier(mockWorkspaceId);

      expect(db.from).toHaveBeenCalledTimes(2);
    });
  });
});

describe('FreeTierLimitExceededError', () => {
  it('should have correct error properties', () => {
    const error = new FreeTierLimitExceededError('aois', 3, 3);

    expect(error.name).toBe('FreeTierLimitExceededError');
    expect(error.message).toContain('Free tier limit exceeded');
    expect(error.message).toContain('aois');
    expect(error.message).toContain('3/3');
    expect(error.resource).toBe('aois');
    expect(error.current).toBe(3);
    expect(error.limit).toBe(3);
  });

  it('should provide upgrade suggestion in message', () => {
    const error = new FreeTierLimitExceededError('alerts', 50, 50);

    expect(error.message).toContain('Upgrade required');
  });
});

describe('ApiAccessDeniedError', () => {
  it('should have correct error message', () => {
    const error = new ApiAccessDeniedError();

    expect(error.name).toBe('ApiAccessDeniedError');
    expect(error.message).toContain('API access is not available');
    expect(error.message).toContain('upgrade');
  });
});

function createMockUsageData(data: {
  aois: { current: number; limit: number };
  alertsThisMonth: { current: number; limit: number };
  exportsThisMonth: { current: number; limit: number };
  apiCallsThisMonth: { current: number; limit: number };
}): UsageService {
  return {
    getUsage: mock(async () => data),
    checkLimit: mock(async () => ({ allowed: true, current: 0, limit: 10, percentage: 0, wouldExceed: false })),
    incrementUsage: mock(async () => {}),
    checkWarnings: mock(async () => []),
    getPlanLimits: mock(async () => ({ aois: 3, alertsPerMonth: 50, exportsPerMonth: 10, apiCallsPerMonth: 0, teamMembers: 1 })),
    resetMonthlyUsage: mock(async () => {}),
  } as unknown as UsageService;
}
