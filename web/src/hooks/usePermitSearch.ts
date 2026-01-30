'use client'

import { useState, useCallback, useEffect } from 'react'
import { Permit, PermitFilters, SearchResult, SavedSearch, FilterOptions } from '@/types/permit'

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

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingOptions(true)
      try {
        const response = await fetch(`${API_BASE_URL}/permits/filter-options`)
        if (response.ok) {
          const data = await response.json()
          setFilterOptions(data)
        }
      } catch (err) {
        console.error('Failed to load filter options:', err)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadFilterOptions()
  }, [])

  // Load saved searches on mount
  useEffect(() => {
    const loadSavedSearches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/saved-searches`)
        if (response.ok) {
          const data = await response.json()
          setSavedSearches(data)
        }
      } catch (err) {
        console.error('Failed to load saved searches:', err)
      }
    }

    loadSavedSearches()
  }, [])

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setPermits([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filters, pageSize])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPermits([])
    setTotal(0)
    setPage(1)
    setAggregations(null)
  }, [])

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save search')
    }
  }, [filters])

  const loadSavedSearch = useCallback(async (searchId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-searches/${searchId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load saved search')
      }

      const savedSearch: SavedSearch = await response.json()
      setFilters(savedSearch.filters)
      // Trigger search with loaded filters
      await search(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved search')
    }
  }, [search])

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
