/**
 * Test Factories Index
 * 
 * Central export point for all test data factories.
 * 
 * Usage:
 *   import { PermitFactory, UserFactory, AlertRuleFactory } from './factories';
 *   
 *   const permit = PermitFactory.create({ county: 'Midland' });
 *   const user = UserFactory.create();
 *   const rule = AlertRuleFactory.matchingPermitCriteria({ county: 'Midland' });
 */

// Core factories
export { PermitFactory, PermitData } from './permit.factory';
export { AlertRuleFactory, AlertRule, AlertRuleFilters } from './alert-rule.factory';
export { UserFactory, User, UserPreferences } from './user.factory';
export { WorkspaceFactory, Workspace, WorkspaceSettings, WorkspaceWithMembers } from './workspace.factory';

// Generators and utilities
export * from './generators';

// Re-export faker for convenience
export { faker } from '@faker-js/faker';
