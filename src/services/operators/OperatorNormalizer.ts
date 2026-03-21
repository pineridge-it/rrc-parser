import { createDatabaseClient, Database } from '../../lib/database';

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
 * Database operator record
 */
interface OperatorRecord {
  id: string;
  operator_number: string | null;
  canonical_name: string;
  normalized_name: string;
  status: string;
}

/**
 * Database alias record
 */
interface AliasRecord {
  operator_id: string;
  alias: string;
  normalized_alias: string;
  confidence_score: number;
}

/**
 * Review queue entry
 */
interface ReviewQueueEntry {
  id: string;
  raw_operator_name: string;
  normalized_name: string;
  suggested_operator_id: string | null;
  suggested_confidence: number | null;
  similar_operators: SimilarOperator[] | null;
  permit_id: string | null;
  source_file: string | null;
  status: string;
}

/**
 * Operator normalizer for ETL pipeline with database integration
 */
export class OperatorNormalizer {
  private db: Database;
  private config: {
    autoCreateOperators: boolean;
    similarityThreshold: number;
    highConfidenceThreshold: number;
    reviewThreshold: number;
  };

  constructor(config?: {
    autoCreateOperators?: boolean;
    similarityThreshold?: number;
    highConfidenceThreshold?: number;
    reviewThreshold?: number;
    db?: Database;
  }) {
    this.config = {
      autoCreateOperators: config?.autoCreateOperators ?? true,
      similarityThreshold: config?.similarityThreshold ?? 0.7,
      highConfidenceThreshold: config?.highConfidenceThreshold ?? 0.9,
      reviewThreshold: config?.reviewThreshold ?? 0.6,
    };
    this.db = config?.db ?? createDatabaseClient();
  }

  /**
   * Normalize an operator name (in-memory only, no database)
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
   * Batch normalize operator names (in-memory only)
   */
  normalizeBatch(names: string[]): OperatorNormalizationResult[] {
    return names.map(name => this.normalize(name));
  }

  /**
   * Normalize operator name with full database integration (ETL pipeline method)
   */
  async normalizeOperatorName(
    name: string,
    permitId?: string,
    sourceFile?: string
  ): Promise<OperatorNormalizationResult> {
    const normalized = name.trim();
    const canonical = this.cleanOperatorName(normalized);
    const normalizedLower = canonical.toLowerCase();

    // Step 1: Check for exact match on normalized name
    const exactMatch = await this.findExactMatch(normalizedLower);
    if (exactMatch) {
      await this.updateAliasUsage(exactMatch.id, normalized);
      return {
        operatorId: exactMatch.id,
        normalizedName: normalized,
        canonicalName: exactMatch.canonical_name,
        confidence: 1.0,
        isNew: false,
        isNewOperator: false,
        needsReview: false,
        aliases: [normalized]
      };
    }

    // Step 2: Check for exact alias match
    const aliasMatch = await this.findExactAliasMatch(normalizedLower);
    if (aliasMatch) {
      await this.updateAliasUsage(aliasMatch.operator_id, normalized);
      const operator = await this.getOperatorById(aliasMatch.operator_id);
      return {
        operatorId: aliasMatch.operator_id,
        normalizedName: normalized,
        canonicalName: operator?.canonical_name || canonical,
        confidence: 1.0,
        isNew: false,
        isNewOperator: false,
        needsReview: false,
        aliases: [normalized]
      };
    }

    // Step 3: Find similar operators using pg_trgm
    const similarOperators = await this.findSimilarOperators(canonical, 0.3);

    if (similarOperators.length > 0) {
      const bestMatch = similarOperators[0];

      // High confidence match - auto-accept
      if (bestMatch && bestMatch.similarity >= this.config.highConfidenceThreshold) {
        await this.createAlias(bestMatch.operatorId, normalized, bestMatch.similarity);
        return {
          operatorId: bestMatch.operatorId,
          normalizedName: normalized,
          canonicalName: bestMatch.canonicalName,
          confidence: bestMatch.similarity,
          isNew: false,
          isNewOperator: false,
          needsReview: false,
          aliases: [normalized]
        };
      }

      // Medium confidence - add to review queue but still use the match
      if (bestMatch && bestMatch.similarity >= this.config.similarityThreshold) {
        await this.addToReviewQueue(
          normalized,
          canonical,
          bestMatch.operatorId,
          bestMatch.similarity,
          similarOperators,
          permitId,
          sourceFile
        );
        await this.createAlias(bestMatch.operatorId, normalized, bestMatch.similarity);
        return {
          operatorId: bestMatch.operatorId,
          normalizedName: normalized,
          canonicalName: bestMatch.canonicalName,
          confidence: bestMatch.similarity,
          isNew: false,
          isNewOperator: false,
          needsReview: true,
          aliases: [normalized]
        };
      }
    }

    // Step 4: Low confidence or no match - add to review queue
    await this.addToReviewQueue(
      normalized,
      canonical,
      null,
      0,
      similarOperators,
      permitId,
      sourceFile
    );

    // If auto-create is enabled, create new operator
    if (this.config.autoCreateOperators) {
      const newOperator = await this.createOperator(canonical, normalized);
      await this.createAlias(newOperator.id, normalized, 1.0);
      return {
        operatorId: newOperator.id,
        normalizedName: normalized,
        canonicalName: newOperator.canonical_name,
        confidence: 1.0,
        isNew: true,
        isNewOperator: true,
        needsReview: false,
        aliases: [normalized]
      };
    }

    // Auto-create disabled - return uncertain result
    return {
      operatorId: '',
      normalizedName: normalized,
      canonicalName: canonical,
      confidence: 0,
      isNew: true,
      isNewOperator: true,
      needsReview: true,
      aliases: [normalized]
    };
  }

