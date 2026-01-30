/**
 * User types for authentication and profiles
 */

export type EmailDigestFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';

export interface NotificationPreferences {
  email_digest: EmailDigestFrequency;
  immediate_alerts: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  permit_notifications?: boolean;
  alert_notifications?: boolean;
  billing_notifications?: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone: string;
  notification_preferences: NotificationPreferences;
  is_active: boolean;
  is_superadmin: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone: string;
  notification_preferences: NotificationPreferences;
}

export interface UserUpdateInput {
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
  notification_preferences?: Partial<NotificationPreferences>;
}

export interface UserCreateInput {
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone?: string;
}

export interface UserWithWorkspaces extends User {
  workspaces: UserWorkspaceSummary[];
}

export interface UserWorkspaceSummary {
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  role: string;
}
