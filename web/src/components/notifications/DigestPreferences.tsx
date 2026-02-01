"use client";

import React, { useState, useEffect } from "react";
import { Mail, Calendar, Clock, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DigestFrequency = "immediate" | "daily" | "weekly";

export interface DigestConfig {
  frequency: DigestFrequency;
  dailyTime?: string;
  weeklyDay?: number;
  weeklyTime?: string;
  timezone: string;
}

interface DigestPreferencesProps {
  value: DigestConfig;
  onChange: (config: DigestConfig) => void;
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

const weekDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const frequencyOptions = [
  {
    value: "immediate" as DigestFrequency,
    label: "Immediate",
    description: "Send alerts as they happen",
    icon: Zap,
  },
  {
    value: "daily" as DigestFrequency,
    label: "Daily Digest",
    description: "One email per day with all alerts",
    icon: Clock,
  },
  {
    value: "weekly" as DigestFrequency,
    label: "Weekly Digest",
    description: "One email per week with all alerts",
    icon: Calendar,
  },
];

export function DigestPreferences({
  value,
  onChange,
  className,
}: DigestPreferencesProps) {
  const [localValue, setLocalValue] = useState<DigestConfig>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleFrequencyChange = (frequency: DigestFrequency) => {
    const newValue = { ...localValue, frequency };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleDailyTimeChange = (dailyTime: string) => {
    const newValue = { ...localValue, dailyTime };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleWeeklyDayChange = (weeklyDay: string) => {
    const newValue = { ...localValue, weeklyDay: parseInt(weeklyDay) };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleWeeklyTimeChange = (weeklyTime: string) => {
    const newValue = { ...localValue, weeklyTime };
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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100">
          <Mail className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Digest Preferences</h3>
          <p className="text-sm text-gray-500">
            Choose how you want to receive alert notifications
          </p>
        </div>
      </div>

      {/* Frequency Selection */}
      <RadioGroup
        value={localValue.frequency}
        onValueChange={(v) => handleFrequencyChange(v as DigestFrequency)}
        className="grid gap-3"
      >
        {frequencyOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Label
              key={option.value}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                localValue.frequency === option.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <RadioGroupItem value={option.value} className="mt-1" />
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    localValue.frequency === option.value
                      ? "bg-indigo-100"
                      : "bg-gray-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      localValue.frequency === option.value
                        ? "text-indigo-600"
                        : "text-gray-500"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>

      {/* Daily Settings */}
      {localValue.frequency === "daily" && (
        <div className="pl-4 space-y-4">
          <div className="space-y-2">
            <Label>Delivery Time</Label>
            <Select
              value={localValue.dailyTime || "09:00"}
              onValueChange={handleDailyTimeChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time" />
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
      )}

      {/* Weekly Settings */}
      {localValue.frequency === "weekly" && (
        <div className="pl-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={String(localValue.weeklyDay || 1)}
                onValueChange={handleWeeklyDayChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Delivery Time</Label>
              <Select
                value={localValue.weeklyTime || "09:00"}
                onValueChange={handleWeeklyTimeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
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
        </div>
      )}

      {/* Timezone */}
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={localValue.timezone} onValueChange={handleTimezoneChange}>
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
          Digest emails include a summary of all permit alerts since your last
          digest. You can change this setting at any time.
        </p>
      </div>
    </div>
  );
}