  /**
   * Find similar operators using pg_trgm fuzzy matching
   */
  async findSimilarOperators(name: string, threshold?: number): Promise<SimilarOperator[]> {
    const simThreshold = threshold ?? this.config.similarityThreshold;
    
    // Use the database function for trigram similarity
    const { data, error } = await this.db.rpc('find_similar_operators', {
      search_name: name,
      similarity_threshold: simThreshold
    });

    if (error) {
      console.error('Error finding similar operators:', error);
      return [];
    }

    // Also check aliases
    const { data: aliasData, error: aliasError } = await this.db.rpc('find_similar_aliases', {
      search_name: name,
      similarity_threshold: simThreshold
    });

    if (aliasError) {
      console.error('Error finding similar aliases:', aliasError);
    }

    // Combine and deduplicate results
    const results = new Map<string, SimilarOperator>();

    (data || []).forEach((op: { operator_id: string; canonical_name: string; similarity: number }) => {
      results.set(op.operator_id, {
        operatorId: op.operator_id,
        canonicalName: op.canonical_name,
        similarity: op.similarity
      });
    });

    for (const alias of (aliasData || [])) {
      const existing = results.get(alias.operator_id);
      if (!existing || alias.similarity > existing.similarity) {
        // Get the canonical name for this operator
        const operator = await this.getOperatorById(alias.operator_id);
        if (operator) {
          results.set(alias.operator_id, {
            operatorId: alias.operator_id,
            canonicalName: operator.canonical_name,
            similarity: alias.similarity
          });
        }
      }
    }

    return Array.from(results.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
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
   * Find exact match by normalized name
   */
  private async findExactMatch(normalizedName: string): Promise<OperatorRecord | null> {
    const { data, error } = await this.db
      .from('operators')
      .select('*')
      .eq('normalized_name', normalizedName)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;
    return data as OperatorRecord;
  }

  /**
   * Find exact alias match
   */
  private async findExactAliasMatch(normalizedAlias: string): Promise<AliasRecord | null> {
    const { data, error } = await this.db
      .from('operator_aliases')
      .select('*')
      .eq('normalized_alias', normalizedAlias)
      .single();

    if (error || !data) return null;
    return data as AliasRecord;
  }

  /**
   * Get operator by ID
   */
  private async getOperatorById(id: string): Promise<OperatorRecord | null> {
    const { data, error } = await this.db
      .from('operators')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as OperatorRecord;
  }

  /**
   * Create a new operator
   */
  private async createOperator(canonicalName: string, _rawName: string): Promise<OperatorRecord> {
    const normalizedName = canonicalName.toLowerCase();
    
    const { data, error } = await this.db
      .from('operators')
      .insert({
        canonical_name: canonicalName,
        normalized_name: normalizedName,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create operator: ${error.message}`);
    }

    return data as OperatorRecord;
  }

  /**
   * Create an alias for an operator
   */
  private async createAlias(
    operatorId: string, 
    alias: string, 
    confidence: number
  ): Promise<void> {
    const normalizedAlias = alias.toLowerCase();
    
    const { error } = await this.db
      .from('operator_aliases')
      .upsert({
        operator_id: operatorId,
        alias: alias,
        normalized_alias: normalizedAlias,
        confidence_score: confidence,
        source: 'etl_auto',
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'alias,operator_id'
      });

    if (error) {
      console.error('Error creating alias:', error);
    }
  }

  /**
   * Update alias usage statistics
   */
  private async updateAliasUsage(operatorId: string, alias: string): Promise<void> {
    const normalizedAlias = alias.toLowerCase();
    
    const { error } = await this.db
      .from('operator_aliases')
      .update({
        last_seen_at: new Date().toISOString(),
        usage_count: this.db.rpc('increment_usage_count', { row_id: operatorId, alias_text: alias })
      })
      .eq('operator_id', operatorId)
      .eq('normalized_alias', normalizedAlias);

    if (error) {
      // Silently fail - this is just statistics
      console.error('Error updating alias usage:', error);
    }
  }

  /**
   * Add entry to review queue
   */
  private async addToReviewQueue(
    rawName: string,
    normalizedName: string,
    suggestedOperatorId: string | null,
    confidence: number,
    similarOperators: SimilarOperator[],
    permitId?: string,
    sourceFile?: string
  ): Promise<void> {
    const { error } = await this.db
      .from('operator_review_queue')
      .insert({
        raw_operator_name: rawName,
        normalized_name: normalizedName,
        suggested_operator_id: suggestedOperatorId,
        suggested_confidence: confidence,
        similar_operators: similarOperators,
        permit_id: permitId || null,
        source_file: sourceFile || null,
        status: 'pending'
      });

    if (error) {
      console.error('Error adding to review queue:', error);
    }
  }

  /**
   * Get review queue statistics
   */
  async getReviewQueueStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    const { data, error } = await this.db
      .from('operator_review_queue')
      .select('status');

    if (error || !data) {
      return { pending: 0, approved: 0, rejected: 0, total: 0 };
    }

    const stats = { pending: 0, approved: 0, rejected: 0, total: data.length };
    data.forEach((row: { status: string }) => {
      if (row.status === 'pending') stats.pending++;
      else if (row.status === 'approved') stats.approved++;
      else if (row.status === 'rejected') stats.rejected++;
    });

    return stats;
  }

  /**
   * Get pending review items
   */
  async getPendingReviews(limit: number = 50): Promise<ReviewQueueEntry[]> {
    const { data, error } = await this.db
      .from('operator_review_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as ReviewQueueEntry[];
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
    const updates: Record<string, unknown> = {
      status: resolution,
      reviewed_at: new Date().toISOString(),
      resolution_notes: notes || null
    };

    if (operatorId) {
      updates.suggested_operator_id = operatorId;
    }

    const { error } = await this.db
      .from('operator_review_queue')
      .update(updates)
      .eq('id', reviewId);

    if (error) {
      throw new Error(`Failed to resolve review: ${error.message}`);
    }

    // If approved with an operator, create the alias
    if (resolution === 'approved' && operatorId) {
      const review = await this.getReviewById(reviewId);
      if (review) {
        await this.createAlias(operatorId, review.raw_operator_name, 1.0);
      }
    }
  }

  /**
   * Get a review by ID
   */
  private async getReviewById(reviewId: string): Promise<ReviewQueueEntry | null> {
    const { data, error } = await this.db
      .from('operator_review_queue')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error || !data) return null;
    return data as ReviewQueueEntry;
  }
}
