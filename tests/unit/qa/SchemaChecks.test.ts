import { SchemaChecks } from '../../../src/qa/checks/SchemaChecks';
import { DEFAULT_QA_CONFIG } from '../../../src/qa/types';
import * as fs from 'fs';
import * as path from 'path';

describe('SchemaChecks', () => {
  let schemaChecks: SchemaChecks;

  beforeEach(() => {
    schemaChecks = new SchemaChecks(DEFAULT_QA_CONFIG.schema);
  });

  describe('checkRequiredFields', () => {
    it('should pass when all required fields are present', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-valid-schema.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = schemaChecks.checkRequiredFields(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.name).toBe('schema.required_fields');
      expect(result.message).toContain('All required fields present');
    });

    it('should fail when required fields are missing', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-missing-fields.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const result = schemaChecks.checkRequiredFields(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('critical');
      expect(result.message).toContain('Missing required fields');
    });
  });

  describe('checkSchemaDrift', () => {
    it('should pass when no schema drift is detected', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-valid-schema.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records,
        expectedSchema: {
          permit_number: 'string',
          operator_name: 'string',
          county: 'string',
          issued_date: 'string'
        }
      };

      const result = schemaChecks.checkSchemaDrift(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.name).toBe('schema.drift');
      expect(result.message).toContain('No schema drift detected');
    });

    it('should detect new fields when not allowed', () => {
      // Create config that doesn't allow new fields
      const config = { ...DEFAULT_QA_CONFIG.schema, allowNewFields: false };
      const schemaChecksNoNew = new SchemaChecks(config);
      
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-schema-drift.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records,
        expectedSchema: {
          permit_number: 'string',
          operator_name: 'string',
          county: 'string',
          issued_date: 'string'
        }
      };

      const result = schemaChecksNoNew.checkSchemaDrift(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('Schema drift detected');
      expect((result.actual as any).newFields).toContain('new_unexpected_field');
    });

    it('should detect missing fields when not allowed', () => {
      // Create config that doesn't allow missing fields
      const config = { ...DEFAULT_QA_CONFIG.schema, allowMissingFields: false };
      const schemaChecksNoMissing = new SchemaChecks(config);
      
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-missing-fields.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records,
        expectedSchema: {
          permit_number: 'string',
          operator_name: 'string',
          county: 'string',
          issued_date: 'string'
        }
      };

      const result = schemaChecksNoMissing.checkSchemaDrift(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('critical');
      expect(result.message).toContain('Schema drift detected');
      expect((result.actual as any).missingFields.length).toBeGreaterThan(0);
    });

    it('should skip check when no expected schema is provided', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-valid-schema.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
        // No expectedSchema provided
      };

      const result = schemaChecks.checkSchemaDrift(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.message).toContain('Schema drift check skipped');
    });
  });

  describe('checkDataTypes', () => {
    it('should pass when data types are correct', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-valid-schema.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records,
        expectedSchema: {
          permit_number: 'string',
          operator_name: 'string',
          county: 'string',
          issued_date: 'string',
          total_depth: 'number',
          well_status: 'string'
        }
      };

      const result = schemaChecks.checkDataTypes(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.name).toBe('schema.data_types');
      expect(result.message).toContain('All data types valid');
    });

    it('should detect type mismatches', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-type-mismatch.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records,
        expectedSchema: {
          permit_number: 'string',
          operator_name: 'string',
          county: 'string',
          issued_date: 'string',
          total_depth: 'number'
        }
      };

      const result = schemaChecks.checkDataTypes(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('Type errors');
    });

    it('should skip check when no expected schema is provided', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-valid-schema.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
        // No expectedSchema provided
      };

      const result = schemaChecks.checkDataTypes(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.message).toContain('Data type check skipped');
    });
  });

  describe('runAll', () => {
    it('should run all schema checks', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/schema/records-valid-schema.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records
      };

      const results = schemaChecks.runAll(context);
      
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('schema.required_fields');
      expect(results[1].name).toBe('schema.drift');
      expect(results[2].name).toBe('schema.data_types');
    });
  });
});