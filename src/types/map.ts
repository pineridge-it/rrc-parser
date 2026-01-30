/// <reference types="geojson" />

export interface MapConfig {
  style: string;  // Mapbox style URL
  center: [number, number];  // Default center (Texas)
  zoom: number;
  maxBounds: [[number, number], [number, number]];  // Texas bounds
}

export interface PermitLayer {
  id: string;
  source: string;
  type: 'circle' | 'symbol';
  paint: object;
  filter?: any[];
}

export interface Permit {
  id: string;
  permitNumber: string;
  operator: string;
  location: {
    latitude: number;
    longitude: number;
  };
  wellInfo?: {
    apiNumber: string;
    wellName: string;
  };
  status: string;
  filedDate: string;
}

export interface AOI {
  id: string;
  name: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface MapFilters {
  operator?: string;
  permitStatus?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export type DrawingMode = 'polygon' | 'rectangle' | 'circle' | 'county' | 'buffer';

export interface DrawingTool {
  mode: DrawingMode;
  onComplete: (geometry: GeoJSON.Geometry) => void;
  onCancel: () => void;
}

export interface AOIDrawer {
  startDrawing(mode: DrawingMode): void;
  setBufferDistance(miles: number): void;
  getPreviewGeometry(): GeoJSON.Geometry;
  finishDrawing(): AOI;
  cancelDrawing(): void;
}