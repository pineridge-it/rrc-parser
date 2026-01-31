import { parseDate, parseIntValue, parseFloatValue, parseNumeric, extractField } from '../../src/utils/typeConverters';

describe('typeConverters', () => {
  describe('parseDate', () => {
    it('should parse valid YYYYMMDD dates correctly', () => {
      expect(parseDate('20251104')).toBe('11/04/2025');
      expect(parseDate('20230101')).toBe('01/01/2023');
      expect(parseDate('19991231')).toBe('12/31/1999');
    });

    it('should return null for invalid dates', () => {
      expect(parseDate('')).toBeNull();
      expect(parseDate('0000')).toBeNull();
      expect(parseDate('    ')).toBeNull();
      expect(parseDate('abcd')).toBeNull();
      expect(parseDate('20251301')).toBeNull(); // Invalid month
      expect(parseDate('20251132')).toBeNull(); // Invalid day
    });

    it('should handle whitespace correctly', () => {
      expect(parseDate(' 20251104 ')).toBe('11/04/2025');
    });
  });

  describe('parseIntValue', () => {
    it('should parse valid integers correctly', () => {
      expect(parseIntValue('123')).toBe(123);
      expect(parseIntValue('0')).toBe(0);
      expect(parseIntValue('-456')).toBe(-456);
    });

    it('should return null for invalid integers', () => {
      expect(parseIntValue('')).toBeNull();
      expect(parseIntValue('abc')).toBeNull();
      expect(parseIntValue('12.34')).toBe(12); // parseInt truncates decimals
      expect(parseIntValue('  ')).toBeNull();
    });

    it('should handle whitespace correctly', () => {
      expect(parseIntValue(' 123 ')).toBe(123);
    });
  });

  describe('parseFloatValue', () => {
    it('should parse valid floats correctly', () => {
      expect(parseFloatValue('12.34')).toBe(12.34);
      expect(parseFloatValue('0')).toBe(0);
      expect(parseFloatValue('-45.67')).toBe(-45.67);
      expect(parseFloatValue('123')).toBe(123);
    });

    it('should return null for invalid floats', () => {
      expect(parseFloatValue('')).toBeNull();
      expect(parseFloatValue('abc')).toBeNull();
      expect(parseFloatValue('  ')).toBeNull();
    });

    it('should handle whitespace correctly', () => {
      expect(parseFloatValue(' 12.34 ')).toBe(12.34);
    });
  });

  describe('parseNumeric', () => {
    it('should parse regular numeric values correctly', () => {
      expect(parseNumeric('12.34')).toBe(12.34);
      expect(parseNumeric('123')).toBe(123);
      expect(parseNumeric('-45.67')).toBe(-45.67);
    });

    it('should parse coordinate values correctly', () => {
      expect(parseNumeric('-959133597', 'longitude')).toBe(-95.9133597);
      expect(parseNumeric('318884969', 'latitude')).toBe(31.8884969);
    });

    it('should return null for invalid numeric values', () => {
      expect(parseNumeric('')).toBeNull();
      expect(parseNumeric('abc')).toBeNull();
      expect(parseNumeric('  ')).toBeNull();
    });

    it('should handle whitespace correctly', () => {
      expect(parseNumeric(' 12.34 ')).toBe(12.34);
    });
  });

  describe('extractField', () => {
    const testRecord = '01091158799001ENERGY TRANSFER FUEL            06252017';

    it('should extract fields correctly within bounds', () => {
      expect(extractField(testRecord, 0, 2)).toBe('01');
      expect(extractField(testRecord, 2, 12)).toBe('091158799001');
      expect(extractField(testRecord, 12, 52)).toBe('ENERGY TRANSFER FUEL');
    });

    it('should handle out of bounds extraction gracefully', () => {
      expect(extractField(testRecord, 100, 200)).toBe('');
      expect(extractField(testRecord, 0, 200)).toBe(testRecord.trimEnd());
    });

    it('should trim trailing whitespace', () => {
      const recordWithSpaces = 'TEST VALUE    ';
      expect(extractField(recordWithSpaces, 0, 20)).toBe('TEST VALUE');
    });
  });
});