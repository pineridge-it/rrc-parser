"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRange {
  from?: string;
  to?: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

interface DatePreset {
  label: string;
  getValue: () => DateRange;
}

const getToday = () => new Date().toISOString().split("T")[0];
const getDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};
const getStartOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  return date.toISOString().split("T")[0];
};
const getStartOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split("T")[0];
};
const getStartOfYear = () => {
  const date = new Date();
  date.setMonth(0, 1);
  return date.toISOString().split("T")[0];
};

const PRESETS: DatePreset[] = [
  {
    label: "Today",
    getValue: () => ({ from: getToday(), to: getToday() }),
  },
  {
    label: "Yesterday",
    getValue: () => ({ from: getDaysAgo(1), to: getDaysAgo(1) }),
  },
  {
    label: "Last 7 days",
    getValue: () => ({ from: getDaysAgo(7), to: getToday() }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({ from: getDaysAgo(30), to: getToday() }),
  },
  {
    label: "This week",
    getValue: () => ({ from: getStartOfWeek(), to: getToday() }),
  },
  {
    label: "This month",
    getValue: () => ({ from: getStartOfMonth(), to: getToday() }),
  },
  {
    label: "This year",
    getValue: () => ({ from: getStartOfYear(), to: getToday() }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayValue = () => {
    if (value.from && value.to) {
      return `${formatDate(value.from)} - ${formatDate(value.to)}`;
    }
    if (value.from) {
      return `From ${formatDate(value.from)}`;
    }
    if (value.to) {
      return `Until ${formatDate(value.to)}`;
    }
    return "Select date range";
  };

  const handlePresetClick = (preset: DatePreset) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({});
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value.from && !value.to && "text-muted-foreground",
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayValue()}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="px-3 py-1.5 text-sm rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">
              Custom Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  From
                </label>
                <input
                  type="date"
                  value={value.from || ""}
                  onChange={(e) =>
                    onChange({ ...value, from: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  To
                </label>
                <input
                  type="date"
                  value={value.to || ""}
                  onChange={(e) =>
                    onChange({ ...value, to: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
