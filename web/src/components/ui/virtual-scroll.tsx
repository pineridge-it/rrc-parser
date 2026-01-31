"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  className?: string;
  containerHeight?: number | string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  isLoading?: boolean;
}

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  itemWidth: number;
  className?: string;
  containerHeight?: number | string;
  gap?: number;
  overscan?: number;
  emptyComponent?: React.ReactNode;
}

// ============================================
// Virtual List Component
// ============================================

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className,
  containerHeight = 400,
  overscan = 5,
  onEndReached,
  endReachedThreshold = 100,
  emptyComponent,
  loadingComponent,
  isLoading,
}: VirtualListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const containerHeightNum = typeof containerHeight === "number" 
    ? containerHeight 
    : parseInt(containerHeight, 10) || 400;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeightNum / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  // Handle scroll
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // Check if end is reached
    if (onEndReached) {
      const scrollBottom = newScrollTop + containerHeightNum;
      const threshold = totalHeight - endReachedThreshold;
      if (scrollBottom >= threshold) {
        onEndReached();
      }
    }
  }, [containerHeightNum, totalHeight, endReachedThreshold, onEndReached]);

  // Measure container
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  if (items.length === 0 && !isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          className
        )}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <p className="text-[var(--color-text-secondary)]">No items</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
      {isLoading && loadingComponent}
    </div>
  );
}

// ============================================
// Virtual Grid Component
// ============================================

export function VirtualGrid<T>({
  items,
  renderItem,
  itemHeight,
  itemWidth,
  className,
  containerHeight = 400,
  gap = 16,
  overscan = 2,
  emptyComponent,
}: VirtualGridProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Calculate columns
  const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap) - gap;

  // Calculate visible range
  const containerHeightNum = typeof containerHeight === "number" 
    ? containerHeight 
    : parseInt(containerHeight, 10) || 400;

  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const visibleRows = Math.ceil(containerHeightNum / (itemHeight + gap)) + overscan * 2;
  const endRow = Math.min(rows, startRow + visibleRows);

  const startIndex = startRow * columns;
  const endIndex = Math.min(items.length, endRow * columns);
  const visibleItems = items.slice(startIndex, endIndex);

  const offsetY = startRow * (itemHeight + gap);

  // Handle scroll
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Measure container
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          className
        )}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <p className="text-[var(--color-text-secondary)]">No items</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          className="grid"
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
            gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
            gap: `${gap}px`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Window Virtual List (uses window scroll)
// ============================================

interface WindowVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  className?: string;
  overscan?: number;
  emptyComponent?: React.ReactNode;
}

export function WindowVirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className,
  overscan = 5,
  emptyComponent,
}: WindowVirtualListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerTop, setContainerTop] = React.useState(0);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor((scrollTop - containerTop) / itemHeight) - overscan);
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const visibleCount = Math.ceil(windowHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  // Handle window scroll
  React.useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Measure container position
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updatePosition = () => {
      const rect = container.getBoundingClientRect();
      setContainerTop(rect.top + window.scrollY);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        {emptyComponent || (
          <p className="text-[var(--color-text-secondary)]">No items</p>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <div style={{ height: items.length * itemHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
