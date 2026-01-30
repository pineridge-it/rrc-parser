/**
 * ETL Service with Operator Normalization
 * Integrates operator name normalization into the ETL pipeline
 */

import { OperatorNormalizer, OperatorNormalizationResult } from '../operators';

export interface PermitIngestionRecord {
  permitId: string;
  operatorName: string;
  leaseName?: string;
  wellType?: string;
  location?: string;
  district?: string;
  field?: string;
  status?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
}

export interface IngestionResult {
  permitId: string;
  operatorId: string;
  canonicalOperatorName: string;
  confidence: number;
  needsReview: boolean;
  success: boolean;
  error?: string;
}

export interface ETLStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  newOperators: number;
  needsReview: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export class ETLService {
  private normalizer: OperatorNormalizer;

  constructor() {
    this.normalizer = new OperatorNormalizer({
      autoCreateOperators: true,
      similarityThreshold: 0.7,
      highConfidenceThreshold: 0.9,
    });
  }

  /**
   * Process a batch of permit records
   */
  async processPermits(
    records: PermitIngestionRecord[],
    sourceFile?: string
  ): Promise<{ results: IngestionResult[]; stats: ETLStats }> {
    const results: IngestionResult[] = [];
    const stats: ETLStats = {
      totalProcessed: records.length,
      successful: 0,
      failed: 0,
      newOperators: 0,
      needsReview: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
    };

    for (const record of records) {
      try {
        const result = await this.processSinglePermit(record, sourceFile);
        results.push(result);

        if (result.success) {
          stats.successful++;

          if (result.needsReview) {
            stats.needsReview++;
          }

          // Track confidence levels
          if (result.confidence >= 0.9) {
            stats.highConfidence++;
          } else if (result.confidence >= 0.7) {
            stats.mediumConfidence++;
          } else {
            stats.lowConfidence++;
          }

          // Track new operators
          // Note: This is a simplified check - in production we'd track this differently
          if (result.confidence < 1.0 && result.confidence >= 0.9) {
            // Likely an existing operator match
          } else if (result.confidence === 1.0) {
            // Could be new or exact alias match
          }
        } else {
          stats.failed++;
        }
      } catch (error) {
        results.push({
          permitId: record.permitId,
          operatorId: '',
          canonicalOperatorName: '',
          confidence: 0,
          needsReview: true,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        stats.failed++;
      }
    }

    return { results, stats };
  }

  /**
   * Process a single permit record
   */
  private async processSinglePermit(
    record: PermitIngestionRecord,
    sourceFile?: string
  ): Promise<IngestionResult> {
    // Normalize operator name
    const normalizationResult = await this.normalizer.normalizeOperatorName(
      record.operatorName,
      record.permitId,
      sourceFile
    );

    // TODO: Insert/update permit record with normalized operator
    await this.savePermitRecord(record, normalizationResult);

    return {
      permitId: record.permitId,
      operatorId: normalizationResult.operatorId.toString(),
      canonicalOperatorName: normalizationResult.canonicalName,
      confidence: normalizationResult.confidence,
      needsReview: normalizationResult.needsReview,
      success: true,
    };
  }

  /**
   * Get normalization statistics for monitoring
   */
  async getNormalizationStats(): Promise<{
    totalOperators: number;
    totalAliases: number;
    pendingReviews: number;
    recentMatches: {
      highConfidence: number;
      mediumConfidence: number;
      newOperators: number;
    };
  }> {
    // TODO: Implement database queries
    return {
      totalOperators: 0,
      totalAliases: 0,
      pendingReviews: 0,
      recentMatches: {
        highConfidence: 0,
        mediumConfidence: 0,
        newOperators: 0,
      },
    };
  }

  /**
   * Preview normalization for a list of operator names
   */
  async previewNormalization(
    operatorNames: string[]
  ): Promise<
    Array<{
      rawName: string;
      canonicalName: string;
      confidence: number;
      isNew: boolean;
      similarMatches: Array<{ name: string; similarity: number }>;
    }>
  > {
    const results = [];

    for (const name of operatorNames) {
      const similarOperators = await this.normalizer.findSimilarOperators(name, 0.6);

      // Try to normalize (without saving)
      try {
        const tempNormalizer = new OperatorNormalizer({
          autoCreateOperators: false,
        });
        const result = await tempNormalizer.normalizeOperatorName(name);

        results.push({
          rawName: name,
          canonicalName: result.canonicalName,
          confidence: result.confidence,
          isNew: result.isNewOperator,
          similarMatches: similarOperators.map((op) => ({
            name: op.canonicalName,
            similarity: op.similarity,
          })),
        });
      } catch {
        // No match found
        results.push({
          rawName: name,
          canonicalName: this.normalizer.cleanOperatorName(name),
          confidence: 0,
          isNew: true,
          similarMatches: similarOperators.map((op) => ({
            name: op.canonicalName,
            similarity: op.similarity,
          })),
        });
      }
    }

    return results;
  }

  private async savePermitRecord(
    record: PermitIngestionRecord,
    operatorResult: OperatorNormalizationResult
  ): Promise<void> {
    // TODO: Implement database insert/update
    console.log('Saving permit:', {
      permitId: record.permitId,
      operatorId: operatorResult.operatorId,
      operatorName: operatorResult.canonicalName,
    });
  }
}

export default ETLService;
