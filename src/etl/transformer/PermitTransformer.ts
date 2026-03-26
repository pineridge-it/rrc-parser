import { createHash } from 'crypto';
import { PermitData } from '../../types/permit';
import { DaPermitRecord, DaRootRecord, GisSurfaceRecord, GisBottomholeRecord } from '../../types/permit';

export interface NormalizedPermit {
  source_id: string | undefined;
  permit_number: string | undefined;
  lease_name: string | undefined;
  operator_name: string | undefined;
  operator_number: string | undefined;
  county_code: string | undefined;
  district: string | undefined;
  issue_date: string | undefined;
  received_date: string | undefined;
  amended_date: string | undefined;
  extended_date: string | undefined;
  spud_date: string | undefined;
  well_number: string | undefined;
  well_status: string | undefined;
  total_depth: number | undefined;
  application_type: string | undefined;
  well_type: string | undefined;
  horizontal_flag: string | undefined;
  directional_flag: string | undefined;
  sidetrack_flag: string | undefined;
  surface_section: string | undefined;
  surface_block: string | undefined;
  surface_survey: string | undefined;
  surface_abstract: string | undefined;
  gis_surface_lat: number | undefined;
  gis_surface_lon: number | undefined;
  gis_bottomhole_lat: number | undefined;
  gis_bottomhole_lon: number | undefined;
  created_at: string;
  updated_at: string;
}

export interface TransformResult {
  cleanPermit: NormalizedPermit | null;
  hash: string;
  isValid: boolean;
  errors: string[];
}

export class PermitTransformer {
  /**
   * Transform raw permit data into clean, normalized format
   * @param rawData - Raw permit data from parser
   * @returns Transformed permit data with validation info
   */
  transform(rawData: PermitData): TransformResult {
    const errors: string[] = [];

    try {
      // Extract core permit information
      const permitRecord = rawData.dapermit;
      const rootRecord = rawData.daroot;
      const surfaceRecord = rawData.gis_surface;
      const bottomholeRecord = rawData.gis_bottomhole;

      if (!permitRecord) {
        errors.push('Missing required dapermit record');
        return {
          cleanPermit: null,
          hash: '',
          isValid: false,
          errors
        };
      }

      // Normalize and validate permit data
      const cleanPermit = this.normalizePermitData(permitRecord, rootRecord, surfaceRecord, bottomholeRecord);

      // Generate hash for idempotency check
      const hash = this.generateHash(cleanPermit);

      // Validate transformed data
      const isValid = this.validateTransformedData(cleanPermit, errors);

      return {
        cleanPermit,
        hash,
        isValid,
        errors
      };
    } catch (error) {
      errors.push(`Transformation error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        cleanPermit: null,
        hash: '',
        isValid: false,
        errors
      };
    }
  }

  /**
   * Normalize permit data into clean format
   */
  private normalizePermitData(
    permitRecord: DaPermitRecord,
    rootRecord: DaRootRecord | null,
    surfaceRecord: GisSurfaceRecord | null,
    bottomholeRecord: GisBottomholeRecord | null
  ): NormalizedPermit {
    // permitRecord fields take precedence over rootRecord fields with same names
    const combinedData = {
      ...rootRecord,
      ...permitRecord
    };

    return {
      source_id: combinedData.permit_number ?? undefined,
      permit_number: combinedData.permit_number ?? undefined,
      lease_name: combinedData.lease_name ?? undefined,
      operator_name: combinedData.operator_name ?? undefined,
      operator_number: combinedData.operator_number ?? undefined,
      county_code: combinedData.county_code ?? undefined,
      district: combinedData.district ?? undefined,
      issue_date: combinedData.issued_date ?? undefined,
      received_date: combinedData.received_date ?? undefined,
      amended_date: combinedData.amended_date ?? undefined,
      extended_date: combinedData.extended_date ?? undefined,
      spud_date: combinedData.spud_date ?? undefined,
      well_number: combinedData.well_number ?? undefined,
      well_status: combinedData.well_status ?? undefined,
      total_depth: combinedData.total_depth ?? undefined,
      application_type: combinedData.application_type ?? undefined,
      well_type: combinedData.well_type ?? undefined,
      horizontal_flag: combinedData.horizontal_flag ?? undefined,
      directional_flag: combinedData.directional_flag ?? undefined,
      sidetrack_flag: combinedData.sidetrack_flag ?? undefined,
      surface_section: combinedData.surface_section ?? undefined,
      surface_block: combinedData.surface_block ?? undefined,
      surface_survey: combinedData.surface_survey ?? undefined,
      surface_abstract: combinedData.surface_abstract ?? undefined,
      gis_surface_lat: surfaceRecord?.latitude ?? undefined,
      gis_surface_lon: surfaceRecord?.longitude ?? undefined,
      gis_bottomhole_lat: bottomholeRecord?.latitude ?? undefined,
      gis_bottomhole_lon: bottomholeRecord?.longitude ?? undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Generate hash for idempotency checking
   */
  private generateHash(data: NormalizedPermit): string {
    const { created_at: _ca, updated_at: _ua, ...stable } = data;
    return createHash('sha256').update(JSON.stringify(stable)).digest('hex');
  }

  /**
   * Validate transformed data
   */
  private validateTransformedData(data: NormalizedPermit, errors: string[]): boolean {
    // Basic validation checks
    if (!data.source_id) {
      errors.push('Missing required field: source_id');
    }

    if (!data.permit_number) {
      errors.push('Missing required field: permit_number');
    }

    // Add more validation as needed

    return errors.length === 0;
  }
}