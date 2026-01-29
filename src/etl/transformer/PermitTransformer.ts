import { PermitData } from '../../types/permit';
import { DaPermitRecord, DaRootRecord, GisSurfaceRecord, GisBottomholeRecord } from '../../types/permit';

export interface TransformResult {
  cleanPermit: any;
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
  ): any {
    // Combine data from permit and root records
    const combinedData = {
      ...rootRecord,
      ...permitRecord
    };
    
    return {
      source_id: combinedData.permit_number,
      permit_number: combinedData.permit_number,
      lease_name: combinedData.lease_name,
      operator_name: combinedData.operator_name,
      operator_number: combinedData.operator_number,
      county_code: combinedData.county_code,
      district: combinedData.district,
      issue_date: combinedData.issued_date || combinedData.issue_date,
      received_date: combinedData.received_date,
      amended_date: combinedData.amended_date,
      extended_date: combinedData.extended_date,
      spud_date: combinedData.spud_date,
      well_number: combinedData.well_number,
      well_status: combinedData.well_status,
      total_depth: combinedData.total_depth,
      application_type: combinedData.application_type,
      well_type: combinedData.well_type,
      horizontal_flag: combinedData.horizontal_flag,
      directional_flag: combinedData.directional_flag,
      sidetrack_flag: combinedData.sidetrack_flag,
      surface_section: combinedData.surface_section,
      surface_block: combinedData.surface_block,
      surface_survey: combinedData.surface_survey,
      surface_abstract: combinedData.surface_abstract,
      gis_surface_lat: surfaceRecord?.latitude,
      gis_surface_lon: surfaceRecord?.longitude,
      gis_bottomhole_lat: bottomholeRecord?.latitude,
      gis_bottomhole_lon: bottomholeRecord?.longitude,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  /**
   * Generate hash for idempotency checking
   */
  private generateHash(data: any): string {
    // Simple hash function for demo purposes
    // In production, use a proper cryptographic hash
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Validate transformed data
   */
  private validateTransformedData(data: any, errors: string[]): boolean {
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