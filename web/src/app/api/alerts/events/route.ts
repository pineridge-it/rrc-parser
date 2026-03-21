import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import {
  alertEventsQuerySchema,
  validateQuery,
} from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const url = new URL(request.url);
    const queryParams: Record<string, string | undefined> = {
      page: url.searchParams.get('page') || '1',
      pageSize: url.searchParams.get('pageSize') || '50',
      subscription_id: url.searchParams.get('subscription_id') || undefined,
      notification_status: url.searchParams.get('notification_status') || undefined,
    };

    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    const validation = validateQuery(queryParams, alertEventsQuerySchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { page, pageSize, subscription_id, notification_status } = validation.data;

    let query = db
      .from('permit_alert_events')
      .select(`
        id,
        subscription_id,
        permit_api_number,
        old_status,
        new_status,
        detected_at,
        notified_at,
        notification_status,
        permit_alert_subscriptions!inner(
          id,
          name,
          trigger_type,
          workspace_id
        )
      `, { count: 'exact' })
      .eq('permit_alert_subscriptions.workspace_id', auth.workspaceId)
      .order('detected_at', { ascending: false });

    if (subscription_id) {
      query = query.eq('subscription_id', subscription_id);
    }

    if (notification_status) {
      query = query.eq('notification_status', notification_status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const events = (data || []).map((event: Record<string, unknown>) => ({
      id: event.id,
      subscription_id: event.subscription_id,
      permit_api_number: event.permit_api_number,
      old_status: event.old_status,
      new_status: event.new_status,
      detected_at: event.detected_at,
      notified_at: event.notified_at,
      notification_status: event.notification_status,
      subscription: event.permit_alert_subscriptions,
    }));

    return createApiResponse(
      {
        events,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
