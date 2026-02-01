"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Icons (using Lucide React style icons as SVG components)
const Icons = {
  home: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  map: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
  ),
  search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  bell: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  user: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  database: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
  ),
  barChart: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
  ),
  activity: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  menu: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
  ),
  chevronLeft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>
  ),
  chevronRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
  ),
  chevronDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6"/></svg>
  ),
  logout: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
  ),
  x: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
};

// Navigation item type
export interface NavItem {
  label: string;
  href: string;
  icon: keyof typeof Icons;
  badge?: number | string;
  badgeVariant?: "default" | "success" | "warning" | "error";
  children?: NavItem[];
  /** Whether this section is expanded by default */
  defaultExpanded?: boolean;
  /** Description for tooltips */
  description?: string;
}

// Default navigation items
export const defaultNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "home" },
  { label: "Map", href: "/map", icon: "map" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Alerts", href: "/alerts", icon: "bell", badge: 0 },
];

// Sidebar props
export interface SidebarProps {
  items?: NavItem[];
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
  footer?: React.ReactNode;
}

// Sidebar context
interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// NavItem component for rendering navigation items with nested support
interface NavItemComponentProps {
  item: NavItem;
  pathname: string | null;
  collapsed: boolean;
  getIcon: (iconName: keyof typeof Icons) => React.ReactNode;
  depth?: number;
}

function NavItemComponent({ item, pathname, collapsed, getIcon, depth = 0 }: NavItemComponentProps) {
  const [isExpanded, setIsExpanded] = React.useState(item.defaultExpanded || false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
  const isChildActive = hasChildren && item.children?.some(child =>
    pathname === child.href || pathname?.startsWith(child.href + "/")
  );

  // Auto-expand if a child is active
  React.useEffect(() => {
    if (isChildActive && !collapsed) {
      setIsExpanded(true);
    }
  }, [isChildActive, collapsed]);

  const Icon = getIcon(item.icon);

  // If sidebar is collapsed and item has children, just render the parent as a link
  if (collapsed && hasChildren) {
    return (
      <li>
        <Link
          href={item.href}
          className={cn(
            "flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-colors relative group",
            isActive || isChildActive
              ? "bg-[var(--color-brand-primary)] text-white"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
          )}
        >
          <span className={cn("flex-shrink-0", (isActive || isChildActive) && "text-white")}>
            {Icon}
          </span>
          {(item.badge !== undefined || isChildActive) && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-error)]" />
          )}
          {/* Tooltip for collapsed state */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--color-text-primary)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {item.label}
            {item.badge !== undefined && (
              <span className="ml-1">({item.badge})</span>
            )}
          </div>
        </Link>
      </li>
    );
  }

  return (
    <li>
      {hasChildren && !collapsed ? (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive || isChildActive
                ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <span className={cn("flex-shrink-0", (isActive || isChildActive) && "text-[var(--color-brand-primary)]")}>
              {Icon}
            </span>
            <span className="truncate flex-1 text-left">{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  item.badgeVariant === "error"
                    ? "bg-[var(--color-error)] text-white"
                    : item.badgeVariant === "warning"
                    ? "bg-[var(--color-warning)] text-white"
                    : item.badgeVariant === "success"
                    ? "bg-[var(--color-success)] text-white"
                    : "bg-[var(--color-brand-primary)] text-white"
                )}
              >
                {item.badge}
              </span>
            )}
            <Icons.chevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
          {isExpanded && (
            <ul className="mt-1 ml-4 pl-3 border-l border-[var(--color-border-default)] space-y-1">
              {item.children?.map((child) => (
                <NavItemComponent
                  key={child.href}
                  item={child}
                  pathname={pathname}
                  collapsed={collapsed}
                  getIcon={getIcon}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group",
            depth > 0 && "text-xs",
            isActive
              ? "bg-[var(--color-brand-primary)] text-white"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]",
            collapsed && "justify-center px-2"
          )}
        >
          <span className={cn("flex-shrink-0", isActive && "text-white")}>
            {Icon}
          </span>
          {!collapsed && <span className="truncate">{item.label}</span>}
          {!collapsed && item.badge !== undefined && (
            <span
              className={cn(
                "ml-auto text-xs px-2 py-0.5 rounded-full",
                item.badgeVariant === "error"
                  ? "bg-[var(--color-error)] text-white"
                  : item.badgeVariant === "warning"
                  ? "bg-[var(--color-warning)] text-white"
                  : item.badgeVariant === "success"
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-brand-primary)] text-white"
              )}
            >
              {item.badge}
            </span>
          )}
          {collapsed && item.badge !== undefined && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-error)]" />
          )}
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--color-text-primary)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {item.label}
              {item.badge !== undefined && (
                <span className="ml-1">({item.badge})</span>
              )}
            </div>
          )}
        </Link>
      )}
    </li>
  );
}

