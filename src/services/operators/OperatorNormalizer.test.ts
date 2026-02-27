import { OperatorNormalizer, OperatorNormalizationResult, SimilarOperator } from './OperatorNormalizer';

// Mock the database client
const mockDb = {
  from: jest.fn(),
  rpc: jest.fn()
};

describe('OperatorNormalizer', () => {
  let normalizer: OperatorNormalizer;

  beforeEach(() => {
    jest.clearAllMocks();
    normalizer = new OperatorNormalizer({
      autoCreateOperators: true,
      similarityThreshold: 0.7,
      highConfidenceThreshold: 0.9,
      reviewThreshold: 0.6,
      db: mockDb as any
    });
  });

  describe('normalize (in-memory)', () => {
    it('should normalize a simple operator name', () => {
      const result = normalizer.normalize('  Exxon Mobil Corp  ');

      expect(result.normalizedName).toBe('Exxon Mobil Corp');
      expect(result.canonicalName).toBe('Exxon Mobil corp');
      expect(result.confidence).toBe(1.0);
      expect(result.needsReview).toBe(false);
    });

    it('should handle company suffixes correctly', () => {
      const result = normalizer.normalize('ABC Oil Inc.');
      expect(result.canonicalName).toBe('ABC Oil inc');
    });

    it('should batch normalize multiple names', () => {
      const names = ['Chevron Corp', 'Shell LLC', 'BP Inc.'];
      const results = normalizer.normalizeBatch(names);

      expect(results).toHaveLength(3);
      expect(results[0].canonicalName).toBe('Chevron corp');
      expect(results[1].canonicalName).toBe('Shell llc');
      expect(results[2].canonicalName).toBe('BP inc');
    });
  });

  describe('cleanOperatorName', () => {
    it('should trim whitespace', () => {
      expect(normalizer.cleanOperatorName('  Test Company  ')).toBe('Test Company');
    });

    it('should normalize multiple spaces', () => {
      expect(normalizer.cleanOperatorName('Test   Company')).toBe('Test Company');
    });

    it('should lowercase company suffixes', () => {
      expect(normalizer.cleanOperatorName('Test INC')).toBe('Test inc');
      expect(normalizer.cleanOperatorName('Test LLC')).toBe('Test llc');
      expect(normalizer.cleanOperatorName('Test Corp')).toBe('Test corp');
    });
  });

  describe('normalizeOperatorName (with database)', () => {
    it('should return exact match from operators table', async () => {
      const mockOperator = {
        id: 'op-123',
        canonical_name: 'Exxon Mobil',
        normalized_name: 'exxon mobil'
      };

      mockDb.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockOperator, error: null })
          })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockOperator, error: null })
          })
        })
      });

      const result = await normalizer.normalizeOperatorName('Exxon Mobil');

      expect(result.operatorId).toBe('op-123');
      expect(result.canonicalName).toBe('Exxon Mobil');
      expect(result.confidence).toBe(1.0);
      expect(result.isNewOperator).toBe(false);
    });

    it('should create new operator when no match found', async () => {
      const newOperator = {
        id: 'new-op-123',
        canonical_name: 'New Operator LLC',
        normalized_name: 'new operator llc'
      };

      // First call - no exact match
      // Second call - no alias match
      // Third call - no similar operators
      // Fourth call - create operator
      let callCount = 0;
      mockDb.from.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
              }),
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: newOperator, error: null })
              })
            })
          };
        }
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: newOperator, error: null })
            })
          })
        };
      });

      mockDb.rpc.mockResolvedValue({ data: [], error: null });

      const result = await normalizer.normalizeOperatorName('New Operator LLC');

      expect(result.isNewOperator).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should add to review queue for uncertain matches', async () => {
      mockDb.from.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          }),
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      }));

      mockDb.rpc.mockResolvedValue({ data: [], error: null });

      const result = await normalizer.normalizeOperatorName('Uncertain Operator');

      expect(result.needsReview).toBe(true);
    });
  });

  describe('findSimilarOperators', () => {
    it('should find similar operators using trigram similarity', async () => {
      const similarOps = [
        { operator_id: 'op-1', canonical_name: 'Exxon Mobil', similarity: 0.85 },
        { operator_id: 'op-2', canonical_name: 'Exxon Corporation', similarity: 0.75 }
      ];

      mockDb.rpc.mockResolvedValue({ data: similarOps, error: null });

      const result = await normalizer.findSimilarOperators('Exxon Mobile');

      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBe(0.85);
      expect(result[0].canonicalName).toBe('Exxon Mobil');
    });

    it('should return empty array when no similar operators found', async () => {
      mockDb.rpc.mockResolvedValue({ data: [], error: null });

      const result = await normalizer.findSimilarOperators('XYZ Unknown');

      expect(result).toEqual([]);
    });
  });

  describe('review queue operations', () => {
    it('should get pending reviews', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          raw_operator_name: 'Test Operator',
          suggested_operator_id: 'op-1',
          suggested_confidence: 0.75,
          similar_operators: [],
          permit_id: null,
          source_file: null,
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockReviews, error: null })
            })
          })
        })
      });

      const result = await normalizer.getPendingReviews(10);

      expect(result).toHaveLength(1);
      expect(result[0].rawName).toBe('Test Operator');
    });

    it('should get review queue stats', async () => {
      mockDb.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{}, {}], error: null })
        })
      });

      const result = await normalizer.getReviewQueueStats();

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.pending).toBeGreaterThanOrEqual(0);
    });

    it('should resolve a review', async () => {
      mockDb.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { raw_operator_name: 'Test' },
              error: null
            })
          })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      await expect(normalizer.resolveReview('review-1', 'approved', 'op-1'))
        .resolves.not.toThrow();
    });
  });
});
