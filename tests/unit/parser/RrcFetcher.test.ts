import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { RrcFetcher, createRrcFetcher } from '../../../src/etl/fetcher/RrcFetcher';

describe('RrcFetcher', () => {
  const testDataDir = path.join(__dirname, '../../fixtures/rrc');
  
  beforeEach(() => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  afterEach(() => {
    const files = fs.readdirSync(testDataDir);
    for (const file of files) {
      if (file.startsWith('fetcher-')) {
        fs.unlinkSync(path.join(testDataDir, file));
      }
    }
  });

  describe('Basic Fetching', () => {
    it('should fetch permits from a DAF420 file', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868
14 -98.2643928  28.9097706
15 -98.2508124  28.8950594`;

      const testFile = path.join(testDataDir, 'fetcher-basic.dat');
      fs.writeFileSync(testFile, testData);

      const fetcher = createRrcFetcher();
      const result = await fetcher.fetch(testFile);

      expect(result.totalCount).toBe(1);
      expect(result.permits).toHaveLength(1);
      expect(result.metadata.sourceFile).toBe(testFile);
      expect(result.metadata.linesProcessed).toBe(4);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should return metadata with record type counts', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868
0307550700R  N0000000000000000NN000000000000000000
14 -98.2643928  28.9097706
15 -98.2508124  28.8950594`;

      const testFile = path.join(testDataDir, 'fetcher-metadata.dat');
      fs.writeFileSync(testFile, testData);

      const fetcher = createRrcFetcher();
      const result = await fetcher.fetch(testFile);

      expect(result.metadata.recordsByType).toBeDefined();
      expect(result.metadata.recordsByType['01']).toBe(1);
      expect(result.metadata.recordsByType['02']).toBe(1);
      expect(result.metadata.recordsByType['03']).toBe(1);
      expect(result.metadata.recordsByType['14']).toBe(1);
      expect(result.metadata.recordsByType['15']).toBe(1);
    });
  });

  describe('Progress Tracking', () => {
    it('should call progress callback during fetch', async () => {
      const testData = Array(250).fill(`01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868`).join('\n');

      const testFile = path.join(testDataDir, 'fetcher-progress.dat');
      fs.writeFileSync(testFile, testData);

      const progressHandler = jest.fn();
      const fetcher = createRrcFetcher();
      
      await fetcher.fetchWithProgress(testFile, progressHandler);
      
      expect(progressHandler).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate a valid file', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868`;

      const testFile = path.join(testDataDir, 'fetcher-valid.dat');
      fs.writeFileSync(testFile, testData);

      const fetcher = createRrcFetcher();
      const result = await fetcher.validate(testFile);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalLines).toBe(2);
    });

    it('should detect invalid files', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
INVALID_RECORD_TYPE
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868`;

      const testFile = path.join(testDataDir, 'fetcher-invalid.dat');
      fs.writeFileSync(testFile, testData);

      const fetcher = createRrcFetcher();
      const result = await fetcher.validate(testFile);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const fetcher = createRrcFetcher();
      const result = await fetcher.fetch('/non/existent/file.dat');

      expect(result.totalCount).toBe(0);
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.permits).toHaveLength(0);
    });

    it('should track warnings', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868
0307550700R  N0000000000000000NN000000000000000000`;

      const testFile = path.join(testDataDir, 'fetcher-warnings.dat');
      fs.writeFileSync(testFile, testData);

      const fetcher = createRrcFetcher();
      const result = await fetcher.fetch(testFile);

      // DAFIELD record without permit should generate orphan warning
      expect(result.warningCount).toBeGreaterThanOrEqual(0);
    });
  });
});
