"use client";

import { 
  MapPin, 
  Bell, 
  Search, 
  BarChart3, 
  Download, 
  Shield,
  Zap,
  Clock
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Draw Your Areas of Interest",
    description: "Use our interactive map to draw custom AOIs. Add buffer zones and get alerts whenever permits are filed in your areas.",
    color: "var(--color-brand-primary)",
  },
  {
    icon: Bell,
    title: "Real-Time Permit Alerts",
    description: "Get notified instantly via SMS, email, or in-app when new permits match your criteria. Never miss an opportunity again.",
    color: "var(--color-success)",
  },
  {
    icon: Search,
    title: "Advanced Search & Filtering",
    description: "Filter by operator, county, permit type, drilling depth, and more. Save searches and get alerts for new matches.",
    color: "var(--color-brand-accent)",
  },
  {
    icon: BarChart3,
    title: "Operator Intelligence",
    description: "Track competitor activity, analyze drilling patterns, and compare operators across counties and time periods.",
    color: "var(--color-warning)",
  },
  {
    icon: Download,
    title: "Export & Reporting",
    description: "Export permit data to CSV or Excel. Generate scheduled reports and share insights with your team.",
    color: "var(--color-info)",
  },
  {
    icon: Shield,
    title: "Data You Can Trust",
    description: "Direct integration with RRC data. We preserve raw records and track amendments so you always have the complete picture.",
    color: "var(--color-error)",
  },
];

const stats = [
  { value: "1M+", label: "Permits Tracked" },
  { value: "254", label: "Texas Counties" },
  { value: "<2hr", label: "Alert Delivery" },
  { value: "99.5%", label: "Uptime SLA" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[var(--color-surface-default)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            Everything You Need to Track Texas Drilling
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Powerful tools designed specifically for landmen, operators, and E&P companies 
            who need to stay on top of Texas drilling activity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-lg"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon
                  className="h-6 w-6"
                  style={{ color: feature.color }}
                />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {feature.title}
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-8 border-t border-[var(--color-border-default)] pt-16 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 text-3xl font-bold text-[var(--color-brand-primary)] sm:text-4xl">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-[var(--color-text-tertiary)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
