// Navigation Components
export { NavigationProvider, useNavigation } from "./NavigationProvider";
export { PageBreadcrumb, PageHeader } from "./PageBreadcrumb";

// Re-export navigation configuration for convenience
export {
  mainNavigation,
  adminNavigation,
  breadcrumbConfig,
  getNavigation,
  findNavItem,
  isNavItemActive,
  getBreadcrumbs,
  filterNavigationByRole,
} from "@/lib/navigation";

export type { NavItem, NavigationSection, BreadcrumbConfig } from "@/lib/navigation";
