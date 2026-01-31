export interface Permit {
    id: string;
    permit_number: string;
    operator_name: string;
    operator_number?: string;
    lease_name?: string;
    well_number?: string;
    county: string;
    county_code?: string;
    status: 'approved' | 'pending' | 'denied' | 'amendment' | string;
    permit_type: 'drilling' | 'recompletion' | 'amendment' | string;
    filed_date?: string;
    approved_date?: string;
    expiration_date?: string;
    latitude?: number;
    longitude?: number;
    total_depth?: number;
    formation?: string;
    field_name?: string;
    district?: string;
    api_number?: string;
    created_at: string;
    updated_at: string;
}
export interface PermitFilters {
    aoiId?: string;
    operators?: string[];
    counties?: string[];
    statuses?: string[];
    permitTypes?: string[];
    filedDateRange?: DateRange;
    approvedDateRange?: DateRange;
    textSearch?: string;
}
export interface DateRange {
    from?: string;
    to?: string;
}
export interface SearchResult {
    permits: Permit[];
    total: number;
    page: number;
    pageSize: number;
    aggregations: {
        byCounty: Record<string, number>;
        byOperator: Record<string, number>;
        byStatus: Record<string, number>;
    };
}
export interface SavedSearch {
    id: string;
    name: string;
    filters: PermitFilters;
    created_at: string;
    user_id: string;
}
export interface FilterOptions {
    counties: {
        code: string;
        name: string;
    }[];
    operators: {
        id: string;
        name: string;
    }[];
    statuses: {
        value: string;
        label: string;
    }[];
    permitTypes: {
        value: string;
        label: string;
    }[];
}
//# sourceMappingURL=permit.d.ts.map