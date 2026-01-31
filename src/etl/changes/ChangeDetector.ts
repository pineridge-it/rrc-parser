import { createLogger } from '../../services/logger';
import {
  ChangeType,
  PermitChange,
  PermitSnapshot,
  ChangeDetectionResult,
  ChangeDetectorConfig,
  UnprocessedChangesQuery,
} from './types';

const logger = createLogger({ name: 'ChangeDetector' });

/**
 * Calculates distance between two lat/lon points in meters
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts a permit record to a snapshot for comparison
 */
function toSnapshot(permit: Record<string, unknown>): PermitSnapshot {
  return {
    id: permit.id as string,
    permitNumber: permit.permit_number as string,
    permitType: permit.permit_type as string | undefined,
    status: permit.status as string | undefined,
    operatorNameRaw: permit.operator_name_raw as string | undefined,
    operatorId: permit.operator_id as string | undefined,
    county: permit.county as string | undefined,
    district: permit.district as string | undefined,
    leaseName: permit.lease_name as string | undefined,
    wellNumber: permit.well_number as string | undefined,
    apiNumber: permit.api_number as string | undefined,
    surfaceLat: permit.surface_lat as number | undefined,
    surfaceLon: permit.surface_lon as number | undefined,
    filedDate: permit.filed_date ? new Date(permit.filed_date as string) : undefined,
    approvedDate: permit.approved_date
      ? new Date(permit.approved_date as string)
      : undefined,
    effectiveAt: permit.effective_at
      ? new Date(permit.effective_at as string)
      : undefined,
    version: (permit.version as number) || 1,
    metadata: (permit.metadata as Record<string, unknown>) || {},
  };
}

/**
 * Detects changes between two permit snapshots
 */
function detectChangesBetweenSnapshots(
  existing: PermitSnapshot,
  incoming: PermitSnapshot,
  config: ChangeDetectorConfig
): ChangeType[] {
  const changes: ChangeType[] = [];

  // Check for status change
  if (existing.status !== incoming.status) {
    changes.push('status_change');
  }

  // Check for operator change
  if (existing.operatorId !== incoming.operatorId) {
    changes.push('operator_change');
  }

  // Check for location update
  if (config.trackLocationChanges !== false) {
    const threshold = config.locationChangeThreshold || 10; // 10 meters default
    if (
      existing.surfaceLat !== undefined &&
      existing.surfaceLon !== undefined &&
      incoming.surfaceLat !== undefined &&
      incoming.surfaceLon !== undefined
    ) {
      const distance = haversineDistance(
        existing.surfaceLat,
        existing.surfaceLon,
        incoming.surfaceLat,
        incoming.surfaceLon
      );
      if (distance > threshold) {
        changes.push('location_update');
      }
    }
  }

  // Check for amendment (version change)
  if (incoming.version > existing.version) {
    changes.push('amendment');
  }

  return changes;
}

/**
 * ChangeDetector class for detecting and tracking permit changes
 */
export class ChangeDetector {
  private config: ChangeDetectorConfig;

  constructor(config: ChangeDetectorConfig = {}) {
    this.config = config;
    logger.info('ChangeDetector initialized', { config });
  }

  /**
   * Detects changes between an existing permit and incoming permit data
   * @param newPermit - The incoming permit data
   * @param existingPermit - The existing permit from database (optional)
   * @returns Array of detected changes
   */
  detectChanges(
    newPermit: Record<string, unknown>,
    existingPermit?: Record<string, unknown>
  ): PermitChange[] {
    const changes: PermitChange[] = [];
    const newSnapshot = toSnapshot(newPermit);

    if (!existingPermit) {
      // This is a new permit
      changes.push({
        permitId: newSnapshot.id,
        changeType: 'new',
        previousValue: null,
        newValue: newPermit,
        detectedAt: new Date(),
        etlRunId: this.config.etlRunId,
        processedForAlerts: false,
      });
      logger.debug('Detected new permit', { permitId: newSnapshot.id });
    } else {
      // Compare with existing permit
      const existingSnapshot = toSnapshot(existingPermit);
      const changeTypes = detectChangesBetweenSnapshots(
        existingSnapshot,
        newSnapshot,
        this.config
      );

      for (const changeType of changeTypes) {
        changes.push({
          permitId: newSnapshot.id,
          changeType,
          previousValue: existingPermit,
          newValue: newPermit,
          detectedAt: new Date(),
          etlRunId: this.config.etlRunId,
          processedForAlerts: false,
        });
      }

      if (changeTypes.length > 0) {
        logger.debug('Detected permit changes', {
          permitId: newSnapshot.id,
          changeTypes,
        });
      }
    }

    return changes;
  }

  /**
   * Processes a batch of permits and detects all changes
   * @param permits - Array of permits to process
   * @param existingPermitsLookup - Map of existing permits by ID
   * @returns Change detection result with statistics
   */
  detectChangesBatch(
    permits: Record<string, unknown>[],
    existingPermitsLookup: Map<string, Record<string, unknown>>
  ): ChangeDetectionResult {
    const allChanges: PermitChange[] = [];
    let newPermits = 0;
    let statusChanges = 0;
    let amendments = 0;
    let operatorChanges = 0;
    let locationUpdates = 0;

    for (const permit of permits) {
      const permitId = permit.id as string;
      const existing = existingPermitsLookup.get(permitId);
      const changes = this.detectChanges(permit, existing);

      allChanges.push(...changes);

      // Count by type
      for (const change of changes) {
        switch (change.changeType) {
          case 'new':
            newPermits++;
            break;
          case 'status_change':
            statusChanges++;
            break;
          case 'amendment':
            amendments++;
            break;
          case 'operator_change':
            operatorChanges++;
            break;
          case 'location_update':
            locationUpdates++;
            break;
        }
      }
    }

    logger.info('Change detection batch complete', {
      totalPermits: permits.length,
      totalChanges: allChanges.length,
      newPermits,
      statusChanges,
      amendments,
      operatorChanges,
      locationUpdates,
    });

    return {
      changes: allChanges,
      newPermits,
      statusChanges,
      amendments,
      operatorChanges,
      locationUpdates,
    };
  }

  /**
   * Creates a lookup map from an array of permits
   * @param permits - Array of permit records
   * @returns Map of permits by ID
   */
  static createLookup(
    permits: Record<string, unknown>[]
  ): Map<string, Record<string, unknown>> {
    const lookup = new Map<string, Record<string, unknown>>();
    for (const permit of permits) {
      const id = permit.id as string;
      if (id) {
        lookup.set(id, permit);
      }
    }
    return lookup;
  }
}

/**
 * Factory function to create a ChangeDetector instance
 */
export function createChangeDetector(
  config?: ChangeDetectorConfig
): ChangeDetector {
  return new ChangeDetector(config);
}
