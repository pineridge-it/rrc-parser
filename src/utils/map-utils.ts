import { MapConfig, Permit, AOI, MapFilters } from '../types/map';

/**
 * Default map configuration for Texas-focused view
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-99.9018, 31.3915], // Center of Texas
  zoom: 6,
  maxBounds: [
    [-106.6431, 25.8379], // Southwest corner of Texas
    [-93.5083, 36.5007]   // Northeast corner of Texas
  ]
};

/**
 * Convert permit data to GeoJSON format for map rendering
 * @param permits Array of permit objects
 * @returns GeoJSON FeatureCollection
 */
export function permitsToGeoJSON(permits: Permit[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: permits
      .filter(permit => permit.location.latitude && permit.location.longitude)
      .map(permit => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [permit.location.longitude, permit.location.latitude]
        },
        properties: {
          id: permit.id,
          permitNumber: permit.permitNumber,
          operator: permit.operator,
          status: permit.status,
          filedDate: permit.filedDate,
          wellInfo: permit.wellInfo
        }
      }))
  };
}

/**
 * Convert AOI data to GeoJSON format for map overlay
 * @param aois Array of AOI objects
 * @returns GeoJSON FeatureCollection
 */
export function aoiToGeoJSON(aois: AOI[]): GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  return {
    type: 'FeatureCollection',
    features: aois.map(aoi => ({
      type: 'Feature',
      geometry: aoi.geometry,
      properties: {
        id: aoi.id,
        name: aoi.name
      }
    }))
  };
}

/**
 * Apply filters to permit data
 * @param permits Array of permit objects
 * @param filters Filter criteria
 * @returns Filtered array of permits
 */
export function filterPermits(permits: Permit[], filters: MapFilters): Permit[] {
  return permits.filter(permit => {
    if (filters.operator && permit.operator !== filters.operator) {
      return false;
    }
    
    if (filters.permitStatus && permit.status !== filters.permitStatus) {
      return false;
    }
    
    if (filters.dateRange) {
      const permitDate = new Date(permit.filedDate);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (permitDate < startDate || permitDate > endDate) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Calculate zoom level based on bounding box
 * @param bounds GeoJSON bounding box
 * @returns Appropriate zoom level
 */
export function calculateZoomLevel(bounds: [[number, number], [number, number]]): number {
  const lngDiff = Math.abs(bounds[1][0] - bounds[0][0]);
  const latDiff = Math.abs(bounds[1][1] - bounds[0][1]);
  
  // Simple heuristic - adjust based on actual requirements
  if (lngDiff > 10 || latDiff > 10) return 5;
  if (lngDiff > 5 || latDiff > 5) return 7;
  if (lngDiff > 1 || latDiff > 1) return 9;
  return 11;
}