/**
 * Data Table Component
 * Enhanced table with sorting, filtering, and bulk actions
 * WCAG 2.1 AA Compliant
 * 
 * @module components/ui/data-table
 */

"use client";

import React, { useState, useMemo, useCallback, useId } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";
import { Button } from "./button";
import { Badge } from "./badge";
import { Input } from "./input";
import { Select, SelectOption } from "./select";

// ============================================================================
// Types
// ============================================================================

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterConfig {
  key: string;
  value: string;
  operator?: "contains" | "equals" | "startsWith" | "endsWith";
}

export interface Column<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select" | "date" | "status";
  filterOptions?: { label: string; value: string }[];
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface BulkAction<T = any> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onClick: (selectedRows: T[]) => void;
  disabled?: (selectedRows: T[]) => boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  bulkActions?: BulkAction<T>[];
  defaultSort?: SortConfig;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  stickyHeader?: boolean;
  "aria-label"?: string;
}

// ============================================================================
// Icons
// ============================================================================

const SortIcon = ({ direction }: { direction: SortDirection }) => {
  if (!direction) {
    return (
      <svg className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-50 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return direction === "asc" ? (
    <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function filterRow<T>(row: T, columns: Column<T>[], filters: FilterConfig[]): boolean {
  return filters.every((filter) => {
    const column = columns.find((c) => c.key === filter.key);
    if (!column) return true;

    const value = column.accessor
      ? column.accessor(row)
      : getNestedValue(row, filter.key);

    const stringValue = String(value ?? "").toLowerCase();
    const filterValue = filter.value.toLowerCase();

    switch (filter.operator || "contains") {
      case "equals":
        return stringValue === filterValue;
      case "startsWith":
        return stringValue.startsWith(filterValue);
      case "endsWith":
        return stringValue.endsWith(filterValue);
      case "contains":
      default:
        return stringValue.includes(filterValue);
    }
  });
}

function sortData<T>(data: T[], sort: SortConfig, columns: Column<T>[]): T[] {
  if (!sort.direction) return data;

  const column = columns.find((c) => c.key === sort.key);
  if (!column) return data;

  return [...data].sort((a, b) => {
    const aValue = column.accessor
      ? column.accessor(a)
      : getNestedValue(a, sort.key);
    const bValue = column.accessor
      ? column.accessor(b)
      : getNestedValue(b, sort.key);

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }

    return sort.direction === "asc" ? comparison : -comparison;
  });
}

// ============================================================================
// DataTable Component
// ============================================================================

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  bulkActions,
  defaultSort,
  searchable = true,
  searchPlaceholder = "Search...",
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  emptyMessage = "No data available",
  loading = false,
  onRowClick,
  selectable = true,
  stickyHeader = false,
  "aria-label": ariaLabel,
}: DataTableProps<T>) {
  const tableId = useId();
  
  // State
  const [sort, setSort] = useState<SortConfig>(defaultSort || { key: "", direction: null });
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleFilters, setVisibleFilters] = useState<Set<string>>(new Set());

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply global search
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = col.accessor
            ? col.accessor(row)
            : getNestedValue(row, col.key);
          return String(value ?? "").toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply column filters
    if (filters.length > 0) {
      result = result.filter((row) => filterRow(row, columns, filters));
    }

    // Apply sorting
    if (sort.direction) {
      result = sortData(result, sort, columns);
    }

    return result;
  }, [data, columns, globalSearch, filters, sort]);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedData.map((row) => keyExtractor(row))));
    }
  }, [processedData, selectedRows, keyExtractor]);

  const handleSelectRow = useCallback(
    (row: T) => {
      const key = keyExtractor(row);
      const newSelected = new Set(selectedRows);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      setSelectedRows(newSelected);
    },
    [selectedRows, keyExtractor]
  );

  const selectedData = useMemo(
    () => data.filter((row) => selectedRows.has(keyExtractor(row))),
    [data, selectedRows, keyExtractor]
  );

  // Sort handlers
  const handleSort = useCallback((key: string) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "asc"
            ? "desc"
            : current.direction === "desc"
            ? null
            : "asc"
          : "asc",
    }));
  }, []);

  // Filter handlers
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((current) => {
      const existing = current.find((f) => f.key === key);
      if (!value) {
        return current.filter((f) => f.key !== key);
      }
      if (existing) {
        return current.map((f) => (f.key === key ? { ...f, value } : f));
      }
      return [...current, { key, value, operator: "contains" }];
    });
  }, []);

  const toggleFilter = useCallback((key: string) => {
    setVisibleFilters((current) => {
      const newSet = new Set(current);
      if (newSet.has(key)) {
        newSet.delete(key);
        // Clear filter when hiding
        setFilters((f) => f.filter((filter) => filter.key !== key));
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setGlobalSearch("");
    setVisibleFilters(new Set());
  }, []);

  const hasActiveFilters = filters.length > 0 || globalSearch !== "";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        {searchable && (
          <div className="relative w-full sm:w-72">
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10"
              aria-label="Search table"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              <SearchIcon />
            </span>
          </div>
        )}

        {/* Bulk Actions */}
        {selectable && bulkActions && selectedRows.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              {selectedRows.size} selected
            </span>
            <div className="flex gap-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || "primary"}
                  size="sm"
                  onClick={() => action.onClick(selectedData)}
                  disabled={action.disabled?.(selectedData)}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      {columns.some((c) => c.filterable) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary flex items-center gap-1">
            <FilterIcon />
            Filters:
          </span>
          {columns
            .filter((c) => c.filterable)
            .map((column) => (
              <Button
                key={column.key}
                variant={visibleFilters.has(column.key) ? "primary" : "outline"}
                size="sm"
                onClick={() => toggleFilter(column.key)}
              >
                {column.header}
              </Button>
            ))}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-text-tertiary"
            >
              <ClearIcon />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Active Filter Inputs */}
      {visibleFilters.size > 0 && (
        <div className="flex flex-wrap gap-4 p-4 bg-surface-subtle rounded-lg">
          {columns
            .filter((c) => c.filterable && visibleFilters.has(c.key))
            .map((column) => {
              const currentValue = filters.find((f) => f.key === column.key)?.value || "";
              
              if (column.filterType === "select" && column.filterOptions) {
                const selectOptions: SelectOption[] = [
                  { value: "", label: "All" },
                  ...column.filterOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })),
                ];
                
                return (
                  <div key={column.key} className="flex flex-col gap-1">
                    <label className="text-xs text-text-secondary">{column.header}</label>
                    <Select
                      options={selectOptions}
                      value={currentValue}
                      onChange={(value) => handleFilterChange(column.key, value as string)}
                      placeholder={`All ${column.header}`}
                      className="w-40"
                    />
                  </div>
                );
              }
              
              return (
                <div key={column.key} className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">{column.header}</label>
                  <Input
                    type={column.filterType === "date" ? "date" : "text"}
                    placeholder={`Filter ${column.header}...`}
                    value={currentValue}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    className="w-40"
                  />
                </div>
              );
            })}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className={cn("w-full text-sm", tableClassName)}
            aria-label={ariaLabel}
            id={tableId}
          >
            <thead
              className={cn(
                "bg-surface-subtle border-b border-border",
                stickyHeader && "sticky top-0 z-10",
                headerClassName
              )}
            >
              <tr>
                {selectable && (
                  <th className="px-4 py-3 w-12">
                    <Checkbox
                      checked={
                        processedData.length > 0 &&
                        selectedRows.size === processedData.length
                      }
                      indeterminate={
                        selectedRows.size > 0 &&
                        selectedRows.size < processedData.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left font-medium text-text-secondary",
                      column.sortable && "cursor-pointer select-none group",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                    aria-sort={
                      sort.key === column.key
                        ? sort.direction === "asc"
                          ? "ascending"
                          : sort.direction === "desc"
                          ? "descending"
                          : "none"
                        : undefined
                    }
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end"
                      )}
                    >
                      {column.header}
                      {column.sortable && (
                        <SortIcon direction={sort.key === column.key ? sort.direction : null} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-8 text-center text-text-secondary"
                  >
                    Loading...
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-8 text-center text-text-secondary"
                  >
                    {hasActiveFilters ? "No matching results" : emptyMessage}
                  </td>
                </tr>
              ) : (
                processedData.map((row, index) => {
                  const rowKey = keyExtractor(row);
                  const isSelected = selectedRows.has(rowKey);
                  
                  return (
                    <tr
                      key={rowKey}
                      className={cn(
                        "border-b border-border-subtle last:border-b-0 transition-colors",
                        isSelected && "bg-brand/5",
                        onRowClick && "cursor-pointer hover:bg-surface-subtle",
                        rowClassName
                      )}
                      onClick={() => onRowClick?.(row)}
                      role={onRowClick ? "button" : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }}
                      aria-rowindex={index + 1}
                    >
                      {selectable && (
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(row)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </td>
                      )}
                      {columns.map((column) => {
                        const value = column.accessor
                          ? column.accessor(row)
                          : getNestedValue(row, column.key);
                        
                        return (
                          <td
                            key={column.key}
                            className={cn(
                              "px-4 py-3",
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right",
                              column.className
                            )}
                          >
                            {column.render
                              ? column.render(value, row)
                              : value ?? "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>
          Showing {processedData.length} of {data.length} results
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Status Badge Helper
// ============================================================================

export function StatusBadge({
  status,
  mapping,
}: {
  status: string;
  mapping: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" | "low" | "medium" | "high" | "critical" }>;
}) {
  const config = mapping[status] || { label: status, variant: "neutral" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default DataTable;
