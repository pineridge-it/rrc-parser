import { MapConfig, Permit, AOI, MapFilters, DrawingMode } from '../../types/map';
import { permitsToGeoJSON, aoiToGeoJSON, filterPermits, DEFAULT_MAP_CONFIG } from '../../utils/map-utils';

// Note: In a real implementation, you would import mapboxgl from 'mapbox-gl'
// For this implementation, we'll define the interface to simulate the functionality

interface MapboxGL {
  Map: any;
  accessToken: string;
}

declare global {
  interface Window {
    mapboxgl: MapboxGL;
  }
}

interface PermitMapOptions {
  container: HTMLElement;
  config?: MapConfig;
}

export class PermitMap {
  private map: any; // In a real implementation, this would be mapboxgl.Map
  private config: MapConfig;
  private permits: Permit[] = [];
  private aois: AOI[] = [];
  private permitClickCallback: ((permit: Permit) => void) | null = null;

  // Drawing tools properties
  private isDrawing: boolean = false;
  private drawingMode: DrawingMode | null = null;
  private drawingPoints: [number, number][] = [];
  private bufferDistance: number = 0; // in miles
  private circleRadius: number = 1; // in miles, default 1 mile for circle drawing
  private drawingCallback: ((geometry: GeoJSON.Geometry) => void) | null = null;
  private cancelCallback: (() => void) | null = null;

  constructor(options: PermitMapOptions) {
    this.config = options.config || DEFAULT_MAP_CONFIG;
    this.initialize(options.container, this.config);
  }

  /**
   * Initialize the map with the given container and configuration
   */
  initialize(container: HTMLElement, config: MapConfig): void {
    // In a real implementation, you would initialize the Mapbox GL JS map:
    /*
    this.map = new mapboxgl.Map({
      container: container,
      style: config.style,
      center: config.center,
      zoom: config.zoom,
      maxBounds: config.maxBounds
    });
    
    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl());
    */

    console.log(`Initializing map with config:`, config);
    console.log(`Container:`, container);

    // Simulate map initialization
    this.map = {
      setCenter: (center: [number, number]) => console.log(`Setting center to: ${center}`),
      setZoom: (zoom: number) => console.log(`Setting zoom to: ${zoom}`),
      addSource: (id: string, source: any) => console.log(`Adding source: ${id}`, source),
      addLayer: (layer: any) => console.log(`Adding layer:`, layer),
      on: (event: string, callback: Function) => console.log(`Adding event listener for: ${event}`),
      remove: () => console.log('Removing map')
    };
  }

  /**
   * Add permit layer to the map
   */
  addPermitLayer(permits: Permit[]): void {
    this.permits = permits;
    
    // Convert permits to GeoJSON
    const geojsonData = permitsToGeoJSON(permits);
    
    // In a real implementation:
    /*
    this.map.addSource('permits', {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    this.map.addLayer({
      id: 'permits-clusters',
      type: 'circle',
      source: 'permits',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#51bbd6',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });
    */

    console.log('Adding permit layer with data:', geojsonData);
    
    // Simulate adding layers
    this.map.addSource('permits', {
      type: 'geojson',
      data: geojsonData
    });
    
    this.map.addLayer({
      id: 'permits-layer',
      type: 'circle',
      source: 'permits',
      paint: {
        'circle-radius': 6,
        'circle-color': '#007cbf'
      }
    });
  }

  /**
   * Add AOI layer to the map
   */
  addAOILayer(aois: AOI[]): void {
    this.aois = aois;
    
    // Convert AOIs to GeoJSON
    const geojsonData = aoiToGeoJSON(aois);
    
    // In a real implementation:
    /*
    this.map.addSource('aois', {
      type: 'geojson',
      data: geojsonData
    });

    this.map.addLayer({
      id: 'aoi-fill',
      type: 'fill',
      source: 'aois',
      paint: {
        'fill-color': '#0080ff',
        'fill-opacity': 0.3
      }
    });

    this.map.addLayer({
      id: 'aoi-outline',
      type: 'line',
      source: 'aois',
      paint: {
        'line-color': '#0080ff',
        'line-width': 2
      }
    });
    */

    console.log('Adding AOI layer with data:', geojsonData);
    
    // Simulate adding layers
    this.map.addSource('aois', {
      type: 'geojson',
      data: geojsonData
    });
    
    this.map.addLayer({
      id: 'aoi-fill',
      type: 'fill',
      source: 'aois',
      paint: {
        'fill-color': '#0080ff',
        'fill-opacity': 0.3
      }
    });
  }

  /**
   * Set filters for the map
   */
  setFilters(filters: MapFilters): void {
    // Filter permits based on the provided filters
    const filteredPermits = filterPermits(this.permits, filters);
    
    // Update the permit layer with filtered data
    // In a real implementation:
    // this.map.getSource('permits').setData(permitsToGeoJSON(filteredPermits));
    
    console.log('Setting filters:', filters);
    console.log('Filtered permits count:', filteredPermits.length);
  }

  /**
   * Set callback for permit click events
   */
  onPermitClick(callback: (permit: Permit) => void): void {
    this.permitClickCallback = callback;
    
    // In a real implementation:
    /*
    this.map.on('click', 'permits-layer', (e: any) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['permits-layer']
      });
      
      if (features.length > 0) {
        const feature = features[0];
        const permit = this.permits.find(p => p.id === feature.properties.id);
        if (permit && this.permitClickCallback) {
          this.permitClickCallback(permit);
        }
      }
    });
    */

    console.log('Setting permit click callback');
  }

