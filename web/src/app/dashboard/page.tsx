'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermitSearch } from '@/hooks/usePermitSearch'
import { PermitSearchFilters } from '@/components/PermitSearchFilters'
import { PermitSearchResults } from '@/components/PermitSearchResults'
import { SavedSearches } from '@/components/SavedSearches'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const {
    permits,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setFilters,
    search,
    resetFilters,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    filterOptions,
    loadingOptions,
  } = usePermitSearch()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Texas Drilling Permit Alerts
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Permit Search</h2>
            <p className="mt-1 text-sm text-gray-500">
              Search and filter drilling permits across Texas
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <PermitSearchFilters
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
                loadingOptions={loadingOptions}
                onSearch={() => search(1)}
                onReset={resetFilters}
              />
              <SavedSearches
                savedSearches={savedSearches}
                onLoad={loadSavedSearch}
                onSave={saveSearch}
                loading={loading}
              />
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <PermitSearchResults
                permits={permits}
                total={total}
                page={page}
                pageSize={pageSize}
                loading={loading}
                onPageChange={search}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
