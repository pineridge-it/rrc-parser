import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import {
  alertSubscriptionCreateSchema,
  validateBody,
} from '@/lib/validators';

const MAX_SUBSCRIPTIONS_PER_WORKSPACE = parseInt(process.env.MAX_ALERT_SUBSCRIPTIONS_PER_WORKSPACE || '100', 10);

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const { data, error } = await db
      .from('permit_alert_subscriptions')
      .select(`
        id,
        workspace_id,
        user_id,
        name,
        trigger_type,
        permit_api_number,
        saved_search_id,
        watched_statuses,
        notify_channels,
        is_active,
        created_at
      `)
      .eq('workspace_id', auth.workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return createApiResponse(
      { subscriptions: data },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const body = await request.json();
    const validation = validateBody(body, alertSubscriptionCreateSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { count, error: countError } = await db
      .from('permit_alert_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', auth.workspaceId);

    if (countError) {
      throw new Error(`Subscription count check failed: ${countError.message}`);
    }

    if ((count || 0) >= MAX_SUBSCRIPTIONS_PER_WORKSPACE) {
      return createValidationErrorResponse(
        [{
          field: 'workspace',
          message: `Maximum of ${MAX_SUBSCRIPTIONS_PER_WORKSPACE} alert subscriptions per workspace exceeded`
        }],
        rateLimit
      );
    }

    const { data, error } = await db
      .from('permit_alert_subscriptions')
      .insert({
        workspace_id: auth.workspaceId,
        user_id: null, // API key authentication - no specific user context
        name: validation.data.name,
        trigger_type: validation.data.trigger_type,
        permit_api_number: validation.data.permit_api_number,
        saved_search_id: validation.data.saved_search_id,
        watched_statuses: validation.data.watched_statuses,
        notify_channels: validation.data.notify_channels,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Create failed: ${error.message}`);
    }

    return createApiResponse(
      { subscription: data },
      201,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
