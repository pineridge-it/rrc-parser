/**
 * CSV export engine
 */
import { Config } from '../config';
import { PermitData } from '../types';
export declare class CSVExporter {
    private config;
    constructor(config: Config);
    /**
     * Export permits to CSV file
     * @param permits - Map of permit number to permit data
     * @param outputPath - Output CSV file path
     */
    export(permits: Record<string, PermitData>, outputPath: string): Promise<void>;
    /**
     * Build a CSV row from permit data
     * @param permitNum - The permit number
     * @param data - The permit data
     * @returns CSV row object
     */
    private buildRow;
    /**
     * Trim a value if it's a string
     * @param value - The value to trim
     * @returns Trimmed string
     */
    private trim;
}
//# sourceMappingURL=CSVExporter.d.ts.map