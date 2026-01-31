import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { RrcPermitParser, createRrcParser } from '../../../src/parser/rrc/RrcPermitParser';
import { RrcParseError, RrcMalformedRecordError } from '../../../src/parser/rrc/errors';
import { getSchema, isSupportedRecordType, getSupportedRecordTypes } from '../../../src/parser/rrc/recordParsers';

describe('RrcPermitParser', () => {
  const testDataDir = path.join(__dirname, '../../fixtures/rrc');
  
  beforeEach(() => {
    // Ensure test directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test files
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      for (const file of files) {
        if (file.startsWith('test-')) {
          fs.unlinkSync(path.join(testDataDir, file));
        }
      }
    }
  });

  describe('Basic Parsing', () => {
    it('should parse a valid DAF420 file', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868
0307550700R  N0000000000000000NN000000000000000000
14 -98.2643928  28.9097706
15 -98.2508124  28.8950594`;

      const testFile = path.join(testDataDir, 'test-valid.dat');
      fs.writeFileSync(testFile, testData);

      const parser = createRrcParser();
      const result = await parser.parseFile(testFile);

      expect(result.permits).toHaveProperty('0911587');
      expect(result.stats.successfulPermits).toBe(1);
      expect(result.stats.linesProcessed).toBeGreaterThanOrEqual(4);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse multiple permits', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868
01091163499013LECHWE UNIT                     01665543    20251105PILLAR EFS, LLC                 00ANNNNNNNNNNN09116342025110700000000N                       3H N000000000000000000 P00000000000000000000000000000
02091163499013LECHWE UNIT                     01   3H 0950066554301                              000000000000000000000000202511052025110700000000000000000000000000000000 000000002027110700000000                              NNYN00000000000000N                  DE LA GARZA, J                                         318   00000065885001160N     CAMPBELLTON  00520500NORTHWEST    00095000NORTHEAST    00020100SOUTHEAST    00095000NORTHEAST    700.0                       O00000000 NNNN09748893 YN       01336070`;

      const testFile = path.join(testDataDir, 'test-multi.dat');
      fs.writeFileSync(testFile, testData);

      const parser = createRrcParser();
      const result = await parser.parseFile(testFile);

      expect(Object.keys(result.permits)).toHaveLength(2);
      expect(result.permits['0911587']).toBeDefined();
      expect(result.permits['0911634']).toBeDefined();
    });
  });

  describe('Record Type Parsing', () => {
    it('should parse DAROOT record correctly', () => {
      const schema = getSchema('01');
      expect(schema).toBeDefined();
      expect(schema?.name).toBe('DAROOT');

      const testRecord = '01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000';
      const parsed = schema!.parseRecord(testRecord);

      expect(parsed.segment).toBe('01');
      // Field positions are based on the actual DAF420 format
      expect(parsed.permit_number).toBeDefined();
      expect(parsed.lease_name).toBeDefined();
      expect(parsed.operator_name).toBeDefined();
    });

    it('should parse DAPERMIT record correctly', () => {
      const schema = getSchema('02');
      expect(schema).toBeDefined();
      expect(schema?.name).toBe('DAPERMIT');

      const testRecord = '02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868';
      const parsed = schema!.parseRecord(testRecord);

      expect(parsed.segment).toBe('02');
      expect(parsed.permit_number).toBeDefined();
      expect(parsed.well_number).toBeDefined();
      expect(parsed.total_depth).toBeDefined();
    });

    it('should parse GIS Surface record correctly', () => {
      const schema = getSchema('14');
      expect(schema).toBeDefined();
      expect(schema?.name).toBe('GIS_SURFACE');

      const testRecord = '14 -98.2643928  28.9097706';
      const parsed = schema!.parseRecord(testRecord);

      expect(parsed.segment).toBe('14');
      expect(parsed.longitude).toBe(-98.2643928);
      expect(parsed.latitude).toBe(28.9097706);
    });
  });

  describe('Malformed Data Handling', () => {
    it('should handle short records gracefully', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
XX
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868`;

      const testFile = path.join(testDataDir, 'test-malformed.dat');
      fs.writeFileSync(testFile, testData);

      const parser = createRrcParser({ strictMode: false });
      const result = await parser.parseFile(testFile);

      expect(result.stats.malformedRecords).toBeGreaterThan(0);
      expect(result.permits['0911587']).toBeDefined();
    });

    it('should handle custom error handlers', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
INVALID
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868`;

      const testFile = path.join(testDataDir, 'test-handler.dat');
      fs.writeFileSync(testFile, testData);

      const errorHandler = jest.fn().mockReturnValue('skip');
      const parser = createRrcParser({ onParseError: errorHandler });
      
      await parser.parseFile(testFile);
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Statistics Tracking', () => {
    it('should track record type counts', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868
0307550700R  N0000000000000000NN000000000000000000
14 -98.2643928  28.9097706
15 -98.2508124  28.8950594`;

      const testFile = path.join(testDataDir, 'test-stats.dat');
      fs.writeFileSync(testFile, testData);

      const parser = createRrcParser();
      const result = await parser.parseFile(testFile);

      expect(result.stats.recordsByType.get('01')).toBe(1);
      expect(result.stats.recordsByType.get('02')).toBe(1);
      expect(result.stats.recordsByType.get('03')).toBe(1);
      expect(result.stats.recordsByType.get('14')).toBe(1);
      expect(result.stats.recordsByType.get('15')).toBe(1);
    });

    it('should track lines processed', async () => {
      const testData = `01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868`;

      const testFile = path.join(testDataDir, 'test-lines.dat');
      fs.writeFileSync(testFile, testData);

      const parser = createRrcParser();
      const result = await parser.parseFile(testFile);

      expect(result.stats.linesProcessed).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Progress Callbacks', () => {
    it('should call progress callback', async () => {
      const testData = Array(250).fill(`01091158799001ENERGY TRANSFER FUEL            06252017    20251104ENERGY TRANSFER COMPANY         00ANNNNNNNNNNN09115872025110500000000N                       9A N000000000000000000 P00000000000000000000000000000
02091158799001ENERGY TRANSFER FUEL            06   9A 0610025201701                              000000770020000000000000202511042025110500000000000000000000000000000000 000000002027110500000000                              NNNN00000000000000N                  LEWIS, A M                                             481   00000004954000236SE    BETHEL       00024100N            00072800W            00024100N            00058900W            0.0                         O00000000 NNNN09748895 NN       00132868`).join('\n');

      const testFile = path.join(testDataDir, 'test-progress.dat');
      fs.writeFileSync(testFile, testData);

      const progressHandler = jest.fn();
      const parser = createRrcParser({ onProgress: progressHandler });
      
      await parser.parseFile(testFile);
      
      expect(progressHandler).toHaveBeenCalled();
    });
  });

  describe('Schema Registry', () => {
    it('should return all supported record types', () => {
      const types = getSupportedRecordTypes();
      expect(types).toContain('01');
      expect(types).toContain('02');
      expect(types).toContain('14');
      expect(types).toContain('15');
      expect(types).toHaveLength(12);
    });

    it('should check if record type is supported', () => {
      expect(isSupportedRecordType('01')).toBe(true);
      expect(isSupportedRecordType('02')).toBe(true);
      expect(isSupportedRecordType('99')).toBe(false);
      expect(isSupportedRecordType('XX')).toBe(false);
    });

    it('should return undefined for unknown schemas', () => {
      expect(getSchema('99')).toBeUndefined();
      expect(getSchema('XX')).toBeUndefined();
    });
  });
});
