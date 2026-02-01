"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "./usePullToRefresh";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
  className?: string;
  indicatorClassName?: string;
  renderIndicator?: (props: {
    isPulling: boolean;
    isRefreshing: boolean;
    pullDistance: number;
    canRefresh: boolean;
    progress: number;
  }) => React.ReactNode;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
  className,
  indicatorClassName,
  renderIndicator,
}: PullToRefreshProps) {
  const { containerRef, isPulling, isRefreshing, pullDistance, canRefresh } =
    usePullToRefresh({
      onRefresh,
      threshold,
      maxPull,
      disabled,
    });

  const progress = Math.min(pullDistance / threshold, 1);

  const defaultIndicator = (
    <div
      className={cn(
        "flex items-center justify-center h-16 transition-opacity duration-200",
        (isPulling || isRefreshing) ? "opacity-100" : "opacity-0",
        indicatorClassName
      )}
      style={{
        transform: `translateY(${isRefreshing ? 0 : Math.max(0, pullDistance - 64)}px)`,
      }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {isRefreshing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Refreshing...</span>
          </>
        ) : (
          <>
            <div
              className="h-5 w-5 rounded-full border-2 border-muted-foreground transition-transform duration-200"
              style={{
                transform: `rotate(${progress * 360}deg)`,
                borderTopColor: canRefresh ? "currentColor" : "transparent",
              }}
            />
            <span className="text-sm">
              {canRefresh ? "Release to refresh" : "Pull to refresh"}
            </span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-y-auto momentum-scroll",
        className
      )}
    >
      {/* Pull Indicator */}
      <div className="sticky top-0 z-10 -mb-16 pointer-events-none">
        {renderIndicator
          ? renderIndicator({
              isPulling,
              isRefreshing,
              pullDistance,
              canRefresh,
              progress,
            })
          : defaultIndicator}
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isRefreshing ? `translateY(${threshold}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
