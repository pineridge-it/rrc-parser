'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Permit } from '@/types/permit'

export interface DashboardData {
  recentActivity: {
    newPermits: number
    statusChanges: number
    lastUpdated: Date
  }
  alerts: {
    unreadCount: number
    recentAlerts: {
      id: string
      title: string
      timestamp: Date
    }[]
  }
  aois: {
    id: string
    name: string
    permitCount: number
    recentPermitCount: number // Last 7 days
  }[]
  savedSearches: {
    id: string
    name: string
    lastUsed: Date
  }[]
}

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch recent permit count (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Get count of new permits filed in the last 7 days
      const { count: newPermitsCount, error: permitsError } = await supabase
        .from('permits')
        .select('*', { count: 'exact', head: true })
        .gte('filed_date', sevenDaysAgo.toISOString().split('T')[0])

      if (permitsError) throw permitsError

      // Get count of permits with status changes in the last 7 days
      const { count: statusChangesCount, error: statusError } = await supabase
        .from('permits')
        .select('*', { count: 'exact', head: true })
        .gte('approved_date', sevenDaysAgo.toISOString().split('T')[0])

      if (statusError) throw statusError

      // For now, we'll use a simplified approach for AOIs
      // In a real implementation, we would fetch the user's actual AOIs
      const mockAois = [
        {
          id: '1',
          name: 'Permian Basin',
          permitCount: 45,
          recentPermitCount: Math.min(8, newPermitsCount || 0)
        },
        {
          id: '2',
          name: 'Eagle Ford Shale',
          permitCount: 23,
          recentPermitCount: Math.min(3, newPermitsCount ? Math.floor(newPermitsCount / 3) : 0)
        },
        {
          id: '3',
          name: 'Barnett Shale',
          permitCount: 17,
          recentPermitCount: Math.min(1, newPermitsCount ? Math.floor(newPermitsCount / 5) : 0)
        }
      ]

      // Mock saved searches
      const mockSavedSearches = [
        {
          id: '1',
          name: 'Recent drilling permits',
          lastUsed: new Date(Date.now() - 86400000)
        },
        {
          id: '2',
          name: 'High priority operators',
          lastUsed: new Date(Date.now() - 172800000)
        }
      ]

      // Mock alerts
      const mockAlerts = [
        {
          id: '1',
          title: 'New permit in AOI 1',
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          id: '2',
          title: 'Status change for permit ABC123',
          timestamp: new Date(Date.now() - 7200000)
        }
      ]

      const dashboardData: DashboardData = {
        recentActivity: {
          newPermits: newPermitsCount || 0,
          statusChanges: statusChangesCount || 0,
          lastUpdated: new Date()
        },
        alerts: {
          unreadCount: 5,
          recentAlerts: mockAlerts
        },
        aois: mockAois,
        savedSearches: mockSavedSearches
      }

      setData(dashboardData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data'
      setError(errorMessage)
      toast.error('Failed to load dashboard', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh: fetchData
  }
}