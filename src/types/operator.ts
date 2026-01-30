/**
 * Operator and operator alias type definitions
 */

export type UUID = string;

/**
 * Canonical operator entity
 */
export interface Operator {
  id: UUID;
  canonicalName: string;
  normalizedName: string;
  
  // Company info
  headquartersCity?: string;
  headquartersState?: string;
  website?: string;
  
  // Computed stats
  totalPermits: number;
  activePermits: number;
  firstPermitDate?: string;
  lastPermitDate?: string;
  primaryCounties: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Operator alias for name matching
 */
export interface OperatorAlias {
  id: UUID;
  operatorId: UUID;
  alias: string;
  normalizedAlias: string;
  source: 'rrc' | 'manual' | 'ml';
  confidence: number;
}

/**
 * Operator activity summary for dashboard
 */
export interface OperatorActivitySummary {
  operatorId: UUID;
  operatorName: string;
  totalPermits: number;
  activePermits: number;
  permitsLast30Days: number;
  permitsLast90Days: number;
  averagePermitsPerMonth: number;
  topCounties: Array<{
    county: string;
    permitCount: number;
  }>;
  permitTrend: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Operator permit timeline entry
 */
export interface OperatorPermitTimelineEntry {
  permitId: UUID;
  permitNumber: string;
  leaseName: string;
  wellNumber?: string;
  county: string;
  district?: string;
  filedDate: string;
  issuedDate?: string;
  status: string;
  wellType?: string;
}

/**
 * Operator comparison data
 */
export interface OperatorComparison {
  operatorId: UUID;
  operatorName: string;
  totalPermits: number;
  activePermits: number;
  permitsThisYear: number;
  averageDepth?: number;
  topCounty?: string;
  primaryWellType?: string;
}

/**
 * Geographic footprint data for mapping
 */
export interface OperatorGeographicFootprint {
  operatorId: UUID;
  operatorName: string;
  permitLocations: Array<{
    permitId: UUID;
    permitNumber: string;
    latitude: number;
    longitude: number;
    leaseName: string;
    filedDate: string;
    status: string;
  }>;
  countyBreakdown: Array<{
    county: string;
    permitCount: number;
    percentage: number;
  }>;
}

/**
 * Operator search result
 */
export interface OperatorSearchResult {
  id: UUID;
  canonicalName: string;
  aliases: string[];
  totalPermits: number;
  matchScore: number;
}

/**
 * Operator filter options
 */
export interface OperatorFilterOptions {
  query?: string;
  counties?: string[];
  minPermits?: number;
  maxPermits?: number;
  activeOnly?: boolean;
  sortBy: 'name' | 'permits' | 'recent';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

/**
 * Paginated operator list response
 */
export interface OperatorListResponse {
  operators: Operator[];
  total: number;
  hasMore: boolean;
}
