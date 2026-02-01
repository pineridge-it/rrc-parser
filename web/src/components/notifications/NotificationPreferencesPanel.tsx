"use client";

import React, { useState, useCallback } from "react";
import { Bell, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { QuietHoursSettings, QuietHoursConfig } from "./QuietHoursSettings";
import { DigestPreferences, DigestConfig } from "./DigestPreferences";

export interface NotificationPreferencesData {
  quietHours: QuietHoursConfig;
  digest: DigestConfig;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

interface NotificationPreferencesPanelProps {
  initialData?: NotificationPreferencesData;
  onSave?: (data: NotificationPreferencesData) => Promise<void>;
  className?: string;
}

const defaultData: NotificationPreferencesData = {
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
    timezone: "America/New_York",
  },
  digest: {
    frequency: "immediate",
    dailyTime: "09:00",
    weeklyDay: 1,
    weeklyTime: "09:00",
    timezone: "America/New_York",
  },
  emailEnabled: true,
  pushEnabled: true,
};

export function NotificationPreferencesPanel({
  initialData = defaultData,
  onSave,
  className,
}: NotificationPreferencesPanelProps) {
  const [data, setData] = useState<NotificationPreferencesData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const handleQuietHoursChange = useCallback((quietHours: QuietHoursConfig) => {
    setData((prev) => ({ ...prev, quietHours }));
    setHasChanges(true);
  }, []);

  const handleDigestChange = useCallback((digest: DigestConfig) => {
    setData((prev) => ({ ...prev, digest }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(data);
      setHasChanges(false);
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "There was an error saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={cn("max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage how and when you receive permit alerts
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quiet Hours */}
        <QuietHoursSettings
          value={data.quietHours}
          onChange={handleQuietHoursChange}
        />

        <Separator />

        {/* Digest Preferences */}
        <DigestPreferences value={data.digest} onChange={handleDigestChange} />

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || !onSave}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
