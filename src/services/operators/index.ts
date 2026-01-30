/**
 * Operator Normalization Service
 * Normalizes operator names during ETL using fuzzy matching
 */

import { UUID } from 'crypto';

export interface OperatorNormalizationResult {
  operatorId: UUID;
  canonicalName: string;
  confidence: number;
  isNewOperator: boolean;
  needsReview: boolean;
}

export interface Operator {
  id: UUID;
  canonicalName: string;
  status: 'active' | 'merged' | 'needs_review' | 'deprecated';
  confidenceScore: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatorAlias {
  id: UUID;
  operatorId: UUID;
  aliasName: string;
  confidenceScore: number;
  autoMatched: boolean;
  usageCount: number;
}

export interface SimilarOperator {
  operatorId: UUID;
  canonicalName: string;
  similarity: number;
  confidenceScore: number;
}

export interface ReviewQueueItem {
  id: UUID;
  rawName: string;
  proposedOperatorId?: UUID;
  similarityScore?: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_resolved';
  sourcePermitId?: string;
  sourceFile?: string;
  createdAt: Date;
}

export interface NormalizerConfig {
  similarityThreshold: number;
  highConfidenceThreshold: number;
  autoCreateOperators: boolean;
}

const DEFAULT_CONFIG: NormalizerConfig = {
  similarityThreshold: 0.7,
  highConfidenceThreshold: 0.9,
  autoCreateOperators: true,
};

/**
 * Operator Normalizer class
 */
export class OperatorNormalizer {
  private config: NormalizerConfig;

