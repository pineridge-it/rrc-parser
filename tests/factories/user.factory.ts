/**
 * User Factory
 * 
 * Generates realistic user data for testing.
 */

import {
  randomId,
  randomUserRole,
  randomBoolean,
  randomArrayElements,
} from './generators';
import { faker } from '@faker-js/faker';

// ============================================================================
// Types
// ============================================================================

export interface UserPreferences {
  timezone: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  defaultAlertChannels: string[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'admin' | 'member' | 'viewer' | 'superadmin';
  emailVerified: boolean;
  phoneNumber?: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isActive: boolean;
}

// ============================================================================
// User Factory
// ============================================================================

export class UserFactory {
  /**
   * Create a single user with realistic defaults
   */
  static create(overrides: Partial<User> = {}): User {
    const firstName = overrides.firstName || faker.person.firstName();
    const lastName = overrides.lastName || faker.person.lastName();
    
    return {
      id: `user-${randomId()}`,
      email: faker.internet.email({ firstName, lastName }),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      role: randomUserRole(),
      emailVerified: true,
      preferences: {
        timezone: 'America/Chicago',
        notifications: {
          email: true,
          inApp: true,
          sms: false,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
        },
        defaultAlertChannels: ['email', 'in-app'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      ...overrides,
    };
  }

  /**
   * Create multiple users
   */
  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create an admin user
   */
  static admin(overrides?: Partial<User>): User {
    return this.create({
      role: 'admin',
      ...overrides,
    });
  }

  /**
   * Create a member user
   */
  static member(overrides?: Partial<User>): User {
    return this.create({
      role: 'member',
      ...overrides,
    });
  }

  /**
   * Create a viewer user
   */
  static viewer(overrides?: Partial<User>): User {
    return this.create({
      role: 'viewer',
      ...overrides,
    });
  }

  /**
   * Create a superadmin user
   */
  static superadmin(overrides?: Partial<User>): User {
    return this.create({
      role: 'superadmin',
      ...overrides,
    });
  }

  /**
   * Create an unverified user
   */
  static unverified(overrides?: Partial<User>): User {
    return this.create({
      emailVerified: false,
      ...overrides,
    });
  }

  /**
   * Create an inactive user
   */
  static inactive(overrides?: Partial<User>): User {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create a deleted user
   */
  static deleted(overrides?: Partial<User>): User {
    return this.create({
      deletedAt: new Date(),
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create a user with phone number
   */
  static withPhone(overrides?: Partial<User>): User {
    return this.create({
      phoneNumber: faker.phone.number(),
      preferences: {
        ...this.create().preferences,
        notifications: {
          email: true,
          inApp: true,
          sms: true,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create a user with specific timezone
   */
  static withTimezone(timezone: string, overrides?: Partial<User>): User {
    return this.create({
      preferences: {
        ...this.create().preferences,
        timezone,
      },
      ...overrides,
    });
  }

  /**
   * Create a user with quiet hours enabled
   */
  static withQuietHours(
    start: string = '22:00',
    end: string = '06:00',
    overrides?: Partial<User>
  ): User {
    return this.create({
      preferences: {
        ...this.create().preferences,
        quietHours: {
          enabled: true,
          start,
          end,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create a recently active user
   */
  static recentlyActive(overrides?: Partial<User>): User {
    return this.create({
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      ...overrides,
    });
  }

  /**
   * Create a user who hasn't logged in for a while
   */
  static inactiveLogin(daysInactive: number = 30, overrides?: Partial<User>): User {
    return this.create({
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * daysInactive),
      ...overrides,
    });
  }
}

export default UserFactory;
