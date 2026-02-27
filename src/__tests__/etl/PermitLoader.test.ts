import { PermitLoader, PermitLoadResult } from '../../etl/loader/PermitLoader';
import { PermitData } from '../../types/permit';
import { ILogger } from '../../types/common';

// Mock logger
const createMockLogger = (): ILogger => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockData: Record<string, any[]> = {
    permits: [],
    permit_versions: [],
    permit_changes: [],
  };

  return {
    from: jest.fn((table: string) => ({
      select: jest.fn((columns: string) => ({
        eq: jest.fn((column: string, value: any) => ({
          maybeSingle: jest.fn(() => {
            const record = mockData[table]?.find((r: any) => r[column] === value);
            return Promise.resolve({ data: record || null, error: null });
          }),
          single: jest.fn(() => {
            const record = mockData[table]?.find((r: any) => r[column] === value);
            if (!record) {
              return Promise.resolve({ data: null, error: { message: 'Not found' } });
            }
            return Promise.resolve({ data: record, error: null });
          }),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn((data: any) => ({
        select: jest.fn((columns?: string) => ({
          single: jest.fn(() => {
            const id = `test-uuid-${Date.now()}-${Math.random()}`;
            const newRecord = { ...data, id };
            if (!mockData[table]) mockData[table] = [];
            mockData[table].push(newRecord);
            return Promise.resolve({ data: newRecord, error: null });
          }),
        })),
      })),
    })),
    _mockData: mockData,
  };
};

describe('PermitLoader', () => {
  let loader: PermitLoader;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockLogger: ILogger;

  const createSamplePermit = (overrides: Partial<PermitData> = {}): PermitData => ({
    daroot: {
      permit_number: 'TEST-001',
      operator_name: 'Test Operator',
      operator_number: '12345',
      county_code: '001',
      district: '01',
      lease_name: 'Test Lease',
      status_flag: 'APPROVED',
    },
    dapermit: {
      permit_number: 'TEST-001',
      api_number: '42-001-12345',
      well_type: 'OIL',
      application_type: 'NEW',
      issued_date: '2024-01-15',
      received_date: '2024-01-01',
      total_depth: 5000,
    },
    gis_surface: {
      latitude: 29.7604,
      longitude: -95.3698,
    },
    ...overrides,
  });

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockLogger = createMockLogger();
    loader = new PermitLoader(mockSupabase as any, mockLogger, {
      batchSize: 10,
      enableVersionHistory: true,
      enableChangeFeed: false,
    });
  });

  describe('Idempotency', () => {
    it('should insert new permits on first run', async () => {
      const permits = [createSamplePermit()];
      const result = await loader.loadPermits(permits);

      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should skip unchanged permits on subsequent runs', async () => {
      const permits = [createSamplePermit()];
      
      // First run - insert
      const result1 = await loader.loadPermits(permits);
      expect(result1.inserted).toBe(1);

      // Second run - same data should be skipped
      const result2 = await loader.loadPermits(permits);
      expect(result2.inserted).toBe(0);
      expect(result2.updated).toBe(0);
      expect(result2.skipped).toBe(1);
    });

    it('should update permits when data changes', async () => {
      const permit1 = createSamplePermit({
        daroot: { ...createSamplePermit().daroot, operator_name: 'Original Operator' },
      });
      
      // First run
      await loader.loadPermits([permit1]);

      // Second run with changed data
      const permit2 = createSamplePermit({
        daroot: { ...createSamplePermit().daroot, operator_name: 'Changed Operator' },
      });
      
      const result = await loader.loadPermits([permit2]);
      expect(result.inserted).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it('should handle multiple permits with mixed operations', async () => {
      const permit1 = createSamplePermit({ daroot: { ...createSamplePermit().daroot!, permit_number: 'TEST-001' } });
      const permit2 = createSamplePermit({ daroot: { ...createSamplePermit().daroot!, permit_number: 'TEST-002' } });
      const permit3 = createSamplePermit({ daroot: { ...createSamplePermit().daroot!, permit_number: 'TEST-003' } });

      // First run - all inserted
      const result1 = await loader.loadPermits([permit1, permit2, permit3]);
      expect(result1.inserted).toBe(3);

      // Second run - one changed, others skipped
      const permit2Changed = createSamplePermit({ 
        daroot: { ...createSamplePermit().daroot!, permit_number: 'TEST-002', operator_name: 'Changed' } 
      });
      
      const result2 = await loader.loadPermits([permit1, permit2Changed, permit3]);
      expect(result2.inserted).toBe(0);
      expect(result2.updated).toBe(1);
      expect(result2.skipped).toBe(2);
    });

    it('should compute consistent version hashes for identical data', async () => {
      const permit1 = createSamplePermit();
      const permit2 = createSamplePermit();

      const hash1 = (loader as any).computeVersionHash(permit1);
      const hash2 = (loader as any).computeVersionHash(permit2);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex length
    });

    it('should compute different version hashes for different data', async () => {
      const permit1 = createSamplePermit();
      const permit2 = createSamplePermit({
        daroot: { ...createSamplePermit().daroot!, operator_name: 'Different Operator' },
      });

      const hash1 = (loader as any).computeVersionHash(permit1);
      const hash2 = (loader as any).computeVersionHash(permit2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Error Handling', () => {
    it('should handle permits without permit_number', async () => {
      const invalidPermit = createSamplePermit({
        daroot: { ...createSamplePermit().daroot!, permit_number: undefined as any },
        dapermit: { ...createSamplePermit().dapermit!, permit_number: undefined as any },
      });

      const result = await loader.loadPermits([invalidPermit]);
      expect(result.errors).toBe(1);
      expect(result.errorDetails[0]).toContain('Permit missing permit_number');
    });

    it('should continue processing batch after individual errors', async () => {
      const validPermit = createSamplePermit({ daroot: { ...createSamplePermit().daroot!, permit_number: 'VALID-001' } });
      const invalidPermit = createSamplePermit({
        daroot: { ...createSamplePermit().daroot!, permit_number: undefined as any },
        dapermit: { ...createSamplePermit().dapermit!, permit_number: undefined as any },
      });

      const result = await loader.loadPermits([validPermit, invalidPermit, validPermit]);
      expect(result.inserted).toBe(2);
      expect(result.errors).toBe(1);
    });
  });

  describe('Batch Processing', () => {
    it('should process permits in batches', async () => {
      const permits = Array.from({ length: 25 }, (_, i) =>
        createSamplePermit({
          daroot: { ...createSamplePermit().daroot!, permit_number: `BATCH-${i.toString().padStart(3, '0')}` },
        })
      );

      const result = await loader.loadPermits(permits, 10);
      expect(result.inserted).toBe(25);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('batch'));
    });
  });

  describe('Version History', () => {
    it('should create version records when enabled', async () => {
      const permit = createSamplePermit();
      await loader.loadPermits([permit]);

      // Verify permit_versions table was queried
      expect(mockSupabase.from).toHaveBeenCalledWith('permit_versions');
    });

    it('should skip version history when disabled', async () => {
      loader = new PermitLoader(mockSupabase as any, mockLogger, {
        enableVersionHistory: false,
      });

      const permit = createSamplePermit();
      await loader.loadPermits([permit]);

      // Should not query permit_versions
      const versionCalls = (mockSupabase.from as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'permit_versions'
      );
      expect(versionCalls.length).toBe(0);
    });
  });
});
