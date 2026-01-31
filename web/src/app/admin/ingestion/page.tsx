'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Clock, Database, TrendingUp, Activity, Bell, RefreshCw } from 'lucide-react'

// Types matching the monitoring system
interface IngestionMetrics {
  runId: string
  sourceFile?: string
  startTime: string
  endTime?: string
  status: 'running' | 'success' | 'failed'
  recordsProcessed: number
  recordsFailed: number
  duration?: number
  errorMessage?: string
}

interface SLOState {
  name: string
  target: number
  current: number
  status: 'healthy' | 'warning' | 'critical'
  window: string
}

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  acknowledged: boolean
  ruleName: string
}

interface DashboardMetrics {
  realTimeStatus: {
    lastRunTime: string | null
    lastRunStatus: 'success' | 'failed' | 'running' | null
    recordsInLastRun: number
    currentStatus: 'healthy' | 'warning' | 'critical'
  }
  stats24h: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    totalRecords: number
    avgRecordsPerRun: number
    errorRate: number
  }
  sloStatus: SLOState[]
  activeAlerts: Alert[]
  recentAlerts: Alert[]
}

// Mock data for the dashboard
const MOCK_DASHBOARD_DATA: DashboardMetrics = {
  realTimeStatus: {
    lastRunTime: new Date(Date.now() - 3600000).toISOString(),
    lastRunStatus: 'success',
    recordsInLastRun: 1523,
    currentStatus: 'healthy'
  },
  stats24h: {
    totalRuns: 12,
    successfulRuns: 11,
    failedRuns: 1,
    totalRecords: 18456,
    avgRecordsPerRun: 1538,
    errorRate: 0.02
  },
  sloStatus: [
    { name: 'freshness', target: 95, current: 98, status: 'healthy', window: '24h' },
    { name: 'error_rate', target: 5, current: 2, status: 'healthy', window: '24h' },
    { name: 'success_rate', target: 95, current: 91.7, status: 'warning', window: '24h' }
  ],
  activeAlerts: [
    {
      id: '1',
      severity: 'warning',
      message: 'Success rate below target (91.7% < 95%)',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      acknowledged: false,
      ruleName: 'success-rate-warning'
    }
  ],
  recentAlerts: [
    {
      id: '2',
      severity: 'info',
      message: 'Volume deviation detected: +15% from average',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      acknowledged: true,
      ruleName: 'volume-anomaly'
    }
  ]
}

const MOCK_RUNS: IngestionMetrics[] = [
  { runId: 'run-001', sourceFile: 'permits-2024-01-15.csv', startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date(Date.now() - 3540000).toISOString(), status: 'success', recordsProcessed: 1523, recordsFailed: 12, duration: 60000 },
  { runId: 'run-002', sourceFile: 'permits-2024-01-14.csv', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 86340000).toISOString(), status: 'success', recordsProcessed: 1489, recordsFailed: 8, duration: 55000 },
  { runId: 'run-003', sourceFile: 'permits-2024-01-13.csv', startTime: new Date(Date.now() - 172800000).toISOString(), status: 'failed', recordsProcessed: 0, recordsFailed: 0, errorMessage: 'Connection timeout' }
]

