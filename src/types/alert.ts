/**
 * Alert Rules Engine type definitions
 */

/**
 * UUID type alias for clarity
 */
type UUID = string;

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  type: 'email' | 'webhook' | 'sms' | 'push';
  config: Record<string, unknown>;
}

/**
 * Alert rule filter criteria
 */
export interface RuleFilters {
  /** Match specific operator IDs */
  operators?: UUID[];
  /** Match specific counties */
  counties?: string[];
  /** Match permit statuses (approved, pending, etc.) */
  statuses?: string[];
  /** Match permit types (drilling, amendment, etc.) */
  permitTypes?: string[];
  /** Only permits filed after this date */
  filedAfter?: Date;
}

/**
 * Alert rule definition
 */
export interface AlertRule {
  /** Unique rule ID */
  id: UUID;
  /** Workspace this rule belongs to */
  workspaceId: UUID;
  /** Human-readable rule name */
  name: string;
  /** AOI IDs for spatial filtering (empty = no spatial filter) */
  aoiIds: UUID[];
  /** Filter criteria */
  filters: RuleFilters;
  /** Operator IDs to watch */
  operatorWatchlist: UUID[];
  /** Whether to notify on amendments */
  notifyOnAmendment: boolean;
  /** Notification channels */
  channels: NotificationChannel[];
  /** Whether rule is active */
  isActive: boolean;
}

/**
 * Clean permit data structure for evaluation
 */
export interface CleanPermit {
  id: UUID;
  permitNumber: string;
  permitType?: string;
  status?: string;
  operatorId?: UUID;
  operatorName?: string;
  county?: string;
  district?: string;
  leaseName?: string;
  wellNumber?: string;
  apiNumber?: string;
  surfaceLat?: number;
  surfaceLon?: number;
  filedDate?: Date;
  approvedDate?: Date;
  amendedDate?: Date;
  isAmendment: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Matched rule result for a permit
 */
export interface MatchedRule {
  /** The rule that matched */
  rule: AlertRule;
  /** The permit that matched */
  permit: CleanPermit;
  /** Which matching criteria were satisfied */
  matchedCriteria: {
    aoiMatch?: boolean;
    operatorMatch?: boolean;
    countyMatch?: boolean;
    statusMatch?: boolean;
    typeMatch?: boolean;
    dateMatch?: boolean;
    watchlistMatch?: boolean;
  };
  /** Timestamp of match */
  matchedAt: Date;
}

/**
 * Area of Interest (AOI) geometry
 */
export interface AOI {
  id: UUID;
  workspaceId: UUID;
  name: string;
  /** GeoJSON geometry */
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  /** Optional buffer distance in miles */
  bufferMiles?: number;
}

/**
 * Alert evaluation result for batch processing
 */
export interface BatchEvaluationResult {
  /** Map of permit ID to matched rules */
  matches: Map<UUID, MatchedRule[]>;
  /** Total permits evaluated */
  totalEvaluated: number;
  /** Total matches found */
  totalMatches: number;
  /** Evaluation duration in milliseconds */
  durationMs: number;
}
