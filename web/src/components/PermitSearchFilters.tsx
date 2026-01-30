'use client'

import { PermitFilters, FilterOptions } from '@/types/permit'

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
  const handleTextSearchChange = (value: string) => {
    setFilters({ ...filters, textSearch: value || undefined })
  }

  const handleCountyToggle = (county: string) => {
    const current = filters.counties || []
    const updated = current.includes(county)
      ? current.filter(c => c !== county)
      : [...current, county]
    setFilters({ ...filters, counties: updated.length ? updated : undefined })
  }

  const handleOperatorToggle = (operator: string) => {
    const current = filters.operators || []
    const updated = current.includes(operator)
      ? current.filter(o => o !== operator)
      : [...current, operator]
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

  const handleFiledDateChange = (field: 'from' | 'to', value: string) => {
    setFilters({
      ...filters,
      filedDateRange: {
        ...filters.filedDateRange,
        [field]: value || undefined,
      },
    })
  }

  const handleApprovedDateChange = (field: 'from' | 'to', value: string) => {
    setFilters({
      ...filters,
      approvedDateRange: {
        ...filters.approvedDateRange,
        [field]: value || undefined,
      },
    })
  }

  const activeFilterCount = [
    filters.counties?.length,
    filters.operators?.length,
    filters.statuses?.length,
    filters.permitTypes?.length,
    filters.textSearch,
    filters.filedDateRange?.from || filters.filedDateRange?.to,
    filters.approvedDateRange?.from || filters.approvedDateRange?.to,
  ].filter(Boolean).length

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {activeFilterCount} active
          </span>
        )}
      </div>

      {/* Text Search */}
      <div>
        <label htmlFor="text-search" className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          id="text-search"
          placeholder="Lease, well, API number..."
          value={filters.textSearch || ''}
          onChange={(e) => handleTextSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* County Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Counties
          {loadingOptions && <span className="ml-2 text-xs text-gray-500">Loading...</span>}
        </label>
        <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
          {filterOptions?.counties.map((county) => (
            <label key={county.code} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.counties?.includes(county.code) || false}
                onChange={() => handleCountyToggle(county.code)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{county.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="space-y-2">
          {filterOptions?.statuses.map((status) => (
            <label key={status.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.statuses?.includes(status.value) || false}
                onChange={() => handleStatusToggle(status.value)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{status.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Permit Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Permit Type</label>
        <div className="space-y-2">
          {filterOptions?.permitTypes.map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.permitTypes?.includes(type.value) || false}
                onChange={() => handlePermitTypeToggle(type.value)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filed Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Filed Date</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            placeholder="From"
            value={filters.filedDateRange?.from || ''}
            onChange={(e) => handleFiledDateChange('from', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            type="date"
            placeholder="To"
            value={filters.filedDateRange?.to || ''}
            onChange={(e) => handleFiledDateChange('to', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onSearch}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Apply Filters
        </button>
        <button
          onClick={onReset}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