export default function AdminIngestionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [runs, setRuns] = useState<IngestionMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    // Use a timeout to avoid synchronous setState in useEffect
    const timer = setTimeout(() => {
      setMetrics(MOCK_DASHBOARD_DATA)
      setRuns(MOCK_RUNS)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [user, authLoading, router])

  const handleRefresh = async () => {
    setRefreshing(true)
    setLoading(true)
    setTimeout(() => {
      setMetrics(MOCK_DASHBOARD_DATA)
      setRuns(MOCK_RUNS)
      setLoading(false)
      setRefreshing(false)
    }, 800)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
      case 'failed':
        return 'bg-red-500'
      case 'running':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    switch (status) {
      case 'healthy':
      case 'success':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="w-3 h-3 mr-1" /> {status}</span>
      case 'warning':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}><AlertTriangle className="w-3 h-3 mr-1" /> {status}</span>
      case 'critical':
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}><AlertTriangle className="w-3 h-3 mr-1" /> {status}</span>
      case 'running':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}><Activity className="w-3 h-3 mr-1" /> {status}</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>
    }
  }

  const getSeverityBadge = (severity: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    switch (severity) {
      case 'critical':
        return <span className={`${baseClasses} bg-red-600 text-white`}>Critical</span>
      case 'warning':
        return <span className={`${baseClasses} bg-yellow-500 text-white`}>Warning</span>
      case 'info':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 border`}>Info</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{severity}</span>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ingestion Monitoring</h1>
          <p className="text-gray-500 mt-1">Monitor ETL pipeline health, SLO compliance, and alerts</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Real-time Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Current Status</p>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(metrics.realTimeStatus.currentStatus)}`} />
            <span className="text-2xl font-bold capitalize">{metrics.realTimeStatus.currentStatus}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Last Run</p>
          <div className="flex items-center space-x-2">
            {metrics.realTimeStatus.lastRunStatus === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-lg font-semibold">
              {metrics.realTimeStatus.lastRunTime
                ? new Date(metrics.realTimeStatus.lastRunTime).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {metrics.realTimeStatus.recordsInLastRun.toLocaleString()} records
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">24h Success Rate</p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold">
              {((metrics.stats24h.successfulRuns / metrics.stats24h.totalRuns) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {metrics.stats24h.successfulRuns} / {metrics.stats24h.totalRuns} runs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">24h Records Processed</p>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold">
              {metrics.stats24h.totalRecords.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Avg: {metrics.stats24h.avgRecordsPerRun.toLocaleString()} per run
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'runs', 'alerts', 'slos'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'slos' ? 'SLO Compliance' : tab}
                {tab === 'alerts' && metrics.activeAlerts.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {metrics.activeAlerts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Active Alerts
              </h3>
            </div>
            <div className="p-6">
              {metrics.activeAlerts.length === 0 ? (
                <p className="text-gray-500">No active alerts</p>
              ) : (
                <div className="space-y-3">
                  {metrics.activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(alert.severity)}
                          <span className="text-sm text-gray-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SLO Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                SLO Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {metrics.sloStatus.map((slo) => (
                  <div key={slo.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{slo.name.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">Target: {slo.target}%</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(slo.status)}
                      <p className="text-sm font-semibold mt-1">{slo.current.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Recent ETL Runs</h3>
            <p className="text-sm text-gray-500">Last 10 pipeline executions</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {runs.map((run) => (
                    <tr key={run.runId}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{run.runId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{run.sourceFile || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(run.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {run.recordsProcessed.toLocaleString()}
                        {run.recordsFailed > 0 && (
                          <span className="text-red-500 ml-2">
                            ({run.recordsFailed} failed)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(run.startTime).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">All Alerts</h3>
            <p className="text-sm text-gray-500">Active and recently resolved alerts</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...metrics.activeAlerts, ...metrics.recentAlerts].map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.acknowledged ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-sm font-medium">{alert.ruleName}</span>
                        {alert.acknowledged && <span className="text-xs border rounded px-2 py-0.5">Acknowledged</span>}
                      </div>
                      <p className="mt-2">{alert.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'slos' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">SLO Compliance Details</h3>
            <p className="text-sm text-gray-500">Service Level Objective performance over the last 24 hours</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {metrics.sloStatus.map((slo) => (
                <div key={slo.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold capitalize">{slo.name.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-500">Window: {slo.window}</p>
                    </div>
                    {getStatusBadge(slo.status)}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current: {slo.current.toFixed(1)}%</span>
                      <span>Target: {slo.target}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          slo.status === 'healthy'
                            ? 'bg-green-500'
                            : slo.status === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(slo.current, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
