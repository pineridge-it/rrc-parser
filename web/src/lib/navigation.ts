import { ReactNode } from "react";

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number | string;
  badgeVariant?: "default" | "success" | "warning" | "error";
  children?: NavItem[];
  /** Whether this item requires authentication */
  requiresAuth?: boolean;
  /** Required roles to see this item */
  roles?: string[];
  /** Whether to show this item in the navigation */
  hidden?: boolean;
  /** External link */
  external?: boolean;
  /** Description for tooltips or mega menus */
  description?: string;
}

export interface NavigationSection {
  title?: string;
  items: NavItem[];
}

export interface BreadcrumbConfig {
  /** Override the label for this path */
  label?: string;
  /** Override the icon for this path */
  icon?: ReactNode;
  /** Whether to hide this path from breadcrumbs */
  hidden?: boolean;
  /** Parent path for hierarchy */
  parent?: string;
}

// ============================================
// Main Navigation Configuration
// ============================================

export const mainNavigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "home",
    description: "Overview of your permits and activity",
  },
  {
    label: "Map",
    href: "/map",
    icon: "map",
    description: "Interactive map view of all permits",
  },
  {
    label: "Search",
    href: "/search",
    icon: "search",
    description: "Advanced search and filtering",
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: "bell",
    badge: 0,
    badgeVariant: "error",
    description: "Notifications and alerts",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "settings",
    description: "Account and application settings",
  },
];

// ============================================
// Admin Navigation
// ============================================

export const adminNavigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "home",
    description: "Admin overview",
  },
  {
    label: "Ingestion",
    href: "/admin/ingestion",
    icon: "database",
    description: "Data ingestion management",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: "users",
    description: "User management",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: "barChart",
    description: "System analytics",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "settings",
    description: "System settings",
  },
];

// ============================================
// Breadcrumb Configuration
// ============================================

export const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  "/": { label: "Home" },
  "/dashboard": { label: "Dashboard" },
  "/map": { label: "Map" },
  "/search": { label: "Search" },
  "/alerts": { label: "Alerts" },
  "/notifications": { label: "Notifications", parent: "/alerts" },
  "/settings": { label: "Settings" },
  "/admin": { label: "Admin" },
  "/admin/ingestion": { label: "Ingestion", parent: "/admin" },
  "/admin/users": { label: "Users", parent: "/admin" },
  "/admin/analytics": { label: "Analytics", parent: "/admin" },
  "/admin/settings": { label: "Settings", parent: "/admin" },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get navigation items for a specific section
 */
export function getNavigation(section: "main" | "admin" = "main"): NavItem[] {
  return section === "admin" ? adminNavigation : mainNavigation;
}

/**
 * Find a navigation item by href
 */
export function findNavItem(href: string, items: NavItem[] = mainNavigation): NavItem | undefined {
  for (const item of items) {
    if (item.href === href) return item;
    if (item.children) {
      const found = findNavItem(href, item.children);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Check if a navigation item is active
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  if (item.children) {
    return item.children.some((child) => isNavItemActive(child, pathname));
  }
  return false;
}

/**
 * Get breadcrumb items for a pathname
 */
export function getBreadcrumbs(
  pathname: string,
  config: Record<string, BreadcrumbConfig> = breadcrumbConfig
): Array<{ label: string; href?: string }> {
  const breadcrumbs: Array<{ label: string; href?: string }> = [];
  const segments = pathname.split("/").filter(Boolean);
  
  // Always start with home
  breadcrumbs.push({ label: "Home", href: "/" });
  
  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const config = breadcrumbConfig[currentPath];
    
    if (config?.hidden) continue;
    
    breadcrumbs.push({
      label: config?.label || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: currentPath,
    });
  }
  
  return breadcrumbs;
}

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(
  items: NavItem[],
  userRole?: string
): NavItem[] {
  return items.filter((item) => {
    if (item.hidden) return false;
    if (item.roles && userRole) {
      return item.roles.includes(userRole);
    }
    return true;
  });
}
