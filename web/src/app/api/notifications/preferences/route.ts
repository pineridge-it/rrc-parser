import { NextRequest, NextResponse } from "next/server";

// Mock data store - replace with actual database
const preferencesStore = new Map<string, NotificationPreferences>();

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

const defaultPreferences: NotificationPreferences = {
  userId: "",
  workspaceId: "",
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
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get actual user ID from session
    const userId = request.headers.get("x-user-id") || "mock-user-id";
    const workspaceId = request.headers.get("x-workspace-id") || "mock-workspace-id";
    
    const key = `${userId}:${workspaceId}`;
    let preferences = preferencesStore.get(key);
    
    if (!preferences) {
      // Return default preferences
      preferences = {
        ...defaultPreferences,
        userId,
        workspaceId,
      };
    }
    
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
    // TODO: Get actual user ID from session
    const userId = request.headers.get("x-user-id") || "mock-user-id";
    const workspaceId = request.headers.get("x-workspace-id") || "mock-workspace-id";
    
    const body = await request.json();
    const key = `${userId}:${workspaceId}`;
    
    const existing = preferencesStore.get(key);
    const now = new Date().toISOString();
    
    const preferences: NotificationPreferences = {
      ...(existing || defaultPreferences),
      userId,
      workspaceId,
      quietHours: {
        ...defaultPreferences.quietHours,
        ...body.quietHours,
      },
      digest: {
        ...defaultPreferences.digest,
        ...body.digest,
      },
      emailEnabled: body.emailEnabled ?? existing?.emailEnabled ?? true,
      pushEnabled: body.pushEnabled ?? existing?.pushEnabled ?? true,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    
    preferencesStore.set(key, preferences);
    
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
    // TODO: Get actual user ID from session
    const userId = request.headers.get("x-user-id") || "mock-user-id";
    const workspaceId = request.headers.get("x-workspace-id") || "mock-workspace-id";
    
    const body = await request.json();
    const key = `${userId}:${workspaceId}`;
    
    const existing = preferencesStore.get(key);
    if (!existing) {
      return NextResponse.json(
        { error: "Notification preferences not found" },
        { status: 404 }
      );
    }
    
    const preferences: NotificationPreferences = {
      ...existing,
      ...(body.quietHours && {
        quietHours: { ...existing.quietHours, ...body.quietHours },
      }),
      ...(body.digest && {
        digest: { ...existing.digest, ...body.digest },
      }),
      ...(body.emailEnabled !== undefined && { emailEnabled: body.emailEnabled }),
      ...(body.pushEnabled !== undefined && { pushEnabled: body.pushEnabled }),
      updatedAt: new Date().toISOString(),
    };
    
    preferencesStore.set(key, preferences);
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
