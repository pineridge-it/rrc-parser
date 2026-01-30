# AOI Drawing Tools Implementation

This document describes the implementation of the Area of Interest (AOI) drawing tools for the PermitMap component.

## Overview

The AOI drawing tools allow users to draw custom areas on the map for spatial analysis and permit filtering. The implementation supports multiple drawing modes including polygons, rectangles, circles, and buffered points.

## Key Components

### DrawingMode Type
Defines the available drawing modes:
- `polygon`: Freehand polygon drawing
- `rectangle`: Rectangular area selection
- `circle`: Circular area selection (uses `circleRadius`, optionally with `bufferDistance`)
- `county`: Pre-defined county boundary selection
- `buffer`: Buffered point selection (applies `bufferDistance` to any geometry)

### DrawingTool Interface
Represents the active drawing tool with properties:
- `mode`: Current drawing mode
- `points`: Array of coordinate points
- `bufferDistance`: Buffer distance in meters (for buffer mode)

### AOIDrawer Interface
Defines the structure for AOI drawing operations:
- `id`: Unique identifier for the drawing operation
- `name`: Display name for the AOI
- `geometry`: GeoJSON geometry of the drawn AOI
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update
- `userId`: ID of the user who created the AOI
- `properties`: Additional metadata properties for the AOI

## PermitMap Class Extensions

The PermitMap class has been extended with several new properties and methods to support drawing functionality:

### New Properties
- `isDrawing`: Boolean indicating if a drawing operation is in progress
- `drawingMode`: Current drawing mode (polygon, rectangle, circle, county, buffer)
- `drawingPoints`: Array of coordinate points for the current drawing
- `circleRadius`: Radius in miles for circle drawing mode (separate from buffer)
- `bufferDistance`: Buffer distance in miles applied to geometry after drawing
- `drawingCallback`: Callback function triggered when drawing is completed
- `cancelCallback`: Callback function triggered when drawing is cancelled

### New Methods
- `startDrawing(mode: DrawingMode)`: Initializes a new drawing operation
- `setCircleRadius(radius: number)`: Sets the radius for circle drawing mode
- `setBufferDistance(distance: number)`: Sets the buffer distance applied after drawing
- `getPreviewGeometry()`: Returns a preview of the current drawing as GeoJSON geometry
- `finishDrawing()`: Completes the drawing operation, applies buffer if set, and returns an AOI object
- `cancelDrawing()`: Cancels the current drawing operation
- `setDrawingCallbacks(onFinish: Function, onCancel: Function)`: Sets callbacks for drawing completion/cancellation

## Implementation Details

### Drawing Flow
1. User initiates drawing via `startDrawing()` with a specific mode
2. Points are collected through map interactions (implementation-dependent)
3. User can preview the geometry with `getPreviewGeometry()`
4. User completes drawing with `finishDrawing()` or cancels with `cancelDrawing()`
5. Appropriate callbacks are triggered upon completion or cancellation

### Geometry Generation
- Polygon mode creates a GeoJSON Polygon from collected points
- Rectangle mode calculates bounds from two points
- Circle mode generates a circular polygon approximation
- Buffer mode creates a buffer around a point using turf.js or similar library

## Usage Example

```javascript
// Initialize map
const permitMap = new PermitMap({ container: '#map' });

// Start polygon drawing
permitMap.startDrawing('polygon');

// Set callbacks
permitMap.setDrawingCallbacks(
  (aoi) => console.log('Drawing completed:', aoi),
  () => console.log('Drawing cancelled')
);

// Finish drawing
const aoi = permitMap.finishDrawing();
## Type Definitions

### DrawingMode
```typescript
type DrawingMode = 'polygon' | 'rectangle' | 'circle' | 'buffer';
```

### DrawingTool
```typescript
interface DrawingTool {
  mode: DrawingMode;
  points: [number, number][];
  bufferDistance?: number;
}
```

### AOIDrawer
```typescript
interface AOIDrawer {
  id: string;
  name: string;
  geometry: GeoJSON.Geometry;
  createdAt: Date;
}
```

## Integration with Existing Code

The drawing tools integrate with the existing map functionality through:
- The `addAOILayer()` method for displaying drawn AOIs
- The `aoiToGeoJSON()` utility function for converting AOIs to GeoJSON format
- Event handlers for map interactions during drawing operations

## Future Enhancements

Potential improvements for future iterations:
- Undo/redo functionality for drawing points
- Snapping to existing map features
- Measurement tools for distance/area calculation
- Import/export of AOI geometries
- Styling options for drawn AOIs