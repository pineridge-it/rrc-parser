import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    
    // TODO: Fetch from database
    // For now, return default preferences
    const preferences: NotificationPreferences = {
      ...defaultPreferences,
      userId: user.id,
      workspaceId,
    };
    
    return NextResponse.json(preferences);
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
 * Create or update notification preferences
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
    
    const body = await request.json();
    const workspaceId = body.workspaceId || user.user_metadata?.default_workspace_id;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    // TODO: Save to database
    const preferences: NotificationPreferences = {
      userId: user.id,
      workspaceId,
      quietHours: {
        ...defaultPreferences.quietHours,
        ...body.quietHours,
      },
      digest: {
        ...defaultPreferences.digest,
        ...body.digest,
      },
      emailEnabled: body.emailEnabled ?? true,
      pushEnabled: body.pushEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
    
    return NextResponse.json(preferences);
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
    
    const body = await request.json();
    const workspaceId = body.workspaceId || user.user_metadata?.default_workspace_id;
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }
    
    // TODO: Fetch existing from database and merge
    const now = new Date().toISOString();
    
    const preferences: NotificationPreferences = {
      ...defaultPreferences,
      userId: user.id,
      workspaceId,
      quietHours: body.quietHours ? {
        ...defaultPreferences.quietHours,
        ...body.quietHours,
      } : defaultPreferences.quietHours,
      digest: body.digest ? {
        ...defaultPreferences.digest,
        ...body.digest,
      } : defaultPreferences.digest,
      emailEnabled: body.emailEnabled ?? defaultPreferences.emailEnabled,
      pushEnabled: body.pushEnabled ?? defaultPreferences.pushEnabled,
      createdAt: now,
      updatedAt: now,
    };
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}