"use client";

import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface FilterSearchProps<T> {
  items: T[];
  searchFields: (keyof T)[];
  renderItem: (item: T, isHighlighted: boolean) => React.ReactNode;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
  maxHeight?: string;
}

export function FilterSearch<T>({
  items,
  searchFields,
  renderItem,
  placeholder = "Search...",
  className,
  emptyMessage = "No results found",
  maxHeight = "200px",
}: FilterSearchProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        return false;
      })
    );
  }, [items, searchQuery, searchFields]);

  const highlightMatch = (text: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    const query = searchQuery.toLowerCase();
    const index = text.toLowerCase().indexOf(query);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <mark className="bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] font-medium rounded px-0.5">
          {text.slice(index, index + query.length)}
        </mark>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-placeholder)]" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[var(--color-surface-subtle)] transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          </button>
        )}
      </div>

      <div
        className="border border-[var(--color-border-default)] rounded-md overflow-y-auto momentum-scroll"
        style={{ maxHeight }}
      >
        {filteredItems.length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
            {emptyMessage}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredItems.map((item, index) => (
              <div key={index}>
                {renderItem(item, !!searchQuery.trim())}
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredItems.length !== items.length && (
        <div className="text-xs text-[var(--color-text-tertiary)]">
          Showing {filteredItems.length} of {items.length}
        </div>
      )}
    </div>
  );
}

// Hook for debounced search
export function useDebouncedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  delay: number = 300
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchQuery, delay]);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items;

    const query = debouncedQuery.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        return false;
      })
    );
  }, [items, debouncedQuery, searchFields]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    filteredItems,
  };
}
