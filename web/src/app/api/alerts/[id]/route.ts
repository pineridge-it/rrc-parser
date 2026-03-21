import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../../src/lib/database';
import {
  alertSubscriptionUpdateSchema,
  validateBody,
  uuidSchema,
} from '@/lib/validators';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { id } = params;

    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid subscription ID format' }],
        rateLimit
      );
    }

    const { data: subscription, error: subError } = await db
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
      .eq('id', id)
      .eq('workspace_id', auth.workspaceId)
      .maybeSingle();

    if (subError) {
      throw new Error(`Database query failed: ${subError.message}`);
    }

    if (!subscription) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Subscription not found' }],
        rateLimit
      );
    }

    const { data: events, error: eventsError } = await db
      .from('permit_alert_events')
      .select(`
        id,
        permit_api_number,
        old_status,
        new_status,
        detected_at,
        notified_at,
        notification_status
      `)
      .eq('subscription_id', id)
      .order('detected_at', { ascending: false })
      .limit(20);

    if (eventsError) {
      throw new Error(`Events query failed: ${eventsError.message}`);
    }

    return createApiResponse(
      { subscription, recent_events: events || [] },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { id } = params;

    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid subscription ID format' }],
        rateLimit
      );
    }

    const body = await request.json();
    const validation = validateBody(body, alertSubscriptionUpdateSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { data, error } = await db
      .from('permit_alert_subscriptions')
      .update(validation.data)
      .eq('id', id)
      .eq('workspace_id', auth.workspaceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    if (!data) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Subscription not found' }],
        rateLimit
      );
    }

    return createApiResponse(
      { subscription: data },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { id } = params;

    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid subscription ID format' }],
        rateLimit
      );
    }

    const { error } = await db
      .from('permit_alert_subscriptions')
      .delete()
      .eq('id', id)
      .eq('workspace_id', auth.workspaceId);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return createApiResponse(
      { success: true },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
