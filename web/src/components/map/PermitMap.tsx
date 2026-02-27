import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createRoot } from 'react-dom/client';

export interface Permit {
  id: string;
  permitNumber: string;
  operatorName: string;
  county: string;
  status: string;
  latitude: number;
  longitude: number;
  filedDate?: string;
  wellNumber?: string;
}

export interface AOI {
  id: string;
  name: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface MapFilters {
  county?: string;
  operator?: string;
  status?: string;
  dateRange?: { start: string; end: string };
}

export interface MapConfig {
  center: [number, number];
  zoom: number;
  maxBounds?: [[number, number], [number, number]];
}

export interface PermitMapProps {
  permits: Permit[];
  aois?: AOI[];
  onPermitClick?: (permit: Permit) => void;
  onAOIClick?: (aoi: AOI) => void;
  filters?: MapFilters;
  selectedPermitId?: string;
  className?: string;
}

const DEFAULT_CONFIG: MapConfig = {
  center: [-99.9018, 31.9686],
  zoom: 6,
  maxBounds: [[-106.645646, 25.837377], [-93.508292, 36.500704]],
};

const TEXAS_COUNTIES_SOURCE = 'tx-counties';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function PermitMap({
  permits,
  aois = [],
  onPermitClick,
  onAOIClick,
  filters,
  selectedPermitId,
  className = '',
}: PermitMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);

  const permitsToGeoJSON = useCallback((data: Permit[]): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: data.map((permit) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [permit.longitude, permit.latitude],
        },
        properties: {
          id: permit.id,
          permitNumber: permit.permitNumber,
          operatorName: permit.operatorName,
          county: permit.county,
          status: permit.status,
          filedDate: permit.filedDate,
          wellNumber: permit.wellNumber,
        },
      })),
    };
  }, []);

  const aoisToGeoJSON = useCallback((data: AOI[]): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: data.map((aoi) => ({
        type: 'Feature',
        geometry: aoi.geometry,
        properties: {
          id: aoi.id,
          name: aoi.name,
        },
      })),
    };
  }, []);

  const clearPopups = useCallback(() => {
    popupsRef.current.forEach((popup) => popup.remove());
    popupsRef.current = [];
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!mapboxgl.accessToken) {
      setError('Mapbox token not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN environment variable.');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CONFIG.center,
      zoom: DEFAULT_CONFIG.zoom,
      maxBounds: DEFAULT_CONFIG.maxBounds,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('error', (e) => {
      setError(`Map error: ${e.error?.message || 'Unknown error'}`);
    });

    return () => {
      clearPopups();
      map.current?.remove();
      map.current = null;
    };
  }, [clearPopups]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    if (!mapInstance.getSource('permits')) {
      mapInstance.addSource('permits', {
        type: 'geojson',
        data: permitsToGeoJSON(permits),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'permits',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
        },
      });

      mapInstance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'permits',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'permits',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'active',
            '#22c55e',
            'pending',
            '#f59e0b',
            'approved',
            '#3b82f6',
            'drilling',
            '#8b5cf6',
            'completed',
            '#6b7280',
            '#94a3b8',
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
    } else {
      const source = mapInstance.getSource('permits') as mapboxgl.GeoJSONSource;
      source?.setData(permitsToGeoJSON(permits));
    }
  }, [permits, mapLoaded, permitsToGeoJSON]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    if (aois.length > 0) {
      if (!mapInstance.getSource('aois')) {
        mapInstance.addSource('aois', {
          type: 'geojson',
          data: aoisToGeoJSON(aois),
        });

        mapInstance.addLayer({
          id: 'aoi-fill',
          type: 'fill',
          source: 'aois',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.2,
          },
        });

        mapInstance.addLayer({
          id: 'aoi-outline',
          type: 'line',
          source: 'aois',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
          },
        });
      } else {
        const source = mapInstance.getSource('aois') as mapboxgl.GeoJSONSource;
        source?.setData(aoisToGeoJSON(aois));
      }
    }
  }, [aois, mapLoaded, aoisToGeoJSON]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !onPermitClick) return;

    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point'],
      });

      if (features.length > 0) {
        const feature = features[0];
        const props = feature.properties as Permit;

        clearPopups();

        const popupContent = document.createElement('div');
        const root = createRoot(popupContent);
        root.render(
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-sm">{props.permitNumber}</h3>
            <p className="text-xs text-gray-600">{props.operatorName}</p>
            <p className="text-xs text-gray-500">{props.county} County</p>
            <p className="text-xs mt-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100">
                {props.status}
              </span>
            </p>
          </div>
        );

        const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat([props.longitude, props.latitude])
          .setDOMContent(popupContent)
          .addTo(mapInstance);

        popupsRef.current.push(popup);
        onPermitClick(props);
      }
    };

    const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });

      if (features.length > 0) {
        const clusterId = features[0].properties?.cluster_id;
        const source = mapInstance.getSource('permits') as mapboxgl.GeoJSONSource;
        source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          mapInstance.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          });
        });
      }
    };

    mapInstance.on('click', 'unclustered-point', handleClick);
    mapInstance.on('click', 'clusters', handleClusterClick);

    mapInstance.on('mouseenter', 'unclustered-point', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });
    mapInstance.on('mouseleave', 'unclustered-point', () => {
      mapInstance.getCanvas().style.cursor = '';
    });

    return () => {
      mapInstance.off('click', 'unclustered-point', handleClick);
      mapInstance.off('click', 'clusters', handleClusterClick);
    };
  }, [mapLoaded, onPermitClick, clearPopups]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedPermitId) return;

    const selectedPermit = permits.find((p) => p.id === selectedPermitId);
    if (selectedPermit) {
      map.current.flyTo({
        center: [selectedPermit.longitude, selectedPermit.latitude],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedPermitId, permits, mapLoaded]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">Map Error</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[400px] rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PermitMap;
