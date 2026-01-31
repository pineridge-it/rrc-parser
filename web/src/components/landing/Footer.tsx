"use client";

import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "API Docs", href: "/docs" },
    { name: "Changelog", href: "/changelog" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Security", href: "/security" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-default)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                Texas Permit Alerts
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-[var(--color-text-secondary)]">
              Real-time drilling permit alerts and operator intelligence for
              independent landmen and E&P companies in Texas.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href="mailto:support@txpermits.com"
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <Mail className="h-4 w-4" />
                support@txpermits.com
              </a>
              <a
                href="tel:+1-800-555-0199"
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <Phone className="h-4 w-4" />
                1-800-555-0199
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border-default)] pt-8 sm:flex-row">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            © {new Date().getFullYear()} Texas Permit Alerts. All rights
            reserved.
          </p>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Data sourced from the Texas Railroad Commission (RRC).
          </p>
        </div>
      </div>
    </footer>
  );
}
