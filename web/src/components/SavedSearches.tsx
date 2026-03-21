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
    <div className="rounded-lg p-4" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-default)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Saved Searches</h3>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded disabled:opacity-50"
          style={{ color: 'var(--color-brand-primary)', background: 'color-mix(in srgb, var(--color-brand-primary) 10%, transparent)' }}
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Save Current
        </button>
      </div>

      {savedSearches.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
          No saved searches yet. Apply filters and save your search.
        </p>
      ) : (
        <ul className="space-y-2">
          {savedSearches.map((search) => (
            <li key={search.id}>
              <button
                onClick={() => onLoad(search.id)}
                className="w-full text-left px-3 py-2 rounded-md text-sm focus:outline-none"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="font-medium">{search.name}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
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
