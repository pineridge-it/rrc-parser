"use client";

import * as React from "react";

/**
 * Design Tokens Documentation Component
 * 
 * A development-only component that displays all design tokens
 * for reference and debugging. This helps ensure consistency
 * across the application.
 * 
 * Usage:
 *   <DesignTokensShowcase />
 */

interface TokenGroupProps {
  title: string;
  children: React.ReactNode;
}

function TokenGroup({ title, children }: TokenGroupProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
        {title}
      </h3>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

interface ColorSwatchProps {
  name: string;
  variable: string;
  value: string;
}

function ColorSwatch({ name, variable, value }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-surface-subtle)]">
      <div
        className="w-12 h-12 rounded-md border border-[var(--color-border-default)] shadow-sm"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-text-primary)] truncate">
          {name}
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)] font-mono truncate">
          {variable}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">{value}</p>
      </div>
    </div>
  );
}

interface TokenValueProps {
  name: string;
  variable: string;
  value: string;
  preview?: React.ReactNode;
}

function TokenValue({ name, variable, value, preview }: TokenValueProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-surface-subtle)]">
      {preview && <div className="w-12 h-12 flex items-center justify-center">{preview}</div>}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-text-primary)] truncate">
          {name}
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)] font-mono truncate">
          {variable}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">{value}</p>
      </div>
    </div>
  );
}

