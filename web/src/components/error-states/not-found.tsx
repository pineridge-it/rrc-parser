"use client";

/**
 * NotFound Component
 * 
 * Displayed when a page or resource is not found (404).
 * Provides navigation options to get back on track.
 * 
 * @component
 * @example
 * ```tsx
 * <NotFound 
 *   resource="permit"
 *   onGoHome={() => router.push('/')}
 *   onSearch={(q) => router.push(`/search?q=${q}`)}
 * />
 * ```
 * 
 * @author IvoryWaterfall
 * @since 2026-01-31
 */

import * as React from "react";
import { motion } from "framer-motion";
import { FileQuestion, Home, Search, Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NotFoundProps {
  /** Type of resource that was not found */
  resource?: "page" | "permit" | "aoi" | "alert" | "export" | "user" | string;
  /** Callback to navigate home */
  onGoHome?: () => void;
  /** Callback to perform a search */
  onSearch?: (query: string) => void;
  /** Callback to go back */
  onGoBack?: () => void;
  /** Callback to browse sitemap */
  onBrowseSitemap?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom title */
  title?: string;
  /** Custom message */
  message?: string;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const resourceMessages: Record<string, { title: string; message: string }> = {
  page: {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist or has been moved.",
  },
  permit: {
    title: "Permit Not Found",
    message: "The permit you're looking for doesn't exist or may have been removed.",
  },
  aoi: {
    title: "Area of Interest Not Found",
    message: "The AOI you're looking for doesn't exist or may have been deleted.",
  },
  alert: {
    title: "Alert Not Found",
    message: "The alert you're looking for doesn't exist or may have been dismissed.",
  },
  export: {
    title: "Export Not Found",
    message: "The export you're looking for doesn't exist or may have expired.",
  },
  user: {
    title: "User Not Found",
    message: "The user you're looking for doesn't exist or may have been removed.",
  },
};

/**
 * NotFound - Display when page or resource is not found
 */
export function NotFound({
  resource = "page",
  onGoHome,
  onSearch,
  onGoBack,
  onBrowseSitemap,
  className,
  title: customTitle,
  message: customMessage,
}: NotFoundProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const { title, message } = resourceMessages[resource] || resourceMessages.page;

  const handleSearch = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  }, [onSearch, searchQuery]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center p-8",
        "bg-[var(--color-surface-subtle)] rounded-xl",
        "border border-[var(--color-border-default)]",
        "max-w-lg mx-auto",
        className
      )}
    >
      {/* Illustration */}
      <motion.div
        variants={itemVariants}
        className="relative w-28 h-28 mb-6"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-info)]/10 flex items-center justify-center">
            <FileQuestion className="w-10 h-10 text-[var(--color-info)]" />
          </div>
        </div>
        
        {/* Decorative 404 numbers */}
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="text-6xl font-bold text-[var(--color-text-tertiary)] opacity-10">
            404
          </span>
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2 text-center"
      >
        {customTitle || title}
      </motion.h3>

      {/* Message */}
      <motion.p
        variants={itemVariants}
        className="text-[var(--color-text-secondary)] text-center mb-6 max-w-sm"
      >
        {customMessage || message}
      </motion.p>

      {/* Search form */}
      {onSearch && (
        <motion.form
          variants={itemVariants}
          onSubmit={handleSearch}
          className="w-full max-w-xs mb-6"
        >
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!searchQuery.trim()}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </motion.form>
      )}

      {/* Action buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-3"
      >
        {onGoBack && (
          <Button
            variant="outline"
            onClick={onGoBack}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
        
        {onGoHome && (
          <Button
            onClick={onGoHome}
            className="flex items-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        )}
        
        {onBrowseSitemap && (
          <Button
            variant="outline"
            onClick={onBrowseSitemap}
            className="flex items-center"
          >
            <Compass className="w-4 h-4 mr-2" />
            Browse
          </Button>
        )}
      </motion.div>

      {/* Helpful links */}
      <motion.div
        variants={itemVariants}
        className="mt-8 pt-6 border-t border-[var(--color-border-default)] w-full"
      >
        <p className="text-sm text-[var(--color-text-tertiary)] text-center mb-3">
          Looking for something else?
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <a
            href="/permits"
            className="text-[var(--color-brand-primary)] hover:underline"
          >
            Browse Permits
          </a>
          <a
            href="/aois"
            className="text-[var(--color-brand-primary)] hover:underline"
          >
            View AOIs
          </a>
          <a
            href="/alerts"
            className="text-[var(--color-brand-primary)] hover:underline"
          >
            Check Alerts
          </a>
          <a
            href="/help"
            className="text-[var(--color-brand-primary)] hover:underline"
          >
            Get Help
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default NotFound;
