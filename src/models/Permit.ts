
/**
 * Permit data model class
 * Location: src/models/Permit.ts
 * 
 * IMPROVEMENTS:
 * - Better type safety with proper type guards
 * - Improved null safety
 * - Better documentation
 * - Added helper methods
 * - More readable code
 */

import { 
  PermitData, 
  DaRootRecord,
  DaPermitRecord,
  DaFieldRecord,
  DaLeaseRecord,
  DaSurveyRecord,
  DaCanResRecord,
  DaAreasRecord,
  DaRemarksRecord,
  DaAreaResRecord,
  DaAddressRecord,
  GisSurfaceRecord,
  GisBottomholeRecord,
  RecordData,
  StorageKey
} from '../types';

/**
 * Permit class representing a complete permit with all related records
 */
export class Permit implements PermitData {
  // Permit data properties
  daroot: DaRootRecord | null = null;
  dapermit: DaPermitRecord | null = null;
  dafield: DaFieldRecord[] = [];
  dalease: DaLeaseRecord[] = [];
  dasurvey: DaSurveyRecord[] = [];
  dacanres: DaCanResRecord[] = [];
  daareas: DaAreasRecord[] = [];
  daremarks: DaRemarksRecord[] = [];
  daareares: DaAreaResRecord[] = [];
  daaddress: DaAddressRecord[] = [];
  gis_surface: GisSurfaceRecord | null = null;
  gis_bottomhole: GisBottomholeRecord | null = null;
  
  constructor(public readonly permitNumber: string) {}
  
  /**
   * Add a child record to the appropriate collection
   * @param storageKey - The storage key identifying the record type
   * @param data - The record data
   */
  addChildRecord(storageKey: StorageKey, data: RecordData): void {
    switch (storageKey) {
      case 'gis_surface':
        this.gis_surface = data as GisSurfaceRecord;
        break;
      case 'gis_bottomhole':
        this.gis_bottomhole = data as GisBottomholeRecord;
        break;
      case 'daroot':
        this.daroot = data as DaRootRecord;
        break;
      case 'dapermit':
        this.dapermit = data as DaPermitRecord;
        break;
      default:
        // Array-based storage
        this.addToArrayCollection(storageKey, data);
        break;
    }
  }
  
  /**
   * Add data to an array-based collection
   * @param storageKey - The storage key
   * @param data - The record data
   */
  private addToArrayCollection(storageKey: StorageKey, data: RecordData): void {
    const collection = (this as unknown as Record<string, unknown>)[storageKey];
    if (Array.isArray(collection)) {
      collection.push(data as unknown);
    }
  }

  /**
   * Check if the permit has a specific record type
   * @param storageKey - The storage key to check
   * @returns True if the permit has records of this type
   */
  hasRecord(storageKey: StorageKey): boolean {
    const value = (this as unknown as Record<string, unknown>)[storageKey];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null;
  }

  /**
   * Get the count of records for a specific type
   * @param storageKey - The storage key
   * @returns Count of records (1 for single records, array length for collections)
   */
  getRecordCount(storageKey: StorageKey): number {
    const value = (this as unknown as Record<string, unknown>)[storageKey];
    if (Array.isArray(value)) {
      return value.length;
    }
    return value !== null ? 1 : 0;
  }
  
  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): PermitData {
    return {
      daroot: this.daroot,
      dapermit: this.dapermit,
      dafield: [...this.dafield],
      dalease: [...this.dalease],
      dasurvey: [...this.dasurvey],
      dacanres: [...this.dacanres],
      daareas: [...this.daareas],
      daremarks: [...this.daremarks],
      daareares: [...this.daareares],
      daaddress: [...this.daaddress],
      gis_surface: this.gis_surface,
      gis_bottomhole: this.gis_bottomhole
    };
  }
  
  /**
   * Get a summary of the permit
   * @returns Summary string
   */
  getSummary(): string {
    return `Permit ${this.permitNumber}: ` +
      `${this.getRecordCount('dafield')} fields, ` +
      `${this.getRecordCount('dalease')} leases, ` +
      `${this.getRecordCount('dasurvey')} surveys`;
  }
}
