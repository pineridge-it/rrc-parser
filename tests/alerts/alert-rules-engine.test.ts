/**
 * Tests for Alert Rules Engine
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AlertRulesEngine } from '../../src/lib/alerts';
import {
  AlertRule,
  CleanPermit,
  AOI,
} from '../../src/types/alert';

describe('AlertRulesEngine', () => {
  let engine: AlertRulesEngine;
  
  beforeEach(() => {
    engine = new AlertRulesEngine();
  });
  
  describe('Basic Rule Matching', () => {
    it('should match a permit with no filters (catch-all rule)', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Catch All',
        aoiIds: [],
        filters: {},
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].rule.id).toBe('rule-1');
    });
    
    it('should not match inactive rules', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Inactive Rule',
        aoiIds: [],
        filters: {},
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: false,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(0);
    });
  });
  
  describe('County Filter Matching', () => {
    it('should match permit by county', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Midland County Rule',
        aoiIds: [],
        filters: { counties: ['Midland'] },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        county: 'Midland',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.countyMatch).toBe(true);
    });
    
    it('should not match permit with different county', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Midland County Rule',
        aoiIds: [],
        filters: { counties: ['Midland'] },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        county: 'Ector',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(0);
    });
  });
  
  describe('Status Filter Matching', () => {
    it('should match permit by status', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Approved Permits',
        aoiIds: [],
        filters: { statuses: ['APPROVED'] },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        status: 'APPROVED',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.statusMatch).toBe(true);
    });
  });
  
  describe('Operator Filter Matching', () => {
    it('should match permit by operator ID', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Specific Operator',
        aoiIds: [],
        filters: { operators: ['op-123'] },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        operatorId: 'op-123',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.operatorMatch).toBe(true);
    });
  });
  
  describe('Operator Watchlist Matching', () => {
    it('should match permit on watchlist', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Watchlist Rule',
        aoiIds: [],
        filters: {},
        operatorWatchlist: ['op-456', 'op-789'],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        operatorId: 'op-456',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.watchlistMatch).toBe(true);
    });
    
    it('should match watchlist even without other filters', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Watchlist Only',
        aoiIds: [],
        filters: { counties: ['Midland'] },
        operatorWatchlist: ['op-456'],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      // Permit in different county but on watchlist
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        operatorId: 'op-456',
        county: 'Ector',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.watchlistMatch).toBe(true);
    });
  });
  
  describe('AOI Spatial Matching', () => {
    it('should match permit within AOI polygon', async () => {
      const aoi: AOI = {
        id: 'aoi-1',
        workspaceId: 'ws-1',
        name: 'Test AOI',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-100, 30],
            [-100, 32],
            [-98, 32],
            [-98, 30],
            [-100, 30],
          ]],
        },
      };
      
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'AOI Rule',
        aoiIds: ['aoi-1'],
        filters: {},
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      engine.setAOIs([aoi]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        surfaceLat: 31,
        surfaceLon: -99,
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.aoiMatch).toBe(true);
    });
    
    it('should not match permit outside AOI polygon', async () => {
      const aoi: AOI = {
        id: 'aoi-1',
        workspaceId: 'ws-1',
        name: 'Test AOI',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-100, 30],
            [-100, 32],
            [-98, 32],
            [-98, 30],
            [-100, 30],
          ]],
        },
      };
      
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'AOI Rule',
        aoiIds: ['aoi-1'],
        filters: {},
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      engine.setAOIs([aoi]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        surfaceLat: 35,
        surfaceLon: -99,
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(0);
    });
    
    it('should match permit with no AOI filter', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'No AOI Rule',
        aoiIds: [],
        filters: {},
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
    });
  });
  
  describe('Amendment Handling', () => {
    it('should not match amendment when notifyOnAmendment is false', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'No Amendments',
        aoiIds: [],
        filters: {},
        operatorWatchlist: [],
        notifyOnAmendment: false,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        isAmendment: true,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(0);
    });
    
    it('should match amendment when notifyOnAmendment is true', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'With Amendments',
        aoiIds: [],
        filters: {},
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        isAmendment: true,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
    });
  });
  
  describe('Date Filter Matching', () => {
    it('should match permit filed after specified date', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Recent Permits',
        aoiIds: [],
        filters: { filedAfter: new Date('2024-01-01') },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        filedDate: new Date('2024-06-15'),
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.dateMatch).toBe(true);
    });
    
    it('should not match permit filed before specified date', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Recent Permits',
        aoiIds: [],
        filters: { filedAfter: new Date('2024-01-01') },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        filedDate: new Date('2023-06-15'),
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(0);
    });
  });
  
  describe('Batch Evaluation', () => {
    it('should evaluate multiple permits efficiently', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Midland County',
        aoiIds: [],
        filters: { counties: ['Midland'] },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permits: CleanPermit[] = [
        { id: 'p1', permitNumber: '1', county: 'Midland', isAmendment: false, metadata: {} },
        { id: 'p2', permitNumber: '2', county: 'Ector', isAmendment: false, metadata: {} },
        { id: 'p3', permitNumber: '3', county: 'Midland', isAmendment: false, metadata: {} },
      ];
      
      const result = await engine.evaluateBatch(permits);
      
      expect(result.totalEvaluated).toBe(3);
      expect(result.totalMatches).toBe(2);
      expect(result.matches.has('p1')).toBe(true);
      expect(result.matches.has('p2')).toBe(false);
      expect(result.matches.has('p3')).toBe(true);
      expect(result.durationMs).toBeLessThan(1000);
    });
  });
  
  describe('Workspace Filtering', () => {
    it('should return rules for specific workspace', () => {
      const rules: AlertRule[] = [
        {
          id: 'rule-1',
          workspaceId: 'ws-1',
          name: 'WS1 Rule',
          aoiIds: [],
          filters: {},
          operatorWatchlist: [],
          notifyOnAmendment: true,
          channels: [],
          isActive: true,
        },
        {
          id: 'rule-2',
          workspaceId: 'ws-2',
          name: 'WS2 Rule',
          aoiIds: [],
          filters: {},
          operatorWatchlist: [],
          notifyOnAmendment: true,
          channels: [],
          isActive: true,
        },
      ];
      
      engine.setRules(rules);
      
      const ws1Rules = engine.getRulesForWorkspace('ws-1');
      expect(ws1Rules).toHaveLength(1);
      expect(ws1Rules[0].id).toBe('rule-1');
    });
  });
  
  describe('Complex Rules', () => {
    it('should match with multiple filter criteria', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Complex Rule',
        aoiIds: [],
        filters: {
          counties: ['Midland'],
          statuses: ['APPROVED'],
        },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        county: 'Midland',
        status: 'APPROVED',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(1);
      expect(matches[0].matchedCriteria.countyMatch).toBe(true);
      expect(matches[0].matchedCriteria.statusMatch).toBe(true);
    });
    
    it('should not match when one filter criteria fails', async () => {
      const rule: AlertRule = {
        id: 'rule-1',
        workspaceId: 'ws-1',
        name: 'Complex Rule',
        aoiIds: [],
        filters: {
          counties: ['Midland'],
          statuses: ['APPROVED'],
        },
        operatorWatchlist: [],
        notifyOnAmendment: true,
        channels: [],
        isActive: true,
      };
      
      engine.setRules([rule]);
      
      const permit: CleanPermit = {
        id: 'permit-1',
        permitNumber: '12345',
        county: 'Midland',
        status: 'PENDING',
        isAmendment: false,
        metadata: {},
      };
      
      const matches = await engine.evaluatePermit(permit);
      expect(matches).toHaveLength(0);
    });
  });
});
