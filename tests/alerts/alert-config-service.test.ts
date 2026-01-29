/**
 * Alert Configuration Service Tests
 */

import {
  AlertConfigService,
  InMemoryAlertStorage,
  MockPermitSource,
} from '../../src/lib/alerts/AlertConfigService';
import {
  AlertConfigForm,
  AlertFilterOptions,
} from '../../src/types/alert-config';
import { CleanPermit } from '../../src/types/alert';

describe('AlertConfigService', () => {
  let service: AlertConfigService;
  let storage: InMemoryAlertStorage;
  let permitSource: MockPermitSource;

  beforeEach(() => {
    storage = new InMemoryAlertStorage();
    permitSource = new MockPermitSource();
    service = new AlertConfigService(storage, permitSource);
  });

  const createValidForm = (): AlertConfigForm => ({
    name: 'Test Alert',
    triggers: {
      newPermits: true,
      statusChanges: false,
    },
    channels: {
      email: true,
      sms: false,
      inApp: true,
    },
    frequency: 'immediate',
  });

  describe('createAlert', () => {
    it('should create a valid alert', async () => {
      const form = createValidForm();
      const result = await service.createAlert('user-1', 'workspace-1', form);

      expect(result.success).toBe(true);
      expect(result.alert).toBeDefined();
      expect(result.alert?.name).toBe('Test Alert');
      expect(result.alert?.isActive).toBe(true);
      expect(result.alert?.userId).toBe('user-1');
      expect(result.alert?.workspaceId).toBe('workspace-1');
    });

    it('should reject alert without name', async () => {
      const form = { ...createValidForm(), name: '' };
      const result = await service.createAlert('user-1', 'workspace-1', form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'name', message: 'Alert name is required' })
      );
    });

    it('should reject alert with name too long', async () => {
      const form = { ...createValidForm(), name: 'a'.repeat(101) };
      const result = await service.createAlert('user-1', 'workspace-1', form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: 'Alert name must be 100 characters or less',
        })
      );
    });

    it('should reject alert without triggers', async () => {
      const form: AlertConfigForm = {
        ...createValidForm(),
        triggers: {
          newPermits: false,
          statusChanges: false,
        },
      };
      const result = await service.createAlert('user-1', 'workspace-1', form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'triggers',
          message: 'At least one trigger condition is required',
        })
      );
    });

    it('should reject alert without channels', async () => {
      const form: AlertConfigForm = {
        ...createValidForm(),
        channels: {
          email: false,
          sms: false,
          inApp: false,
        },
      };
      const result = await service.createAlert('user-1', 'workspace-1', form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'channels',
          message: 'At least one notification channel is required',
        })
      );
    });

    it('should accept alert with operator watchlist only', async () => {
      const form: AlertConfigForm = {
        ...createValidForm(),
        triggers: {
          newPermits: false,
          statusChanges: false,
          specificOperators: ['op-1', 'op-2'],
        },
      };
      const result = await service.createAlert('user-1', 'workspace-1', form);

      expect(result.success).toBe(true);
    });
  });

  describe('getAlert', () => {
    it('should retrieve an existing alert', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);

      const retrieved = await service.getAlert(created.alert!.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.alert!.id);
      expect(retrieved?.name).toBe('Test Alert');
    });

    it('should return null for non-existent alert', async () => {
      const retrieved = await service.getAlert('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('updateAlert', () => {
    it('should update alert name', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);

      const result = await service.updateAlert(created.alert!.id, { name: 'Updated Alert' });

      expect(result.success).toBe(true);
      expect(result.alert?.name).toBe('Updated Alert');
    });

    it('should update alert channels', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);

      const result = await service.updateAlert(created.alert!.id, {
        channels: { email: false, sms: true, inApp: true },
      });

      expect(result.success).toBe(true);
      expect(result.alert?.config.channels.email).toBe(false);
      expect(result.alert?.config.channels.sms).toBe(true);
    });

    it('should reject update to invalid state', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);

      const result = await service.updateAlert(created.alert!.id, { name: '' });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should return error for non-existent alert', async () => {
      const result = await service.updateAlert('non-existent-id', { name: 'New Name' });

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'id', message: 'Alert not found' })
      );
    });
  });

  describe('toggleAlert', () => {
    it('should pause an active alert', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);
      expect(created.alert?.isActive).toBe(true);

      const result = await service.toggleAlert({
        alertId: created.alert!.id,
        isActive: false,
      });

      expect(result.success).toBe(true);
      expect(result.alert?.isActive).toBe(false);
    });

    it('should resume a paused alert', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);
      await service.toggleAlert({ alertId: created.alert!.id, isActive: false });

      const result = await service.toggleAlert({
        alertId: created.alert!.id,
        isActive: true,
      });

      expect(result.success).toBe(true);
      expect(result.alert?.isActive).toBe(true);
    });

    it('should return failure for non-existent alert', async () => {
      const result = await service.toggleAlert({
        alertId: 'non-existent-id',
        isActive: false,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteAlert', () => {
    it('should soft delete an alert', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);

      const result = await service.deleteAlert({
        alertId: created.alert!.id,
        permanent: false,
      });

      expect(result.success).toBe(true);
      const alert = await service.getAlert(created.alert!.id);
      expect(alert?.isActive).toBe(false);
    });

    it('should hard delete an alert', async () => {
      const form = createValidForm();
      const created = await service.createAlert('user-1', 'workspace-1', form);

      const result = await service.deleteAlert({
        alertId: created.alert!.id,
        permanent: true,
      });

      expect(result.success).toBe(true);
      const alert = await service.getAlert(created.alert!.id);
      expect(alert).toBeNull();
    });
  });

  describe('listAlerts', () => {
    beforeEach(async () => {
      // Create multiple alerts
      await service.createAlert('user-1', 'workspace-1', {
        ...createValidForm(),
        name: 'Alert A',
      });
      await service.createAlert('user-1', 'workspace-1', {
        ...createValidForm(),
        name: 'Alert B',
      });
      await service.createAlert('user-2', 'workspace-1', {
        ...createValidForm(),
        name: 'Alert C',
      });
      await service.createAlert('user-1', 'workspace-2', {
        ...createValidForm(),
        name: 'Alert D',
      });
    });

    it('should list all alerts', async () => {
      const result = await service.listAlerts({
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(4);
      expect(result.items.length).toBe(4);
    });

    it('should filter by workspace', async () => {
      const result = await service.listAlerts({
        workspaceId: 'workspace-1',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(3);
      // Note: AlertListItem doesn't include workspaceId, so we verify by checking
      // that we got the right number of results for the workspace filter
    });

    it('should filter by user', async () => {
      const result = await service.listAlerts({
        userId: 'user-1',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(3);
      // Note: AlertListItem doesn't include userId, so we verify by checking
      // that we got the right number of results for the user filter
    });

    it('should filter by search term', async () => {
      const result = await service.listAlerts({
        searchTerm: 'Alert A',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Alert A');
    });

    it('should paginate results', async () => {
      const result = await service.listAlerts({
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 2,
        offset: 0,
      });

      expect(result.total).toBe(4);
      expect(result.items.length).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(0);
    });

    it('should sort by name ascending', async () => {
      const result = await service.listAlerts({
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      });

      const names = result.items.map(i => i.name);
      expect(names).toEqual(['Alert A', 'Alert B', 'Alert C', 'Alert D']);
    });

    it('should sort by name descending', async () => {
      const result = await service.listAlerts({
        sortBy: 'name',
        sortOrder: 'desc',
        limit: 10,
        offset: 0,
      });

      const names = result.items.map(i => i.name);
      expect(names).toEqual(['Alert D', 'Alert C', 'Alert B', 'Alert A']);
    });
  });

  describe('previewAlert', () => {
    const mockPermits: CleanPermit[] = [
      {
        id: 'permit-1',
        permitNumber: 'PERM-001',
        operatorId: 'op-1',
        operatorName: 'Operator A',
        county: 'Midland',
        status: 'approved',
        isAmendment: false,
        metadata: {},
      },
      {
        id: 'permit-2',
        permitNumber: 'PERM-002',
        operatorId: 'op-2',
        operatorName: 'Operator B',
        county: 'Ector',
        status: 'pending',
        isAmendment: false,
        metadata: {},
      },
      {
        id: 'permit-3',
        permitNumber: 'PERM-003',
        operatorId: 'op-1',
        operatorName: 'Operator A',
        county: 'Midland',
        status: 'approved',
        isAmendment: false,
        metadata: {},
      },
    ];

    beforeEach(() => {
      permitSource.setPermits(mockPermits);
    });

    it('should preview permits matching operator filter', async () => {
      const form: AlertConfigForm = {
        name: 'Operator Alert',
        triggers: {
          newPermits: true,
          statusChanges: false,
          specificOperators: ['op-1'],
        },
        channels: { email: true, sms: false, inApp: true },
        frequency: 'immediate',
      };

      const result = await service.previewAlert({
        config: form,
        workspaceId: 'workspace-1',
        limit: 10,
      });

      expect(result.totalCount).toBe(2);
      expect(result.samplePermits.length).toBe(2);
      expect(result.samplePermits.every(p => p.operatorName === 'Operator A')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const form = createValidForm();

      const result = await service.previewAlert({
        config: form,
        workspaceId: 'workspace-1',
        limit: 2,
      });

      expect(result.samplePermits.length).toBe(2);
      expect(result.isTruncated).toBe(true);
    });

    it('should map permits to preview format', async () => {
      const form = createValidForm();

      const result = await service.previewAlert({
        config: form,
        workspaceId: 'workspace-1',
        limit: 1,
      });

      const permit = result.samplePermits[0];
      expect(permit.id).toBeDefined();
      expect(permit.permitNumber).toBeDefined();
      expect(permit.operatorName).toBeDefined();
    });
  });

  describe('validateForm', () => {
    it('should validate quiet hours time format', () => {
      const form: AlertConfigForm = {
        ...createValidForm(),
        quietHours: {
          start: '25:00', // Invalid
          end: '07:00',
          timezone: 'America/New_York',
        },
      };

      const result = service.validateForm(form);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quietHours.start',
          message: 'Invalid time format (use HH:MM)',
        })
      );
    });

    it('should require timezone for quiet hours', () => {
      const form: AlertConfigForm = {
        ...createValidForm(),
        quietHours: {
          start: '22:00',
          end: '07:00',
          timezone: '',
        },
      };

      const result = service.validateForm(form);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quietHours.timezone',
          message: 'Timezone is required for quiet hours',
        })
      );
    });

    it('should accept valid quiet hours', () => {
      const form: AlertConfigForm = {
        ...createValidForm(),
        quietHours: {
          start: '22:00',
          end: '07:00',
          timezone: 'America/New_York',
        },
      };

      const result = service.validateForm(form);

      expect(result.isValid).toBe(true);
    });
  });

  describe('formToAlertRule', () => {
    it('should convert form to alert rule', () => {
      const form: AlertConfigForm = {
        name: 'Test Rule',
        aoiId: 'aoi-1',
        triggers: {
          newPermits: true,
          statusChanges: true,
          specificOperators: ['op-1'],
        },
        channels: {
          email: true,
          sms: false,
          inApp: true,
        },
        frequency: 'daily',
      };

      const rule = service.formToAlertRule(form, 'workspace-1');

      expect(rule.name).toBe('Test Rule');
      expect(rule.workspaceId).toBe('workspace-1');
      expect(rule.aoiIds).toEqual(['aoi-1']);
      expect(rule.operatorWatchlist).toEqual(['op-1']);
      expect(rule.notifyOnAmendment).toBe(true);
      expect(rule.channels.length).toBe(2);
      expect(rule.channels.some(c => c.type === 'email')).toBe(true);
      expect(rule.channels.some(c => c.type === 'push')).toBe(true);
    });

    it('should handle form without AOI', () => {
      const form = createValidForm();
      const rule = service.formToAlertRule(form, 'workspace-1');

      expect(rule.aoiIds).toEqual([]);
    });
  });

  describe('getUserAlerts', () => {
    beforeEach(async () => {
      await service.createAlert('user-1', 'workspace-1', {
        ...createValidForm(),
        name: 'User 1 Alert 1',
      });
      await service.createAlert('user-1', 'workspace-1', {
        ...createValidForm(),
        name: 'User 1 Alert 2',
      });
      await service.createAlert('user-2', 'workspace-1', {
        ...createValidForm(),
        name: 'User 2 Alert',
      });
    });

    it('should get alerts for specific user and workspace', async () => {
      const result = await service.getUserAlerts('user-1', 'workspace-1');

      expect(result.total).toBe(2);
      expect(result.items.every(i => i.name.startsWith('User 1'))).toBe(true);
    });
  });
});
