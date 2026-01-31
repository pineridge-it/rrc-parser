"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Bell, TrendingUp } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-surface-subtle)] to-[var(--color-surface-default)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-brand-primary)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--color-brand-accent)_0%,transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[90vh] flex-col items-center justify-center py-20 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 py-2 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Now tracking 1M+ permits across Texas
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 max-w-4xl text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl md:text-6xl lg:text-7xl">
            Never Miss a{" "}
            <span className="bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] bg-clip-text text-transparent">
              Drilling Permit
            </span>{" "}
            in Your Area
          </h1>

          {/* Subheadline */}
          <p className="mb-10 max-w-2xl text-lg text-[var(--color-text-secondary)] sm:text-xl md:text-2xl">
            Get real-time alerts for new drilling permits, amendments, and operator activity 
            across Texas. Built for landmen, operators, and E&P companies.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="group min-w-[200px]">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="min-w-[200px]">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>254 Texas Counties</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Real-time Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Operator Intelligence</span>
            </div>
          </div>

          {/* Product Preview */}
          <div className="mt-16 w-full max-w-5xl">
            <div className="relative rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-2 shadow-2xl">
              <div className="aspect-[16/9] overflow-hidden rounded-lg bg-[var(--color-surface-subtle)]">
                {/* Mock Dashboard Preview */}
                <div className="flex h-full flex-col">
                  {/* Mock Header */}
                  <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 w-48 rounded bg-[var(--color-surface-subtle)]" />
                    </div>
                  </div>
                  {/* Mock Content */}
                  <div className="flex flex-1">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-4">
                      <div className="space-y-3">
                        <div className="h-8 rounded bg-[var(--color-surface-default)]" />
                        <div className="h-8 rounded bg-[var(--color-surface-default)]" />
                        <div className="h-8 rounded bg-[var(--color-brand-primary)] opacity-50" />
                        <div className="h-8 rounded bg-[var(--color-surface-default)]" />
                      </div>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 p-4">
                      <div className="mb-4 flex gap-4">
                        <div className="h-20 flex-1 rounded-lg bg-[var(--color-surface-default)] p-3">
                          <div className="h-3 w-20 rounded bg-[var(--color-surface-subtle)]" />
                          <div className="mt-2 h-6 w-16 rounded bg-[var(--color-brand-primary)] opacity-30" />
                        </div>
                        <div className="h-20 flex-1 rounded-lg bg-[var(--color-surface-default)] p-3">
                          <div className="h-3 w-20 rounded bg-[var(--color-surface-subtle)]" />
                          <div className="mt-2 h-6 w-16 rounded bg-[var(--color-success)] opacity-30" />
                        </div>
                        <div className="h-20 flex-1 rounded-lg bg-[var(--color-surface-default)] p-3">
                          <div className="h-3 w-20 rounded bg-[var(--color-surface-subtle)]" />
                          <div className="mt-2 h-6 w-16 rounded bg-[var(--color-brand-accent)] opacity-30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-12 rounded bg-[var(--color-surface-default)]" />
                        <div className="h-12 rounded bg-[var(--color-surface-default)]" />
                        <div className="h-12 rounded bg-[var(--color-surface-default)]" />
                        <div className="h-12 rounded bg-[var(--color-surface-default)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
