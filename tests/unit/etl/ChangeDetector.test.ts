import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ChangeDetector,
  createChangeDetector,
  PermitChange,
  ChangeDetectionResult,
} from '../../../src/etl/changes';

describe('ChangeDetector', () => {
  let detector: ChangeDetector;

  beforeEach(() => {
    detector = createChangeDetector({ etlRunId: 'test-run-123' });
  });

  describe('New Permit Detection', () => {
    it('should detect a new permit when no existing permit provided', () => {
      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        status: 'pending',
        operator_name_raw: 'Test Operator',
        surface_lat: 30.0,
        surface_lon: -97.0,
        version: 1,
      };

      const changes = detector.detectChanges(newPermit);

      expect(changes).toHaveLength(1);
      expect(changes[0].changeType).toBe('new');
      expect(changes[0].permitId).toBe('permit-1');
      expect(changes[0].previousValue).toBeNull();
      expect(changes[0].newValue).toEqual(newPermit);
      expect(changes[0].etlRunId).toBe('test-run-123');
      expect(changes[0].processedForAlerts).toBe(false);
    });
  });

  describe('Status Change Detection', () => {
    it('should detect status change from pending to approved', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        status: 'pending',
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        status: 'approved',
        approved_date: '2025-01-15',
        version: 1,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(1);
      expect(changes[0].changeType).toBe('status_change');
      expect(changes[0].previousValue).toEqual(existingPermit);
      expect(changes[0].newValue).toEqual(newPermit);
    });

    it('should not detect change when status is unchanged', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        status: 'approved',
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        status: 'approved',
        version: 1,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(0);
    });
  });

  describe('Operator Change Detection', () => {
    it('should detect operator change', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        operator_id: 'operator-1',
        operator_name_raw: 'Old Operator',
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        operator_id: 'operator-2',
        operator_name_raw: 'New Operator',
        version: 1,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(1);
      expect(changes[0].changeType).toBe('operator_change');
    });
  });

  describe('Amendment Detection', () => {
    it('should detect amendment when version increases', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        version: 2,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(1);
      expect(changes[0].changeType).toBe('amendment');
    });

    it('should not detect amendment when version is same', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        version: 1,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(0);
    });
  });

  describe('Location Update Detection', () => {
    it('should detect location change above threshold', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        surface_lat: 30.0,
        surface_lon: -97.0,
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        surface_lat: 30.001, // ~111 meters change
        surface_lon: -97.0,
        version: 1,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(1);
      expect(changes[0].changeType).toBe('location_update');
    });

    it('should not detect location change below threshold', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        surface_lat: 30.0,
        surface_lon: -97.0,
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        surface_lat: 30.00001, // ~1 meter change
        surface_lon: -97.0,
        version: 1,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(0);
    });

    it('should respect custom location threshold', () => {
      const customDetector = createChangeDetector({
        etlRunId: 'test',
        locationChangeThreshold: 1000, // 1km threshold
      });

      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        surface_lat: 30.0,
        surface_lon: -97.0,
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        surface_lat: 30.005, // ~555 meters change
        surface_lon: -97.0,
        version: 1,
      };

      const changes = customDetector.detectChanges(newPermit, existingPermit);

      expect(changes).toHaveLength(0); // Below 1km threshold
    });
  });

  describe('Multiple Changes Detection', () => {
    it('should detect multiple simultaneous changes', () => {
      const existingPermit = {
        id: 'permit-1',
        permit_number: '12345',
        status: 'pending',
        operator_id: 'operator-1',
        version: 1,
      };

      const newPermit = {
        id: 'permit-1',
        permit_number: '12345',
        status: 'approved',
        operator_id: 'operator-2',
        version: 2,
      };

      const changes = detector.detectChanges(newPermit, existingPermit);

      const changeTypes = changes.map((c) => c.changeType);
      expect(changeTypes).toContain('status_change');
      expect(changeTypes).toContain('operator_change');
      expect(changeTypes).toContain('amendment');
      expect(changes).toHaveLength(3);
    });
  });

  describe('Batch Processing', () => {
    it('should process batch of permits with mixed changes', () => {
      const existingPermits = new Map([
        [
          'permit-1',
          {
            id: 'permit-1',
            permit_number: '12345',
            status: 'pending',
            version: 1,
          },
        ],
        [
          'permit-2',
          {
            id: 'permit-2',
            permit_number: '67890',
            status: 'approved',
            version: 1,
          },
        ],
      ]);

      const newPermits = [
        {
          id: 'permit-1',
          permit_number: '12345',
          status: 'approved', // Status change
          version: 1,
        },
        {
          id: 'permit-2',
          permit_number: '67890',
          status: 'approved',
          version: 1, // No change
        },
        {
          id: 'permit-3',
          permit_number: '11111',
          status: 'pending',
          version: 1, // New permit
        },
      ];

      const result = detector.detectChangesBatch(newPermits, existingPermits);

      expect(result.newPermits).toBe(1);
      expect(result.statusChanges).toBe(1);
      expect(result.changes).toHaveLength(2);
    });

    it('should return correct statistics', () => {
      const existingPermits = new Map();
      const newPermits = [
        { id: 'p1', permit_number: '1', status: 'pending', version: 1 },
        { id: 'p2', permit_number: '2', status: 'approved', version: 1 },
        { id: 'p3', permit_number: '3', status: 'pending', version: 1 },
      ];

      const result = detector.detectChangesBatch(newPermits, existingPermits);

      expect(result.newPermits).toBe(3);
      expect(result.statusChanges).toBe(0);
      expect(result.amendments).toBe(0);
      expect(result.operatorChanges).toBe(0);
      expect(result.locationUpdates).toBe(0);
      expect(result.changes).toHaveLength(3);
    });
  });

  describe('Lookup Creation', () => {
    it('should create lookup map from array', () => {
      const permits = [
        { id: 'permit-1', permit_number: '12345' },
        { id: 'permit-2', permit_number: '67890' },
      ];

      const lookup = ChangeDetector.createLookup(permits);

      expect(lookup.get('permit-1')).toEqual(permits[0]);
      expect(lookup.get('permit-2')).toEqual(permits[1]);
      expect(lookup.size).toBe(2);
    });

    it('should skip permits without id', () => {
      const permits = [
        { id: 'permit-1', permit_number: '12345' },
        { permit_number: '67890' }, // No id
      ];

      const lookup = ChangeDetector.createLookup(permits);

      expect(lookup.size).toBe(1);
      expect(lookup.get('permit-1')).toBeDefined();
    });
  });
});
