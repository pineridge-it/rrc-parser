/**
 * ETL Service with Operator Normalization
 * Integrates operator name normalization into the ETL pipeline
 */

import { OperatorNormalizer, OperatorNormalizationResult } from '../operators';
import { createDatabaseClient, Database } from '../../lib/database';

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
  // Additional permit fields
  operatorNumber?: string;
  countyCode?: string;
  wellNumber?: string;
  totalDepth?: number;
  surfaceLatitude?: number;
  surfaceLongitude?: number;
}

export interface IngestionResult {
  permitId: string;
  operatorId: string;
  canonicalOperatorName: string;
  confidence: number;
  needsReview: boolean;
  success: boolean;
  error?: string;
  isNewOperator: boolean;
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
  private db: Database;

  constructor(db?: Database) {
    this.db = db ?? createDatabaseClient();
    this.normalizer = new OperatorNormalizer({
      autoCreateOperators: true,
      similarityThreshold: 0.7,
      highConfidenceThreshold: 0.9,
      reviewThreshold: 0.6,
      db: this.db
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

          if (result.isNewOperator) {
            stats.newOperators++;
          }

          // Track confidence levels
          if (result.confidence >= 0.9) {
            stats.highConfidence++;
          } else if (result.confidence >= 0.7) {
            stats.mediumConfidence++;
          } else {
            stats.lowConfidence++;
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
          isNewOperator: false,
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

    // Insert/update permit record with normalized operator
    await this.savePermitRecord(record, normalizationResult);

    return {
      permitId: record.permitId,
      operatorId: normalizationResult.operatorId.toString(),
      canonicalOperatorName: normalizationResult.canonicalName,
      confidence: normalizationResult.confidence,
      needsReview: normalizationResult.needsReview,
      success: true,
      isNewOperator: normalizationResult.isNewOperator,
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
    // Get operator counts
    const { data: operatorData, error: _operatorError } = await this.db
      .from('operators')
      .select('id', { count: 'exact' });

    const { data: aliasData, error: _aliasError } = await this.db
      .from('operator_aliases')
      .select('id', { count: 'exact' });

    const { data: reviewData, error: _reviewError } = await this.db
      .from('operator_review_queue')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    // Get recent review stats (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentReviews, error: _recentError } = await this.db
      .from('operator_review_queue')
      .select('suggested_confidence, status')
      .gte('created_at', yesterday.toISOString());

    const recentStats = {
      highConfidence: 0,
      mediumConfidence: 0,
      newOperators: 0
    };

    if (recentReviews) {
      recentReviews.forEach((review: { suggested_confidence: number; status: string }) => {
        if (review.suggested_confidence >= 0.9) {
          recentStats.highConfidence++;
        } else if (review.suggested_confidence >= 0.7) {
          recentStats.mediumConfidence++;
        } else if (review.status === 'approved' && review.suggested_confidence === 0) {
          recentStats.newOperators++;
        }
      });
    }

    return {
      totalOperators: operatorData?.length || 0,
      totalAliases: aliasData?.length || 0,
      pendingReviews: reviewData?.length || 0,
      recentMatches: recentStats
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
          db: this.db
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

  /**
   * Get review queue items
   */
  async getReviewQueue(
    status?: 'pending' | 'approved' | 'rejected',
    limit: number = 50
  ): Promise<Array<{
    id: string;
    rawName: string;
    suggestedOperatorId: string | null;
    suggestedConfidence: number;
    similarOperators: Array<{ operatorId: string; name: string; similarity: number }>;
    permitId: string | null;
    sourceFile: string | null;
    status: string;
    createdAt: string;
  }>> {
    let query = this.db
      .from('operator_review_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((item: {
      id: string;
      raw_operator_name: string;
      suggested_operator_id: string | null;
      suggested_confidence: number;
      similar_operators: Array<{ operatorId: string; name: string; similarity: number }> | null;
      permit_id: string | null;
      source_file: string | null;
      status: string;
      created_at: string;
    }) => ({
      id: item.id,
      rawName: item.raw_operator_name,
      suggestedOperatorId: item.suggested_operator_id,
      suggestedConfidence: item.suggested_confidence,
      similarOperators: item.similar_operators || [],
      permitId: item.permit_id,
      sourceFile: item.source_file,
      status: item.status,
      createdAt: item.created_at
    }));
  }

  /**
   * Resolve a review queue item
   */
  async resolveReview(
    reviewId: string,
    resolution: 'approved' | 'rejected',
    operatorId?: string,
    notes?: string
  ): Promise<void> {
    await this.normalizer.resolveReview(reviewId, resolution, operatorId, notes);
  }

  private async savePermitRecord(
    record: PermitIngestionRecord,
    operatorResult: OperatorNormalizationResult
  ): Promise<void> {
    // Prepare permit data for upsert
    const permitData = {
      permit_number: record.permitId,
      operator_name: operatorResult.canonicalName,
      operator_number: record.operatorNumber || null,
      lease_name: record.leaseName || null,
      well_number: record.wellNumber || null,
      well_type: record.wellType || null,
      well_status: record.status || null,
      district: record.district || null,
      county_code: record.countyCode || null,
      total_depth: record.totalDepth || null,
      surface_latitude: record.surfaceLatitude || null,
      surface_longitude: record.surfaceLongitude || null,
      surface_location: (record.surfaceLatitude && record.surfaceLongitude) 
        ? `POINT(${record.surfaceLongitude} ${record.surfaceLatitude})`
        : null
    };

    // Upsert permit record
    const { error } = await this.db
      .from('permits')
      .upsert(permitData, {
        onConflict: 'permit_number'
      });

    if (error) {
      throw new Error(`Failed to save permit: ${error.message}`);
    }
  }
}

export default ETLService;
