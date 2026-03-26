"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    id: "search",
    label: "Search Permits",
    description: "Find permits by operator, county, or status",
    href: "/permits",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]",
  },
  {
    id: "aoi",
    label: "Create AOI",
    description: "Draw an area to monitor for new permits",
    href: "/aois/new",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  },
  {
    id: "alerts",
    label: "Set Up Alerts",
    description: "Configure notifications for permit changes",
    href: "/alerts/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    color: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  },
  {
    id: "operators",
    label: "Browse Operators",
    description: "View activity by drilling operator",
    href: "/operators",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
  },
];

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -2 }}
        >
          <Link
            href={action.href}
            className="block bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border-default)] p-4 hover:border-[var(--color-brand-primary)]/40 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 p-2 rounded-lg ${action.color}`}>
                {action.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors">
                  {action.label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] line-clamp-1">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