  /**
   * Cleanup and remove the map
   */
  destroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Start drawing mode
   * @param mode Drawing mode (polygon, rectangle, circle, county)
   */
  startDrawing(mode: DrawingMode): void {
    this.isDrawing = true;
    this.drawingMode = mode;
    this.drawingPoints = [];

    console.log(`Starting ${mode} drawing mode`);

    // In a real implementation, you would add event listeners for map interactions
    // For now, we'll just log the actions
  }

  /**
   * Set buffer distance for the drawing
   * @param miles Buffer distance in miles
   */
  setBufferDistance(miles: number): void {
    this.bufferDistance = miles;
    console.log(`Setting buffer distance to ${miles} miles`);

    // In a real implementation, you would update the preview geometry with the buffer
  }

  /**
   * Set circle radius for circle drawing mode
   * @param miles Circle radius in miles
   */
  setCircleRadius(miles: number): void {
    this.circleRadius = miles;
    console.log(`Setting circle radius to ${miles} miles`);
  }

  /**
   * Get preview geometry for the current drawing
   * @returns GeoJSON geometry of the current drawing
   */
  getPreviewGeometry(): GeoJSON.Geometry | null {
    if (!this.isDrawing || this.drawingPoints.length === 0) {
      return null;
    }

    // Create geometry based on drawing mode
    switch (this.drawingMode) {
      case 'polygon':
        if (this.drawingPoints.length >= 3) {
          return {
            type: 'Polygon',
            coordinates: [this.drawingPoints.concat([this.drawingPoints[0]])] // Close the polygon
          };
        }
        break;

      case 'rectangle':
        if (this.drawingPoints.length >= 2) {
          const [minLng, minLat] = [
            Math.min(this.drawingPoints[0][0], this.drawingPoints[1][0]),
            Math.min(this.drawingPoints[0][1], this.drawingPoints[1][1])
          ];
          const [maxLng, maxLat] = [
            Math.max(this.drawingPoints[0][0], this.drawingPoints[1][0]),
            Math.max(this.drawingPoints[0][1], this.drawingPoints[1][1])
          ];

          return {
            type: 'Polygon',
            coordinates: [[
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat]
            ]]
          };
        }
        break;

      case 'circle':
        if (this.drawingPoints.length >= 1) {
          // For simplicity, we'll create a polygon approximation of a circle
          // In a real implementation, you would use turf.js or similar library
          const center = this.drawingPoints[0];
          const radius = this.circleRadius; // Use dedicated circle radius property

          // Convert miles to approximate degrees (rough approximation)
          const radiusDeg = radius / 69; // Rough conversion

          // Create a polygon approximation of a circle
          const points: [number, number][] = [];
          for (let i = 0; i < 32; i++) {
            const angle = (i * 2 * Math.PI) / 32;
            const lng = center[0] + radiusDeg * Math.cos(angle);
            const lat = center[1] + radiusDeg * Math.sin(angle);
            points.push([lng, lat]);
          }
          points.push(points[0]); // Close the polygon

          return {
            type: 'Polygon',
            coordinates: [points]
          };
        }
        break;

      case 'county':
        // County selection would require a separate data source
        // For now, we'll return null
        break;
    }

    return null;
  }

  /**
   * Finish drawing and return the AOI
   * @returns AOI object with the drawn geometry
   */
  finishDrawing(): AOI | null {
    if (!this.isDrawing) {
      return null;
    }

    const geometry = this.getPreviewGeometry();
    if (!geometry) {
      return null;
    }

    // Apply buffer if set
    let bufferedGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon = geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    if (this.bufferDistance > 0) {
      // In a real implementation, you would use turf.js or similar library to buffer the geometry
      // For now, we'll just log that buffering would happen
      console.log(`Would apply ${this.bufferDistance} mile buffer to geometry`);
      // TODO: Implement actual buffer using turf.buffer() when @turf/buffer is installed
      // bufferedGeometry = buffer(geometry, this.bufferDistance, { units: 'miles' });
    }

    const aoi: AOI = {
      id: `aoi-${Date.now()}`, // Generate a unique ID
      name: 'New AOI', // This would typically be set by the user
      geometry: bufferedGeometry
    };

    // Reset drawing state
    this.isDrawing = false;
    this.drawingMode = null;
    this.drawingPoints = [];

    if (this.drawingCallback) {
      this.drawingCallback(bufferedGeometry);
    }

    return aoi;
  }

  /**
   * Cancel drawing
   */
  cancelDrawing(): void {
    this.isDrawing = false;
    this.drawingMode = null;
    this.drawingPoints = [];

    if (this.cancelCallback) {
      this.cancelCallback();
    }

    console.log('Drawing cancelled');
  }

  /**
   * Set callbacks for drawing completion and cancellation
   * @param onComplete Callback when drawing is completed
   * @param onCancel Callback when drawing is cancelled
   */
  setDrawingCallbacks(
    onComplete: (geometry: GeoJSON.Geometry) => void,
    onCancel: () => void
  ): void {
    this.drawingCallback = onComplete;
    this.cancelCallback = onCancel;
  }
}