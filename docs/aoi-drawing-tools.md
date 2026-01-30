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
- Circle mode generates a circular polygon approximation using `circleRadius`
- Buffer mode applies `bufferDistance` to any geometry using turf.js (when installed)

## Circle Radius vs Buffer Distance

It's important to understand the distinction between these two properties:

- **`circleRadius`**: Defines the radius of a circle when drawing in 'circle' mode. This is the size of the circle itself.
- **`bufferDistance`**: An additional offset applied to ANY geometry after drawing is complete. This expands the geometry outward.

### Example: Circle with Buffer
```javascript
// Draw a 1-mile circle with an additional 0.5-mile buffer
// Result: Total radius of 1.5 miles from center
const permitMap = new PermitMap({ container: '#map' });

permitMap.setCircleRadius(1);        // Circle radius: 1 mile
permitMap.setBufferDistance(0.5);    // Additional buffer: 0.5 mile
permitMap.startDrawing('circle');

// After user places center point and finishes:
// - Inner circle: 1 mile radius
// - With buffer: 1.5 miles total radius
const aoi = permitMap.finishDrawing();
```
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
type DrawingMode = 'polygon' | 'rectangle' | 'circle' | 'county' | 'buffer';
```

**Note:** The `'buffer'` mode was added to support applying buffer distances to any geometry type. The `'county'` mode allows selecting pre-defined county boundaries.

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

## API Reference

### PermitMap Methods

#### `startDrawing(mode: DrawingMode): void`
Initializes a new drawing operation with the specified mode.

**Parameters:**
- `mode`: The drawing mode - 'polygon', 'rectangle', 'circle', 'county', or 'buffer'

#### `setCircleRadius(radius: number): void`
Sets the radius for circle drawing mode. This defines the size of the circle itself, before any buffer is applied.

**Parameters:**
- `radius`: Radius in miles (default: 1)

**Example:**
```typescript
map.setCircleRadius(2); // 2-mile radius circle
```

#### `setBufferDistance(distance: number): void`
Sets the buffer distance to be applied to the geometry after drawing is complete. This expands the geometry outward by the specified distance.

**Parameters:**
- `distance`: Buffer distance in miles (default: 0)

**Example:**
```typescript
map.setBufferDistance(0.5); // Add 0.5-mile buffer
```

#### `finishDrawing(): AOI | null`
Completes the current drawing operation. If a buffer distance is set, it will be applied to the geometry before creating the AOI.

**Returns:**
- `AOI` object if drawing was active and valid
- `null` if no drawing was in progress or geometry was invalid

**Note:** Buffer application requires `@turf/buffer` to be installed. Without it, the geometry is returned unbuffered with a console warning.

#### `cancelDrawing(): void`
Cancels the current drawing operation and triggers the cancel callback if set.

#### `setDrawingCallbacks(onComplete: Function, onCancel: Function): void`
Sets callback functions for drawing completion and cancellation events.

## Integration with Existing Code

The drawing tools integrate with the existing map functionality through:
- The `addAOILayer()` method for displaying drawn AOIs
- The `aoiToGeoJSON()` utility function for converting AOIs to GeoJSON format
- Event handlers for map interactions during drawing operations

## Migration Notes

### From v1.0 to v1.1

**Breaking Changes:**
- Circle drawing now uses `setCircleRadius()` instead of `setBufferDistance()` to define the circle size
- `setBufferDistance()` now applies an additional buffer after drawing (to any geometry type)

**Migration Example:**
```typescript
// OLD (v1.0) - Used bufferDistance for circle radius
map.setBufferDistance(1);
map.startDrawing('circle');

// NEW (v1.1) - Use circleRadius for circle, bufferDistance for additional buffer
map.setCircleRadius(1);      // Circle is 1 mile radius
map.setBufferDistance(0.5);  // Plus 0.5 mile buffer = 1.5 miles total
map.startDrawing('circle');
```

**New Features:**
- Added `'county'` drawing mode for selecting county boundaries
- Added `'buffer'` mode for applying buffers to any geometry
- Added `setCircleRadius()` method for explicit circle sizing
- Buffer is now applied in `finishDrawing()` when `bufferDistance > 0`

## Future Enhancements

Potential improvements for future iterations:
- Undo/redo functionality for drawing points
- Snapping to existing map features
- Measurement tools for distance/area calculation
- Import/export of AOI geometries
- Styling options for drawn AOIs
- Real-time buffer preview during drawing