'use client'

import { useState, useCallback, useEffect } from 'react'
import { Permit, PermitFilters, SearchResult, SavedSearch, FilterOptions } from '@/types/permit'
import { useToast } from '@/components/ui/use-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface UsePermitSearchReturn {
  permits: Permit[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  aggregations: SearchResult['aggregations'] | null
  filters: PermitFilters
  setFilters: (filters: PermitFilters) => void
  search: (page?: number) => Promise<void>
  resetFilters: () => void
  savedSearches: SavedSearch[]
  saveSearch: (name: string) => Promise<void>
  loadSavedSearch: (searchId: string) => Promise<void>
  filterOptions: FilterOptions | null
  loadingOptions: boolean
}

const defaultFilters: PermitFilters = {}

export function usePermitSearch(): UsePermitSearchReturn {
  const [permits, setPermits] = useState<Permit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aggregations, setAggregations] = useState<SearchResult['aggregations'] | null>(null)
  const [filters, setFilters] = useState<PermitFilters>(defaultFilters)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const { toast, error: toastError, success: toastSuccess, info: toastInfo } = useToast()

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingOptions(true)
      try {
        const response = await fetch(`${API_BASE_URL}/permits/filter-options`)
        if (response.ok) {
          const data = await response.json()
          setFilterOptions(data)
        } else {
          throw new Error('Failed to load filter options')
        }
      } catch (err) {
        console.error('Failed to load filter options:', err)
        toastError('Filter Options Error', {
          description: 'Failed to load filter options. Some filter features may not work properly.'
        })
      } finally {
        setLoadingOptions(false)
      }
    }

    loadFilterOptions()
  }, [toast])

  // Load saved searches on mount
  useEffect(() => {
    const loadSavedSearches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/saved-searches`)
        if (response.ok) {
          const data = await response.json()
          setSavedSearches(data)
        } else {
          throw new Error('Failed to load saved searches')
        }
      } catch (err) {
        console.error('Failed to load saved searches:', err)
        toastError('Saved Searches Error', {
          description: 'Failed to load saved searches. Your saved searches may not be available.'
        })
      }
    }

    loadSavedSearches()
  }, [toast])

  const search = useCallback(async (targetPage: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', targetPage.toString())
      queryParams.append('pageSize', pageSize.toString())

      if (filters.operators?.length) {
        queryParams.append('operators', filters.operators.join(','))
      }
      if (filters.counties?.length) {
        queryParams.append('counties', filters.counties.join(','))
      }
      if (filters.statuses?.length) {
        queryParams.append('statuses', filters.statuses.join(','))
      }
      if (filters.permitTypes?.length) {
        queryParams.append('permitTypes', filters.permitTypes.join(','))
      }
      if (filters.filedDateRange?.from) {
        queryParams.append('filedFrom', filters.filedDateRange.from)
      }
      if (filters.filedDateRange?.to) {
        queryParams.append('filedTo', filters.filedDateRange.to)
      }
      if (filters.approvedDateRange?.from) {
        queryParams.append('approvedFrom', filters.approvedDateRange.from)
      }
      if (filters.approvedDateRange?.to) {
        queryParams.append('approvedTo', filters.approvedDateRange.to)
      }
      if (filters.textSearch) {
        queryParams.append('q', filters.textSearch)
      }
      if (filters.aoiId) {
        queryParams.append('aoiId', filters.aoiId)
      }

      const response = await fetch(`${API_BASE_URL}/permits/search?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data: SearchResult = await response.json()
      setPermits(data.permits)
      setTotal(data.total)
      setPage(targetPage)
      setAggregations(data.aggregations)

      // Show success message only if there are results
      if (data.total > 0) {
        toastSuccess('Search Complete', {
          description: `Found ${data.total} permits matching your criteria.`
        })
      } else {
        toastInfo('Search Complete', {
          description: 'No permits found matching your criteria.'
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setPermits([])
      setTotal(0)
      toastError('Search Failed', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [filters, pageSize, toast])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPermits([])
    setTotal(0)
    setPage(1)
    setAggregations(null)
    toastInfo('Filters Reset', {
      description: 'All filters have been cleared.'
    })
  }, [toast])

  const saveSearch = useCallback(async (name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, filters }),
      })

      if (!response.ok) {
        throw new Error('Failed to save search')
      }

      const newSearch: SavedSearch = await response.json()
      setSavedSearches(prev => [...prev, newSearch])
      toastSuccess('Search Saved', {
        description: `Your search "${name}" has been saved successfully.`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save search'
      setError(errorMessage)
      toastError('Save Search Failed', {
        description: errorMessage
      })
    }
  }, [filters, toast])

  const loadSavedSearch = useCallback(async (searchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-searches/${searchId}`)

      if (!response.ok) {
        throw new Error('Failed to load saved search')
      }

      const savedSearch: SavedSearch = await response.json()
      // Set filters first, then search will use the updated filters
      setFilters(savedSearch.filters)
      // Use setTimeout to ensure filters are updated before searching
      setTimeout(() => {
        search(1)
      }, 0)
      toastSuccess('Search Loaded', {
        description: `Loaded saved search "${savedSearch.name}".`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load saved search'
      setError(errorMessage)
      toastError('Load Search Failed', {
        description: errorMessage
      })
    }
  }, [search, toast])

  return {
    permits,
    total,
    page,
    pageSize,
    loading,
    error,
    aggregations,
    filters,
    setFilters,
    search,
    resetFilters,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    filterOptions,
    loadingOptions,
  }
}
