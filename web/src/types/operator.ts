export type UUID = string;

export interface Operator {
  id: UUID;
  canonicalName: string;
  normalizedName: string;
  headquartersCity?: string;
  headquartersState?: string;
  website?: string;
  totalPermits: number;
  activePermits: number;
  firstPermitDate?: string;
  lastPermitDate?: string;
  primaryCounties: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OperatorAlias {
  id: UUID;
  operatorId: UUID;
  alias: string;
  normalizedAlias: string;
  source: 'rrc' | 'manual' | 'ml';
  confidence: number;
}

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

export interface OperatorSearchResult {
  id: UUID;
  canonicalName: string;
  aliases: string[];
  totalPermits: number;
  matchScore: number;
}

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

export interface OperatorListResponse {
  operators: Operator[];
  total: number;
  hasMore: boolean;
}
