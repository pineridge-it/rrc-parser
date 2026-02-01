"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PermitFilters } from "@/types/permit";

/**
 * Hook to sync filter state with URL query parameters
 * Enables shareable filter URLs and browser history support
 */
export function useFilterUrlSync(
  filters: PermitFilters,
  setFilters: (filters: PermitFilters) => void
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse URL params into filters on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const urlFilters: PermitFilters = {};

    // Text search
    const textSearch = params.get("q");
    if (textSearch) urlFilters.textSearch = textSearch;

    // Counties
    const counties = params.get("counties");
    if (counties) urlFilters.counties = counties.split(",");

    // Operators
    const operators = params.get("operators");
    if (operators) urlFilters.operators = operators.split(",");

    // Statuses
    const statuses = params.get("statuses");
    if (statuses) urlFilters.statuses = statuses.split(",");

    // Permit types
    const permitTypes = params.get("types");
    if (permitTypes) urlFilters.permitTypes = permitTypes.split(",");

    // Filed date range
    const filedFrom = params.get("filedFrom");
    const filedTo = params.get("filedTo");
    if (filedFrom || filedTo) {
      urlFilters.filedDateRange = {
        from: filedFrom || undefined,
        to: filedTo || undefined,
      };
    }

    // Approved date range
    const approvedFrom = params.get("approvedFrom");
    const approvedTo = params.get("approvedTo");
    if (approvedFrom || approvedTo) {
      urlFilters.approvedDateRange = {
        from: approvedFrom || undefined,
        to: approvedTo || undefined,
      };
    }

    // Only update if there are URL params
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, []); // Only run on mount

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.textSearch) params.set("q", filters.textSearch);
    if (filters.counties?.length) params.set("counties", filters.counties.join(","));
    if (filters.operators?.length) params.set("operators", filters.operators.join(","));
    if (filters.statuses?.length) params.set("statuses", filters.statuses.join(","));
    if (filters.permitTypes?.length) params.set("types", filters.permitTypes.join(","));
    if (filters.filedDateRange?.from) params.set("filedFrom", filters.filedDateRange.from);
    if (filters.filedDateRange?.to) params.set("filedTo", filters.filedDateRange.to);
    if (filters.approvedDateRange?.from) params.set("approvedFrom", filters.approvedDateRange.from);
    if (filters.approvedDateRange?.to) params.set("approvedTo", filters.approvedDateRange.to);

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    // Use replace to avoid polluting browser history
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router]);

  // Get shareable URL
  const getShareableUrl = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.textSearch) params.set("q", filters.textSearch);
    if (filters.counties?.length) params.set("counties", filters.counties.join(","));
    if (filters.operators?.length) params.set("operators", filters.operators.join(","));
    if (filters.statuses?.length) params.set("statuses", filters.statuses.join(","));
    if (filters.permitTypes?.length) params.set("types", filters.permitTypes.join(","));
    if (filters.filedDateRange?.from) params.set("filedFrom", filters.filedDateRange.from);
    if (filters.filedDateRange?.to) params.set("filedTo", filters.filedDateRange.to);
    if (filters.approvedDateRange?.from) params.set("approvedFrom", filters.approvedDateRange.from);
    if (filters.approvedDateRange?.to) params.set("approvedTo", filters.approvedDateRange.to);

    return params.toString()
      ? `${window.location.origin}${pathname}?${params.toString()}`
      : `${window.location.origin}${pathname}`;
  }, [filters, pathname]);

  return { getShareableUrl };
}
