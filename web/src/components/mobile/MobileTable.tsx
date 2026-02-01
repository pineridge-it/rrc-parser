"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface MobileTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface MobileTableProps<T> {
  data: T[];
  columns: MobileTableColumn<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  cardClassName?: string;
}

export function MobileTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  onRowClick,
  emptyState,
  cardClassName,
}: MobileTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // Columns visible on mobile (excluding those marked hideOnMobile)
  const mobileColumns = columns.filter((col) => !col.hideOnMobile);
  // Primary column (first visible one) for card header
  const primaryColumn = mobileColumns[0];
  // Secondary columns for card body
  const secondaryColumns = mobileColumns.slice(1);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "border-b border-border transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3", column.className)}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className={cn(
              "bg-card rounded-lg border border-border p-4 shadow-sm",
              onRowClick && "cursor-pointer active:scale-[0.98] transition-transform touch-feedback",
              cardClassName
            )}
            onClick={() => onRowClick?.(item)}
          >
            {/* Card Header - Primary Column */}
            {primaryColumn && (
              <div className="mb-3 pb-3 border-b border-border">
                <div className="text-sm text-muted-foreground mb-1">
                  {primaryColumn.header}
                </div>
                <div className="font-medium">
                  {primaryColumn.render(item)}
                </div>
              </div>
            )}

            {/* Card Body - Secondary Columns */}
            <div className="space-y-3">
              {secondaryColumns.map((column) => (
                <div
                  key={column.key}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-muted-foreground">
                    {column.header}
                  </span>
                  <span className={cn("text-sm", column.className)}>
                    {column.render(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple card list variant for very simple data
interface MobileCardListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  className?: string;
}

export function MobileCardList<T>({
  data,
  keyExtractor,
  renderCard,
  className,
}: MobileCardListProps<T>) {
  return (
    <div className={cn("md:hidden space-y-4", className)}>
      {data.map((item) => (
        <div key={keyExtractor(item)}>{renderCard(item)}</div>
      ))}
    </div>
  );
}