// Main sidebar component

// Sidebar provider component
export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Main sidebar component
export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      items = defaultNavItems,
      className,
      collapsible = true,
      defaultCollapsed = false,
      onCollapsedChange,
      user,
      onLogout,
      footer,
    },
    ref
  ) => {
    const pathname = usePathname();
    const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

    // Handle collapse toggle
    const handleToggleCollapse = () => {
      const newCollapsed = !collapsed;
      setCollapsed(newCollapsed);
      onCollapsedChange?.(newCollapsed);
    };

    // Close mobile menu on route change
    React.useEffect(() => {
      setMobileOpen(false);
    }, [pathname, setMobileOpen]);

    // Get icon component
    const getIcon = (iconName: keyof typeof Icons) => {
      const IconComponent = Icons[iconName];
      return IconComponent ? <IconComponent className={cn("w-5 h-5", collapsed && "w-6 h-6")} /> : null;
    };

    return (
      <>
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          ref={ref}
          className={cn(
            "fixed left-0 top-0 z-50 h-screen bg-[var(--color-surface-elevated)] border-r border-[var(--color-border-default)] transition-all duration-300 ease-in-out flex flex-col",
            collapsed ? "w-[72px]" : "w-[280px]",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--color-border-default)]">
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="font-semibold text-[var(--color-text-primary)]">RealRate</span>
              </Link>
            )}
            {collapsed && (
              <Link href="/dashboard" className="mx-auto">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
              </Link>
            )}
            {!collapsed && collapsible && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="hidden lg:flex"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Icons.chevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {items.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  getIcon={getIcon}
                />
              ))}
            </ul>
          </nav>

          {/* User section */}
          {(user || onLogout) && (
            <div className="border-t border-[var(--color-border-default)] p-3">
              {user && !collapsed && (
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-subtle)] flex items-center justify-center">
                      <Icons.user className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
              {user && collapsed && (
                <div className="flex justify-center mb-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-subtle)] flex items-center justify-center">
                      <Icons.user className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    </div>
                  )}
                </div>
              )}
              {onLogout && (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-[var(--color-text-secondary)] hover:text-[var(--color-error)]",
                    collapsed && "justify-center px-2"
                  )}
                  onClick={onLogout}
                >
                  <Icons.logout className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Logout</span>}
                </Button>
              )}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div className={cn("border-t border-[var(--color-border-default)]", collapsed && "hidden lg:block")}>
              {footer}
            </div>
          )}

          {/* Collapse toggle for collapsed state */}
          {collapsed && collapsible && (
            <div className="border-t border-[var(--color-border-default)] p-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="w-full flex justify-center"
                aria-label="Expand sidebar"
              >
                <Icons.chevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </aside>
      </>
    );
  }
);
Sidebar.displayName = "Sidebar";

// Mobile menu button component
export function MobileMenuButton({ className }: { className?: string }) {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMobileOpen(!mobileOpen)}
      className={cn("lg:hidden", className)}
      aria-label={mobileOpen ? "Close menu" : "Open menu"}
      aria-expanded={mobileOpen}
    >
      {mobileOpen ? <Icons.x className="w-5 h-5" /> : <Icons.menu className="w-5 h-5" />}
    </Button>
  );
}

// Layout wrapper component
export interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebarProps?: SidebarProps;
  header?: React.ReactNode;
}

export function SidebarLayout({ children, sidebarProps, header }: SidebarLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[var(--color-surface-default)]">
      <Sidebar {...sidebarProps} />
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"
        )}
      >
        {header && (
          <header className="sticky top-0 z-30 h-16 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-default)] flex items-center px-4 lg:px-6">
            <MobileMenuButton className="mr-4" />
            {header}
          </header>
        )}
        {!header && (
          <div className="lg:hidden sticky top-0 z-30 h-16 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-default)] flex items-center px-4">
            <MobileMenuButton />
            <span className="ml-3 font-semibold text-[var(--color-text-primary)]">RealRate</span>
          </div>
        )}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