  constructor(config: Partial<NormalizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Normalize an operator name
   */
  async normalizeOperatorName(
    rawName: string,
    sourcePermitId?: string,
    sourceFile?: string
  ): Promise<OperatorNormalizationResult> {
    const cleanedName = this.cleanOperatorName(rawName);

    // Check for exact match in aliases
    const exactMatch = await this.findExactAliasMatch(cleanedName);
    if (exactMatch) {
      await this.incrementAliasUsage(cleanedName);
      return {
        operatorId: exactMatch.operatorId,
        canonicalName: exactMatch.canonicalName,
        confidence: exactMatch.confidenceScore,
        isNewOperator: false,
        needsReview: false,
      };
    }

    // Find similar operators using fuzzy matching
    const similarOperators = await this.findSimilarOperators(
      cleanedName,
      this.config.similarityThreshold
    );

    if (similarOperators.length > 0) {
      const bestMatch = similarOperators[0];

      if (bestMatch.similarity >= this.config.highConfidenceThreshold) {
        // High confidence match - auto-assign
        await this.createAliasMapping(
          bestMatch.operatorId,
          cleanedName,
          bestMatch.similarity
        );

        return {
          operatorId: bestMatch.operatorId,
          canonicalName: bestMatch.canonicalName,
          confidence: bestMatch.similarity,
          isNewOperator: false,
          needsReview: false,
        };
      } else if (bestMatch.similarity >= this.config.similarityThreshold) {
        // Medium confidence - needs review
        await this.addToReviewQueue(
          rawName,
          cleanedName,
          bestMatch.operatorId,
          bestMatch.similarity,
          sourcePermitId,
          sourceFile
        );

        if (this.config.autoCreateOperators) {
          // Create new operator but flag for review
          const newOperator = await this.createOperator(
            cleanedName,
            'needs_review',
            bestMatch.similarity
          );

          await this.createAliasMapping(
            newOperator.id,
            cleanedName,
            bestMatch.similarity
          );

          return {
            operatorId: newOperator.id,
            canonicalName: newOperator.canonicalName,
            confidence: bestMatch.similarity,
            isNewOperator: true,
            needsReview: true,
          };
        } else {
          return {
            operatorId: bestMatch.operatorId,
            canonicalName: bestMatch.canonicalName,
            confidence: bestMatch.similarity,
            isNewOperator: false,
            needsReview: true,
          };
        }
      }
    }

    // No match found - create new operator
    if (this.config.autoCreateOperators) {
      const newOperator = await this.createOperator(cleanedName, 'active', 1.0);

      await this.createAliasMapping(newOperator.id, cleanedName, 1.0);

      return {
        operatorId: newOperator.id,
        canonicalName: newOperator.canonicalName,
        confidence: 1.0,
        isNewOperator: true,
        needsReview: false,
      };
    } else {
      await this.addToReviewQueue(
        rawName,
        cleanedName,
        undefined,
        undefined,
        sourcePermitId,
        sourceFile
      );

      throw new Error(
        `No matching operator found for "${rawName}" and auto-create is disabled`
      );
    }
  }

  /**
   * Find similar operators using fuzzy matching
   */
  async findSimilarOperators(
    name: string,
    threshold: number = this.config.similarityThreshold
  ): Promise<SimilarOperator[]> {
    // TODO: Implement database query using pg_trgm
    // Placeholder implementation
    return [];
  }

  /**
   * Get operators pending review
   */
  async getPendingReviews(limit: number = 50): Promise<ReviewQueueItem[]> {
    // TODO: Implement database query
    return [];
  }

  /**
   * Approve a review queue item
   */
  async approveReview(
    reviewId: UUID,
    targetOperatorId?: UUID
  ): Promise<void> {
    // TODO: Implement database update
    // If targetOperatorId provided, merge into that operator
    // Otherwise, approve as new operator
  }

  /**
   * Reject a review queue item
   */
  async rejectReview(reviewId: UUID, notes?: string): Promise<void> {
    // TODO: Implement database update
  }

  /**
   * Merge two operators
   */
  async mergeOperators(
    sourceOperatorId: UUID,
    targetOperatorId: UUID,
    reviewedBy?: UUID
  ): Promise<void> {
    // TODO: Implement database update
    // Update source operator status to 'merged'
    // Move all aliases to target operator
    // Update review queue entries
  }

  /**
   * Clean and normalize operator name
   */
  cleanOperatorName(inputName: string): string {
    let cleaned = inputName.toUpperCase().trim();

    // Remove common punctuation
    cleaned = cleaned.replace(/[.,;:!?&]/g, '');

    // Standardize common suffixes
    cleaned = cleaned.replace(/\s+LLC$/i, ' LLC');
    cleaned = cleaned.replace(/\s+INC$/i, ' INC');
    cleaned = cleaned.replace(/\s+CORP$/i, ' CORP');
    cleaned = cleaned.replace(/\s+LTD$/i, ' LTD');
    cleaned = cleaned.replace(/\s+LP$/i, ' LP');
    cleaned = cleaned.replace(/\s+CO$/i, ' CO');

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned;
  }

  // Placeholder methods for database interactions

  private async findExactAliasMatch(
    aliasName: string
  ): Promise<{ operatorId: UUID; canonicalName: string; confidenceScore: number } | null> {
    // TODO: Implement database query
    return null;
  }

  private async incrementAliasUsage(aliasName: string): Promise<void> {
    // TODO: Implement database update
  }

  private async createAliasMapping(
    operatorId: UUID,
    aliasName: string,
    confidenceScore: number
  ): Promise<void> {
    // TODO: Implement database insert
  }

  private async createOperator(
    canonicalName: string,
    status: 'active' | 'needs_review',
    confidenceScore: number
  ): Promise<Operator> {
    // TODO: Implement database insert
    return {
      id: crypto.randomUUID() as UUID,
      canonicalName,
      status,
      confidenceScore,
      usageCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async addToReviewQueue(
    rawName: string,
    cleanedName: string,
    proposedOperatorId?: UUID,
    similarityScore?: number,
    sourcePermitId?: string,
    sourceFile?: string
  ): Promise<void> {
    // TODO: Implement database insert
  }
}

export default OperatorNormalizer;
