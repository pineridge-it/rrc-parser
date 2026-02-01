"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  value: string;
  category: string;
  onRemove: () => void;
  className?: string;
}

export function FilterChip({
  label,
  value,
  category,
  onRemove,
  className,
}: FilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
        "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]",
        "border border-[var(--color-brand-primary)]/20",
        "transition-all duration-200",
        "hover:bg-[var(--color-brand-primary)]/20",
        className
      )}
    >
      <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
        {category}:
      </span>
      <span className="font-medium">{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 rounded-full hover:bg-[var(--color-brand-primary)]/20 transition-colors touch-target"
        aria-label={`Remove ${category} filter: ${label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

interface FilterChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterChipGroup({ children, className }: FilterChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}
