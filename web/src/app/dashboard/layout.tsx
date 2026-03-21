"use client";

import {
  Sidebar,
  SidebarProvider,
  useSidebar,
  NavItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/components/notifications/NotificationContext";
import { ThemeToggle } from "@/components/ui/theme-provider";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useRouter } from "next/navigation";
import { MobileMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PageBreadcrumb } from "@/components/navigation";
import { mainNavigation } from "@/lib/navigation";
import { toast } from "sonner";

const dashboardNavItems: NavItem[] = mainNavigation.map(item => ({
  label: item.label,
  href: item.href,
  icon: item.icon as NavItem["icon"],
  badge: item.badge,
  badgeVariant: item.badgeVariant,
  description: item.description,
}));

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const { notifications, unreadCount, markAsRead, markAllAsRead, batchSimilarNotifications } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const navItems = dashboardNavItems.map(item => {
    if (item.href === "/alerts") {
      return {
        ...item,
        badge: unreadCount > 0 ? unreadCount : undefined,
        badgeVariant: unreadCount > 0 ? ("error" as const) : undefined,
      };
    }
    return item;
  });

  const displayName = user?.user_metadata?.full_name
    || user?.email?.split("@")[0]?.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    || "Account";

  return (
    <>
      <Sidebar
        items={navItems}
        user={user ? {
          name: displayName,
          email: user.email || "",
        } : undefined}
        onLogout={handleSignOut}
        collapsible={true}
        defaultCollapsed={false}
      />

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          collapsed ? "lg:ml-[72px]" : "lg:ml-[280px]"
        )}
      >
        <header className="sticky top-0 z-30 h-16 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-default)] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <MobileMenuButton className="lg:hidden" />
            <span className="font-semibold text-[var(--color-text-primary)] lg:hidden">RRC Permit Monitor</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onNotificationClick={() => {}}
              onSnoozeNotification={() => {}}
              onBatchSimilarNotifications={batchSimilarNotifications}
            />
            <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-[var(--color-border-default)]">
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-[var(--color-brand-primary)]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {displayName}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <PageBreadcrumb className="mb-6" />
          {children}
        </main>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[var(--color-surface-default)]">
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </div>
    </SidebarProvider>
  );
}