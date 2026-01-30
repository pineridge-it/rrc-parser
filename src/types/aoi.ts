/**
 * Area of Interest (AOI) types for geographic monitoring
 */

export type AoiType = 'custom' | 'county' | 'state' | 'lease' | 'field';

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface AOI {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  geometry: GeoJSON.Geometry;
  bbox_north?: number;
  bbox_south?: number;
  bbox_east?: number;
  bbox_west?: number;
  aoi_type: AoiType;
  color: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AOIWithBBox extends AOI {
  boundingBox: BoundingBox;
}

export interface AOICreateInput {
  name: string;
  description?: string;
  geometry: GeoJSON.Geometry;
  aoi_type?: AoiType;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface AOIUpdateInput {
  name?: string;
  description?: string;
  geometry?: GeoJSON.Geometry;
  color?: string;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}

export interface AOISummary {
  id: string;
  name: string;
  aoi_type: AoiType;
  color: string;
  is_active: boolean;
}

export interface AOIFilterOptions {
  workspace_id?: string;
  aoi_type?: AoiType;
  is_active?: boolean;
  search?: string;
}
