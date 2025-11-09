"use strict";
/**
 * Common type definitions used throughout the parser
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = exports.RecordType = void 0;
/**
 * Record types in the DAF420 format
 */
var RecordType;
(function (RecordType) {
    RecordType["DAROOT"] = "01";
    RecordType["DAPERMIT"] = "02";
    RecordType["DAFIELD"] = "03";
    RecordType["DALEASE"] = "04";
    RecordType["DASURVEY"] = "05";
    RecordType["DACANRES"] = "06";
    RecordType["DAAREAS"] = "07";
    RecordType["DAREMARKS"] = "08";
    RecordType["DAAREARES"] = "09";
    RecordType["DAADDRESS"] = "10";
    RecordType["GIS_SURFACE"] = "14";
    RecordType["GIS_BOTTOMHOLE"] = "15";
})(RecordType || (exports.RecordType = RecordType = {}));
/**
 * Simple console logger implementation
 */
class ConsoleLogger {
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    debug(message) {
        if (this.verbose) {
            console.log(`[DEBUG] ${message}`);
        }
    }
    info(message) {
        console.info(`[INFO] ${message}`);
    }
    warn(message) {
        console.warn(`[WARN] ${message}`);
    }
    error(message) {
        console.error(`[ERROR] ${message}`);
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=common.js.map