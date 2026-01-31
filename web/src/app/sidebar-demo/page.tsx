"use client";

import {
  Sidebar,
  SidebarProvider,
  SidebarLayout,
  MobileMenuButton,
  NavItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ui/theme-provider";

// Custom navigation items for the demo
const demoNavItems: NavItem[] = [
  { label: "Dashboard", href: "/sidebar-demo", icon: "home" },
  { label: "Map", href: "/sidebar-demo/map", icon: "map" },
  { label: "Search", href: "/sidebar-demo/search", icon: "search" },
  { label: "Alerts", href: "/sidebar-demo/alerts", icon: "bell", badge: 5, badgeVariant: "error" },
  { label: "Settings", href: "/sidebar-demo/settings", icon: "settings" },
];

export default function SidebarDemoPage() {
  const { success } = useToast();

  const handleLogout = () => {
    success("Logged out", {
      description: "You have been successfully logged out.",
    });
  };

  return (
    <SidebarProvider>
      <SidebarLayout
        sidebarProps={{
          items: demoNavItems,
          user: {
            name: "John Doe",
            email: "john@example.com",
          },
          onLogout: handleLogout,
        }}
        header={
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Sidebar Demo
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Sidebar Navigation Component
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              This demo showcases the new sidebar navigation component with collapsible
              functionality, mobile responsiveness, and badge support.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="p-6 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Features
              </h3>
              <ul className="space-y-2 text-[var(--color-text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  Collapsible sidebar (click the chevron)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  Mobile responsive with overlay
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  Active state indicators
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  Badge support for notifications
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  Tooltips in collapsed mode
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  User section with logout
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Try It Out
              </h3>
              <div className="space-y-4">
                <p className="text-[var(--color-text-secondary)]">
                  Resize your browser window to see the responsive behavior:
                </p>
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li>
                    <strong className="text-[var(--color-text-primary)]">Desktop:</strong>{" "}
                    Collapsible sidebar with smooth animations
                  </li>
                  <li>
                    <strong className="text-[var(--color-text-primary)]">Mobile:</strong>{" "}
                    Hamburger menu with overlay
                  </li>
                </ul>
                <div className="pt-4">
                  <MobileMenuButton />
                  <span className="ml-3 text-sm text-[var(--color-text-secondary)]">
                    Click to toggle mobile menu
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Usage Example
            </h3>
            <pre className="p-4 rounded-lg bg-[var(--color-surface-subtle)] overflow-x-auto text-sm text-[var(--color-text-secondary)]">
{`<SidebarProvider>
  <SidebarLayout
    sidebarProps={{
      items: navItems,
      user: { name, email, avatar },
      onLogout: handleLogout,
    }}
    header={<HeaderContent />}
  >
    <YourPageContent />
  </SidebarLayout>
</SidebarProvider>`}
            </pre>
          </section>
        </div>
      </SidebarLayout>
    </SidebarProvider>
  );
}