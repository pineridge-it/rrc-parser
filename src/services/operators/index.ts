export * from './OperatorService';
export * from './OperatorAdminService';

/**
 * Operator normalization result
 */
export interface OperatorNormalizationResult {
  operatorId: string;
  normalizedName: string;
  canonicalName: string;
  confidence: number;
  isNew: boolean;
  isNewOperator: boolean;
  needsReview: boolean;
  aliases: string[];
}

/**
 * Similar operator match
 */
export interface SimilarOperator {
  operatorId: string;
  canonicalName: string;
  similarity: number;
}

/**
 * Operator normalizer for ETL pipeline
 */
export class OperatorNormalizer {
  private config: {
    autoCreateOperators: boolean;
    similarityThreshold: number;
    highConfidenceThreshold: number;
  };

  constructor(config?: {
    autoCreateOperators?: boolean;
    similarityThreshold?: number;
    highConfidenceThreshold?: number;
  }) {
    this.config = {
      autoCreateOperators: config?.autoCreateOperators ?? true,
      similarityThreshold: config?.similarityThreshold ?? 0.7,
      highConfidenceThreshold: config?.highConfidenceThreshold ?? 0.9,
    };
  }

  /**
   * Normalize an operator name
   */
  normalize(name: string): OperatorNormalizationResult {
    const normalized = name.trim();
    const canonical = this.cleanOperatorName(normalized);
    
    return {
      operatorId: `op_${canonical.toLowerCase().replace(/\s+/g, '_')}`,
      normalizedName: normalized,
      canonicalName: canonical,
      confidence: 1.0,
      isNew: false,
      isNewOperator: false,
      needsReview: false,
      aliases: [normalized]
    };
  }

  /**
   * Batch normalize operator names
   */
  normalizeBatch(names: string[]): OperatorNormalizationResult[] {
    return names.map(name => this.normalize(name));
  }

  /**
   * Normalize operator name with full context (ETL pipeline method)
   */
  async normalizeOperatorName(
    name: string,
    _permitId?: string,
    _sourceFile?: string
  ): Promise<OperatorNormalizationResult> {
    const result = this.normalize(name);
    
    // If auto-create is disabled, mark as new operator
    if (!this.config.autoCreateOperators) {
      return {
        ...result,
        isNew: true,
        isNewOperator: true,
        needsReview: true,
        confidence: 0,
      };
    }
    
    return result;
  }

  /**
   * Find similar operators based on name similarity
   */
  async findSimilarOperators(name: string, threshold?: number): Promise<SimilarOperator[]> {
    const simThreshold = threshold ?? this.config.similarityThreshold;
    const normalized = this.cleanOperatorName(name);
    
    // Simple similarity check - in production this would query the database
    const similarity = this.calculateSimilarity(name, normalized);
    
    if (similarity >= simThreshold) {
      return [{
        operatorId: `op_${normalized.toLowerCase().replace(/\s+/g, '_')}`,
        canonicalName: normalized,
        similarity,
      }];
    }
    
    return [];
  }

  /**
   * Clean and standardize operator name
   */
  cleanOperatorName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?/gi, (match) => match.toLowerCase())
      .trim();
  }

  /**
   * Calculate simple string similarity (Levenshtein-based)
   */
  private calculateSimilarity(a: string, b: string): number {
    const cleanA = this.cleanOperatorName(a).toLowerCase();
    const cleanB = this.cleanOperatorName(b).toLowerCase();
    
    if (cleanA === cleanB) return 1.0;
    
    // Simple Jaccard similarity for words
    const wordsA = new Set(cleanA.split(' '));
    const wordsB = new Set(cleanB.split(' '));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }
}