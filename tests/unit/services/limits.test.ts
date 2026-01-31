/**
 * Unit tests for LimitsEnforcer service
 * Tests free tier limit enforcement for AOIs, alerts, and exports
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  LimitsEnforcer,
  FreeTierLimitExceededError,
  ApiAccessDeniedError,
} from '../../../src/services/limits';

describe('LimitsEnforcer', () => {
  let limitsEnforcer: LimitsEnforcer;
  const mockWorkspaceId = '550e8400-e29b-41d4-a716-446655440000' as `${string}-${string}-${string}-${string}-${string}`;

  beforeEach(() => {
    limitsEnforcer = new LimitsEnforcer();
  });

  describe('checkLimit', () => {
    it('should deny API access on free tier', async () => {
      const result = await limitsEnforcer.checkLimit(mockWorkspaceId, 'apiAccess');

      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
      expect(result.message).toContain('API access is not available');
    });
  });

  describe('enforceLimit', () => {
    it('should throw ApiAccessDeniedError for API access on free tier', async () => {
      try {
        await limitsEnforcer.enforceLimit(mockWorkspaceId, 'apiAccess');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error instanceof ApiAccessDeniedError).toBe(true);
      }
    });

    it('should not enforce when enforceStrictly is false', async () => {
      const lenientEnforcer = new LimitsEnforcer({ enforceStrictly: false });
      
      // Should not throw even for API access
      await lenientEnforcer.enforceLimit(mockWorkspaceId, 'apiAccess');
    });
  });

  describe('isFreeTier', () => {
    it('should return true for free tier workspace', async () => {
      const result = await limitsEnforcer.isFreeTier(mockWorkspaceId);
      expect(result).toBe(true);
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
});

describe('ApiAccessDeniedError', () => {
  it('should have correct error message', () => {
    const error = new ApiAccessDeniedError();

    expect(error.name).toBe('ApiAccessDeniedError');
    expect(error.message).toContain('API access is not available');
    expect(error.message).toContain('upgrade');
  });
});
