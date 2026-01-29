
/**
 * Permit data model class
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

export class Permit implements PermitData {
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
    if (storageKey === 'gis_surface') {
      this.gis_surface = data as GisSurfaceRecord;
    } else if (storageKey === 'gis_bottomhole') {
      this.gis_bottomhole = data as GisBottomholeRecord;
    } else if (storageKey === 'daroot') {
      this.daroot = data as DaRootRecord;
    } else if (storageKey === 'dapermit') {
      this.dapermit = data as DaPermitRecord;
    } else {
      // Array-based storage
      const collection = this[storageKey] as RecordData[];
      if (Array.isArray(collection)) {
        collection.push(data);
      }
    }
  }
  
  /**
   * Convert to plain object
   * @returns Plain object representation
   */
  toObject(): PermitData {
    return {
      daroot: this.daroot,
      dapermit: this.dapermit,
      dafield: this.dafield,
      dalease: this.dalease,
      dasurvey: this.dasurvey,
      dacanres: this.dacanres,
      daareas: this.daareas,
      daremarks: this.daremarks,
      daareares: this.daareares,
      daaddress: this.daaddress,
      gis_surface: this.gis_surface,
      gis_bottomhole: this.gis_bottomhole
    };
  }
}
