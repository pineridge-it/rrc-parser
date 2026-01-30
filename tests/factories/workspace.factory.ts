/**
 * Workspace Factory
 * 
 * Generates realistic workspace data for testing.
 */

import {
  randomId,
  randomWorkspacePlan,
  randomBoolean,
  randomInt,
} from './generators';
import { faker } from '@faker-js/faker';
import { User, UserFactory } from './user.factory';

// ============================================================================
// Types
// ============================================================================

export interface WorkspaceSettings {
  maxAlerts: number;
  maxUsers: number;
  maxAOIs: number;
  maxApiCallsPerDay: number;
  dataRetentionDays: number;
  features: {
    alerts: boolean;
    exports: boolean;
    api: boolean;
    webhooks: boolean;
    sso: boolean;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: WorkspaceSettings;
  billingEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isActive: boolean;
}

export interface WorkspaceWithMembers {
  workspace: Workspace;
  members: User[];
}

// ============================================================================
// Workspace Factory
// ============================================================================

export class WorkspaceFactory {
  /**
   * Create a single workspace with realistic defaults
   */
  static create(overrides: Partial<Workspace> = {}): Workspace {
    const name = overrides.name || faker.company.name();
    
    return {
      id: `ws-${randomId()}`,
      name: `${name} Workspace`,
      slug: faker.helpers.slugify(name),
      description: faker.company.catchPhrase(),
      plan: 'free',
      settings: {
        maxAlerts: 10,
        maxUsers: 5,
        maxAOIs: 5,
        maxApiCallsPerDay: 1000,
        dataRetentionDays: 90,
        features: {
          alerts: true,
          exports: false,
          api: false,
          webhooks: false,
          sso: false,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      ...overrides,
    };
  }

  /**
   * Create multiple workspaces
   */
  static createMany(count: number, overrides?: Partial<Workspace>): Workspace[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a free plan workspace
   */
  static free(overrides?: Partial<Workspace>): Workspace {
    return this.create({
      plan: 'free',
      settings: {
        maxAlerts: 10,
        maxUsers: 5,
        maxAOIs: 5,
        maxApiCallsPerDay: 1000,
        dataRetentionDays: 90,
        features: {
          alerts: true,
          exports: false,
          api: false,
          webhooks: false,
          sso: false,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create a pro plan workspace
   */
  static pro(overrides?: Partial<Workspace>): Workspace {
    return this.create({
      plan: 'pro',
      settings: {
        maxAlerts: 100,
        maxUsers: 20,
        maxAOIs: 50,
        maxApiCallsPerDay: 10000,
        dataRetentionDays: 365,
        features: {
          alerts: true,
          exports: true,
          api: true,
          webhooks: true,
          sso: false,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create an enterprise plan workspace
   */
  static enterprise(overrides?: Partial<Workspace>): Workspace {
    return this.create({
      plan: 'enterprise',
      settings: {
        maxAlerts: 1000,
        maxUsers: 100,
        maxAOIs: 500,
        maxApiCallsPerDay: 100000,
        dataRetentionDays: 1095, // 3 years
        features: {
          alerts: true,
          exports: true,
          api: true,
          webhooks: true,
          sso: true,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create a workspace with members
   */
  static withMembers(
    memberCount: number = 3,
    overrides?: Partial<Workspace>
  ): WorkspaceWithMembers {
    const workspace = this.create(overrides);
    const members = UserFactory.createMany(memberCount);
    return { workspace, members };
  }

  /**
   * Create a workspace at its user limit
   */
  static atUserLimit(overrides?: Partial<Workspace>): Workspace {
    const workspace = this.create(overrides);
    return {
      ...workspace,
      settings: {
        ...workspace.settings,
        maxUsers: 1,
      },
    };
  }

  /**
   * Create a workspace at its alert limit
   */
  static atAlertLimit(overrides?: Partial<Workspace>): Workspace {
    const workspace = this.create(overrides);
    return {
      ...workspace,
      settings: {
        ...workspace.settings,
        maxAlerts: 1,
      },
    };
  }

  /**
   * Create an inactive workspace
   */
  static inactive(overrides?: Partial<Workspace>): Workspace {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create a deleted workspace
   */
  static deleted(overrides?: Partial<Workspace>): Workspace {
    return this.create({
      deletedAt: new Date(),
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create a workspace with specific features enabled
   */
  static withFeatures(
    features: Partial<WorkspaceSettings['features']>,
    overrides?: Partial<Workspace>
  ): Workspace {
    const workspace = this.create(overrides);
    return {
      ...workspace,
      settings: {
        ...workspace.settings,
        features: {
          ...workspace.settings.features,
          ...features,
        },
      },
    };
  }

  /**
   * Create a workspace with API access
   */
  static withApiAccess(overrides?: Partial<Workspace>): Workspace {
    return this.pro({
      ...overrides,
      settings: {
        ...this.pro().settings,
        ...overrides?.settings,
      },
    });
  }

  /**
   * Create a workspace with SSO enabled
   */
  static withSso(overrides?: Partial<Workspace>): Workspace {
    return this.enterprise({
      ...overrides,
      settings: {
        ...this.enterprise().settings,
        ...overrides?.settings,
      },
    });
  }
}

export default WorkspaceFactory;
