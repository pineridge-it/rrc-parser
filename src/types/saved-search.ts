/**
 * Saved Search types for filter configurations
 */

export type SortByField = 'filed_date' | 'approved_date' | 'operator_name' | 'county' | 'permit_number' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface PermitFilters {
  operators?: string[];
  counties?: string[];
  statuses?: string[];
  permit_types?: string[];
  filed_after?: string;
  filed_before?: string;
  approved_after?: string;
  approved_before?: string;
  aois?: string[];
  has_location?: boolean;
  has_surface_location?: boolean;
  has_bottom_hole_location?: boolean;
  search_query?: string;
}

export interface SavedSearch {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description?: string;
  filters: PermitFilters;
  sort_by: SortByField;
  sort_order: SortOrder;
  columns: string[];
  notify_on_new_matches: boolean;
  is_active: boolean;
  is_default: boolean;
  last_used_at?: string;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedSearchCreateInput {
  name: string;
  description?: string;
  filters: PermitFilters;
  sort_by?: SortByField;
  sort_order?: SortOrder;
  columns?: string[];
  notify_on_new_matches?: boolean;
  is_default?: boolean;
}

export interface SavedSearchUpdateInput {
  name?: string;
  description?: string;
  filters?: PermitFilters;
  sort_by?: SortByField;
  sort_order?: SortOrder;
  columns?: string[];
  notify_on_new_matches?: boolean;
  is_active?: boolean;
  is_default?: boolean;
}

export interface SavedSearchSummary {
  id: string;
  name: string;
  is_default: boolean;
  use_count: number;
  last_used_at?: string;
}

export interface SavedSearchWithMeta extends SavedSearch {
  creator_name?: string;
  match_count?: number;
}
