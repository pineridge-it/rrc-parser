'use client'

import { SavedSearch } from '@/types/permit'

interface SavedSearchesProps {
  savedSearches: SavedSearch[]
  onLoad: (searchId: string) => void
  onSave: (name: string) => void
  loading: boolean
}

export function SavedSearches({ savedSearches, onLoad, onSave, loading }: SavedSearchesProps) {
  const handleSave = () => {
    const name = prompt('Enter a name for this search:')
    if (name && name.trim()) {
      onSave(name.trim())
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Saved Searches</h3>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Save Current
        </button>
      </div>

      {savedSearches.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No saved searches yet. Apply filters and save your search.
        </p>
      ) : (
        <ul className="space-y-2">
          {savedSearches.map((search) => (
            <li key={search.id}>
              <button
                onClick={() => onLoad(search.id)}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="font-medium">{search.name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(search.created_at).toLocaleDateString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
