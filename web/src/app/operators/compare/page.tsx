'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
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

export default function OperatorComparisonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [operator1, setOperator1] = useState<string>(searchParams.get('operator1') || '');
  const [operator2, setOperator2] = useState<string>(searchParams.get('operator2') || '');
  const [stats1, setStats1] = useState<OperatorStats | null>(null);
  const [stats2, setStats2] = useState<OperatorStats | null>(null);
  const [monthlyData1, setMonthlyData1] = useState<MonthlyPermits[]>([]);
  const [monthlyData2, setMonthlyData2] = useState<MonthlyPermits[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data for both operators
  useEffect(() => {
    const fetchData = async () => {
      if (!operator1 || !operator2) return;

      try {
        setLoading(true);
        setError(null);

        // Update URL params
        const newParams = new URLSearchParams();
        newParams.set('operator1', operator1);
        newParams.set('operator2', operator2);
        router.replace(`/operators/compare?${newParams.toString()}`, { scroll: false });

        // Fetch data for both operators in parallel
        const [statsRes1, statsRes2, monthlyRes1, monthlyRes2] = await Promise.all([
          fetch(`/api/v1/operators/stats?operatorName=${encodeURIComponent(operator1)}`),
          fetch(`/api/v1/operators/stats?operatorName=${encodeURIComponent(operator2)}`),
          fetch(`/api/v1/operators/${encodeURIComponent(operator1)}/permits-by-month`),
          fetch(`/api/v1/operators/${encodeURIComponent(operator2)}/permits-by-month`)
        ]);

        if (!statsRes1.ok || !statsRes2.ok) {
          throw new Error('Failed to fetch operator stats');
        }

        const statsData1 = await statsRes1.json();
        const statsData2 = await statsRes2.json();
        setStats1(statsData1.stats);
        setStats2(statsData2.stats);

        if (!monthlyRes1.ok || !monthlyRes2.ok) {
          throw new Error('Failed to fetch monthly permits data');
        }

        const monthlyData1 = await monthlyRes1.json();
        const monthlyData2 = await monthlyRes2.json();
        setMonthlyData1(monthlyData1.permits);
        setMonthlyData2(monthlyData2.permits);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operator data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [operator1, operator2, router]);

  // Handle comparison
  const handleCompare = () => {
    if (operator1 && operator2) {
      // Data will be fetched by the useEffect hook
    }
  };

  // Prepare combined data for charts
  const prepareCombinedMonthlyData = () => {
    if (!monthlyData1.length || !monthlyData2.length) return [];

    // Merge data by month
    const combinedData: any[] = [];
    const months = new Set([...monthlyData1.map(d => d.month), ...monthlyData2.map(d => d.month)]);

    months.forEach(month => {
      const data1 = monthlyData1.find(d => d.month === month);
      const data2 = monthlyData2.find(d => d.month === month);

      combinedData.push({
        month,
        [`${operator1}_permits`]: data1?.permit_count || 0,
        [`${operator2}_permits`]: data2?.permit_count || 0,
        [`${operator1}_approved`]: data1?.approved_count || 0,
        [`${operator2}_approved`]: data2?.approved_count || 0,
      });
    });

    // Sort by month
    return combinedData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const combinedMonthlyData = prepareCombinedMonthlyData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Operator Comparison</h1>
        <p className="mt-2 text-gray-600">
          Compare two operators side-by-side to analyze their permit activity and trends.
        </p>
      </div>

      {/* Operator Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Operators to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="operator1" className="block text-sm font-medium text-gray-700 mb-1">
                First Operator
              </label>
              <Input
                id="operator1"
                value={operator1}
                onChange={(e) => setOperator1(e.target.value)}
                placeholder="Enter operator name"
              />
            </div>
            <div>
              <label htmlFor="operator2" className="block text-sm font-medium text-gray-700 mb-1">
                Second Operator
              </label>
              <Input
                id="operator2"
                value={operator2}
                onChange={(e) => setOperator2(e.target.value)}
                placeholder="Enter operator name"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleCompare}
              disabled={!operator1 || !operator2 || loading}
            >
              Compare Operators
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Operator Data</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
        </div>
      )}

      {stats1 && stats2 && (
        <>
          {/* Stats Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{stats1.operator_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Permits</span>
                    <span className="font-medium">{stats1.total_permits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approval Rate</span>
                    <span className="font-medium">
                      {stats1.approval_rate_pct !== null ? `${stats1.approval_rate_pct.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recent Activity (30d)</span>
                    <span className="font-medium">{stats1.permits_last_30d}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top County</span>
                    <span className="font-medium">{stats1.top_counties?.[0] || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{stats2.operator_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Permits</span>
                    <span className="font-medium">{stats2.total_permits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approval Rate</span>
                    <span className="font-medium">
                      {stats2.approval_rate_pct !== null ? `${stats2.approval_rate_pct.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recent Activity (30d)</span>
                    <span className="font-medium">{stats2.permits_last_30d}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top County</span>
                    <span className="font-medium">{stats2.top_counties?.[0] || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Comparison Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Permit Filings Over Time Comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedMonthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={`${operator1}_permits`}
                    stroke="#3B82F6"
                    name={`${stats1.operator_name} Total Permits`}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${operator2}_permits`}
                    stroke="#10B981"
                    name={`${stats2.operator_name} Total Permits`}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Approval Rate Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{stats1.operator_name} - Permit Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Approved', count: stats1.approved_count },
                      { name: 'Denied', count: stats1.denied_count },
                      { name: 'Pending', count: stats1.pending_count },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{stats2.operator_name} - Permit Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Approved', count: stats2.approved_count },
                      { name: 'Denied', count: stats2.denied_count },
                      { name: 'Pending', count: stats2.pending_count },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
          <h2 className="text-xl font-bold text-gray-900 mb-4">{operator2.operator.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            <KPICard
              title="Total Permits"
              value={formatNumber(operator2.kpiCards.totalPermits)}
              highlight={totalPermitsDiff < 0}
            />
            <KPICard
              title="Approval Rate"
              value={operator2.kpiCards.approvalRate !== null ? `${operator2.kpiCards.approvalRate.toFixed(1)}%` : 'N/A'}
              highlight={approvalRateDiff < 0}
            />
            <KPICard
              title="Counties Active"
              value={formatNumber(operator2.kpiCards.countiesActive)}
              highlight={countiesActiveDiff < 0}
            />
            <KPICard
              title="Last Filing"
              value={formatDate(operator2.kpiCards.lastFilingDate)}
            />
          </div>
        </div>
      </div>

      {/* Difference Highlights */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Key Differences</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Total Permits</span>
            <ComparisonBadge 
              operator1Value={operator1.kpiCards.totalPermits} 
              operator2Value={operator2.kpiCards.totalPermits} 
              label="more permits" 
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Approval Rate</span>
            <ComparisonBadge 
              operator1Value={operator1.kpiCards.approvalRate || 0} 
              operator2Value={operator2.kpiCards.approvalRate || 0} 
              label="higher approval" 
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Counties Active</span>
            <ComparisonBadge 
              operator1Value={operator1.kpiCards.countiesActive} 
              operator2Value={operator2.kpiCards.countiesActive} 
              label="more counties" 
            />
          </div>
        </div>
      </div>

      {/* Chart Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Filing Trend Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filing Trend</h3>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would appear here in a full implementation</p>
          </div>
        </div>

        {/* Top Counties Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Counties</h3>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">County visualization would appear here in a full implementation</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => router.push('/operators')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Operators
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams();
            params.set('operator1', operator2Name);
            params.set('operator2', operator1Name);
            router.push(`/operators/compare?${params.toString()}`);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Swap Operators
        </button>
      </div>
    </div>
  );
}