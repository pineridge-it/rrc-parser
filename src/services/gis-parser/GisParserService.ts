import * as fs from 'fs/promises';
import * as path from 'path';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import * as shp from 'shpjs';
import * as togeojson from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';

export interface ParsedAoi {
  name: string;
  geometry: Geometry;
}

export interface GisParseResult {
  features: ParsedAoi[];
  fileName: string;
  fileType: 'geojson' | 'shapefile' | 'kml';
}

/**
 * GIS File Parser Service
 * Handles parsing of Shapefile, GeoJSON, and KML/KMZ files
 */
export class GisParserService {
  /**
   * Parse a GIS file based on its extension
   */
  async parseFile(filePath: string, fileName: string): Promise<GisParseResult> {
    const ext = path.extname(fileName).toLowerCase();
    
    switch (ext) {
      case '.geojson':
      case '.json':
        return this.parseGeoJsonFile(filePath, fileName);
      case '.shp':
        return this.parseShapefile(filePath, fileName);
      case '.zip':
        // Could be a shapefile zip archive
        return this.parseShapefileZip(filePath, fileName);
      case '.kml':
      case '.kmz':
        return this.parseKmlFile(filePath, fileName, ext === '.kmz');
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Parse a GeoJSON file
   */
  private async parseGeoJsonFile(filePath: string, fileName: string): Promise<GisParseResult> {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const geoJson: FeatureCollection = JSON.parse(data);
      
      if (geoJson.type !== 'FeatureCollection') {
        throw new Error('File is not a valid GeoJSON FeatureCollection');
      }
      
      const features: ParsedAoi[] = geoJson.features
        .filter(feature => feature.geometry && this.isValidGeometry(feature.geometry))
        .map((feature, index) => ({
          name: this.extractNameFromFeature(feature, index),
          geometry: feature.geometry
        }));
      
      return {
        features,
        fileName: path.basename(fileName, path.extname(fileName)),
        fileType: 'geojson'
      };
    } catch (error) {
      throw new Error(`Failed to parse GeoJSON file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse a Shapefile
   */
  private async parseShapefile(filePath: string, fileName: string): Promise<GisParseResult> {
    try {
      const data = await fs.readFile(filePath);
      const geoJson: FeatureCollection | FeatureCollection[] = await shp.parseShp(data);
      
      // Handle both single and multiple feature collections
      const featureCollections = Array.isArray(geoJson) ? geoJson : [geoJson];
      
      const features: ParsedAoi[] = [];
      featureCollections.forEach((collection, collectionIndex) => {
        if (collection.features) {
          collection.features
            .filter(feature => feature.geometry && this.isValidGeometry(feature.geometry))
            .forEach((feature, index) => {
              features.push({
                name: this.extractNameFromFeature(feature, index, collectionIndex),
                geometry: feature.geometry
              });
            });
        }
      });
      
      return {
        features,
        fileName: path.basename(fileName, path.extname(fileName)),
        fileType: 'shapefile'
      };
    } catch (error) {
      throw new Error(`Failed to parse Shapefile: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse a Shapefile from a ZIP archive
   */
  private async parseShapefileZip(filePath: string, fileName: string): Promise<GisParseResult> {
    try {
      const data = await fs.readFile(filePath);
      const geoJson: FeatureCollection | FeatureCollection[] = await shp(data);
      
      // Handle both single and multiple feature collections
      const featureCollections = Array.isArray(geoJson) ? geoJson : [geoJson];
      
      const features: ParsedAoi[] = [];
      featureCollections.forEach((collection, collectionIndex) => {
        if (collection.features) {
          collection.features
            .filter(feature => feature.geometry && this.isValidGeometry(feature.geometry))
            .forEach((feature, index) => {
              features.push({
                name: this.extractNameFromFeature(feature, index, collectionIndex),
                geometry: feature.geometry
              });
            });
        }
      });
      
      return {
        features,
        fileName: path.basename(fileName, path.extname(fileName)),
        fileType: 'shapefile'
      };
    } catch (error) {
      throw new Error(`Failed to parse Shapefile ZIP: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse a KML/KMZ file
   */
  private async parseKmlFile(filePath: string, fileName: string, isKmz: boolean): Promise<GisParseResult> {
    try {
      let kmlContent: string;
      
      if (isKmz) {
        // For KMZ files, we would need to extract the KML content from the ZIP archive
        // This is a simplified implementation - in a real application, you'd use a library like node-stream-zip
        throw new Error('KMZ parsing not implemented in this simplified version');
      } else {
        kmlContent = await fs.readFile(filePath, 'utf8');
      }
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');
      const geoJson: FeatureCollection = togeojson.kml(xmlDoc);
      
      const features: ParsedAoi[] = geoJson.features
        .filter(feature => feature.geometry && this.isValidGeometry(feature.geometry))
        .map((feature, index) => ({
          name: this.extractNameFromFeature(feature, index),
          geometry: feature.geometry
        }));
      
      return {
        features,
        fileName: path.basename(fileName, path.extname(fileName)),
        fileType: 'kml'
      };
    } catch (error) {
      throw new Error(`Failed to parse KML file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract a name from a GeoJSON feature
   */
  private extractNameFromFeature(feature: Feature, index: number, collectionIndex?: number): string {
    // Try to get name from properties
    if (feature.properties) {
      // Common name fields in GIS data
      const nameFields = ['name', 'NAME', 'Name', 'title', 'TITLE', 'Title', 'label', 'LABEL'];
      
      for (const field of nameFields) {
        if (feature.properties[field]) {
          return String(feature.properties[field]);
        }
      }
      
      // If no name field found, try to use an ID field
      const idFields = ['id', 'ID', 'identifier', 'IDENTIFIER'];
      for (const field of idFields) {
        if (feature.properties[field]) {
          return `Feature ${feature.properties[field]}`;
        }
      }
    }
    
    // Fallback to a generic name
    const prefix = collectionIndex !== undefined ? `Collection ${collectionIndex} - ` : '';
    return `${prefix}Feature ${index + 1}`;
  }

  /**
   * Validate that a geometry is supported
   */
  private isValidGeometry(geometry: Geometry): boolean {
    const supportedTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
    return supportedTypes.includes(geometry.type);
  }
}