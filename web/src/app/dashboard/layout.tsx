"use client";

import {
  Sidebar,
  SidebarProvider,
  NavItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/components/notifications/NotificationContext";
import { ThemeToggle } from "@/components/ui/theme-provider";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useRouter, usePathname } from "next/navigation";
import { MobileMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PageBreadcrumb } from "@/components/navigation";
import { mainNavigation } from "@/lib/navigation";

// Convert main navigation to sidebar format
const dashboardNavItems: NavItem[] = mainNavigation.map(item => ({
  label: item.label,
  href: item.href,
  icon: item.icon as NavItem["icon"],
  badge: item.badge,
  badgeVariant: item.badgeVariant,
  description: item.description,
}));

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { notifications, unreadCount, markAsRead, markAllAsRead, batchSimilarNotifications } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Calculate badge count for alerts
  const alertsItem = dashboardNavItems.find(item => item.href === "/alerts");
  if (alertsItem) {
    alertsItem.badge = unreadCount > 0 ? unreadCount : undefined;
    alertsItem.badgeVariant = unreadCount > 0 ? "error" : undefined;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[var(--color-surface-default)]">
        <Sidebar
          items={dashboardNavItems}
          user={user ? {
            name: user.email?.split('@')[0] || "User",
            email: user.email || "",
          } : undefined}
          onLogout={handleSignOut}
          collapsible={true}
          defaultCollapsed={false}
        />
        
        {/* Main content area */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out lg:ml-[280px]"
          )}
        >
          {/* Header */}
          <header className="sticky top-0 z-30 h-16 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-default)] flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <MobileMenuButton className="lg:hidden" />
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] hidden lg:block">
                RRC Permit Monitor
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onNotificationClick={(notification) => {
                  console.log("Notification clicked:", notification);
                }}
                onSnoozeNotification={(id, duration) => {
                  console.log("Snooze notification:", id, duration);
                }}
                onBatchSimilarNotifications={batchSimilarNotifications}
              />
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {user?.email}
                </span>
              </div>
            </div>
          </header>
          
          {/* Page content */}
          <main className="p-4 lg:p-6">
            {/* Breadcrumb navigation */}
            <PageBreadcrumb className="mb-6" />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}