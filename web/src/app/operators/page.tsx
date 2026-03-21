'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { debounce } from 'lodash';
import { OperatorApiResponse } from '@/types/api';
import { formatDate } from '@/utils/date';

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  operators: OperatorApiResponse[];
  pagination: PaginationInfo;
}

const PAGE_SIZE = 25;

export default function OperatorsIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [operators, setOperators] = useState<OperatorApiResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (term: string, page: number) => {
      try {
        setLoading(true);
        setError(null);
        
        // Update URL
        const params = new URLSearchParams();
        if (term) params.set('q', term);
        if (page > 1) params.set('page', page.toString());
        router.push(`/operators?${params.toString()}`, { scroll: false });

        const response = await fetch(
          `/api/v1/operators?page=${page}&pageSize=${PAGE_SIZE}${term ? `&q=${encodeURIComponent(term)}` : ''}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch operators: ${response.statusText}`);
        }
        
        const data: ApiResponse = await response.json();
        setOperators(data.operators);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch operators');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300),
    [router]
  );

  // Fetch operators when search term or page changes
  useEffect(() => {
    debouncedSearch(searchTerm, currentPage);
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, currentPage, debouncedSearch]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle operator selection for comparison
  const handleSelectOperator = (operatorName: string) => {
    setSelectedOperators(prev => {
      if (prev.includes(operatorName)) {
        return prev.filter(name => name !== operatorName);
      } else if (prev.length < 2) {
        return [...prev, operatorName];
      }
      return prev;
    });
  };

  // Handle compare button click
  const handleCompare = () => {
    if (selectedOperators.length === 2) {
      router.push(`/operators/compare?operator1=${encodeURIComponent(selectedOperators[0])}&operator2=${encodeURIComponent(selectedOperators[1])}`);
    }
  };

  // Handle row click to navigate to operator detail page
  const handleRowClick = (operatorName: string) => {
    router.push(`/operators/${encodeURIComponent(operatorName)}`);
  };

  // Get approval rate color
  const getApprovalRateColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-500';
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render sparkline SVG
  const renderSparkline = (operator: OperatorApiResponse) => {
    // Simplified sparkline - in a real implementation, this would be generated server-side
    const points = [];
    for (let i = 0; i < 12; i++) {
      points.push(Math.floor(Math.random() * 20) + 5);
    }
    
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    
    const svgPoints = points.map((value, index) => {
      const x = (index / (points.length - 1)) * 60;
      const y = 20 - ((value - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="60" height="20" className="inline-block">
        <polyline 
          points={svgPoints} 
          fill="none" 
          stroke="#4f46e5" 
          strokeWidth="1" 
        />
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Operator Intelligence</h1>
        <p className="mt-2 text-gray-600">
          Browse and analyze drilling operators across Texas with aggregated statistics and trends.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Compare Button */}
      {selectedOperators.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleCompare}
            disabled={selectedOperators.length !== 2}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedOperators.length === 2
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Compare Selected ({selectedOperators.length}/2)
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading operators</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operators Table */}
      {!loading && !error && (
        <>
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <span className="sr-only">Select</span>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Operator
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Permits
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approval Rate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Most Active County
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Filing
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {operators.map((operator) => (
                        <tr 
                          key={operator.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(operator.canonicalName)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOperators.includes(operator.canonicalName)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectOperator(operator.canonicalName);
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{operator.canonicalName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{operator.permitCount?.toLocaleString() || '0'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${getApprovalRateColor(operator.approvalRate)}`}>
                              {operator.approvalRate !== null ? `${operator.approvalRate.toFixed(1)}%` : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {/* In a real implementation, this would come from the API */}
                            <div className="text-sm text-gray-500">Midland</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {operator.lastFilingDate ? formatDate(operator.lastFilingDate) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderSparkline(operator)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && operators.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No operators found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by searching for operators.'}
          </p>
        </div>
      )}
    </div>
  );
}