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
import { PermitData, DaRootRecord, DaPermitRecord, DaFieldRecord, DaLeaseRecord, DaSurveyRecord, DaCanResRecord, DaAreasRecord, DaRemarksRecord, DaAreaResRecord, DaAddressRecord, GisSurfaceRecord, GisBottomholeRecord, RecordData, StorageKey } from '../types';
/**
 * Permit class representing a complete permit with all related records
 */
export declare class Permit implements PermitData {
    readonly permitNumber: string;
    daroot: DaRootRecord | null;
    dapermit: DaPermitRecord | null;
    dafield: DaFieldRecord[];
    dalease: DaLeaseRecord[];
    dasurvey: DaSurveyRecord[];
    dacanres: DaCanResRecord[];
    daareas: DaAreasRecord[];
    daremarks: DaRemarksRecord[];
    daareares: DaAreaResRecord[];
    daaddress: DaAddressRecord[];
    gis_surface: GisSurfaceRecord | null;
    gis_bottomhole: GisBottomholeRecord | null;
    constructor(permitNumber: string);
    /**
     * Add a child record to the appropriate collection
     * @param storageKey - The storage key identifying the record type
     * @param data - The record data
     */
    addChildRecord(storageKey: StorageKey, data: RecordData): void;
    /**
     * Add data to an array-based collection
     * @param storageKey - The storage key
     * @param data - The record data
     */
    private addToArrayCollection;
    /**
     * Check if the permit has a specific record type
     * @param storageKey - The storage key to check
     * @returns True if the permit has records of this type
     */
    hasRecord(storageKey: StorageKey): boolean;
    /**
     * Get the count of records for a specific type
     * @param storageKey - The storage key
     * @returns Count of records (1 for single records, array length for collections)
     */
    getRecordCount(storageKey: StorageKey): number;
    /**
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject(): PermitData;
    /**
     * Get a summary of the permit
     * @returns Summary string
     */
    getSummary(): string;
}
//# sourceMappingURL=Permit.d.ts.map