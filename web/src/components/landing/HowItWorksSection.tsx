"use client";

import { MapPin, SlidersHorizontal, Bell, FileText } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: MapPin,
    title: "Define Your Areas",
    description: "Draw your Areas of Interest (AOIs) on our interactive Texas map. Add buffer zones around existing assets or lease boundaries.",
  },
  {
    step: "02",
    icon: SlidersHorizontal,
    title: "Set Your Filters",
    description: "Choose operators, permit types, drilling depths, and other criteria. Create multiple saved searches for different strategies.",
  },
  {
    step: "03",
    icon: Bell,
    title: "Get Real-Time Alerts",
    description: "Receive instant notifications via SMS, email, or in-app when new permits match your criteria. Set quiet hours and digest preferences.",
  },
  {
    step: "04",
    icon: FileText,
    title: "Analyze & Export",
    description: "View permit details, track operator activity, and export data for your internal analysis. Generate reports on demand or schedule them.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-[var(--color-surface-subtle)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Get started in minutes and never miss another drilling permit in your areas of interest.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (desktop only) */}
          <div className="absolute left-1/2 top-24 hidden h-0.5 w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--color-border-strong)] to-transparent lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-center text-center">
                  {/* Step Number & Icon */}
                  <div className="relative mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-raised)] shadow-lg ring-4 ring-[var(--color-surface-subtle)]">
                      <item.icon className="h-7 w-7 text-[var(--color-brand-primary)]" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-xs font-bold text-white">
                      {item.step}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
