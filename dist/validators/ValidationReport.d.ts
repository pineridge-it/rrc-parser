/**
 * Validation reporting system for better error tracking
 * Location: src/validators/ValidationReport.ts
 */
export interface ValidationIssue {
    severity: 'error' | 'warning';
    field: string;
    value: string;
    message: string;
    lineNumber?: number;
    permitNumber?: string;
    rule: string;
    timestamp: Date;
}
export declare class ValidationReport {
    private issues;
    /**
     * Add a validation issue
     */
    addIssue(issue: Omit<ValidationIssue, 'timestamp'>): void;
    /**
     * Add an error
     */
    addError(field: string, value: string, message: string, rule: string, context?: {
        lineNumber?: number;
        permitNumber?: string;
    }): void;
    /**
     * Add a warning
     */
    addWarning(field: string, value: string, message: string, rule: string, context?: {
        lineNumber?: number;
        permitNumber?: string;
    }): void;
    /**
     * Get all issues, optionally filtered
     */
    getIssues(filter?: {
        severity?: 'error' | 'warning';
        field?: string;
        permitNumber?: string;
        rule?: string;
    }): ValidationIssue[];
    /**
     * Get summary statistics
     */
    getSummary(): {
        totalErrors: number;
        totalWarnings: number;
        total: number;
        byField: Record<string, number>;
        byRule: Record<string, number>;
        bySeverity: Record<string, number>;
    };
    /**
     * Export issues to CSV file
     */
    exportToCSV(outputPath: string): Promise<void>;
    /**
     * Print summary to console
     */
    printSummary(): void;
    /**
     * Clear all issues
     */
    clear(): void;
    /**
     * Get issues for a specific permit
     */
    getPermitIssues(permitNumber: string): ValidationIssue[];
    /**
     * Check if there are any errors (not warnings)
     */
    hasErrors(): boolean;
}
//# sourceMappingURL=ValidationReport.d.ts.map