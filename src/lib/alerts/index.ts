/**
 * Alert Rules Engine
 * 
 * Core engine for evaluating permits against user-defined alert rules.
 * Supports spatial matching (AOI), filter matching, and operator watchlists.
 */

import {
  AlertRule,
  RuleFilters,
  CleanPermit,
  MatchedRule,
  AOI,
  BatchEvaluationResult,
} from '../../types/alert';

type UUID = string;

/**
 * Point-in-polygon test using ray casting algorithm
 * Supports simple polygons (GeoJSON format)
 */
function pointInPolygon(
  lat: number,
  lon: number,
  polygon: number[][][]
): boolean {
  let inside = false;
  
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i]?.[0] ?? 0;
      const yi = ring[i]?.[1] ?? 0;
      const xj = ring[j]?.[0] ?? 0;
      const yj = ring[j]?.[1] ?? 0;

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Check if a point is within an AOI (including buffer)
 * Note: Buffer is approximated as a simple bounding box expansion
 */
function pointInAOI(
  lat: number,
  lon: number,
  aoi: AOI
): boolean {
  const geometry = aoi.geometry;
  
  if (geometry.type === 'Polygon') {
    // Handle buffer by expanding the check area
    if (aoi.bufferMiles && aoi.bufferMiles > 0) {
      // Approximate: 1 degree ≈ 69 miles
      const bufferDegrees = aoi.bufferMiles / 69;
      
      // Quick bounding box check first
      let minLat = Infinity, maxLat = -Infinity;
      let minLon = Infinity, maxLon = -Infinity;
      
      for (const ring of geometry.coordinates) {
        for (const coord of ring) {
          const x = (coord?.[0] as number) ?? 0;
          const y = (coord?.[1] as number) ?? 0;
          minLon = Math.min(minLon, x);
          maxLon = Math.max(maxLon, x);
          minLat = Math.min(minLat, y);
          maxLat = Math.max(maxLat, y);
        }
      }
      
      // Check if point is within buffered bounding box
      if (lat < minLat - bufferDegrees || lat > maxLat + bufferDegrees ||
          lon < minLon - bufferDegrees || lon > maxLon + bufferDegrees) {
        return false;
      }
    }
    
    return pointInPolygon(lat, lon, geometry.coordinates as number[][][]);
  }
  
  // MultiPolygon - check each polygon
  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates as number[][][][]) {
      if (pointInPolygon(lat, lon, polygon)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Alert Rules Engine implementation
 */
export class AlertRulesEngine {
  private rules: AlertRule[] = [];
  private aois: Map<UUID, AOI> = new Map();
  
  /**
   * Load rules into the engine
   */
  setRules(rules: AlertRule[]): void {
    this.rules = rules.filter(r => r.isActive);
  }
  
  /**
   * Load AOIs into the engine
   */
  setAOIs(aois: AOI[]): void {
    this.aois.clear();
    for (const aoi of aois) {
      this.aois.set(aoi.id, aoi);
    }
  }
  
  /**
   * Get all active rules
   */
  getRules(): AlertRule[] {
    return [...this.rules];
  }
  
  /**
   * Get rules for a specific workspace
   */
  getRulesForWorkspace(workspaceId: UUID): AlertRule[] {
    return this.rules.filter(r => r.workspaceId === workspaceId);
  }
  
  /**
   * Check if permit matches AOI criteria
   */
  private matchesAOI(permit: CleanPermit, rule: AlertRule): boolean {
    // No AOI filter = matches all
    if (!rule.aoiIds || rule.aoiIds.length === 0) {
      return true;
    }

    // Permit must have coordinates
    if (permit.surfaceLat === null || permit.surfaceLat === undefined ||
        permit.surfaceLon === null || permit.surfaceLon === undefined) {
      return false;
    }
    
    // Check if permit is in any of the rule's AOIs
    for (const aoiId of rule.aoiIds) {
      const aoi = this.aois.get(aoiId);
      if (aoi && pointInAOI(permit.surfaceLat, permit.surfaceLon, aoi)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if permit matches filter criteria
   */
  private matchesFilters(permit: CleanPermit, filters: RuleFilters): {
    operatorMatch: boolean;
    countyMatch: boolean;
    statusMatch: boolean;
    typeMatch: boolean;
    dateMatch: boolean;
  } {
    const result = {
      operatorMatch: true,
      countyMatch: true,
      statusMatch: true,
      typeMatch: true,
      dateMatch: true,
    };
    
    // Operator filter
    if (filters.operators && filters.operators.length > 0) {
      result.operatorMatch = permit.operatorId !== undefined &&
        filters.operators.includes(permit.operatorId);
    }
    
    // County filter
    if (filters.counties && filters.counties.length > 0) {
      result.countyMatch = permit.county !== undefined &&
        filters.counties.includes(permit.county);
    }
    
    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      result.statusMatch = permit.status !== undefined &&
        filters.statuses.includes(permit.status);
    }
    
    // Permit type filter
    if (filters.permitTypes && filters.permitTypes.length > 0) {
      result.typeMatch = permit.permitType !== undefined &&
        filters.permitTypes.includes(permit.permitType);
    }
    
    // Date filter
    if (filters.filedAfter && permit.filedDate) {
      result.dateMatch = permit.filedDate >= filters.filedAfter;
    }
    
    return result;
  }
  
  /**
   * Check if permit matches operator watchlist
   */
  private matchesWatchlist(permit: CleanPermit, watchlist: UUID[]): boolean {
    if (!watchlist || watchlist.length === 0) {
      return false;
    }
    
    return permit.operatorId !== undefined &&
      watchlist.includes(permit.operatorId);
  }
  
  /**
   * Evaluate a single permit against all rules
   */
  async evaluatePermit(permit: CleanPermit): Promise<MatchedRule[]> {
    const matches: MatchedRule[] = [];
    
    for (const rule of this.rules) {
      const matchedCriteria: MatchedRule['matchedCriteria'] = {};
      let isMatch = false;
      
      // Check AOI match
      matchedCriteria.aoiMatch = this.matchesAOI(permit, rule);
      
      // Check filter matches
      const filterMatches = this.matchesFilters(permit, rule.filters);
      matchedCriteria.operatorMatch = filterMatches.operatorMatch;
      matchedCriteria.countyMatch = filterMatches.countyMatch;
      matchedCriteria.statusMatch = filterMatches.statusMatch;
      matchedCriteria.typeMatch = filterMatches.typeMatch;
      matchedCriteria.dateMatch = filterMatches.dateMatch;
      
      // Check watchlist match
      matchedCriteria.watchlistMatch = this.matchesWatchlist(
        permit,
        rule.operatorWatchlist
      );
      
      // Determine if this is a match
      // Rule matches if:
      // 1. AOI matches (or no AOI filter)
      // 2. All specified filters match
      // 3. OR watchlist matches

      const hasAOIFilter = rule.aoiIds && rule.aoiIds.length > 0;
      const hasFilters = rule.filters &&
        (rule.filters.operators?.length ||
         rule.filters.counties?.length ||
         rule.filters.statuses?.length ||
         rule.filters.permitTypes?.length ||
         rule.filters.filedAfter);
      const hasWatchlist = rule.operatorWatchlist && rule.operatorWatchlist.length > 0;

      // Check amendment notification first - if it's an amendment and we don't notify, skip
      if (permit.isAmendment && !rule.notifyOnAmendment) {
        isMatch = false;
      } else if (hasWatchlist && matchedCriteria.watchlistMatch) {
        // Watchlist match is always a match (unless amendment blocked above)
        isMatch = true;
      } else if (hasAOIFilter && hasFilters) {
        // Both AOI and filters required
        isMatch = matchedCriteria.aoiMatch &&
          filterMatches.operatorMatch &&
          filterMatches.countyMatch &&
          filterMatches.statusMatch &&
          filterMatches.typeMatch &&
          filterMatches.dateMatch;
      } else if (hasAOIFilter) {
        // Only AOI filter
        isMatch = matchedCriteria.aoiMatch;
      } else if (hasFilters) {
        // Only filter criteria
        isMatch = filterMatches.operatorMatch &&
          filterMatches.countyMatch &&
          filterMatches.statusMatch &&
          filterMatches.typeMatch &&
          filterMatches.dateMatch;
      } else if (!hasAOIFilter && !hasFilters && !hasWatchlist) {
        // Catch-all rule: no filters at all means match everything
        isMatch = true;
      }
      
      if (isMatch) {
        matches.push({
          rule,
          permit,
          matchedCriteria,
          matchedAt: new Date(),
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Evaluate a batch of permits against all rules
   */
  async evaluateBatch(permits: CleanPermit[]): Promise<BatchEvaluationResult> {
    const startTime = Date.now();
    const matches = new Map<UUID, MatchedRule[]>();
    let totalMatches = 0;
    
    for (const permit of permits) {
      const permitMatches = await this.evaluatePermit(permit);
      if (permitMatches.length > 0) {
        matches.set(permit.id, permitMatches);
        totalMatches += permitMatches.length;
      }
    }
    
    return {
      matches,
      totalEvaluated: permits.length,
      totalMatches,
      durationMs: Date.now() - startTime,
    };
  }
}

export default AlertRulesEngine;
