import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import {
  digestPreferencesSchema,
  validateBody,
} from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const { data, error } = await db
      .from('user_digest_preferences')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('workspace_id', auth.workspaceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return createApiResponse(
      { preferences: data || null },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const body = await request.json();
    const validation = validateBody(body, digestPreferencesSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const {
      digest_enabled,
      digest_frequency,
      digest_day_of_week,
      digest_hour_utc,
      include_saved_searches,
      include_status_changes,
      include_new_operators
    } = validation.data;

    const { data, error } = await db
      .from('user_digest_preferences')
      .upsert({
        user_id: auth.userId,
        workspace_id: auth.workspaceId,
        digest_enabled,
        digest_frequency,
        digest_day_of_week,
        digest_hour_utc,
        include_saved_searches,
        include_status_changes,
        include_new_operators,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,workspace_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update digest preferences: ${error.message}`);
    }

    return createApiResponse(
      { preferences: data },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
