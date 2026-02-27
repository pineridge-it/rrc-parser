/**
 * Clean Permit model for normalized permit data
 * Location: src/models/PermitClean.ts
 * 
 * Represents cleaned, validated permit data with PostGIS geometry.
 * This is the "clean" side of the raw/clean data separation pattern.
 * 
 * DESIGN DECISIONS:
 * - Uses UUID branded type for compile-time type safety
 * - Geometry stored as PostGIS Point (WGS84 / EPSG:4326)
 * - Decimal coordinates for easy querying without PostGIS functions
 * - Version tracking for permit amendments
 * - Links to raw source via raw_id for lineage
 */

import { UUID } from '../types';

/**
 * Permit status values
 */
export type PermitStatus = 
  | 'approved'
  | 'pending'
  | 'cancelled'
  | 'expired'
  | 'suspended'
  | 'active'
  | 'inactive'
  | string; // Extensible for future statuses

/**
 * Permit type values
 */
export type PermitType = 
  | 'drilling'
  | 'amendment'
  | 'recompletion'
  | 'workover'
  | 'plugging'
  | 'transfer'
  | string; // Extensible for future types

/**
 * Geometry point interface for PostGIS Point
 */
export interface GeometryPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  crs?: {
    type: 'name';
    properties: {
      name: 'EPSG:4326';
    };
  };
}

/**
 * Clean permit record interface
 * Maps 1:1 with permits_clean database table
 */
export interface PermitClean {
  /** Unique identifier for the clean permit record */
  id: UUID;
  
  /** Foreign key to permits_raw - maintains lineage to source data */
  raw_id: UUID | null;
  
  /** Official RRC permit number */
  permit_number: string;
  
  /** Type of permit (drilling, amendment, etc.) */
  permit_type: PermitType | null;
  
  /** Current status (approved, pending, cancelled, etc.) */
  status: PermitStatus | null;
  
  /** Original operator name from source before normalization */
  operator_name_raw: string | null;
  
  /** Foreign key to normalized operators table (Phase 4) */
  operator_id: UUID | null;
  
  /** Texas county name */
  county: string | null;
  
  /** RRC district number/identifier */
  district: string | null;
  
  /** Oil/gas lease name */
  lease_name: string | null;
  
  /** Well number within lease */
  well_number: string | null;
  
  /** API well number */
  api_number: string | null;
  
  /** PostGIS Point geometry (WGS84 / EPSG:4326) */
  location: GeometryPoint | null;
  
  /** Surface latitude in decimal degrees */
  surface_lat: number | null;
  
  /** Surface longitude in decimal degrees */
  surface_lon: number | null;
  
  /** Date permit was filed with RRC */
  filed_date: Date | null;
  
  /** Date permit was approved by RRC */
  approved_date: Date | null;
  
  /** Timestamp when RRC says permit is effective */
  effective_at: Date | null;
  
  /** Timestamp when we first saw this permit from source */
  source_seen_at: Date | null;
  
  /** Additional permit fields as JSONB */
  metadata: Record<string, unknown>;
  
  /** Version number for tracking amendments to same permit */
  version: number;
  
  /** When this clean record was created */
  created_at: Date;
  
  /** When this clean record was last updated */
  updated_at: Date;
}

/**
 * Input type for creating a new PermitClean record
 * Omits auto-generated fields (id, timestamps, version)
 */
export interface PermitCleanInput {
  raw_id?: UUID | null;
  permit_number: string;
  permit_type?: PermitType | null;
  status?: PermitStatus | null;
  operator_name_raw?: string | null;
  operator_id?: UUID | null;
  county?: string | null;
  district?: string | null;
  lease_name?: string | null;
  well_number?: string | null;
  api_number?: string | null;
  location?: GeometryPoint | null;
  surface_lat?: number | null;
  surface_lon?: number | null;
  filed_date?: Date | null;
  approved_date?: Date | null;
  effective_at?: Date | null;
  source_seen_at?: Date | null;
  metadata?: Record<string, unknown>;
  version?: number;
}

/**
 * Update type for modifying an existing PermitClean record
 * All fields optional except id
 */
