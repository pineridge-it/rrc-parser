import { PermitParser } from '../../src/parser/PermitParser';
import { Config } from '../../src/config';
import * as path from 'path';
import * as fs from 'fs';

describe('PermitParser', () => {
  let parser: PermitParser;
  let config: Config;

  beforeEach(() => {
    config = new Config();
    parser = new PermitParser(config, {
      strictMode: false,
      verbose: false,
      enablePerformanceMonitoring: false,
      enableCheckpoints: false
    });
  });

  describe('constructor', () => {
    it('should create a parser with default configuration', () => {
      expect(parser).toBeInstanceOf(PermitParser);
    });

    it('should initialize stats correctly', () => {
      const stats = parser.getStats();
      expect(stats.linesProcessed).toBe(0);
      expect(stats.successfulPermits).toBe(0);
    });
  });

  describe('parseFile', () => {
    it('should parse a single permit file correctly', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/parser/single-permit.txt');
      
      // Ensure the fixture exists
      if (!fs.existsSync(fixturePath)) {
        fail(`Test fixture not found: ${fixturePath}`);
      }

      const result = await parser.parseFile(fixturePath);
      
      expect(result.permits).toBeDefined();
      expect(Object.keys(result.permits)).toHaveLength(1);
      expect(result.stats.linesProcessed).toBeGreaterThan(0);
      expect(result.stats.successfulPermits).toBe(1);
    });

    it('should handle empty files gracefully', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/parser/empty.txt');
      
      // Ensure the fixture exists
      if (!fs.existsSync(fixturePath)) {
        fail(`Test fixture not found: ${fixturePath}`);
      }

      const result = await parser.parseFile(fixturePath);
      
      expect(result.permits).toBeDefined();
      expect(Object.keys(result.permits)).toHaveLength(0);
      expect(result.stats.linesProcessed).toBe(0);
      expect(result.stats.successfulPermits).toBe(0);
    });

    it('should handle malformed sections', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/parser/malformed-sections.txt');
      
      // Ensure the fixture exists
      if (!fs.existsSync(fixturePath)) {
        fail(`Test fixture not found: ${fixturePath}`);
      }

      const result = await parser.parseFile(fixturePath);
      
      // Even with malformed data, it should still process what it can
      expect(result.permits).toBeDefined();
      expect(result.stats.linesProcessed).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should return current parsing statistics', () => {
      const stats = parser.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.linesProcessed).toBe('number');
      expect(typeof stats.successfulPermits).toBe('number');
    });
  });

  describe('reset', () => {
    it('should reset the parser state', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/parser/single-permit.txt');
      
      // Parse a file first
      await parser.parseFile(fixturePath);
      
      // Verify stats are not zero
      const statsBefore = parser.getStats();
      expect(statsBefore.linesProcessed).toBeGreaterThan(0);
      
      // Reset the parser
      parser.reset();
      
      // Verify stats are now zero
      const statsAfter = parser.getStats();
      expect(statsAfter.linesProcessed).toBe(0);
      expect(statsAfter.successfulPermits).toBe(0);
    });
  });
});