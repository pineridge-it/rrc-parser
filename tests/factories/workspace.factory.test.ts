/**
 * Workspace Factory Tests
 *
 * Tests for the WorkspaceFactory to ensure it generates valid workspace data.
 */

import { WorkspaceFactory } from './workspace.factory';

describe('WorkspaceFactory', () => {
  describe('create', () => {
    it('should create a valid workspace with default values', () => {
      const workspace = WorkspaceFactory.create();

      expect(workspace.id).toBeTruthy();
      expect(workspace.name).toBeTruthy();
      expect(workspace.slug).toBeTruthy();
      expect(['free', 'pro', 'enterprise']).toContain(workspace.plan);
      expect(workspace.settings.maxAlerts).toBeGreaterThan(0);
      expect(workspace.settings.maxUsers).toBeGreaterThan(0);
      expect(workspace.isActive).toBe(true);
      expect(workspace.createdAt).toBeInstanceOf(Date);
    });

    it('should apply overrides', () => {
      const workspace = WorkspaceFactory.create({ name: 'Test Workspace' });
      expect(workspace.name).toBe('Test Workspace');
    });
  });

  describe('createMany', () => {
    it('should create the specified number of workspaces', () => {
      const workspaces = WorkspaceFactory.createMany(5);
      expect(workspaces).toHaveLength(5);
    });

    it('should create unique workspaces', () => {
      const workspaces = WorkspaceFactory.createMany(10);
      const ids = new Set(workspaces.map(w => w.id));
      expect(ids.size).toBe(10);
    });
  });

  describe('free, pro, enterprise', () => {
    it('should create free plan workspace', () => {
      const workspace = WorkspaceFactory.free();
      expect(workspace.plan).toBe('free');
      expect(workspace.settings.maxAlerts).toBeLessThanOrEqual(5);
    });

    it('should create pro plan workspace', () => {
      const workspace = WorkspaceFactory.pro();
      expect(workspace.plan).toBe('pro');
    });

    it('should create enterprise plan workspace', () => {
      const workspace = WorkspaceFactory.enterprise();
      expect(workspace.plan).toBe('enterprise');
    });
  });

  describe('inactive', () => {
    it('should create inactive workspace', () => {
      const workspace = WorkspaceFactory.inactive();
      expect(workspace.isActive).toBe(false);
    });
  });

  describe('withMembers', () => {
    it('should create workspace with members', () => {
      const result = WorkspaceFactory.withMembers(3);
      expect(result.workspace).toBeDefined();
      expect(result.members).toHaveLength(3);
    });
  });
});