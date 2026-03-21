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
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 border"
        style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}
        role="document"
      >
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <h2
            id="export-dialog-title"
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Export Permits
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Configure your export settings and select the fields you want to include.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <fieldset>
              <legend className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Export Format
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXPORT_FORMATS.map((format) => {
                  const isSelected = selectedFormat === format.format
                  return (
                    <label
                      key={format.format}
                      className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors"
                      style={{
                        borderColor: isSelected ? 'var(--color-brand-primary)' : 'var(--color-border-default)',
                        background: isSelected ? 'color-mix(in srgb, var(--color-brand-primary) 6%, transparent)' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.format}
                        checked={isSelected}
                        onChange={() => setSelectedFormat(format.format)}
                        className="mt-1 mr-3 h-4 w-4"
                        style={{ accentColor: 'var(--color-brand-primary)' }}
                        aria-describedby={`format-${format.format}-description`}
                      />
                      <div>
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {format.format.toUpperCase()}
                        </div>
                        <div
                          id={`format-${format.format}-description`}
                          className="text-xs"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {format.description}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          Max: {format.maxRecords.toLocaleString()} records
                        </div>
                      </div>
                    </label>
                  )
                })}
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
                className="h-4 w-4 rounded"
                style={{ accentColor: 'var(--color-brand-primary)' }}
                aria-describedby="include-geometry-description"
              />
              <label
                htmlFor="includeGeometry"
                className="ml-2 text-sm"
                id="include-geometry-description"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Include geometry data
              </label>
            </div>
          )}

          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className="block text-sm font-medium"
                id="fields-selection-label"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Fields to Export ({selectedFields.length} selected)
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedFields(EXPORT_FIELDS.map(f => f.key))}
                  className="text-xs focus:outline-none focus:underline"
                  style={{ color: 'var(--color-text-link)' }}
                  aria-label="Select all fields"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedFields([])}
                  className="text-xs focus:outline-none focus:underline"
                  style={{ color: 'var(--color-text-link)' }}
                  aria-label="Clear all fields"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div
              className="space-y-3 rounded-lg p-4 border"
              style={{ borderColor: 'var(--color-border-default)' }}
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
                    className="last:pb-0 pb-3 last:border-0"
                    style={{ borderBottom: '1px solid var(--color-border-default)' }}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleCategory(category.key)}
                        className="flex items-center text-sm font-medium focus:outline-none focus:underline"
                        style={{ color: 'var(--color-text-secondary)' }}
                        aria-expanded={isExpanded}
                        aria-controls={`category-${category.key}-fields`}
                      >
                        <span className="mr-2" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
                        {category.label}
                        <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          ({selectedCount}/{categoryFields.length})
                        </span>
                      </button>
                      <input
                        type="checkbox"
                        checked={selectedCount === categoryFields.length}
                        onChange={() => handleCategoryToggle(category.key)}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: 'var(--color-brand-primary)' }}
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
                              className="h-4 w-4 rounded"
                              style={{ accentColor: 'var(--color-brand-primary)' }}
                              aria-label={`Select ${field.label} field`}
                            />
                            <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>{field.label}</span>
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
        <div className="p-6 flex justify-end space-x-3" style={{ borderTop: '1px solid var(--color-border-default)' }}>
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 text-sm font-medium border rounded-lg disabled:opacity-50 focus:outline-none transition-colors"
            style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-default)', background: 'transparent' }}
            aria-label="Cancel export"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={creating || selectedFields.length === 0}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-colors"
            style={{ background: 'var(--color-brand-primary)' }}
            aria-label={selectedFields.length === 0 ? "Select fields to enable export" : "Create export"}
          >
            {creating ? 'Creating...' : 'Create Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
