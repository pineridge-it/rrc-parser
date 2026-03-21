'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface DigestPreferences {
  digest_enabled: boolean;
  digest_frequency: 'daily' | 'weekly' | 'off';
  digest_day_of_week: number;
  digest_hour_utc: number;
  include_saved_searches: boolean;
  include_status_changes: boolean;
  include_new_operators: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const HOURS_UTC = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00 UTC`,
}));

export default function DigestSettingsPage() {
  const [preferences, setPreferences] = useState<DigestPreferences>({
    digest_enabled: true,
    digest_frequency: 'weekly',
    digest_day_of_week: 1, // Monday
    digest_hour_utc: 8, // 8 AM UTC
    include_saved_searches: true,
    include_status_changes: true,
    include_new_operators: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/digest/preferences');
        if (!response.ok) {
          throw new Error('Failed to fetch digest preferences');
        }
        const data = await response.json();

        if (data.preferences) {
          setPreferences({
            digest_enabled: data.preferences.digest_enabled,
            digest_frequency: data.preferences.digest_frequency,
            digest_day_of_week: data.preferences.digest_day_of_week,
            digest_hour_utc: data.preferences.digest_hour_utc,
            include_saved_searches: data.preferences.include_saved_searches,
            include_status_changes: data.preferences.include_status_changes,
            include_new_operators: data.preferences.include_new_operators,
          });
        }
      } catch (error) {
        toast.error('Failed to load digest preferences');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Handle preference changes
  const handleFrequencyChange = (value: 'daily' | 'weekly' | 'off') => {
    setPreferences(prev => ({
      ...prev,
      digest_frequency: value,
      // Reset day of week for daily digests
      digest_day_of_week: value === 'daily' ? 0 : prev.digest_day_of_week,
    }));
  };

  const handleDayChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      digest_day_of_week: parseInt(value, 10),
    }));
  };

  const handleHourChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      digest_hour_utc: parseInt(value, 10),
    }));
  };

  const handleToggle = (field: keyof DigestPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/digest/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save digest preferences');
      }

      toast.success('Digest preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save digest preferences');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Digest Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your weekly digest email preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Digest Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Digest */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="digest-enabled" className="text-base font-medium">
                Enable Email Digest
              </Label>
              <p className="text-sm text-gray-500">
                Receive a summary of permit activity in your watched areas
              </p>
            </div>
            <Switch
              id="digest-enabled"
              checked={preferences.digest_enabled}
              onCheckedChange={() => handleToggle('digest_enabled')}
            />
          </div>

          {preferences.digest_enabled && (
            <>
              {/* Frequency */}
              <div>
                <Label className="text-base font-medium">Digest Frequency</Label>
                <p className="text-sm text-gray-500 mb-3">
                  How often would you like to receive digest emails?
                </p>
                <Select
                  value={preferences.digest_frequency}
                  onValueChange={handleFrequencyChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              {preferences.digest_frequency !== 'off' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {preferences.digest_frequency === 'weekly' && (
                    <div>
                      <Label className="text-base font-medium">Day of Week</Label>
                      <p className="text-sm text-gray-500 mb-3">
                        Which day of the week should we send your digest?
                      </p>
                      <Select
                        value={preferences.digest_day_of_week.toString()}
                        onValueChange={handleDayChange}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map(day => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-base font-medium">Time of Day</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      What time should we send your digest? (UTC)
                    </p>
                    <Select
                      value={preferences.digest_hour_utc.toString()}
                      onValueChange={handleHourChange}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS_UTC.map(hour => (
                          <SelectItem key={hour.value} value={hour.value.toString()}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Content Preferences */}
              <div>
                <Label className="text-base font-medium">Content Preferences</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Choose what information to include in your digest
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="include-saved-searches" className="font-medium">
                        Saved Search Results
                      </Label>
                      <p className="text-sm text-gray-500">
                        Include new permits from your saved searches
                      </p>
                    </div>
                    <Switch
                      id="include-saved-searches"
                      checked={preferences.include_saved_searches}
                      onCheckedChange={() => handleToggle('include_saved_searches')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="include-status-changes" className="font-medium">
                        Status Changes
                      </Label>
                      <p className="text-sm text-gray-500">
                        Include permits that changed status
                      </p>
                    </div>
                    <Switch
                      id="include-status-changes"
                      checked={preferences.include_status_changes}
                      onCheckedChange={() => handleToggle('include_status_changes')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="include-new-operators" className="font-medium">
                        New Operators
                      </Label>
                      <p className="text-sm text-gray-500">
                        Include operators that filed their first permit
                      </p>
                    </div>
                    <Switch
                      id="include-new-operators"
                      checked={preferences.include_new_operators}
                      onCheckedChange={() => handleToggle('include_new_operators')}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Digest Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Your digest will include:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
            <li>Summary of new permits in your saved searches</li>
            <li>Status changes for permits you're watching</li>
            <li>New operators entering your watched areas</li>
            <li>County activity heatmap</li>
            <li>Quick links to view permits in the app</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Note: Digest emails are sent according to your schedule above. You can unsubscribe at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="include-new-operators"
                    type="checkbox"
                    checked={preferences.include_new_operators}
                    onChange={(e) => handlePreferenceChange('include_new_operators', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="include-new-operators" className="font-medium text-gray-700">
                    New operator entrants
                  </label>
                  <p className="text-gray-500">
                    Include operators that filed permits in your areas for the first time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Send a preview of your digest to your email to see what it will look like.
              </p>
              <button
                type="button"
                onClick={handlePreviewDigest}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send Preview
              </button>
            </div>
          </div>

          {/* History Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">History</h2>
            {preferences.last_digest_sent_at ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Last digest sent:{' '}
                  {new Date(preferences.last_digest_sent_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  No digest has been sent yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}