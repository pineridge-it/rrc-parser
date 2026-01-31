"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  /** Maximum number of items to show before collapsing */
  maxItems?: number;
  /** Number of items to show at the start when collapsed */
  itemsBeforeCollapse?: number;
  /** Number of items to show at the end when collapsed */
  itemsAfterCollapse?: number;
  /** Custom renderer for collapsed indicator */
  renderCollapse?: (onExpand: () => void) => React.ReactNode;
}

// ============================================
// Icons
// ============================================

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const SlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 2 2 22" />
  </svg>
);

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MoreHorizontalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

// ============================================
// Breadcrumb Item Component
// ============================================

interface BreadcrumbItemProps {
  item: BreadcrumbItem;
  isLast: boolean;
  isFirst: boolean;
  index: number;
}

function BreadcrumbItemComponent({ item, isLast, isFirst, index }: BreadcrumbItemProps) {
  const content = (
    <>
      {isFirst && !item.icon && <HomeIcon />}
      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
      <span className={cn(isFirst && !item.icon && "sr-only")}>{item.label}</span>
    </>
  );

  if (isLast) {
    return (
      <li
        className="flex items-center gap-1.5 text-[var(--color-text-primary)] font-medium"
        aria-current="page"
      >
        {content}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1.5">
      {item.href ? (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-1.5 text-[var(--color-text-secondary)]",
            "hover:text-[var(--color-brand-primary)] transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]",
            "focus-visible:ring-offset-2 rounded-sm"
          )}
          aria-label={`Go to ${item.label}`}
        >
          {content}
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          {content}
        </span>
      )}
    </li>
  );
}

// ============================================
// Collapsed Items Component
// ============================================

interface CollapsedItemsProps {
  hiddenItems: BreadcrumbItem[];
  onExpand: () => void;
}

function CollapsedItems({ hiddenItems, onExpand }: CollapsedItemsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLLIElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <li className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md",
          "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-hover)] transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]",
          "focus-visible:ring-offset-2"
        )}
        aria-label="Show more navigation items"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreHorizontalIcon />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full mt-1 z-50",
            "min-w-[200px] py-1 rounded-lg",
            "bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)]",
            "shadow-lg shadow-black/5"
          )}
          role="menu"
        >
          {hiddenItems.map((item, index) => (
            <div key={index} role="none">
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "block px-4 py-2 text-sm",
                    "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                    "hover:bg-[var(--color-surface-hover)] transition-colors"
                  )}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && (
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </Link>
              ) : (
                <span
                  className="block px-4 py-2 text-sm text-[var(--color-text-muted)]"
                  role="menuitem"
                  aria-disabled="true"
                >
                  {item.icon && (
                    <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

// ============================================
// Main Breadcrumb Component
// ============================================

export function Breadcrumb({
  items,
  separator = <ChevronRightIcon />,
  className,
  maxItems = 5,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 1,
  renderCollapse,
}: BreadcrumbProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Don't collapse if there are fewer items than maxItems
  const shouldCollapse = items.length > maxItems && !isExpanded;

  // Calculate visible and hidden items
  let visibleItems: BreadcrumbItem[];
  let hiddenItems: BreadcrumbItem[] = [];

  if (shouldCollapse) {
    const startIndex = itemsBeforeCollapse;
    const endIndex = items.length - itemsAfterCollapse;
    hiddenItems = items.slice(startIndex, endIndex);
    visibleItems = [
      ...items.slice(0, itemsBeforeCollapse),
      ...items.slice(endIndex),
    ];
  } else {
    visibleItems = items;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("w-full", className)}
    >
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1.5",
          "text-sm text-[var(--color-text-secondary)]"
        )}
      >
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isFirst = index === 0;
          const isCollapsedIndicator =
            shouldCollapse && index === itemsBeforeCollapse;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <li
                  className="flex items-center text-[var(--color-text-muted)]"
                  aria-hidden="true"
                >
                  {separator}
                </li>
              )}

              {isCollapsedIndicator ? (
                renderCollapse ? (
                  renderCollapse(() => setIsExpanded(true))
                ) : (
                  <CollapsedItems
                    hiddenItems={hiddenItems}
                    onExpand={() => setIsExpanded(true)}
                  />
                )
              ) : (
                <BreadcrumbItemComponent
                  item={item}
                  isLast={isLast}
                  isFirst={isFirst}
                  index={index}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================
// Page Header with Breadcrumb
// ============================================

export interface PageHeaderProps {
  breadcrumb?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "pb-6 mb-6 border-b border-[var(--color-border-default)]",
        className
      )}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          {title && (
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-[var(--color-text-secondary)]">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Hook for generating breadcrumbs from pathname
// ============================================

export function useBreadcrumbsFromPath(
  pathname: string,
  labelMap: Record<string, string> = {}
): BreadcrumbItem[] {
  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/", icon: <HomeIcon /> },
    ];

    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = labelMap[segment] ||
        segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  }, [pathname, labelMap]);
}

// ============================================
// Export types
// ============================================

export type { BreadcrumbProps as BreadcrumbType };
