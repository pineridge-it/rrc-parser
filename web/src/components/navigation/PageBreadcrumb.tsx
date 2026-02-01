"use client";

import * as React from "react";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { useNavigation } from "./NavigationProvider";
import { cn } from "@/lib/utils";

interface PageBreadcrumbProps {
  /** Additional items to append to the breadcrumbs */
  additionalItems?: BreadcrumbItem[];
  /** Override the breadcrumbs entirely */
  items?: BreadcrumbItem[];
  /** Custom separator */
  separator?: React.ReactNode;
  /** Maximum number of items to show before collapsing */
  maxItems?: number;
  /** Custom className */
  className?: string;
  /** Whether to show the home link */
  showHome?: boolean;
}

/**
 * PageBreadcrumb - A breadcrumb component that integrates with the navigation context
 * 
 * Automatically generates breadcrumbs from the current pathname, or allows
 * custom items to be provided.
 */
export function PageBreadcrumb({
  additionalItems,
  items: customItems,
  separator,
  maxItems = 4,
  className,
  showHome = true,
}: PageBreadcrumbProps) {
  const { breadcrumbs, activeItem } = useNavigation();
  
  // Build breadcrumb items
  const breadcrumbItems = React.useMemo((): BreadcrumbItem[] => {
    // If custom items provided, use those
    if (customItems) return customItems;
    
    // Build from navigation breadcrumbs
    const items: BreadcrumbItem[] = breadcrumbs
      .filter((crumb, index) => {
        // Skip home if not showing
        if (index === 0 && !showHome) return false;
        return true;
      })
      .map((crumb, index, array) => ({
        label: crumb.label,
        href: index < array.length - 1 ? crumb.href : undefined, // Last item has no href
        icon: index === 0 ? undefined : undefined, // Could add home icon here
      }));
    
    // Add additional items if provided
    if (additionalItems) {
      items.push(...additionalItems);
    }
    
    return items;
  }, [breadcrumbs, customItems, additionalItems, showHome]);
  
  if (breadcrumbItems.length <= 1 && !showHome) {
    return null;
  }
  
  return (
    <Breadcrumb
      items={breadcrumbItems}
      separator={separator}
      maxItems={maxItems}
      className={cn("mb-4", className)}
    />
  );
}

/**
 * PageHeader - A page header component with integrated breadcrumb
 */
interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Actions to show in the header */
  actions?: React.ReactNode;
  /** Whether to show the breadcrumb */
  showBreadcrumb?: boolean;
  /** Custom breadcrumb items */
  breadcrumbItems?: BreadcrumbItem[];
  /** Custom className */
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  showBreadcrumb = true,
  breadcrumbItems,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {showBreadcrumb && (
        <PageBreadcrumb items={breadcrumbItems} />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
