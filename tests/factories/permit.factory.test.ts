/**
 * Permit Factory Tests
 *
 * Tests for the PermitFactory to ensure it generates valid, realistic data.
 */

import { PermitFactory } from './permit.factory';
import { TEXAS_COUNTIES, OPERATORS } from './generators';

describe('PermitFactory', () => {
  describe('create', () => {
    it('should create a valid permit with default values', () => {
      const permit = PermitFactory.create();

      expect(permit.permitNumber).toBeTruthy();
      expect(permit.apiNumber).toMatch(/^42-\d{3}-\d{5}$/);
      expect(TEXAS_COUNTIES).toContain(permit.county);
      expect(OPERATORS).toContain(permit.operatorName);
      expect(permit.surfaceLocation.latitude).toBeGreaterThanOrEqual(25.8);
      expect(permit.surfaceLocation.latitude).toBeLessThanOrEqual(36.5);
      expect(permit.surfaceLocation.longitude).toBeGreaterThanOrEqual(-106.6);
      expect(permit.surfaceLocation.longitude).toBeLessThanOrEqual(-93.5);
      expect(permit.issuedDate).toBeInstanceOf(Date);
    });

    it('should apply overrides', () => {
      const permit = PermitFactory.create({ county: 'Midland' });
      expect(permit.county).toBe('Midland');
    });

    it('should create unique permits on multiple calls', () => {
      const permit1 = PermitFactory.create();
      const permit2 = PermitFactory.create();
      expect(permit1.permitNumber).not.toBe(permit2.permitNumber);
      expect(permit1.apiNumber).not.toBe(permit2.apiNumber);
    });
  });

  describe('createMany', () => {
    it('should create the specified number of permits', () => {
      const permits = PermitFactory.createMany(10);
      expect(permits).toHaveLength(10);
    });

    it('should create unique permits', () => {
      const permits = PermitFactory.createMany(100);
      const permitNumbers = new Set(permits.map(p => p.permitNumber));
      expect(permitNumbers.size).toBe(100);
    });

    it('should apply overrides to all permits', () => {
      const permits = PermitFactory.createMany(5, { county: 'Midland' });
      permits.forEach(permit => {
        expect(permit.county).toBe('Midland');
      });
    });
  });

  describe('withOperator', () => {
    it('should create permit with specific operator', () => {
      const permit = PermitFactory.withOperator('Pioneer Natural Resources');
      expect(permit.operatorName).toBe('Pioneer Natural Resources');
    });
  });

  describe('inCounty', () => {
    it('should create permit in specific county', () => {
      const permit = PermitFactory.inCounty('Midland');
      expect(permit.county).toBe('Midland');
    });
  });

  describe('withStatus', () => {
    it('should create permit with specific status', () => {
      const permit = PermitFactory.withStatus('ACTIVE');
      expect(permit.status).toBe('ACTIVE');
    });
  });

  describe('withDateRange', () => {
    it('should create permit within date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const permit = PermitFactory.withDateRange(start, end);
      expect(permit.issuedDate).toBeInstanceOf(Date);
      expect(permit.issuedDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(permit.issuedDate.getTime()).toBeLessThanOrEqual(end.getTime());
    });
  });

  describe('withLocation', () => {
    it('should create permit at specific location', () => {
      const permit = PermitFactory.withLocation(32.0, -102.0);
      expect(permit.surfaceLocation.latitude).toBe(32.0);
      expect(permit.surfaceLocation.longitude).toBe(-102.0);
    });
  });

  describe('oilWell, gasWell, injectionWell', () => {
    it('should create oil well', () => {
      const permit = PermitFactory.oilWell();
      expect(permit.wellType).toBe('OIL');
    });

    it('should create gas well', () => {
      const permit = PermitFactory.gasWell();
      expect(permit.wellType).toBe('GAS');
    });

    it('should create injection well', () => {
      const permit = PermitFactory.injectionWell();
      expect(permit.wellType).toBe('INJECTION');
    });
  });

  describe('horizontal, vertical, directional', () => {
    it('should create horizontal well', () => {
      const permit = PermitFactory.horizontal();
      expect(permit.drillType).toBe('HORIZONTAL');
    });

    it('should create vertical well', () => {
      const permit = PermitFactory.vertical();
      expect(permit.drillType).toBe('VERTICAL');
    });

    it('should create directional well', () => {
      const permit = PermitFactory.directional();
      expect(permit.drillType).toBe('DIRECTIONAL');
    });
  });
});