export interface PermitCleanUpdate {
  id: UUID;
  status?: PermitStatus | null;
  operator_id?: UUID | null;
  metadata?: Record<string, unknown>;
  // Note: Most fields should not be updated after creation
  // Status and operator linking are the primary update use cases
}

/**
 * Query filters for fetching PermitClean records
 */
export interface PermitCleanFilters {
  permit_number?: string;
  permit_type?: PermitType;
  status?: PermitStatus;
  operator_id?: UUID;
  county?: string;
  district?: string;
  api_number?: string;
  filed_after?: Date;
  filed_before?: Date;
  approved_after?: Date;
  approved_before?: Date;
  has_geometry?: boolean;
  /** Bounding box for spatial query [minLon, minLat, maxLon, maxLat] */
  bbox?: [number, number, number, number];
  limit?: number;
  offset?: number;
  order_by?: 'filed_date' | 'approved_date' | 'created_at' | 'permit_number';
  order_dir?: 'asc' | 'desc';
}

/**
 * Spatial query options for map-based queries
 */
export interface SpatialQueryOptions {
  /** Center point [longitude, latitude] */
  center: [number, number];
  /** Radius in meters */
  radius_meters: number;
  limit?: number;
}

/**
 * Validation result for permit data
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * PermitClean class with helper methods
 */
export class PermitCleanRecord implements PermitClean {
  id: UUID;
  raw_id: UUID | null;
  permit_number: string;
  permit_type: PermitType | null;
  status: PermitStatus | null;
  operator_name_raw: string | null;
  operator_id: UUID | null;
  county: string | null;
  district: string | null;
  lease_name: string | null;
  well_number: string | null;
  api_number: string | null;
  location: GeometryPoint | null;
  surface_lat: number | null;
  surface_lon: number | null;
  filed_date: Date | null;
  approved_date: Date | null;
  effective_at: Date | null;
  source_seen_at: Date | null;
  metadata: Record<string, unknown>;
  version: number;
  created_at: Date;
  updated_at: Date;

