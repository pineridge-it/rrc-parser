"use strict";
/**
 * Permit data model class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permit = void 0;
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
        if (storageKey === 'gis_surface') {
            this.gis_surface = data;
        }
        else if (storageKey === 'gis_bottomhole') {
            this.gis_bottomhole = data;
        }
        else if (storageKey === 'daroot') {
            this.daroot = data;
        }
        else if (storageKey === 'dapermit') {
            this.dapermit = data;
        }
        else {
            // Array-based storage
            const collection = this[storageKey];
            if (Array.isArray(collection)) {
                collection.push(data);
            }
        }
    }
    /**
     * Convert to plain object
     * @returns Plain object representation
     */
    toObject() {
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
exports.Permit = Permit;
//# sourceMappingURL=Permit.js.map