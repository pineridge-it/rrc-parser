import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  notificationPreferencesSchema, 
  validateBody,
  workspaceIdSchema,
  type ValidationError 
} from "@/lib/validators";

interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

interface DigestPreferences {
  frequency: "immediate" | "daily" | "weekly";
  dailyTime?: string;
  weeklyDay?: number;
  weeklyTime?: string;
  timezone: string;
}

interface NotificationPreferences {
  userId: string;
  workspaceId: string;
  quietHours: QuietHours;
  digest: DigestPreferences;
  emailEnabled: boolean;
  pushEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Database row type
interface NotificationPreferencesRow {
  id: string;
  user_id: string;
  workspace_id: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start_time: string;
  quiet_hours_end_time: string;
  quiet_hours_timezone: string;
  digest_frequency: "immediate" | "daily" | "weekly";
  digest_daily_time: string | null;
  digest_weekly_day: number | null;
  digest_weekly_time: string | null;
  digest_timezone: string;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<NotificationPreferences, 'userId' | 'workspaceId'> = {
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Helper to get authenticated user
 */
async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Validate workspace ID format
 */
function validateWorkspaceId(workspaceId: string): { valid: true } | { valid: false; errors: ValidationError[] } {
  const result = workspaceIdSchema.safeParse(workspaceId);
  if (result.success) {
    return { valid: true };
  }
  return { 
    valid: false, 
    errors: result.error.errors.map(e => ({ field: 'workspaceId', message: e.message }))
  };
}

/**
 * Convert database row to API response format
 */
function rowToPreferences(row: NotificationPreferencesRow): NotificationPreferences {
  return {
    userId: row.user_id,
    workspaceId: row.workspace_id,
    quietHours: {
      enabled: row.quiet_hours_enabled,
      startTime: row.quiet_hours_start_time,
      endTime: row.quiet_hours_end_time,
      timezone: row.quiet_hours_timezone,
    },
    digest: {
      frequency: row.digest_frequency,
      dailyTime: row.digest_daily_time || undefined,
      weeklyDay: row.digest_weekly_day || undefined,
      weeklyTime: row.digest_weekly_time || undefined,
      timezone: row.digest_timezone,
    },
    emailEnabled: row.email_enabled,
    pushEnabled: row.push_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get workspace from query param or use user's default workspace
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || user.user_metadata?.default_workspace_id;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }
    
    // Validate workspace ID format
    const workspaceValidation = validateWorkspaceId(workspaceId);
    if (!workspaceValidation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: workspaceValidation.errors },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Fetch preferences from database
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .single();
    
    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Error fetching notification preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch notification preferences" },
        { status: 500 }
      );
    }
    
    // If no preferences found, return defaults
    if (!data) {
      const preferences: NotificationPreferences = {
        ...defaultPreferences,
        userId: user.id,
        workspaceId,
      };
      return NextResponse.json(preferences);
    }
    
    return NextResponse.json(rowToPreferences(data as NotificationPreferencesRow));
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/preferences
 * Create or update notification preferences (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Validate workspace ID
    const workspaceId = body.workspaceId || user.user_metadata?.default_workspace_id;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }
    