export function DesignTokensShowcase() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-surface-subtle)] rounded w-1/3" />
          <div className="h-32 bg-[var(--color-surface-subtle)] rounded" />
        </div>
      </div>
    );
  }

  const styles = getComputedStyle(document.documentElement);

  const getToken = (name: string) => styles.getPropertyValue(name).trim();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
        Design Tokens
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Complete reference of all design tokens in the system. These tokens ensure
        consistency across the application.
      </p>

      {/* Brand Colors */}
      <TokenGroup title="Brand Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ColorSwatch
            name="Brand Primary"
            variable="--color-brand-primary"
            value={getToken("--color-brand-primary")}
          />
          <ColorSwatch
            name="Brand Primary Hover"
            variable="--color-brand-primary-hover"
            value={getToken("--color-brand-primary-hover")}
          />
          <ColorSwatch
            name="Brand Accent"
            variable="--color-brand-accent"
            value={getToken("--color-brand-accent")}
          />
        </div>
      </TokenGroup>

      {/* Status Colors */}
      <TokenGroup title="Status Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ColorSwatch
            name="Success"
            variable="--color-success"
            value={getToken("--color-success")}
          />
          <ColorSwatch
            name="Success Subtle"
            variable="--color-success-subtle"
            value={getToken("--color-success-subtle")}
          />
          <ColorSwatch
            name="Warning"
            variable="--color-warning"
            value={getToken("--color-warning")}
          />
          <ColorSwatch
            name="Warning Subtle"
            variable="--color-warning-subtle"
            value={getToken("--color-warning-subtle")}
          />
          <ColorSwatch
            name="Error"
            variable="--color-error"
            value={getToken("--color-error")}
          />
          <ColorSwatch
            name="Error Subtle"
            variable="--color-error-subtle"
            value={getToken("--color-error-subtle")}
          />
          <ColorSwatch
            name="Info"
            variable="--color-info"
            value={getToken("--color-info")}
          />
          <ColorSwatch
            name="Info Subtle"
            variable="--color-info-subtle"
            value={getToken("--color-info-subtle")}
          />
        </div>
      </TokenGroup>

      {/* Surface Colors */}
      <TokenGroup title="Surface Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ColorSwatch
            name="Surface Default"
            variable="--color-surface-default"
            value={getToken("--color-surface-default")}
          />
          <ColorSwatch
            name="Surface Subtle"
            variable="--color-surface-subtle"
            value={getToken("--color-surface-subtle")}
          />
          <ColorSwatch
            name="Surface Raised"
            variable="--color-surface-raised"
            value={getToken("--color-surface-raised")}
          />
          <ColorSwatch
            name="Surface Overlay"
            variable="--color-surface-overlay"
            value={getToken("--color-surface-overlay")}
          />
          <ColorSwatch
            name="Surface Inset"
            variable="--color-surface-inset"
            value={getToken("--color-surface-inset")}
          />
        </div>
      </TokenGroup>

      {/* Text Colors */}
      <TokenGroup title="Text Colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[var(--color-surface-default)] border border-[var(--color-border-default)]">
            <p
              className="text-2xl font-bold"
              style={{ color: getToken("--color-text-primary") }}
            >
              Primary Text
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)] font-mono mt-2">
              --color-text-primary
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-surface-default)] border border-[var(--color-border-default)]">
            <p
              className="text-lg"
              style={{ color: getToken("--color-text-secondary") }}
            >
              Secondary Text
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)] font-mono mt-2">
              --color-text-secondary
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--color-surface-default)] border border-[var(--color-border-default)]">
            <p style={{ color: getToken("--color-text-tertiary") }}>
              Tertiary Text
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)] font-mono mt-2">
              --color-text-tertiary
            </p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: getToken("--color-brand-primary") }}
          >
            <p
              className="text-lg"
              style={{ color: getToken("--color-text-inverse") }}
            >
              Inverse Text
            </p>
            <p
              className="text-sm font-mono mt-2"
              style={{ color: getToken("--color-text-inverse") }}
            >
              --color-text-inverse
            </p>
          </div>
        </div>
      </TokenGroup>

      {/* Typography Scale */}
      <TokenGroup title="Typography Scale">
        <div className="space-y-4">
          {[
            { name: "6XL", var: "--font-size-6xl", size: getToken("--font-size-6xl") },
            { name: "5XL", var: "--font-size-5xl", size: getToken("--font-size-5xl") },
            { name: "4XL", var: "--font-size-4xl", size: getToken("--font-size-4xl") },
            { name: "3XL", var: "--font-size-3xl", size: getToken("--font-size-3xl") },
            { name: "2XL", var: "--font-size-2xl", size: getToken("--font-size-2xl") },
            { name: "XL", var: "--font-size-xl", size: getToken("--font-size-xl") },
            { name: "LG", var: "--font-size-lg", size: getToken("--font-size-lg") },
            { name: "Base", var: "--font-size-base", size: getToken("--font-size-base") },
            { name: "SM", var: "--font-size-sm", size: getToken("--font-size-sm") },
            { name: "XS", var: "--font-size-xs", size: getToken("--font-size-xs") },
          ].map((item) => (
            <div
              key={item.var}
              className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-surface-subtle)]"
            >
              <span
                className="font-bold text-[var(--color-brand-primary)]"
                style={{ fontSize: item.size }}
              >
                Aa
              </span>
              <div className="flex-1">
                <p className="font-medium text-[var(--color-text-primary)]">
                  {item.name}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] font-mono">
                  {item.var}: {item.size}
                </p>
              </div>
            </div>
          ))}
        </div>
      </TokenGroup>

      {/* Spacing Scale */}
      <TokenGroup title="Spacing Scale">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            "0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7",
            "8", "9", "10", "12", "14", "16", "20", "24",
          ].map((size) => {
            const value = getToken(`--space-${size}`);
            return (
              <div
                key={size}
                className="p-3 rounded-lg bg-[var(--color-surface-subtle)] text-center"
              >
                <div
                  className="mx-auto mb-2 bg-[var(--color-brand-primary)] rounded"
                  style={{ width: value, height: value }}
                />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {size}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      </TokenGroup>

      {/* Border Radius */}
      <TokenGroup title="Border Radius">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "None", var: "--radius-none" },
            { name: "SM", var: "--radius-sm" },
            { name: "Base", var: "--radius-base" },
            { name: "MD", var: "--radius-md" },
            { name: "LG", var: "--radius-lg" },
            { name: "XL", var: "--radius-xl" },
            { name: "2XL", var: "--radius-2xl" },
            { name: "3XL", var: "--radius-3xl" },
            { name: "Full", var: "--radius-full" },
          ].map((item) => (
            <div
              key={item.var}
              className="p-4 rounded-lg bg-[var(--color-surface-subtle)] text-center"
            >
              <div
                className="mx-auto mb-2 w-16 h-16 bg-[var(--color-brand-primary)]"
                style={{ borderRadius: getToken(item.var) }}
              />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {item.name}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
                {getToken(item.var)}
              </p>
            </div>
          ))}
        </div>
      </TokenGroup>

      {/* Shadows */}
      <TokenGroup title="Shadows & Elevation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "XS", var: "--shadow-xs" },
            { name: "SM", var: "--shadow-sm" },
            { name: "Base", var: "--shadow-base" },
            { name: "MD", var: "--shadow-md" },
            { name: "LG", var: "--shadow-lg" },
            { name: "XL", var: "--shadow-xl" },
            { name: "2XL", var: "--shadow-2xl" },
            { name: "Inner", var: "--shadow-inner" },
          ].map((item) => (
            <div
              key={item.var}
              className="p-6 rounded-lg bg-[var(--color-surface-default)]"
              style={{ boxShadow: getToken(item.var) }}
            >
              <p className="font-medium text-[var(--color-text-primary)]">
                {item.name}
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] font-mono">
                {item.var}
              </p>
            </div>
          ))}
        </div>
      </TokenGroup>

      {/* Animation Durations */}
      <TokenGroup title="Animation Durations">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: "Instant", var: "--duration-instant" },
            { name: "Fast", var: "--duration-fast" },
            { name: "Normal", var: "--duration-normal" },
            { name: "Slow", var: "--duration-slow" },
            { name: "Slower", var: "--duration-slower" },
          ].map((item) => (
            <TokenValue
              key={item.var}
              name={item.name}
              variable={item.var}
              value={getToken(item.var)}
              preview={
                <div
                  className="w-8 h-8 rounded bg-[var(--color-brand-primary)] animate-pulse"
                  style={{
                    animationDuration: getToken(item.var),
                  }}
                />
              }
            />
          ))}
        </div>
      </TokenGroup>

      {/* Z-Index Scale */}
      <TokenGroup title="Z-Index Scale">
        <div className="space-y-2">
          {[
            { name: "Base", var: "--z-base" },
            { name: "Dropdown", var: "--z-dropdown" },
            { name: "Sticky", var: "--z-sticky" },
            { name: "Fixed", var: "--z-fixed" },
            { name: "Modal Backdrop", var: "--z-modal-backdrop" },
            { name: "Modal", var: "--z-modal" },
            { name: "Popover", var: "--z-popover" },
            { name: "Tooltip", var: "--z-tooltip" },
            { name: "Toast", var: "--z-toast" },
          ].map((item, index) => (
            <div
              key={item.var}
              className="flex items-center gap-4 p-3 rounded-lg bg-[var(--color-surface-subtle)]"
            >
              <div
                className="w-12 h-8 rounded bg-[var(--color-brand-primary)] flex items-center justify-center text-white text-xs font-mono"
                style={{ opacity: 0.3 + index * 0.08 }}
              >
                {getToken(item.var)}
              </div>
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {item.name}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] font-mono">
                  {item.var}
                </p>
              </div>
            </div>
          ))}
        </div>
      </TokenGroup>
    </div>
  );
}

/**
 * Token Inspector
 * 
 * A utility component to inspect the value of any CSS custom property.
 */
interface TokenInspectorProps {
  token: string;
}

export function TokenInspector({ token }: TokenInspectorProps) {
  const [value, setValue] = React.useState<string>("");

  React.useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setValue(styles.getPropertyValue(token).trim());
  }, [token]);

  return (
    <span className="font-mono text-sm text-[var(--color-text-secondary)]">
      {token}: {value || "not set"}
    </span>
  );
}
