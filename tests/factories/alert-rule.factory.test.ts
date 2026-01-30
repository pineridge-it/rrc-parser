/**
 * Alert Rule Factory Tests
 *
 * Tests for the AlertRuleFactory to ensure it generates valid alert rule configurations.
 */

import { AlertRuleFactory } from './alert-rule.factory';
import { TEXAS_COUNTIES, OPERATORS } from './generators';

describe('AlertRuleFactory', () => {
  describe('create', () => {
    it('should create a valid alert rule with default values', () => {
      const rule = AlertRuleFactory.create();

      expect(rule.id).toBeTruthy();
      expect(rule.name).toBeTruthy();
      expect(typeof rule.enabled).toBe('boolean');
      expect(['low', 'medium', 'high', 'critical']).toContain(rule.priority);
      expect(Array.isArray(rule.channels)).toBe(true);
      expect(rule.createdAt).toBeInstanceOf(Date);
    });

    it('should apply overrides', () => {
      const rule = AlertRuleFactory.create({ name: 'Test Alert' });
      expect(rule.name).toBe('Test Alert');
    });
  });

  describe('createMany', () => {
    it('should create the specified number of rules', () => {
      const rules = AlertRuleFactory.createMany(5);
      expect(rules).toHaveLength(5);
    });

    it('should create unique rules', () => {
      const rules = AlertRuleFactory.createMany(10);
      const ids = new Set(rules.map(r => r.id));
      expect(ids.size).toBe(10);
    });
  });

  describe('enabled, disabled', () => {
    it('should create enabled rule', () => {
      const rule = AlertRuleFactory.enabled();
      expect(rule.enabled).toBe(true);
    });

    it('should create disabled rule', () => {
      const rule = AlertRuleFactory.disabled();
      expect(rule.enabled).toBe(false);
    });
  });

  describe('priority helpers', () => {
    it('should create low priority rule', () => {
      const rule = AlertRuleFactory.lowPriority();
      expect(rule.priority).toBe('low');
    });

    it('should create medium priority rule', () => {
      const rule = AlertRuleFactory.mediumPriority();
      expect(rule.priority).toBe('medium');
    });

    it('should create high priority rule', () => {
      const rule = AlertRuleFactory.highPriority();
      expect(rule.priority).toBe('high');
    });

    it('should create critical priority rule', () => {
      const rule = AlertRuleFactory.criticalPriority();
      expect(rule.priority).toBe('critical');
    });
  });

  describe('withFilters', () => {
    it('should create rule with county filters', () => {
      const rule = AlertRuleFactory.withFilters({ counties: ['Midland', 'Martin'] });
      expect(rule.filters.counties).toContain('Midland');
      expect(rule.filters.counties).toContain('Martin');
    });

    it('should create rule with operator filters', () => {
      const rule = AlertRuleFactory.withFilters({ operators: ['Pioneer Natural Resources'] });
      expect(rule.filters.operators).toContain('Pioneer Natural Resources');
    });
  });

  describe('matchingPermitCriteria', () => {
    it('should create rule matching permit criteria', () => {
      const criteria = { county: 'Midland', operator: 'Pioneer' };
      const rule = AlertRuleFactory.matchingPermitCriteria(criteria);
      expect(rule.filters.counties).toContain('Midland');
      expect(rule.filters.operators).toContain('Pioneer');
    });
  });

  describe('withChannels', () => {
    it('should create rule with specific channels', () => {
      const rule = AlertRuleFactory.withChannels(['email', 'slack']);
      expect(rule.channels).toContain('email');
      expect(rule.channels).toContain('slack');
    });
  });

  describe('withQuietHours', () => {
    it('should create rule with quiet hours', () => {
      const rule = AlertRuleFactory.withQuietHours('22:00', '08:00');
      expect(rule.quietHours.enabled).toBe(true);
      expect(rule.quietHours.start).toBe('22:00');
      expect(rule.quietHours.end).toBe('08:00');
    });
  });
});