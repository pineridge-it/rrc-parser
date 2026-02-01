"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  className?: string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  emptyComponent?: React.ReactNode;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className,
  overscan = 5,
  onEndReached,
  endReachedThreshold = 200,
  emptyComponent,
  headerComponent,
  footerComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const { virtualItems, totalHeight, startIndex, endIndex } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    const virtualItems = items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: "absolute" as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));

    return { virtualItems, totalHeight, startIndex, endIndex };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // Check if end is reached
    if (onEndReached) {
      const scrollBottom = newScrollTop + containerHeight;
      const threshold = totalHeight - endReachedThreshold;
      if (scrollBottom >= threshold) {
        onEndReached();
      }
    }
  }, [containerHeight, totalHeight, endReachedThreshold, onEndReached]);

  // Measure container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.getBoundingClientRect().height);

    return () => resizeObserver.disconnect();
  }, []);

  if (items.length === 0 && emptyComponent) {
    return (
      <div ref={containerRef} className={cn("overflow-auto", className)}>
        {headerComponent}
        {emptyComponent}
        {footerComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn("overflow-auto momentum-scroll", className)}
    >
      {headerComponent}
      <div style={{ position: "relative", height: totalHeight }}>
        {virtualItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {footerComponent}
    </div>
  );
}

// Hook for using virtual list with dynamic item heights
interface UseVirtualListOptions {
  itemCount: number;
  estimateItemHeight: (index: number) => number;
  overscan?: number;
}

export function useVirtualList(options: UseVirtualListOptions) {
  const { itemCount, estimateItemHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const measuredHeights = useRef<Map<number, number>>(new Map());

  // Calculate item positions
  const { virtualItems, totalHeight } = useMemo(() => {
    let totalHeight = 0;
    const itemPositions: { index: number; top: number; height: number }[] = [];

    for (let i = 0; i < itemCount; i++) {
      const height = measuredHeights.current.get(i) || estimateItemHeight(i);
      itemPositions.push({ index: i, top: totalHeight, height });
      totalHeight += height;
    }

    // Find visible range
    const startIndex = Math.max(
      0,
      itemPositions.findIndex((pos) => pos.top + pos.height > scrollTop) - overscan
    );

    const endIndex = Math.min(
      itemCount,
      itemPositions.findIndex((pos) => pos.top > scrollTop + containerHeight) + overscan
    );

    const virtualItems = itemPositions
      .slice(startIndex, endIndex === -1 ? itemCount : endIndex)
      .map((pos) => ({
        index: pos.index,
        style: {
          position: "absolute" as const,
          top: pos.top,
          height: pos.height,
          left: 0,
          right: 0,
        },
      }));

    return { virtualItems, totalHeight };
  }, [itemCount, estimateItemHeight, scrollTop, containerHeight, overscan]);

  const measureItem = useCallback((index: number, height: number) => {
    measuredHeights.current.set(index, height);
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollTop,
    setScrollTop,
    containerHeight,
    setContainerHeight,
    measureItem,
  };
}