  constructor(data: PermitClean) {
    this.id = data.id;
    this.raw_id = data.raw_id;
    this.permit_number = data.permit_number;
    this.permit_type = data.permit_type;
    this.status = data.status;
    this.operator_name_raw = data.operator_name_raw;
    this.operator_id = data.operator_id;
    this.county = data.county;
    this.district = data.district;
    this.lease_name = data.lease_name;
    this.well_number = data.well_number;
    this.api_number = data.api_number;
    this.location = data.location;
    this.surface_lat = data.surface_lat;
    this.surface_lon = data.surface_lon;
    this.filed_date = data.filed_date;
    this.approved_date = data.approved_date;
    this.effective_at = data.effective_at;
    this.source_seen_at = data.source_seen_at;
    this.metadata = data.metadata;
    this.version = data.version;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Check if the permit has geometry data
   */
  hasGeometry(): boolean {
    return this.location !== null && 
           this.surface_lat !== null && 
           this.surface_lon !== null;
  }

  /**
   * Check if the permit is approved
   */
  isApproved(): boolean {
    return this.status === 'approved' || this.status === 'active';
  }

  /**
   * Check if the permit is pending
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Get the permit age in days since filing
   */
  getAgeDays(): number | null {
    if (!this.filed_date) return null;
    const now = new Date();
    const filed = new Date(this.filed_date);
    return Math.floor((now.getTime() - filed.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get coordinates as [longitude, latitude] tuple
   */
  getCoordinates(): [number, number] | null {
    if (this.surface_lon !== null && this.surface_lat !== null) {
      return [this.surface_lon, this.surface_lat];
    }
    if (this.location?.coordinates) {
      return this.location.coordinates;
    }
    return null;
  }

  /**
   * Calculate distance to another permit in kilometers (haversine formula)
   */
  distanceToKm(other: PermitCleanRecord): number | null {
    const coords1 = this.getCoordinates();
    const coords2 = other.getCoordinates();
    
    if (!coords1 || !coords2) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
    const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Validate the permit data
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!this.permit_number || this.permit_number.trim() === '') {
      errors.push({ field: 'permit_number', message: 'Permit number is required', code: 'REQUIRED' });
    }

    // Coordinate validation
    if (this.surface_lat !== null) {
      if (this.surface_lat < -90 || this.surface_lat > 90) {
        errors.push({ field: 'surface_lat', message: 'Latitude must be between -90 and 90', code: 'RANGE_ERROR' });
      }
    }

    if (this.surface_lon !== null) {
      if (this.surface_lon < -180 || this.surface_lon > 180) {
        errors.push({ field: 'surface_lon', message: 'Longitude must be between -180 and 180', code: 'RANGE_ERROR' });
      }
    }

    // Texas bounds check (approximate)
    if (this.surface_lat !== null && this.surface_lon !== null) {
      if (this.surface_lat < 25 || this.surface_lat > 37 || 
          this.surface_lon < -107 || this.surface_lon > -93) {
        warnings.push('Coordinates appear to be outside Texas bounds');
      }
    }

    // Date validation
    if (this.filed_date && this.approved_date) {
      if (new Date(this.approved_date) < new Date(this.filed_date)) {
        errors.push({ field: 'approved_date', message: 'Approved date cannot be before filed date', code: 'DATE_ORDER_ERROR' });
      }
    }

    // API number format (should be 8-12 digits)
    if (this.api_number && !/^\d{8,12}$/.test(this.api_number.replace(/-/g, ''))) {
      warnings.push('API number format may be invalid');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert to a plain object suitable for database insertion
   */
  toObject(): PermitClean {
    return {
      id: this.id,
      raw_id: this.raw_id,
      permit_number: this.permit_number,
      permit_type: this.permit_type,
      status: this.status,
      operator_name_raw: this.operator_name_raw,
      operator_id: this.operator_id,
      county: this.county,
      district: this.district,
      lease_name: this.lease_name,
      well_number: this.well_number,
      api_number: this.api_number,
      location: this.location,
      surface_lat: this.surface_lat,
      surface_lon: this.surface_lon,
      filed_date: this.filed_date,
      approved_date: this.approved_date,
      effective_at: this.effective_at,
      source_seen_at: this.source_seen_at,
      metadata: this.metadata,
      version: this.version,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Create a new PermitCleanRecord from input data
   * Generates id, timestamps, and sets defaults
   */
  static create(input: PermitCleanInput): PermitCleanRecord {
    const now = new Date();
    
    // Build geometry point if coordinates provided
    let location: GeometryPoint | null = null;
    if (input.surface_lon !== null && input.surface_lat !== null) {
      location = {
        type: 'Point',
        coordinates: [input.surface_lon, input.surface_lat],
        crs: {
          type: 'name',
          properties: {
            name: 'EPSG:4326'
          }
        }
      };
    }
    
    return new PermitCleanRecord({
      id: crypto.randomUUID() as UUID,
      raw_id: input.raw_id ?? null,
      permit_number: input.permit_number,
      permit_type: input.permit_type ?? null,
      status: input.status ?? null,
      operator_name_raw: input.operator_name_raw ?? null,
      operator_id: input.operator_id ?? null,
      county: input.county ?? null,
      district: input.district ?? null,
      lease_name: input.lease_name ?? null,
      well_number: input.well_number ?? null,
      api_number: input.api_number ?? null,
      location: input.location ?? location,
      surface_lat: input.surface_lat ?? null,
      surface_lon: input.surface_lon ?? null,
      filed_date: input.filed_date ?? null,
      approved_date: input.approved_date ?? null,
      effective_at: input.effective_at ?? null,
      source_seen_at: input.source_seen_at ?? null,
      metadata: input.metadata ?? {},
      version: input.version ?? 1,
      created_at: now,
      updated_at: now
    });
  }

  /**
   * Create a PostGIS geometry string from coordinates
   */
  static createGeometryString(lat: number, lon: number): string {
    return `SRID=4326;POINT(${lon} ${lat})`;
  }

  /**
   * Parse a PostGIS geometry string into coordinates
   */
  static parseGeometryString(geomString: string): { lat: number; lon: number } | null {
    const match = geomString.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) {
      return {
        lon: parseFloat(match[1]),
        lat: parseFloat(match[2])
      };
    }
    return null;
  }
}
