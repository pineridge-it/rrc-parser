'use client'

import { PermitFilters, FilterOptions } from '@/types/permit'
import { Input } from '@/components/ui/input'
import { FilterChip, FilterChipGroup } from '@/components/filters/FilterChip'
import { FilterSearch } from '@/components/filters/FilterSearch'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { SavedFilters } from '@/components/filters/SavedFilters'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

interface PermitSearchFiltersProps {
  filters: PermitFilters
  setFilters: (filters: PermitFilters) => void
  filterOptions: FilterOptions | null
  loadingOptions: boolean
  onSearch: () => void
  onReset: () => void
}

export function PermitSearchFilters({
  filters,
  setFilters,
  filterOptions,
  loadingOptions,
  onSearch,
  onReset,
}: PermitSearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['counties', 'status', 'permitType']))

  const handleTextSearchChange = (value: string) => {
    setFilters({ ...filters, textSearch: value || undefined })
  }

  const handleCountyToggle = (countyCode: string) => {
    const current = filters.counties || []
    const updated = current.includes(countyCode)
      ? current.filter(c => c !== countyCode)
      : [...current, countyCode]
    setFilters({ ...filters, counties: updated.length ? updated : undefined })
  }

  const handleOperatorToggle = (operatorId: string) => {
    const current = filters.operators || []
    const updated = current.includes(operatorId)
      ? current.filter(o => o !== operatorId)
      : [...current, operatorId]
    setFilters({ ...filters, operators: updated.length ? updated : undefined })
  }

  const handleStatusToggle = (status: string) => {
    const current = filters.statuses || []
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    setFilters({ ...filters, statuses: updated.length ? updated : undefined })
  }

  const handlePermitTypeToggle = (type: string) => {
    const current = filters.permitTypes || []
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    setFilters({ ...filters, permitTypes: updated.length ? updated : undefined })
  }

  const handleFiledDateChange = (range: { from?: string; to?: string }) => {
    setFilters({
      ...filters,
      filedDateRange: range.from || range.to ? range : undefined,
    })
  }

  const handleApprovedDateChange = (range: { from?: string; to?: string }) => {
    setFilters({
      ...filters,
      approvedDateRange: range.from || range.to ? range : undefined,
    })
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Calculate active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; category: string; onRemove: () => void }[] = []

    if (filters.textSearch) {
      chips.push({
        key: 'textSearch',
        label: filters.textSearch,
        category: 'Search',
        onRemove: () => setFilters({ ...filters, textSearch: undefined }),
      })
    }

    filters.counties?.forEach(countyCode => {
      const county = filterOptions?.counties.find(c => c.code === countyCode)
      if (county) {
        chips.push({
          key: `county-${countyCode}`,
          label: county.name,
          category: 'County',
          onRemove: () => handleCountyToggle(countyCode),
        })
      }
    })

    filters.operators?.forEach(operatorId => {
      const operator = filterOptions?.operators.find(o => o.id === operatorId)
      if (operator) {
        chips.push({
          key: `operator-${operatorId}`,
          label: operator.name,
          category: 'Operator',
          onRemove: () => handleOperatorToggle(operatorId),
        })
      }
    })

    filters.statuses?.forEach(status => {
      const statusLabel = filterOptions?.statuses.find(s => s.value === status)?.label || status
      chips.push({
        key: `status-${status}`,
        label: statusLabel,
        category: 'Status',
        onRemove: () => handleStatusToggle(status),
      })
    })

    filters.permitTypes?.forEach(type => {
      const typeLabel = filterOptions?.permitTypes.find(t => t.value === type)?.label || type
      chips.push({
        key: `type-${type}`,
        label: typeLabel,
        category: 'Type',
        onRemove: () => handlePermitTypeToggle(type),
      })
    })

    if (filters.filedDateRange?.from || filters.filedDateRange?.to) {
      const from = filters.filedDateRange.from || 'Any'
      const to = filters.filedDateRange.to || 'Any'
      chips.push({
        key: 'filedDate',
        label: `${from} to ${to}`,
        category: 'Filed Date',
        onRemove: () => setFilters({ ...filters, filedDateRange: undefined }),
      })
    }

    if (filters.approvedDateRange?.from || filters.approvedDateRange?.to) {
      const from = filters.approvedDateRange.from || 'Any'
      const to = filters.approvedDateRange.to || 'Any'
      chips.push({
        key: 'approvedDate',
        label: `${from} to ${to}`,
        category: 'Approved Date',
        onRemove: () => setFilters({ ...filters, approvedDateRange: undefined }),
      })
    }

    return chips
  }, [filters, filterOptions])

  const activeFilterCount = activeFilterChips.length

  const handleApplySavedFilters = (savedFilters: PermitFilters) => {
    setFilters(savedFilters)
  }

  return (
    <div className="rounded-lg p-6 space-y-6" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-default)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" style={{ color: 'var(--color-text-tertiary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Filters</h2>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--color-brand-primary) 10%, transparent)', color: 'var(--color-brand-primary)' }}>
              {activeFilterCount} active
            </span>
          )}
        </div>
      </div>

      {/* Saved Filters */}
      <SavedFilters
        currentFilters={filters}
        onApplyFilters={handleApplySavedFilters}
      />

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Active Filters</span>
            <button
              onClick={onReset}
              className="text-sm flex items-center gap-1"
              style={{ color: 'var(--color-text-link)' }}
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          </div>
          <FilterChipGroup>
            {activeFilterChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                value={chip.key}
                category={chip.category}
                onRemove={chip.onRemove}
              />
            ))}
          </FilterChipGroup>
        </div>
      )}

      {/* Text Search */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Lease, well, API number..."
            value={filters.textSearch || ''}
            onChange={(e) => handleTextSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md"
            style={{ border: '1px solid var(--color-border-default)', background: 'var(--color-surface-default)', color: 'var(--color-text-primary)', outline: 'none' }}
            onFocus={e => (e.currentTarget.style.outline = `2px solid var(--color-brand-primary)`)}
            onBlur={e => (e.currentTarget.style.outline = 'none')}
          />
        </div>
      </div>

      {/* County Filter with Search */}
      <div>
        <button
          onClick={() => toggleSection('counties')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span>
            Counties
            {filters.counties && filters.counties.length > 0 && (
              <span className="ml-2 text-xs" style={{ color: 'var(--color-brand-primary)' }}>({filters.counties.length})</span>
            )}
          </span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            {expandedSections.has('counties') ? '−' : '+'}
          </span>
        </button>
        {expandedSections.has('counties') && (
          <FilterSearch
            items={filterOptions?.counties || []}
            searchFields={['name', 'code']}
            placeholder="Search counties..."
            emptyMessage="No counties found"
            renderItem={(county) => (
              <label className="flex items-center p-2 rounded cursor-pointer"
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={filters.counties?.includes(county.code) || false}
                  onChange={() => handleCountyToggle(county.code)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--color-brand-primary)' }}
                />
                <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{county.name}</span>
              </label>
            )}
          />
        )}
      </div>

      {/* Status Filter */}
      <div>
        <button
          onClick={() => toggleSection('status')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span>
            Status
            {filters.statuses && filters.statuses.length > 0 && (
              <span className="ml-2 text-xs" style={{ color: 'var(--color-brand-primary)' }}>({filters.statuses.length})</span>
            )}
          </span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            {expandedSections.has('status') ? '−' : '+'}
          </span>
        </button>
        {expandedSections.has('status') && (
          <div className="space-y-2">
            {filterOptions?.statuses.map((status) => (
              <label key={status.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.statuses?.includes(status.value) || false}
                  onChange={() => handleStatusToggle(status.value)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--color-brand-primary)' }}
                />
                <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{status.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Permit Type Filter */}
      <div>
        <button
          onClick={() => toggleSection('permitType')}
          className="flex items-center justify-between w-full text-sm font-medium mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span>
            Permit Type
            {filters.permitTypes && filters.permitTypes.length > 0 && (
              <span className="ml-2 text-xs" style={{ color: 'var(--color-brand-primary)' }}>({filters.permitTypes.length})</span>
            )}
          </span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            {expandedSections.has('permitType') ? '−' : '+'}
          </span>
        </button>
        {expandedSections.has('permitType') && (
          <div className="space-y-2">
            {filterOptions?.permitTypes.map((type) => (
              <label key={type.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.permitTypes?.includes(type.value) || false}
                  onChange={() => handlePermitTypeToggle(type.value)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--color-brand-primary)' }}
                />
                <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{type.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Operator Filter with Search */}
      {filterOptions && filterOptions.operators.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('operators')}
            className="flex items-center justify-between w-full text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span>
              Operators
              {filters.operators && filters.operators.length > 0 && (
                <span className="ml-2 text-xs" style={{ color: 'var(--color-brand-primary)' }}>({filters.operators.length})</span>
              )}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              {expandedSections.has('operators') ? '−' : '+'}
            </span>
          </button>
          {expandedSections.has('operators') && (
            <FilterSearch
              items={filterOptions.operators}
              searchFields={['name']}
              placeholder="Search operators..."
              emptyMessage="No operators found"
              renderItem={(operator) => (
                <label className="flex items-center p-2 rounded cursor-pointer"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={filters.operators?.includes(operator.id) || false}
                    onChange={() => handleOperatorToggle(operator.id)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: 'var(--color-brand-primary)' }}
                  />
                  <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{operator.name}</span>
                </label>
              )}
            />
          )}
        </div>
      )}

      {/* My Annotations Section */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="button"
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection('annotations')}
        >
          <span className="text-sm font-medium text-gray-900">My Annotations</span>
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
        </button>

        {(expandedSections.has('annotations') || hasActiveAnnotationFilters) && (
          <div className="mt-4 space-y-6">
            {/* Tags */}
            {filterOptions?.tags && filterOptions.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.tags.map((tag) => {
                    const isSelected = filters.annotationTags?.includes(tag.tag_name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAnnotationTagToggle(tag.tag_name)}
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                          isSelected
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        )}
                      >
                        {tag.tag_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Status */}
            {filterOptions?.customStatuses && filterOptions.customStatuses.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Custom Status
                </label>
                <FilterChipGroup
                  options={filterOptions.customStatuses.map(status => ({
                    value: status.status_name,
                    label: status.status_name
                  }))}
                  selectedValues={filters.annotationStatus || []}
                  onToggle={handleAnnotationStatusToggle}
                />
              </div>
            )}

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Assignee
              </label>
              <select
                value={filters.assignee || ''}
                onChange={(e) => handleAssigneeChange(e.target.value || undefined)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Any assignee</option>
                <option value="me">Assigned to me</option>
                {filterOptions?.workspaceMembers?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Has Notes */}
            <div className="flex items-center">
              <input
                id="has-notes"
                name="has-notes"
                type="checkbox"
                checked={filters.hasNotes === true}
                onChange={handleHasNotesToggle}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="has-notes" className="ml-2 block text-sm text-gray-900">
                Has Notes
              </label>
            </div>

            {/* Annotated */}
            <div className="flex items-center">
              <input
                id="annotated"
                name="annotated"
                type="checkbox"
                checked={filters.annotated === true}
                onChange={handleAnnotatedToggle}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="annotated" className="ml-2 block text-sm text-gray-900">
                Annotated
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Filed Date Range */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Filed Date
        </label>
        <DateRangePicker
          value={filters.filedDateRange || {}}
          onChange={handleFiledDateChange}
        />
      </div>

      {/* Approved Date Range */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Approved Date
        </label>
        <DateRangePicker
          value={filters.approvedDateRange || {}}
          onChange={handleApprovedDateChange}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4" style={{ borderTop: '1px solid var(--color-border-default)' }}>
        <button
          onClick={onSearch}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md touch-target"
          style={{ color: '#fff', background: 'var(--color-brand-primary)' }}
        >
          Apply Filters
        </button>
        <button
          onClick={onReset}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md touch-target"
          style={{ border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
