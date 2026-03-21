import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import {
  digestPreferencesUpdateSchema,
  validateBody,
} from '@/lib/validators';

const DEFAULT_PREFERENCES = {
  digest_enabled: true,
  digest_frequency: 'weekly' as const,
  digest_day_of_week: 1,
  digest_hour_utc: 8,
  include_saved_searches: true,
  include_status_changes: true,
  include_new_operators: true,
};

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const { data, error } = await db
      .from('user_digest_preferences')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('workspace_id', auth.workspaceId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const preferences = data || {
      user_id: auth.userId,
      workspace_id: auth.workspaceId,
      ...DEFAULT_PREFERENCES,
      last_digest_sent_at: null,
      created_at: null,
      updated_at: null,
    };

    return createApiResponse(
      { preferences },
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
    const validation = validateBody(body, digestPreferencesUpdateSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { data: existing } = await db
      .from('user_digest_preferences')
      .select('user_id')
      .eq('user_id', auth.userId)
      .eq('workspace_id', auth.workspaceId)
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      const result = await db
        .from('user_digest_preferences')
        .update(validation.data)
        .eq('user_id', auth.userId)
        .eq('workspace_id', auth.workspaceId)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await db
        .from('user_digest_preferences')
        .insert({
          user_id: auth.userId,
          workspace_id: auth.workspaceId,
          ...DEFAULT_PREFERENCES,
          ...validation.data,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      throw new Error(`Upsert failed: ${error.message}`);
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
