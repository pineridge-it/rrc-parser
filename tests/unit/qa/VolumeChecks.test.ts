import { VolumeChecks } from '../../../src/qa/checks/VolumeChecks';
import { DEFAULT_QA_CONFIG } from '../../../src/qa/types';
import * as fs from 'fs';
import * as path from 'path';

describe('VolumeChecks', () => {
  let volumeChecks: VolumeChecks;

  beforeEach(() => {
    volumeChecks = new VolumeChecks(DEFAULT_QA_CONFIG.volume);
  });

  describe('checkRowCount', () => {
    it('should pass when record count is within acceptable bounds', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        currentCount: records.length,
        records
      };

      const result = volumeChecks.checkRowCount(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.name).toBe('volume.row_count');
    });

    it('should fail when record count is zero and alertOnZero is true', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/empty-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        currentCount: records.length,
        records
      };

      const result = volumeChecks.checkRowCount(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('critical');
      expect(result.message).toContain('Zero records detected');
    });

    it('should fail when record count is below minimum', () => {
      // Create a config with higher minimum
      const config = { ...DEFAULT_QA_CONFIG.volume, minRecords: 10 };
      const volumeChecksHighMin = new VolumeChecks(config);
      
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        currentCount: records.length,
        records
      };

      const result = volumeChecksHighMin.checkRowCount(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('below minimum');
    });

    it('should warn when record count exceeds maximum', () => {
      // Create a config with lower maximum
      const config = { ...DEFAULT_QA_CONFIG.volume, maxRecords: 2 };
      const volumeChecksLowMax = new VolumeChecks(config);
      
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        currentCount: records.length,
        records
      };

      const result = volumeChecksLowMax.checkRowCount(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('warning');
      expect(result.message).toContain('exceeds maximum');
    });

    it('should fail when volume delta exceeds threshold', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        currentCount: records.length,
        previousCount: 100, // Much higher than current (3)
        records
      };

      const result = volumeChecks.checkRowCount(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.message).toContain('Volume delta');
    });
  });

  describe('checkDuplicates', () => {
    it('should pass when no duplicates are found', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records,
        idField: 'permit_number'
      };

      const result = volumeChecks.checkDuplicates(context);
      
      expect(result.passed).toBe(true);
      expect(result.severity).toBe('info');
      expect(result.actual).toBe(0);
    });

    it('should fail when duplicates are found', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/records-with-duplicates.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        records,
        idField: 'permit_number'
      };

      const result = volumeChecks.checkDuplicates(context);
      
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
      expect(result.actual).toBe(1); // One duplicate permit_number
      expect(result.message).toContain('duplicate records');
    });
  });

  describe('runAll', () => {
    it('should run all volume checks', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/qa/volume/valid-records.json');
      const records = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      
      const context = {
        currentCount: records.length,
        records
      };

      const results = volumeChecks.runAll(context);
      
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('volume.row_count');
      expect(results[1].name).toBe('volume.duplicates');
    });
  });
});