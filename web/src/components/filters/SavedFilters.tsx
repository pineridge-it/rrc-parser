"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, Save, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PermitFilters } from "@/types/permit";

const STORAGE_KEY = "permit-saved-filters";

export interface SavedFilter {
  id: string;
  name: string;
  filters: PermitFilters;
  createdAt: string;
}

interface SavedFiltersProps {
  currentFilters: PermitFilters;
  onApplyFilters: (filters: PermitFilters) => void;
  className?: string;
}

export function SavedFilters({
  currentFilters,
  onApplyFilters,
  className,
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");

  // Load saved filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedFilters(parsed);
      } catch (e) {
        console.error("Failed to parse saved filters:", e);
      }
    }
  }, []);

  // Save to localStorage whenever savedFilters changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters));
  }, [savedFilters]);

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return;

    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: newFilterName.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    };

    setSavedFilters([...savedFilters, newFilter]);
    setNewFilterName("");
    setIsSaveDialogOpen(false);
  };

  const handleDeleteFilter = (id: string) => {
    setSavedFilters(savedFilters.filter((f) => f.id !== id));
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilters(filter.filters);
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Save Current Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSaveDialogOpen(true)}
        disabled={!hasActiveFilters}
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        Save Filter
      </Button>

      {/* Load Saved Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={savedFilters.length === 0}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Load Filter
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {savedFilters.length === 0 ? (
            <DropdownMenuItem disabled>No saved filters</DropdownMenuItem>
          ) : (
            savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => handleApplyFilter(filter)}
                className="flex items-center justify-between group"
              >
                <span className="truncate">{filter.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFilter(filter.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                  aria-label={`Delete ${filter.name}`}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter configuration for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Filter name (e.g., "Texas Drilling Permits")"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveFilter();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!newFilterName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
