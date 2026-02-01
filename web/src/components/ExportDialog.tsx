/**
 * Export Dialog Component
 * Allows users to configure and create export jobs
 */

'use client';

import { useState } from 'react';
import {
  ExportFormat,
  ExportRequest,
  EXPORT_FORMATS,
  EXPORT_FIELDS,
  supportsGeometry
} from '@/types/export';
import { PermitFilters } from '@/types/permit';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (request: Omit<ExportRequest, 'workspaceId'>) => void;
  filters: PermitFilters;
  creating: boolean;
}

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  filters,
  creating
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'permit_number',
    'operator_name',
    'lease_name',
    'county',
    'well_type',
    'filed_date'
  ]);
  const [includeGeometry, setIncludeGeometry] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['basic']));

  if (!isOpen) return null;

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleCategoryToggle = (category: string) => {
    const categoryFields = EXPORT_FIELDS
      .filter(f => f.category === category)
      .map(f => f.key);

    const allSelected = categoryFields.every(f => selectedFields.includes(f));

    if (allSelected) {
      setSelectedFields(prev => prev.filter(f => !categoryFields.includes(f)));
    } else {
      setSelectedFields(prev => [...new Set([...prev, ...categoryFields])]);
    }
  };

  const handleExport = () => {
    onExport({
      format: selectedFormat,
      filters,
      fields: selectedFields,
      includeGeometry: includeGeometry && supportsGeometry(selectedFormat),
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const categories = [
    { key: 'basic', label: 'Basic Information' },
    { key: 'location', label: 'Location' },
    { key: 'technical', label: 'Technical' },
    { key: 'dates', label: 'Dates' },
    { key: 'status', label: 'Status' },
  ];

  // Handle Escape key press to close dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
        role="document"
      >
        <div className="p-6 border-b border-gray-200">
          <h2
            id="export-dialog-title"
            className="text-xl font-semibold text-gray-900"
          >
            Export Permits
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure your export settings and select the fields you want to include.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXPORT_FORMATS.map((format) => (
                  <label
                    key={format.format}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFormat === format.format
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.format}
                      checked={selectedFormat === format.format}
                      onChange={() => setSelectedFormat(format.format)}
                      className="mt-1 mr-3 focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      aria-describedby={`format-${format.format}-description`}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {format.format.toUpperCase()}
                      </div>
                      <div
                        id={`format-${format.format}-description`}
                        className="text-xs text-gray-500"
                      >
                        {format.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Max: {format.maxRecords.toLocaleString()} records
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Geometry Option */}
          {supportsGeometry(selectedFormat) && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeGeometry"
                checked={includeGeometry}
                onChange={(e) => setIncludeGeometry(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-describedby="include-geometry-description"
              />
              <label
                htmlFor="includeGeometry"
                className="ml-2 text-sm text-gray-700"
                id="include-geometry-description"
              >
                Include geometry data
              </label>
            </div>
          )}

          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className="block text-sm font-medium text-gray-700"
                id="fields-selection-label"
              >
                Fields to Export ({selectedFields.length} selected)
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedFields(EXPORT_FIELDS.map(f => f.key))}
                  className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                  aria-label="Select all fields"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedFields([])}
                  className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                  aria-label="Clear all fields"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div
              className="space-y-3 border border-gray-200 rounded-lg p-4"
              role="group"
              aria-labelledby="fields-selection-label"
            >
              {categories.map((category) => {
                const categoryFields = EXPORT_FIELDS.filter(f => f.category === category.key);
                const selectedCount = categoryFields.filter(f =>
                  selectedFields.includes(f.key)
                ).length;
                const isExpanded = expandedCategories.has(category.key);

                return (
                  <div
                    key={category.key}
                    className="border-b border-gray-100 last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleCategory(category.key)}
                        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:underline"
                        aria-expanded={isExpanded}
                        aria-controls={`category-${category.key}-fields`}
                      >
                        <span className="mr-2" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
                        {category.label}
                        <span className="ml-2 text-xs text-gray-400">
                          ({selectedCount}/{categoryFields.length})
                        </span>
                      </button>
                      <input
                        type="checkbox"
                        checked={selectedCount === categoryFields.length}
                        onChange={() => handleCategoryToggle(category.key)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        aria-label={`Select all fields in ${category.label} category`}
                      />
                    </div>

                    {isExpanded && (
                      <div
                        id={`category-${category.key}-fields`}
                        className="mt-2 ml-6 grid grid-cols-2 gap-2"
                      >
                        {categoryFields.map((field) => (
                          <label
                            key={field.key}
                            className="flex items-center text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(field.key)}
                              onChange={() => handleFieldToggle(field.key)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              aria-label={`Select ${field.label} field`}
                            />
                            <span className="ml-2 text-gray-700">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Cancel export"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={creating || selectedFields.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={selectedFields.length === 0 ? "Select fields to enable export" : "Create export"}
          >
            {creating ? 'Creating...' : 'Create Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
