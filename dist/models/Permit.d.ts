/**
 * Permit data model class
 */
import { PermitData, DaRootRecord, DaPermitRecord, DaFieldRecord, DaLeaseRecord, DaSurveyRecord, DaCanResRecord, DaAreasRecord, DaRemarksRecord, DaAreaResRecord, DaAddressRecord, GisSurfaceRecord, GisBottomholeRecord, RecordData, StorageKey } from '../types';
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
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject(): PermitData;
}
//# sourceMappingURL=Permit.d.ts.map