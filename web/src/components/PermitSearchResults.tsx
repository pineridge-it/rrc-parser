'use client'

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
  type ColumnResizeMode,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, GripVertical, Settings2 } from 'lucide-react'
import { Permit } from '@/types/permit'

interface PermitSearchResultsProps {
  permits: Permit[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
}

// Column visibility state type
type ColumnVisibility = {
  permit_number: boolean
  operator_name: boolean
  lease_name: boolean
  county: boolean
  status: boolean
  filed_date: boolean
  annotation_tags: boolean
  annotation_custom_status: boolean
}

export function PermitSearchResults({
  permits,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
}: PermitSearchResultsProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    permit_number: true,
    operator_name: true,
    lease_name: true,
    county: true,
    status: true,
    filed_date: true,
    annotation_tags: false,
    annotation_custom_status: false,
  })
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange')

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status.toLowerCase()) {
      case 'approved':
        return { color: 'var(--color-success)', background: 'color-mix(in srgb, var(--color-success) 12%, transparent)' }
      case 'pending':
        return { color: 'var(--color-warning)', background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)' }
      case 'denied':
        return { color: 'var(--color-error)', background: 'color-mix(in srgb, var(--color-error) 12%, transparent)' }
      case 'amendment':
        return { color: 'var(--color-info)', background: 'color-mix(in srgb, var(--color-info) 12%, transparent)' }
      default:
        return { color: 'var(--color-text-secondary)', background: 'var(--color-surface-subtle)' }
    }
  }

  // Define columns
  const columns = useMemo<ColumnDef<Permit>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            style={{ accentColor: 'var(--color-brand-primary)' }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            style={{ accentColor: 'var(--color-brand-primary)' }}
          />
        ),
        size: 40,
        enableResizing: false,
      },
      {
        accessorKey: 'permit_number',
        header: 'Permit #',
        cell: ({ getValue }) => <div className="font-medium">{getValue<string>()}</div>,
        size: 120,
      },
      {
        accessorKey: 'operator_name',
        header: 'Operator',
        cell: ({ getValue }) => <div>{getValue<string>() || 'N/A'}</div>,
        size: 150,
      },
      {
        accessorKey: 'lease_name',
        header: 'Lease Name',
        cell: ({ getValue }) => <div>{getValue<string>() || 'N/A'}</div>,
        size: 150,
      },
      {
        accessorKey: 'county',
        header: 'County',
        cell: ({ getValue }) => <div>{getValue<string>() || 'N/A'}</div>,
        size: 120,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue<string>()
          return (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={getStatusStyle(status)}
            >
              {status || 'N/A'}
            </span>
          )
        },
        size: 100,
      },
      {
        accessorKey: 'filed_date',
        header: 'Filed Date',
        cell: ({ getValue }) => <div>{formatDate(getValue<string>())}</div>,
        size: 120,
      },
      // Annotation columns (hidden by default)
      {
        accessorKey: 'annotation_tags',
        header: 'Tags',
        cell: ({ getValue }) => {
          const tags = getValue<string[]>() || []
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )
        },
        size: 150,
        enableHiding: true,
      },
      {
        accessorKey: 'annotation_custom_status',
        header: 'Custom Status',
        cell: ({ getValue }) => {
          const status = getValue<string>()
          if (!status) return null
          return (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface-subtle)' }}
            >
              {status}
            </span>
          )
        },
        size: 120,
        enableHiding: true,
      },
        cell: ({ row }) => (
          <div>
            <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.original.operator_name}</div>
            {row.original.operator_number && (
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>#{row.original.operator_number}</div>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'lease_name',
        header: 'Lease / Well',
        cell: ({ row }) => (
          <div>
            <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.original.lease_name || 'N/A'}</div>
            {row.original.well_number && (
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Well: {row.original.well_number}</div>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'county',
        header: 'County',
        cell: ({ row }) => (
          <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{row.original.county}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            style={{
              display: 'inline-flex',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: '9999px',
              ...getStatusStyle(row.original.status)
            }}
          >
            {row.original.status}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'filed_date',
        header: 'Filed Date',
        cell: ({ row }) => (
          <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {formatDate(row.original.filed_date)}
          </div>
        ),
        enableSorting: true,
      },
    ],
    []
  )

  // Filter columns based on visibility
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (col.id === 'select') return true
      const accessorKey = (col as { accessorKey?: string }).accessorKey
      if (accessorKey && accessorKey in columnVisibility) {
        return columnVisibility[accessorKey as keyof ColumnVisibility] !== false
      }
      return true
    })
  }, [columns, columnVisibility])

  const table = useReactTable({
    data: permits,
    columns: visibleColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection: Object.fromEntries(
        Array.from(selectedRows).map((id) => [id, true])
      ),
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function' 
        ? updater(columnVisibility) 
        : updater
      setColumnVisibility(newVisibility as ColumnVisibility)
    },
    onRowSelectionChange: (updater) => {
      if (typeof updater === 'function') {
        const newSelection = updater(
          Object.fromEntries(Array.from(selectedRows).map((id) => [id, true]))
        )
        setSelectedRows(new Set(Object.keys(newSelection).filter((k) => newSelection[k])))
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode,
  })

  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const selectedCount = selectedRows.size

  // Bulk actions handler
  const handleBulkExport = () => {
    const selectedPermits = permits.filter((p) => selectedRows.has(p.id))
    console.log('Exporting:', selectedPermits)
    // TODO: Implement actual export functionality
  }

  const handleBulkDelete = () => {
    console.log('Deleting:', Array.from(selectedRows))
    // TODO: Implement actual delete functionality
    setSelectedRows(new Set())
  }

  if (loading) {
    return (
      <div className="rounded-lg p-12" style={{ background: 'var(--color-surface-raised)' }}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12" style={{ borderBottom: '2px solid var(--color-brand-primary)' }}></div>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading permits...</p>
        </div>
      </div>
    )
  }

  if (permits.length === 0) {
    return (
      <div className="rounded-lg p-12" style={{ background: 'var(--color-surface-raised)' }}>
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12"
            style={{ color: 'var(--color-text-tertiary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>No permits found</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Try adjusting your filters to see more results.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-default)' }}>
      {/* Results Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Showing <span className="font-medium">{start}</span> to{' '}
            <span className="font-medium">{end}</span> of{' '}
            <span className="font-medium">{total}</span> results
            {selectedCount > 0 && (
              <span className="ml-2" style={{ color: 'var(--color-brand-primary)' }}>
                ({selectedCount} selected)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2 mr-4">
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{selectedCount} selected</span>
              <button
                onClick={handleBulkExport}
                className="px-3 py-1.5 text-sm font-medium rounded-md"
                style={{ color: 'var(--color-brand-primary)', background: 'color-mix(in srgb, var(--color-brand-primary) 8%, transparent)' }}
              >
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-sm font-medium rounded-md"
                style={{ color: 'var(--color-error)', background: 'color-mix(in srgb, var(--color-error) 8%, transparent)' }}
              >
                Delete
              </button>
            </div>
          )}
          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md"
              style={{ border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)' }}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Columns
            </button>
            {showColumnSettings && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-default)' }}>
                <div className="py-1">
                  {Object.entries(columnVisibility).map(([column, isVisible]) => (
                    <label
                      key={column}
                      className="flex items-center px-4 py-2 cursor-pointer"
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) =>
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [column]: e.target.checked,
                          }))
                        }
                        className="rounded mr-2"
                        style={{ accentColor: 'var(--color-brand-primary)' }}
                      />
                      <span className="text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                        {column.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
          <thead className="sticky top-0 z-10" style={{ background: 'var(--color-surface-subtle)' }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider select-none"
                    style={{
                      color: 'var(--color-text-tertiary)',
                      width: header.getSize(),
                      borderBottom: '1px solid var(--color-border-default)',
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center ${
                          header.column.getCanSort()
                            ? 'cursor-pointer'
                            : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <div className="w-4 h-4 opacity-0 group-hover:opacity-50">
                                <ChevronUp className="w-4 h-4" />
                              </div>
                            )}
                          </span>
                        )}
                        {/* Resize handle */}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                            style={{ background: 'var(--color-brand-primary)', opacity: 0 }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                          />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer transition-colors"
                style={{
                  background: row.getIsSelected() ? 'color-mix(in srgb, var(--color-brand-primary) 6%, transparent)' : undefined,
                  borderBottom: '1px solid var(--color-border-default)',
                }}
                onMouseEnter={e => { if (!row.getIsSelected()) e.currentTarget.style.background = 'var(--color-surface-subtle)' }}
                onMouseLeave={e => { if (!row.getIsSelected()) e.currentTarget.style.background = '' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border-default)' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)' }}
          >
            Previous
          </button>
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md"
                  style={page === pageNum ? {
                    border: '1px solid var(--color-brand-primary)',
                    color: 'var(--color-brand-primary)',
                    background: 'color-mix(in srgb, var(--color-brand-primary) 8%, transparent)',
                  } : {
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface-raised)',
                  }}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
