"use client";

import { ThemeToggle } from "@/components/ui/theme-provider";

export default function ThemeTestPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-default)] text-[var(--color-text-primary)] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dark Mode Test Page</h1>
          <ThemeToggle showLabel />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Surface Colors */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Surface Colors</h2>
            <div className="space-y-2">
              <div className="p-4 rounded-lg bg-[var(--color-surface-default)] border border-[var(--color-border-default)]">
                Surface Default
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border-default)]">
                Surface Subtle
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] shadow-sm">
                Surface Raised
              </div>
            </div>
          </div>

          {/* Text Colors */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Text Colors</h2>
            <div className="space-y-2">
              <p className="text-[var(--color-text-primary)]">Primary Text</p>
              <p className="text-[var(--color-text-secondary)]">Secondary Text</p>
              <p className="text-[var(--color-text-tertiary)]">Tertiary Text</p>
              <p className="text-[var(--color-text-placeholder)]">Placeholder Text</p>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Brand Colors</h2>
            <div className="space-y-2">
              <div className="p-4 rounded-lg bg-[var(--color-brand-primary)] text-white">
                Brand Primary
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-brand-accent)] text-white">
                Brand Accent
              </div>
            </div>
          </div>

          {/* Status Colors */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Status Colors</h2>
            <div className="space-y-2">
              <div className="p-4 rounded-lg bg-[var(--color-success-subtle)] text-[var(--color-success)]">
                Success
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-warning-subtle)] text-[var(--color-warning)]">
                Warning
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-error-subtle)] text-[var(--color-error)]">
                Error
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-info-subtle)] text-[var(--color-info)]">
                Info
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Elements */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Interactive Elements</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-[var(--color-brand-primary)] text-white rounded-md hover:bg-[var(--color-brand-primary-hover)] transition-colors">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-md hover:bg-[var(--color-surface-subtle)] transition-colors">
              Secondary Button
            </button>
            <button className="px-4 py-2 text-[var(--color-brand-accent)] hover:text-[var(--color-brand-accent-hover)] transition-colors">
              Link Button
            </button>
          </div>
        </div>

        {/* Borders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Border Colors</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border border-[var(--color-border-default)] rounded-lg">
              Default Border
            </div>
            <div className="p-4 border border-[var(--color-border-strong)] rounded-lg">
              Strong Border
            </div>
            <div className="p-4 border border-[var(--color-border-subtle)] rounded-lg">
              Subtle Border
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}