'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Operator,
  OperatorActivitySummary,
  OperatorPermitTimelineEntry,
  OperatorComparison,
  OperatorGeographicFootprint,
  OperatorSearchResult,
  OperatorFilterOptions,
  OperatorListResponse,
  UUID
} from '@/types/operator'
import { useToast } from '@/components/ui/use-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface UseOperatorsReturn {
  // List state
  operators: Operator[]
  total: number
  hasMore: boolean
  loading: boolean
  error: string | null
  
  // Search state
  searchResults: OperatorSearchResult[]
  searching: boolean
  
  // Detail state
  selectedOperator: Operator | null
  activitySummary: OperatorActivitySummary | null
  permitTimeline: OperatorPermitTimelineEntry[]
  timelineTotal: number
  geographicFootprint: OperatorGeographicFootprint | null
  comparisons: OperatorComparison[]
  
  // Loading states for details
  loadingDetails: boolean
  loadingActivity: boolean
  loadingTimeline: boolean
  loadingFootprint: boolean
  
  // Actions
  listOperators: (options: Partial<OperatorFilterOptions>) => Promise<void>
  searchOperators: (query: string, limit?: number) => Promise<void>
  getOperator: (id: UUID) => Promise<void>
  getActivitySummary: (operatorId: UUID) => Promise<void>
  getPermitTimeline: (operatorId: UUID, options?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) => Promise<void>
  getGeographicFootprint: (operatorId: UUID) => Promise<void>
  compareOperators: (operatorIds: UUID[]) => Promise<void>
  clearSearch: () => void
  clearSelectedOperator: () => void
}

const defaultFilterOptions: OperatorFilterOptions = {
  sortBy: 'name',
  sortOrder: 'asc',
  limit: 25,
  offset: 0
}

export function useOperators(): UseOperatorsReturn {
  // List state
  const [operators, setOperators] = useState<Operator[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search state
  const [searchResults, setSearchResults] = useState<OperatorSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  
  // Detail state
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [activitySummary, setActivitySummary] = useState<OperatorActivitySummary | null>(null)
  const [permitTimeline, setPermitTimeline] = useState<OperatorPermitTimelineEntry[]>([])
  const [timelineTotal, setTimelineTotal] = useState(0)
  const [geographicFootprint, setGeographicFootprint] = useState<OperatorGeographicFootprint | null>(null)
  const [comparisons, setComparisons] = useState<OperatorComparison[]>([])
  
  // Loading states
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [loadingFootprint, setLoadingFootprint] = useState(false)

  const { toast } = useToast()

  const listOperators = useCallback(async (options: Partial<OperatorFilterOptions>) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      const mergedOptions = { ...defaultFilterOptions, ...options }
      
      if (mergedOptions.query) params.append('query', mergedOptions.query)
      if (mergedOptions.counties?.length) params.append('counties', mergedOptions.counties.join(','))
      if (mergedOptions.minPermits !== undefined) params.append('minPermits', mergedOptions.minPermits.toString())
      if (mergedOptions.maxPermits !== undefined) params.append('maxPermits', mergedOptions.maxPermits.toString())
      if (mergedOptions.activeOnly) params.append('activeOnly', 'true')
      params.append('sortBy', mergedOptions.sortBy)
      params.append('sortOrder', mergedOptions.sortOrder)
      params.append('limit', mergedOptions.limit.toString())
      params.append('offset', mergedOptions.offset.toString())

      const response = await fetch(`${API_BASE_URL}/operators?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch operators: ${response.statusText}`)
      }
      
      const data: OperatorListResponse = await response.json()
      setOperators(data.operators)
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Operators List Error', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const searchOperators = useCallback(async (query: string, limit: number = 10) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      })

      const response = await fetch(`${API_BASE_URL}/operators/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to search operators: ${response.statusText}`)
      }
      
      const data: OperatorSearchResult[] = await response.json()
      setSearchResults(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Operator Search Error', {
        description: errorMessage
      })
    } finally {
      setSearching(false)
    }
  }, [toast])

  const getOperator = useCallback(async (id: UUID) => {
    setLoadingDetails(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/operators/${id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch operator: ${response.statusText}`)
      }
      
      const data: Operator = await response.json()
      setSelectedOperator(data)
      toast.success('Operator Loaded', {
        description: `Successfully loaded operator: ${data.name}`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Operator Load Error', {
        description: errorMessage
      })
    } finally {
      setLoadingDetails(false)
    }
  }, [toast])

  const getActivitySummary = useCallback(async (operatorId: UUID) => {
    setLoadingActivity(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/operators/${operatorId}/activity`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activity summary: ${response.statusText}`)
      }
      
      const data: OperatorActivitySummary = await response.json()
      setActivitySummary(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Activity Summary Error', {
        description: errorMessage
      })
    } finally {
      setLoadingActivity(false)
    }
  }, [toast])

  const getPermitTimeline = useCallback(async (
    operatorId: UUID,
    options?: { startDate?: string; endDate?: string; limit?: number; offset?: number }
  ) => {
    setLoadingTimeline(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (options?.startDate) params.append('startDate', options.startDate)
      if (options?.endDate) params.append('endDate', options.endDate)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`${API_BASE_URL}/operators/${operatorId}/timeline${queryString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch permit timeline: ${response.statusText}`)
      }
      
      const data = await response.json()
      setPermitTimeline(data.entries)
      setTimelineTotal(data.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Permit Timeline Error', {
        description: errorMessage
      })
    } finally {
      setLoadingTimeline(false)
    }
  }, [toast])

  const getGeographicFootprint = useCallback(async (operatorId: UUID) => {
    setLoadingFootprint(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/operators/${operatorId}/footprint`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch geographic footprint: ${response.statusText}`)
      }
      
      const data: OperatorGeographicFootprint = await response.json()
      setGeographicFootprint(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Geographic Footprint Error', {
        description: errorMessage
      })
    } finally {
      setLoadingFootprint(false)
    }
  }, [toast])

  const compareOperators = useCallback(async (operatorIds: UUID[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/operators/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorIds })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to compare operators: ${response.statusText}`)
      }
      
      const data: OperatorComparison[] = await response.json()
      setComparisons(data)
      toast.success('Operators Compared', {
        description: `Successfully compared ${operatorIds.length} operators`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error('Operator Comparison Error', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const clearSearch = useCallback(() => {
    setSearchResults([])
  }, [])

  const clearSelectedOperator = useCallback(() => {
    setSelectedOperator(null)
    setActivitySummary(null)
    setPermitTimeline([])
    setTimelineTotal(0)
    setGeographicFootprint(null)
  }, [])

  return {
    operators,
    total,
    hasMore,
    loading,
    error,
    searchResults,
    searching,
    selectedOperator,
    activitySummary,
    permitTimeline,
    timelineTotal,
    geographicFootprint,
    comparisons,
    loadingDetails,
    loadingActivity,
    loadingTimeline,
    loadingFootprint,
    listOperators,
    searchOperators,
    getOperator,
    getActivitySummary,
    getPermitTimeline,
    getGeographicFootprint,
    compareOperators,
    clearSearch,
    clearSelectedOperator
  }
}
