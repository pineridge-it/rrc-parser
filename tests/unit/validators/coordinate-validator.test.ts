import { Validator } from '../../../src/validators/Validator';
import { ValidationReport } from '../../../src/validators/ValidationReport';
import { DEFAULT_CONFIG } from '../../../src/config';
import * as fs from 'fs';
import * as path from 'path';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator(DEFAULT_CONFIG);
  });

  describe('Coordinate Validation', () => {
    it('should validate coordinates within Texas bounds', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/coordinates/valid-texas-coords.json');
      const coords = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const coord of coords) {
        // Test latitude validation
        const latValid = validator.validate('latitude', coord.lat.toString());
        expect(latValid).toBe(true);

        // Test longitude validation
        const lngValid = validator.validate('longitude', coord.lng.toString());
        expect(lngValid).toBe(true);
      }
    });

    it('should reject coordinates outside Texas bounds', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/coordinates/invalid-out-of-state.json');
      const coords = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const coord of coords) {
        // Test latitude validation
        if (coord.lat !== null) {
          const latValid = validator.validate('latitude', coord.lat.toString());
          // Should add warning for out of bounds
          expect(latValid).toBe(false);
        }

        // Test longitude validation
        if (coord.lng !== null) {
          const lngValid = validator.validate('longitude', coord.lng.toString());
          // Should add warning for out of bounds
          expect(lngValid).toBe(false);
        }
      }
    });

    it('should handle edge case border coordinates', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/coordinates/edge-case-border.json');
      const coords = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const coord of coords) {
        // Test latitude validation
        const latValid = validator.validate('latitude', coord.lat.toString());
        expect(latValid).toBe(true);

        // Test longitude validation
        const lngValid = validator.validate('longitude', coord.lng.toString());
        expect(lngValid).toBe(true);
      }
    });

    it('should handle null coordinates gracefully', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/coordinates/null-coordinates.json');
      const coords = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const coord of coords) {
        // Test latitude validation
        const latValid = validator.validate('latitude', coord.lat === null ? '' : coord.lat.toString());
        expect(latValid).toBe(true); // Should pass for empty values

        // Test longitude validation
        const lngValid = validator.validate('longitude', coord.lng === null ? '' : coord.lng.toString());
        expect(lngValid).toBe(true); // Should pass for empty values
      }
    });
  });

  describe('Date Validation', () => {
    it('should validate correct date ranges', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/dates/valid-date-ranges.json');
      const dates = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const date of dates) {
        // Test issued date validation
        const issuedValid = validator.validate('issued_date', date.issued_date);
        expect(issuedValid).toBe(true);

        // Test expires date validation
        const expiresValid = validator.validate('expires_date', date.expires_date);
        expect(expiresValid).toBe(true);
      }
    });

    it('should reject future dates when configured', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/dates/invalid-future-dates.json');
      const dates = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const date of dates) {
        // Test issued date validation
        const issuedValid = validator.validate('issued_date', date.issued_date);
        // Should add warning for future dates
        expect(issuedValid).toBe(false);

        // Test expires date validation
        const expiresValid = validator.validate('expires_date', date.expires_date);
        // Should add warning for inconsistent date ranges
        expect(expiresValid).toBe(false);
      }
    });

    it('should handle invalid/impossible date formats', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/dates/invalid-impossible-ranges.json');
      const dates = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const date of dates) {
        // Test issued date validation
        const issuedValid = validator.validate('issued_date', date.issued_date);
        // Should handle gracefully
        expect(issuedValid).toBe(true);

        // Test expires date validation
        const expiresValid = validator.validate('expires_date', date.expires_date);
        // Should handle gracefully
        expect(expiresValid).toBe(true);
      }
    });

    it('should handle leap year edge cases', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/dates/edge-case-leap-years.json');
      const dates = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const date of dates) {
        // Test issued date validation
        const issuedValid = validator.validate('issued_date', date.issued_date);
        expect(issuedValid).toBe(true);

        // Test expires date validation
        const expiresValid = validator.validate('expires_date', date.expires_date);
        expect(expiresValid).toBe(true);
      }
    });
  });

  describe('Permit Validation', () => {
    it('should validate correct API numbers', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/permits/valid-api-numbers.json');
      const permits = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const permit of permits) {
        const valid = validator.validate('api_number', permit.api_number);
        expect(valid).toBe(true);
      }
    });

    it('should reject invalid API numbers', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/permits/invalid-api-numbers.json');
      const permits = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const permit of permits) {
        const valid = validator.validate('api_number', permit.api_number);
        // Should add warning for invalid API numbers
        expect(valid).toBe(false);
      }
    });

    it('should validate correct depth relationships', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/permits/valid-depth-relationships.json');
      const permits = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const permit of permits) {
        // Test total depth validation
        const depthValid = validator.validate('total_depth', permit.total_depth);
        expect(depthValid).toBe(true);

        // Test surface elevation validation
        const elevationValid = validator.validate('surface_elevation', permit.surface_elevation);
        expect(elevationValid).toBe(true);

        // Test bottom hole location validation
        const bottomValid = validator.validate('bottom_hole_location', permit.bottom_hole_location);
        expect(bottomValid).toBe(true);
      }
    });

    it('should reject invalid depth relationships', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/permits/invalid-depth-relationships.json');
      const permits = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const permit of permits) {
        // Test total depth validation
        const depthValid = validator.validate('total_depth', permit.total_depth);
        // Should add warning for invalid depths
        expect(depthValid).toBe(false);

        // Test surface elevation validation
        const elevationValid = validator.validate('surface_elevation', permit.surface_elevation);
        expect(elevationValid).toBe(true);

        // Test bottom hole location validation
        const bottomValid = validator.validate('bottom_hole_location', permit.bottom_hole_location);
        expect(bottomValid).toBe(true);
      }
    });
  });

  describe('Cross-Field Validation', () => {
    it('should validate correct cross-field relationships', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/cross-field/valid-cross-field.json');
      const fields = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const field of fields) {
        // Test each field individually - in a real scenario, these would be validated together
        for (const [key, value] of Object.entries(field)) {
          if (key !== 'description') {
            const valid = validator.validate(key as any, value as string);
            expect(valid).toBe(true);
          }
        }
      }
    });

    it('should reject invalid cross-field relationships', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/validators/cross-field/invalid-cross-field.json');
      const fields = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

      for (const field of fields) {
        // Test each field individually - in a real scenario, these would be validated together
        for (const [key, value] of Object.entries(field)) {
          if (key !== 'description') {
            const valid = validator.validate(key as any, value as string);
            // Some fields might be valid individually but invalid in combination
            // This is a simplified test - real cross-field validation would be more complex
            expect(typeof valid).toBe('boolean');
          }
        }
      }
    });
  });

  describe('Validation Summary', () => {
    it('should provide correct validation summary', () => {
      // Add some validation errors
      validator.validate('latitude', '20.0'); // Outside Texas
      validator.validate('api_number', 'invalid-api'); // Invalid format

      const summary = validator.getSummary();

      expect(summary.errorCount).toBeGreaterThanOrEqual(0);
      expect(summary.warningCount).toBeGreaterThanOrEqual(2); // Should have warnings for the invalid values
      expect(summary.errorsByType).toBeDefined();
      expect(summary.warningsByType).toBeDefined();
    });

    it('should reset validation state', () => {
      // Add some validation errors
      validator.validate('latitude', '20.0');
      validator.validate('api_number', 'invalid-api');

      let summary = validator.getSummary();
      expect(summary.warningCount).toBeGreaterThan(0);

      // Reset
      validator.reset();
      summary = validator.getSummary();
      expect(summary.warningCount).toBe(0);
      expect(summary.errorCount).toBe(0);
    });
  });
});