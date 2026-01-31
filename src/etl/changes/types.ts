/**
 * Types for permit change detection system
 */

export type ChangeType = 
  | 'new' 
  | 'status_change' 
  | 'amendment' 
  | 'operator_change' 
  | 'location_update';

export interface PermitChange {
  id?: string;
  permitId: string;
  changeType: ChangeType;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown>;
  detectedAt: Date;
  etlRunId?: string;
  processedForAlerts: boolean;
  alertEventId?: string;
  createdAt?: Date;
}

export interface PermitSnapshot {
  id: string;
  permitNumber: string;
  permitType?: string;
  status?: string;
  operatorNameRaw?: string;
  operatorId?: string;
  county?: string;
  district?: string;
  leaseName?: string;
  wellNumber?: string;
  apiNumber?: string;
  surfaceLat?: number;
  surfaceLon?: number;
  filedDate?: Date;
  approvedDate?: Date;
  effectiveAt?: Date;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface ChangeDetectionResult {
  changes: PermitChange[];
  newPermits: number;
  statusChanges: number;
  amendments: number;
  operatorChanges: number;
  locationUpdates: number;
}

export interface ChangeDetectorConfig {
  etlRunId?: string;
  trackLocationChanges?: boolean;
  locationChangeThreshold?: number; // meters
}

export interface UnprocessedChangesQuery {
  limit?: number;
  changeTypes?: ChangeType[];
  since?: Date;
}
