"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { mainNavigation, adminNavigation, getBreadcrumbs, NavItem } from "@/lib/navigation";

// ============================================
// Navigation Context Types
// ============================================

interface NavigationContextValue {
  /** Current pathname */
  pathname: string;
  /** Main navigation items */
  mainNav: NavItem[];
  /** Admin navigation items */
  adminNav: NavItem[];
  /** Breadcrumb items for current path */
  breadcrumbs: Array<{ label: string; href?: string }>;
  /** Current active navigation item */
  activeItem: NavItem | undefined;
  /** Check if a nav item is active */
  isActive: (href: string) => boolean;
  /** Get nav item by href */
  findItem: (href: string) => NavItem | undefined;
}

// ============================================
// Navigation Context
// ============================================

const NavigationContext = React.createContext<NavigationContextValue | undefined>(undefined);

// ============================================
// Hook
// ============================================

export function useNavigation() {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

// ============================================
// Helper Functions
// ============================================

function findNavItem(href: string, items: NavItem[]): NavItem | undefined {
  for (const item of items) {
    if (item.href === href) return item;
    if (item.children) {
      const found = findNavItem(href, item.children);
      if (found) return found;
    }
  }
  return undefined;
}

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  if (item.children) {
    return item.children.some((child) => isNavItemActive(child, pathname));
  }
  return false;
}

// ============================================
// Provider Component
// ============================================

interface NavigationProviderProps {
  children: React.ReactNode;
  /** Custom main navigation items */
  customMainNav?: NavItem[];
  /** Custom admin navigation items */
  customAdminNav?: NavItem[];
}

export function NavigationProvider({
  children,
  customMainNav,
  customAdminNav,
}: NavigationProviderProps) {
  const pathname = usePathname() || "/";
  
  const mainNav = customMainNav || mainNavigation;
  const adminNav = customAdminNav || adminNavigation;
  
  // Generate breadcrumbs
  const breadcrumbs = React.useMemo(() => {
    return getBreadcrumbs(pathname);
  }, [pathname]);
  
  // Find active item
  const activeItem = React.useMemo(() => {
    // Check main nav first
    const mainActive = findNavItem(pathname, mainNav);
    if (mainActive) return mainActive;
    
    // Then check admin nav
    return findNavItem(pathname, adminNav);
  }, [pathname, mainNav, adminNav]);
  
  // Check if a path is active
  const isActive = React.useCallback(
    (href: string) => {
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );
  
  // Find item by href
  const findItem = React.useCallback(
    (href: string) => {
      const mainFound = findNavItem(href, mainNav);
      if (mainFound) return mainFound;
      return findNavItem(href, adminNav);
    },
    [mainNav, adminNav]
  );
  
  const value: NavigationContextValue = {
    pathname,
    mainNav,
    adminNav,
    breadcrumbs,
    activeItem,
    isActive,
    findItem,
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
