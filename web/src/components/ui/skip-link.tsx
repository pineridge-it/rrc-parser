"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  /** The ID of the main content element to skip to */
  targetId?: string;
  /** Custom text for the skip link */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skip Link Component
 * 
 * Provides keyboard users with a way to skip repetitive navigation
 * and jump directly to the main content. Hidden visually until focused.
 * 
 * Usage:
 *   // In layout.tsx
 *   <SkipLink targetId="main-content" />
 *   
 *   // In page.tsx
 *   <main id="main-content">
 *     Page content here
 *   </main>
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ targetId = "main-content", children = "Skip to main content", className }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        // Set tabindex to allow programmatic focus
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus();
        target.scrollIntoView({ behavior: "smooth" });
        
        // Announce to screen readers
        const announcement = document.createElement("div");
        announcement.setAttribute("role", "status");
        announcement.setAttribute("aria-live", "polite");
        announcement.className = "sr-only";
        announcement.textContent = "Skipped to main content";
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
      }
    };

    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        onClick={handleClick}
        className={cn(
          // Base styles
          "fixed top-4 left-4 z-[9999]",
          "px-4 py-2",
          "bg-[var(--color-brand-primary)] text-white",
          "rounded-md shadow-lg",
          "font-medium text-sm",
          "transition-transform duration-200",
          // Hidden by default, visible on focus
          "-translate-y-[calc(100%+2rem)] focus:translate-y-0",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-primary)]",
          className
        )}
      >
        {children}
      </a>
    );
  }
);

SkipLink.displayName = "SkipLink";

export { SkipLink };
export type { SkipLinkProps };
