'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface OperatorStats {
  operator_name: string;
  total_permits: number;
  permits_last_30d: number;
  permits_last_90d: number;
  permits_last_365d: number;
  approved_count: number;
  denied_count: number;
  pending_count: number;
  approval_rate_pct: number;
  top_counties: string[];
  top_formations: string[];
  active_since: string;
  last_filing_date: string;
}

interface MonthlyPermits {
  month: string;
  permit_count: number;
  approved_count: number;
  denied_count: number;
}

interface CountyHeatmap {
  county: string;
  permit_count: number;
  lat: number;
  lng: number;
}

export default function OperatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { operatorName } = params;
  
  const [stats, setStats] = useState<OperatorStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPermits[]>([]);
  const [countyData, setCountyData] = useState<CountyHeatmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decode the operator name from URL param
  const decodedOperatorName = decodeURIComponent(operatorName as string);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch operator stats
        const statsRes = await fetch(`/api/v1/operators/stats?operatorName=${encodeURIComponent(decodedOperatorName)}`);
        if (!statsRes.ok) {
          throw new Error('Failed to fetch operator stats');
        }
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        
        // Fetch monthly permits data
        const monthlyRes = await fetch(`/api/v1/operators/${encodeURIComponent(decodedOperatorName)}/permits-by-month`);
        if (!monthlyRes.ok) {
          throw new Error('Failed to fetch monthly permits data');
        }
        const monthlyData = await monthlyRes.json();
        setMonthlyData(monthlyData.permits);
        
        // Fetch county heatmap data
        const countyRes = await fetch(`/api/v1/operators/${encodeURIComponent(decodedOperatorName)}/county-heatmap`);
        if (!countyRes.ok) {
          throw new Error('Failed to fetch county heatmap data');
        }
        const countyData = await countyRes.json();
        setCountyData(countyData.counties);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operator data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (operatorName) {
      fetchData();
    }
  }, [operatorName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Operator Data</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="ml-3 text-lg font-medium text-yellow-800">Operator Not Found</h3>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            <p>No data found for operator: {decodedOperatorName}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const statusData = [
    { name: 'Approved', value: stats.approved_count },
    { name: 'Denied', value: stats.denied_count },
    { name: 'Pending', value: stats.pending_count },
  ];
  
  const statusColors = ['#10B981', '#EF4444', '#F59E0B'];
  
  const recentActivity = [
    { period: 'Last 30 Days', count: stats.permits_last_30d },
    { period: 'Last 90 Days', count: stats.permits_last_90d },
    { period: 'Last 365 Days', count: stats.permits_last_365d },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats.operator_name}</h1>
            <p className="mt-2 text-gray-600">
              Active since {new Date(stats.active_since).toLocaleDateString()} • 
              Last filing on {new Date(stats.last_filing_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              Watch Operator
            </Button>
            <Button>
              Compare
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Permits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_permits.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.approval_rate_pct !== null ? `${stats.approval_rate_pct.toFixed(1)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.permits_last_30d}</div>
            <p className="text-sm text-gray-500">permits in last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Top County</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.top_counties?.[0] || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Permit Filings Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="permit_count" stroke="#3B82F6" name="Total Permits" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="approved_count" stroke="#10B981" name="Approved" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="denied_count" stroke="#EF4444" name="Denied" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recentActivity}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Counties and Formations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Counties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_counties?.slice(0, 5).map((county, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{county}</span>
                  <Badge variant="secondary">{index + 1}</Badge>
                </div>
              )) || <p className="text-sm text-gray-500">No county data available</p>}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Formations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_formations?.slice(0, 5).map((formation, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{formation}</span>
                  <Badge variant="secondary">{index + 1}</Badge>
                </div>
              )) || <p className="text-sm text-gray-500">No formation data available</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* County Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">County heatmap visualization would appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}