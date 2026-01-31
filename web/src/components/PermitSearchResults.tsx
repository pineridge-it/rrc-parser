'use client'

import { useState, useMemo } from 'react'
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      case 'amendment':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'permit_number',
        header: 'Permit',
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium text-indigo-600">
              {row.original.permit_number}
            </div>
            <div className="text-xs text-gray-500">{row.original.permit_type}</div>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'operator_name',
        header: 'Operator',
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-gray-900">{row.original.operator_name}</div>
            {row.original.operator_number && (
              <div className="text-xs text-gray-500">#{row.original.operator_number}</div>
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
            <div className="text-sm text-gray-900">{row.original.lease_name || 'N/A'}</div>
            {row.original.well_number && (
              <div className="text-xs text-gray-500">Well: {row.original.well_number}</div>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'county',
        header: 'County',
        cell: ({ row }) => (
          <div className="text-sm text-gray-900">{row.original.county}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              row.original.status
            )}`}
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
          <div className="text-sm text-gray-500">
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
      <div className="bg-white rounded-lg shadow p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-500">Loading permits...</p>
        </div>
      </div>
    )
  }

  if (permits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No permits found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters to see more results.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Results Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{start}</span> to{' '}
            <span className="font-medium">{end}</span> of{' '}
            <span className="font-medium">{total}</span> results
            {selectedCount > 0 && (
              <span className="ml-2 text-indigo-600">
                ({selectedCount} selected)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2 mr-4">
              <span className="text-sm text-gray-500">{selectedCount} selected</span>
              <button
                onClick={handleBulkExport}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
              >
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          )}
          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Columns
            </button>
            {showColumnSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  {Object.entries(columnVisibility).map(([column, isVisible]) => (
                    <label
                      key={column}
                      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center ${
                          header.column.getCanSort()
                            ? 'cursor-pointer hover:text-gray-700'
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
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-indigo-500"
                          />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  row.getIsSelected() ? 'bg-indigo-50' : ''
                }`}
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
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                    page === pageNum
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