    const workspaceValidation = validateWorkspaceId(workspaceId);
    if (!workspaceValidation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: workspaceValidation.errors },
        { status: 400 }
      );
    }
    
    // Validate preferences body using Zod schema
    const validation = validateBody(body, notificationPreferencesSchema);
    if (!validation.success) {
      // Log validation failures for security monitoring
      console.warn("Validation failed for notification preferences:", {
        userId: user.id,
        workspaceId,
        errors: validation.errors,
      });
      
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }
    
    const validatedBody = validation.data;
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    // Prepare the database row using validated data
    const row = {
      user_id: user.id,
      workspace_id: workspaceId,
      quiet_hours_enabled: validatedBody.quietHours?.enabled ?? defaultPreferences.quietHours.enabled,
      quiet_hours_start_time: validatedBody.quietHours?.startTime ?? defaultPreferences.quietHours.startTime,
      quiet_hours_end_time: validatedBody.quietHours?.endTime ?? defaultPreferences.quietHours.endTime,
      quiet_hours_timezone: validatedBody.quietHours?.timezone ?? defaultPreferences.quietHours.timezone,
      digest_frequency: validatedBody.digest?.frequency ?? defaultPreferences.digest.frequency,
      digest_daily_time: validatedBody.digest?.dailyTime ?? defaultPreferences.digest.dailyTime,
      digest_weekly_day: validatedBody.digest?.weeklyDay ?? defaultPreferences.digest.weeklyDay,
      digest_weekly_time: validatedBody.digest?.weeklyTime ?? defaultPreferences.digest.weeklyTime,
      digest_timezone: validatedBody.digest?.timezone ?? defaultPreferences.digest.timezone,
      email_enabled: validatedBody.emailEnabled ?? defaultPreferences.emailEnabled,
      push_enabled: validatedBody.pushEnabled ?? defaultPreferences.pushEnabled,
      updated_at: now,
    };
    
    // Upsert the preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(row, {
        onConflict: "user_id,workspace_id",
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving notification preferences:", error);
      return NextResponse.json(
        { error: "Failed to save notification preferences" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(rowToPreferences(data as NotificationPreferencesRow));
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to save notification preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Partial update of notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Validate workspace ID
    const workspaceId = body.workspaceId || user.user_metadata?.default_workspace_id;
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }
    
    const workspaceValidation = validateWorkspaceId(workspaceId);
    if (!workspaceValidation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: workspaceValidation.errors },
        { status: 400 }
      );
    }
    
    // For PATCH, we use partial validation - only validate fields that are present
    // Create a partial schema by making all fields optional
    const partialPreferencesSchema = notificationPreferencesSchema.partial();
    const validation = validateBody(body, partialPreferencesSchema);
    
    if (!validation.success) {
      console.warn("Validation failed for PATCH notification preferences:", {
        userId: user.id,
        workspaceId,
        errors: validation.errors,
      });
      
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }
    
    const validatedBody = validation.data;
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    // Build update object dynamically based on validated fields
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };
    
    if (validatedBody.quietHours) {
      if (validatedBody.quietHours.enabled !== undefined) {
        updateData.quiet_hours_enabled = validatedBody.quietHours.enabled;
      }
      if (validatedBody.quietHours.startTime !== undefined) {
        updateData.quiet_hours_start_time = validatedBody.quietHours.startTime;
      }
      if (validatedBody.quietHours.endTime !== undefined) {
        updateData.quiet_hours_end_time = validatedBody.quietHours.endTime;
      }
      if (validatedBody.quietHours.timezone !== undefined) {
        updateData.quiet_hours_timezone = validatedBody.quietHours.timezone;
      }
    }
    
    if (validatedBody.digest) {
      if (validatedBody.digest.frequency !== undefined) {
        updateData.digest_frequency = validatedBody.digest.frequency;
      }
      if (validatedBody.digest.dailyTime !== undefined) {
        updateData.digest_daily_time = validatedBody.digest.dailyTime;
      }
      if (validatedBody.digest.weeklyDay !== undefined) {
        updateData.digest_weekly_day = validatedBody.digest.weeklyDay;
      }
      if (validatedBody.digest.weeklyTime !== undefined) {
        updateData.digest_weekly_time = validatedBody.digest.weeklyTime;
      }
      if (validatedBody.digest.timezone !== undefined) {
        updateData.digest_timezone = validatedBody.digest.timezone;
      }
    }
    
    if (validatedBody.emailEnabled !== undefined) {
      updateData.email_enabled = validatedBody.emailEnabled;
    }
    if (validatedBody.pushEnabled !== undefined) {
      updateData.push_enabled = validatedBody.pushEnabled;
    }
    
    // Update the preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .update(updateData)
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating notification preferences:", error);
      return NextResponse.json(
        { error: "Failed to update notification preferences" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(rowToPreferences(data as NotificationPreferencesRow));
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}