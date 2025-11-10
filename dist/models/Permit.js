"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permit = void 0;
/**
 * Permit class representing a complete permit with all related records
 */
class Permit {
    constructor(permitNumber) {
        this.permitNumber = permitNumber;
        this.daroot = null;
        this.dapermit = null;
        this.dafield = [];
        this.dalease = [];
        this.dasurvey = [];
        this.dacanres = [];
        this.daareas = [];
        this.daremarks = [];
        this.daareares = [];
        this.daaddress = [];
        this.gis_surface = null;
        this.gis_bottomhole = null;
    }
    /**
     * Add a child record to the appropriate collection
     * @param storageKey - The storage key identifying the record type
     * @param data - The record data
     */
    addChildRecord(storageKey, data) {
        switch (storageKey) {
            case 'gis_surface':
                this.gis_surface = data;
                break;
            case 'gis_bottomhole':
                this.gis_bottomhole = data;
                break;
            case 'daroot':
                this.daroot = data;
                break;
            case 'dapermit':
                this.dapermit = data;
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
    addToArrayCollection(storageKey, data) {
        const collection = this[storageKey];
        if (Array.isArray(collection)) {
            collection.push(data);
        }
    }
    /**
     * Check if the permit has a specific record type
     * @param storageKey - The storage key to check
     * @returns True if the permit has records of this type
     */
    hasRecord(storageKey) {
        const value = this[storageKey];
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
    getRecordCount(storageKey) {
        const value = this[storageKey];
        if (Array.isArray(value)) {
            return value.length;
        }
        return value !== null ? 1 : 0;
    }
    /**
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject() {
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
    getSummary() {
        return `Permit ${this.permitNumber}: ` +
            `${this.getRecordCount('dafield')} fields, ` +
            `${this.getRecordCount('dalease')} leases, ` +
            `${this.getRecordCount('dasurvey')} surveys`;
    }
}
exports.Permit = Permit;
//# sourceMappingURL=Permit.js.map