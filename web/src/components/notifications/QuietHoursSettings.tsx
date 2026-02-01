"use client";

import React, { useState, useEffect } from "react";
import { Moon, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

interface QuietHoursSettingsProps {
  value: QuietHoursConfig;
  onChange: (config: QuietHoursConfig) => void;
  className?: string;
}

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const label = new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { value, label };
});

export function QuietHoursSettings({
  value,
  onChange,
  className,
}: QuietHoursSettingsProps) {
  const [localValue, setLocalValue] = useState<QuietHoursConfig>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleEnabledChange = (enabled: boolean) => {
    const newValue = { ...localValue, enabled };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleStartTimeChange = (startTime: string) => {
    const newValue = { ...localValue, startTime };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleEndTimeChange = (endTime: string) => {
    const newValue = { ...localValue, endTime };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleTimezoneChange = (timezone: string) => {
    const newValue = { ...localValue, timezone };
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Moon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quiet Hours</h3>
            <p className="text-sm text-gray-500">
              Pause notifications during specific hours
            </p>
          </div>
        </div>
        <Switch
          checked={localValue.enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {/* Settings */}
      {localValue.enabled && (
        <div className="space-y-4 pl-11">
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                Start Time
              </Label>
              <Select
                value={localValue.startTime}
                onValueChange={handleStartTimeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                End Time
              </Label>
              <Select
                value={localValue.endTime}
                onValueChange={handleEndTimeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={localValue.timezone}
              onValueChange={handleTimezoneChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Alerts received during quiet hours will be queued and delivered
              when quiet hours end, or included in your next digest.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
