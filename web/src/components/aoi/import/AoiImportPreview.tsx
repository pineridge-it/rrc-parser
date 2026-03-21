'use client';

import { useState, useCallback, useRef } from 'react';
import { Feature, Geometry } from 'geojson';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { FileUploader } from '@/components/ui/file-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ParsedAoi {
  name: string;
  geometry: Geometry;
}

interface AoiImportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function AoiImportPreview({ isOpen, onClose, onImportComplete }: AoiImportPreviewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedFeatures, setParsedFeatures] = useState<ParsedAoi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [aoiNames, setAoiNames] = useState<Record<number, string>>({});
  const mapRef = useRef<L.Map | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the API to parse the file
      // For now, we'll simulate the parsing with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock parsed features - in a real implementation, this would come from the API
      const mockFeatures: ParsedAoi[] = [
        { name: 'Lease Block A', geometry: { type: 'Polygon', coordinates: [[[-95.5, 29.5], [-95.5, 30.5], [-94.5, 30.5], [-94.5, 29.5], [-95.5, 29.5]]] } },
        { name: 'Prospect Area 1', geometry: { type: 'Polygon', coordinates: [[[-96.5, 28.5], [-96.5, 29.5], [-95.5, 29.5], [-95.5, 28.5], [-96.5, 28.5]]] } },
        { name: 'Well Location', geometry: { type: 'Point', coordinates: [-97.5, 29.0] } },
      ];
      
      setParsedFeatures(mockFeatures);
      setAoiNames(Object.fromEntries(mockFeatures.map((feature, index) => [index, feature.name])));
      
      // Calculate bounds for the map
      const bounds = L.latLngBounds([]);
      mockFeatures.forEach(feature => {
        if (feature.geometry.type === 'Point') {
          const coords = feature.geometry.coordinates as [number, number];
          bounds.extend([coords[1], coords[0]]);
        } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          // Simplified bounds calculation - in a real implementation, you'd use turf.js or similar
          bounds.extend([[28, -98], [31, -94]]);
        }
      });
      setMapBounds(bounds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle name change for an AOI
  const handleNameChange = (index: number, name: string) => {
    setAoiNames(prev => ({ ...prev, [index]: name }));
  };

  // Handle import confirmation
  const handleImport = async () => {
    if (parsedFeatures.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare AOIs for import
      const aoisToImport = parsedFeatures.map((feature, index) => ({
        name: aoiNames[index] || feature.name,
        geometry: feature.geometry
      }));
      
      // In a real implementation, this would call the API to import the AOIs
      // For now, we'll simulate the import
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close the dialog and notify parent
      onClose();
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import AOIs');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setParsedFeatures([]);
    setAoiNames({});
    setMapBounds(null);
    setError(null);
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk AOI Import</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {!file ? (
          <div className="py-8">
            <FileUploader
              accept=".geojson,.json,.shp,.zip,.kml,.kmz"
              onFileSelect={handleFileUpload}
              isLoading={isLoading}
              maxSize={10 * 1024 * 1024} // 10MB
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Supported formats: GeoJSON, Shapefile (.zip), KML/KMZ
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full rounded-md overflow-hidden">
                  {mapBounds ? (
                    <MapContainer
                      bounds={mapBounds}
                      style={{ height: '100%', width: '100%' }}
                      ref={mapRef}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {parsedFeatures.map((feature, index) => (
                        <GeoJSON
                          key={index}
                          data={feature.geometry}
                          style={{
                            color: '#3B82F6',
                            weight: 2,
                            fillColor: '#3B82F6',
                            fillOpacity: 0.2
                          }}
                        />
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">Loading map preview...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* AOI List */}
            <Card>
              <CardHeader>
                <CardTitle>Areas to Import ({parsedFeatures.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {parsedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-md">
                      <div className="flex-1">
                        <Input
                          value={aoiNames[index] || feature.name}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          placeholder="AOI Name"
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        {feature.geometry.type}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Actions */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || parsedFeatures.length === 0}
              >
                {isLoading ? 'Importing...' : 'Import AOIs'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}