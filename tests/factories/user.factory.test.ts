/**
 * User Factory Tests
 *
 * Tests for the UserFactory to ensure it generates valid, realistic user data.
 */

import { UserFactory } from './user.factory';

describe('UserFactory', () => {
  describe('create', () => {
    it('should create a valid user with default values', () => {
      const user = UserFactory.create();

      expect(user.id).toBeTruthy();
      expect(user.email).toContain('@');
      expect(user.firstName).toBeTruthy();
      expect(user.lastName).toBeTruthy();
      expect(user.fullName).toBe(`${user.firstName} ${user.lastName}`);
      expect(['admin', 'member', 'viewer', 'superadmin']).toContain(user.role);
      expect(typeof user.emailVerified).toBe('boolean');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should apply overrides', () => {
      const user = UserFactory.create({ email: 'test@example.com' });
      expect(user.email).toBe('test@example.com');
    });

    it('should create unique users on multiple calls', () => {
      const user1 = UserFactory.create();
      const user2 = UserFactory.create();
      expect(user1.id).not.toBe(user2.id);
      expect(user1.email).not.toBe(user2.email);
    });
  });

  describe('createMany', () => {
    it('should create the specified number of users', () => {
      const users = UserFactory.createMany(10);
      expect(users).toHaveLength(10);
    });

    it('should create unique users', () => {
      const users = UserFactory.createMany(50);
      const ids = new Set(users.map(u => u.id));
      expect(ids.size).toBe(50);
    });
  });

  describe('admin', () => {
    it('should create admin user', () => {
      const user = UserFactory.admin();
      expect(user.role).toBe('admin');
    });
  });

  describe('member', () => {
    it('should create member user', () => {
      const user = UserFactory.member();
      expect(user.role).toBe('member');
    });
  });

  describe('viewer', () => {
    it('should create viewer user', () => {
      const user = UserFactory.viewer();
      expect(user.role).toBe('viewer');
    });
  });

  describe('superadmin', () => {
    it('should create superadmin user', () => {
      const user = UserFactory.superadmin();
      expect(user.role).toBe('superadmin');
    });
  });

  describe('verified', () => {
    it('should create verified user', () => {
      const user = UserFactory.verified();
      expect(user.emailVerified).toBe(true);
    });
  });

  describe('unverified', () => {
    it('should create unverified user', () => {
      const user = UserFactory.unverified();
      expect(user.emailVerified).toBe(false);
    });
  });

  describe('inactive', () => {
    it('should create inactive user', () => {
      const user = UserFactory.inactive();
      expect(user.isActive).toBe(false);
    });
  });

  describe('withPreferences', () => {
    it('should create user with custom preferences', () => {
      const user = UserFactory.withPreferences({
        timezone: 'America/Chicago',
        notifications: { email: true, inApp: false, sms: true }
      });
      expect(user.preferences.timezone).toBe('America/Chicago');
      expect(user.preferences.notifications.email).toBe(true);
      expect(user.preferences.notifications.inApp).toBe(false);
      expect(user.preferences.notifications.sms).toBe(true);
    });
  });
});