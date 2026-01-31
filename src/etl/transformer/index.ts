/**
 * ETL Transformer Module
 * 
 * Transforms parsed permit data into database-ready format.
 * Handles data normalization, validation, and enrichment.
 */

import { ParsedPermit, TransformedPermit, ETLError } from '../types/index';
import { createHash } from 'crypto';

/**
 * Transformer configuration options
 */
export interface TransformerConfig {
  /** Whether to validate coordinates */
  validateCoordinates: boolean;
  /** Whether to normalize operator names */
  normalizeOperators: boolean;
  /** Texas bounding box for coordinate validation */
  texasBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

/**
 * Default transformer configuration
 */
export const DEFAULT_TRANSFORMER_CONFIG: TransformerConfig = {
  validateCoordinates: true,
  normalizeOperators: true,
  texasBounds: {
    minLat: 25.8,
    maxLat: 36.5,
    minLon: -106.6,
    maxLon: -93.5,
  },
};

/**
 * Transform result containing transformed permits and errors
 */
export interface TransformerResult {
  /** Successfully transformed permits */
  permits: TransformedPermit[];
  /** Errors encountered during transformation */
  errors: ETLError[];
  /** Statistics */
  stats: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Generate a unique ID from permit data
 */
function generatePermitId(apiNumber: string, permitNumber: string): string {
  const hash = createHash('sha256')
    .update(`${apiNumber}:${permitNumber}`)
    .digest('hex')
    .slice(0, 16);
  return `perm_${hash}`;
}

/**
 * Generate a hash for the raw data
 */
export function generateDataHash(data: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * Validate and parse coordinates
 */
function parseCoordinates(
  latitude: number | undefined,
  longitude: number | undefined,
  config: TransformerConfig
): { latitude: number; longitude: number; geojson: { type: 'Point'; coordinates: [number, number] } } | undefined {
  if (latitude === undefined || longitude === undefined) {
    return undefined;
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return undefined;
  }

  if (config.validateCoordinates) {
    if (
      lat < config.texasBounds.minLat ||
      lat > config.texasBounds.maxLat ||
      lon < config.texasBounds.minLon ||
      lon > config.texasBounds.maxLon
    ) {
      return undefined;
    }
  }

  return {
    latitude: lat,
    longitude: lon,
    geojson: {
      type: 'Point',
      coordinates: [lon, lat],
    },
  };
}

/**
 * Normalize operator name
 */
function normalizeOperatorName(name: string): { name: string; confidence: number } {
  // Basic normalization: uppercase, trim, remove extra spaces
  let normalized = name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)/g, ')');

  // Standardize common suffixes
  const suffixReplacements: Record<string, string> = {
    ' LLC': ' LLC',
    ' INC': ' INC',
    ' INCORPORATED': ' INC',
    ' CORPORATION': ' CORP',
    ' CORP': ' CORP',
    ' LTD': ' LTD',
    ' LIMITED': ' LTD',
    ' LP': ' LP',
    ' L P': ' LP',
  };

  for (const [pattern, replacement] of Object.entries(suffixReplacements)) {
    normalized = normalized.replace(new RegExp(pattern + '$', 'i'), replacement);
  }

  return {
    name: normalized,
    confidence: 1.0, // Would be calculated based on fuzzy matching in real implementation
  };
}

/**
 * Parse status string to enum
 */
function parseStatus(status: string): 'pending' | 'approved' | 'cancelled' | 'expired' {
  const normalized = status.toLowerCase().trim();
  
  if (normalized.includes('approve') || normalized === 'a') {
    return 'approved';
  }
  if (normalized.includes('cancel') || normalized === 'c') {
    return 'cancelled';
  }
  if (normalized.includes('expir') || normalized === 'e') {
    return 'expired';
  }
  
  return 'pending';
}

/**
 * Transform a single parsed permit
 */
export function transformPermit(
  permit: ParsedPermit,
  etlRunId: string,
  config: Partial<TransformerConfig> = {}
): { permit: TransformedPermit | null; error: ETLError | null } {
  const fullConfig = { ...DEFAULT_TRANSFORMER_CONFIG, ...config };

  try {
    // Generate IDs
    const id = generatePermitId(permit.apiNumber, permit.permitNumber);
    const countyId = `cnty_${permit.county.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Normalize operator
    const operator = fullConfig.normalizeOperators
      ? normalizeOperatorName(permit.operatorName)
      : { name: permit.operatorName, confidence: 1.0 };
    const operatorId = `op_${createHash('sha256').update(operator.name).digest('hex').slice(0, 12)}`;

    // Parse coordinates
    const location = parseCoordinates(permit.latitude, permit.longitude, fullConfig);

    // Parse dates
    const filedDate = permit.filedDate ? new Date(permit.filedDate) : undefined;
    const approvedDate = permit.approvedDate ? new Date(permit.approvedDate) : undefined;

    // Validate required fields
    if (!permit.apiNumber || !permit.permitNumber) {
      return {
        permit: null,
        error: {
          timestamp: new Date(),
          phase: 'transform',
          message: 'Missing required fields: apiNumber or permitNumber',
          details: { permit },
        },
      };
    }

    const transformed: TransformedPermit = {
      id,
      permitNumber: permit.permitNumber,
      apiNumber: permit.apiNumber,
      leaseName: permit.leaseName.trim(),
      wellNumber: permit.wellNumber?.trim(),
      countyId,
      countyName: permit.county.trim(),
      operatorId,
      operatorName: operator.name,
      fieldId: undefined, // Would be looked up from field table
      fieldName: permit.fieldName?.trim(),
      filedDate,
      approvedDate,
      status: parseStatus(permit.status),
      permitType: permit.permitType.trim(),
      wellboreProfile: permit.wellboreProfile?.trim(),
      totalDepth: permit.totalDepth,
      location,
      metadata: {
        etlRunId,
        parsedAt: new Date(),
        transformedAt: new Date(),
        sourceFile: permit._raw.sourceFile,
        lineNumber: permit._raw.lineNumber,
        version: 1,
      },
    };

    return { permit: transformed, error: null };
  } catch (err) {
    return {
      permit: null,
      error: {
        timestamp: new Date(),
        phase: 'transform',
        message: `Transform error: ${err instanceof Error ? err.message : String(err)}`,
        details: { permit, error: err },
      },
    };
  }
}

/**
 * Transform multiple permits in batch
 */
export function transformPermits(
  permits: ParsedPermit[],
  etlRunId: string,
  config?: Partial<TransformerConfig>
): TransformerResult {
  const results: TransformedPermit[] = [];
  const errors: ETLError[] = [];

  for (const permit of permits) {
    const { permit: transformed, error } = transformPermit(permit, etlRunId, config);
    
    if (transformed) {
      results.push(transformed);
    }
    if (error) {
      errors.push(error);
    }
  }

  return {
    permits: results,
    errors,
    stats: {
      total: permits.length,
      successful: results.length,
      failed: errors.length,
    },
  };
}

/**
 * Create a transformer function for use in the pipeline
 */
export function createTransformer(
  etlRunId: string,
  config?: Partial<TransformerConfig>
) {
  return {
    transform: (permit: ParsedPermit) => transformPermit(permit, etlRunId, config),
    transformBatch: (permits: ParsedPermit[]) => transformPermits(permits, etlRunId, config),
  };
}
