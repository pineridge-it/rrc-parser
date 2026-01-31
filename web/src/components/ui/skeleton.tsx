"use client";

import React from "react";

// Types for skeleton components
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  children?: React.ReactNode;
}

interface SkeletonCardProps extends SkeletonProps {
  className?: string;
}

interface SkeletonTableProps extends SkeletonProps {
  rows?: number;
  columns?: number;
}

interface SkeletonTextProps extends SkeletonProps {
  variant?: "h1" | "h2" | "h3" | "p" | "label";
  width?: string;
  lines?: number;
}

interface SkeletonFormProps extends SkeletonProps {
  fields?: number;
}

// Base skeleton component
const SkeletonBase = ({ 
  className = "",
  isLoading = true,
  children,
  ...props
}: SkeletonProps) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-shimmer ${className}`}
      style={{
        backgroundImage: "linear-gradient(to right, var(--color-surface-subtle) 0%, var(--color-surface-overlay) 20%, var(--color-surface-subtle) 40%, var(--color-surface-subtle) 100%)",
        backgroundSize: "200% 100%",
      }}
      {...props}
    />
  );
};

// Skeleton Card component for stats and feature cards
const SkeletonCard = ({ className = "", ...props }: SkeletonCardProps) => {
  return (
    <div 
      className={`rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      aria-busy="true"
      aria-label="Loading card content"
      role="status"
      {...props}
    >
      <SkeletonBase className="h-6 w-3/4 mb-4" />
      <SkeletonBase className="h-4 w-full mb-2" />
      <SkeletonBase className="h-4 w-5/6" />
    </div>
  );
};

// Skeleton Table component for data tables
const SkeletonTable = ({ 
  rows = 5, 
  columns = 4,
  className = "",
  ...props
}: SkeletonTableProps) => {
  return (
    <div 
      className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      aria-busy="true"
      aria-label="Loading table content"
      role="status"
      {...props}
    >
      {/* Table header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-4 gap-4 p-4">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonBase key={i} className="h-4" />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
        >
          <div className="grid grid-cols-4 gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonBase key={colIndex} className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton Text component for headings and paragraphs
const SkeletonText = ({ 
  variant = "p",
  width = "100%",
  lines = 1,
  className = "",
  ...props
}: SkeletonTextProps) => {
  // Determine height based on text variant
  const getHeightClass = () => {
    switch (variant) {
      case "h1": return "h-8";
      case "h2": return "h-6";
      case "h3": return "h-5";
      case "label": return "h-3";
      default: return "h-4";
    }
  };

  const heightClass = getHeightClass();
  
  return (
    <div 
      className={className}
      aria-busy="true"
      aria-label="Loading text content"
      role="status"
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase 
          key={i} 
          className={`${heightClass} ${i < lines - 1 ? "mb-2" : ""}`} 
          style={{ width: i === lines - 1 ? width : "100%" }} 
        />
      ))}
    </div>
  );
};

// Skeleton Form component for inputs
const SkeletonForm = ({ 
  fields = 3,
  className = "",
  ...props
}: SkeletonFormProps) => {
  return (
    <div 
      className={`space-y-4 ${className}`}
      aria-busy="true"
      aria-label="Loading form content"
      role="status"
      {...props}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <SkeletonBase className="h-3 w-1/4 mb-2" />
          <SkeletonBase className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
};

// Export all skeleton components
export {
  SkeletonBase,
  SkeletonCard,
  SkeletonTable,
  SkeletonText,
  SkeletonForm,
};