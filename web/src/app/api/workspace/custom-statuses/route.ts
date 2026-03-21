import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import {
  customStatusSchema,
  validateBody,
} from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const { data, error } = await db
      .from('workspace_custom_statuses')
      .select('id, status_name, color_hex, sort_order')
      .eq('workspace_id', auth.workspaceId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return createApiResponse(
      { statuses: data },
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
    const validation = validateBody(body, customStatusSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { status_name, color_hex, sort_order } = validation.data;

    const { data, error } = await db
      .from('workspace_custom_statuses')
      .insert({
        workspace_id: auth.workspaceId,
        status_name,
        color_hex,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return createValidationErrorResponse(
          [{ field: 'status_name', message: 'Status with this name already exists' }],
          rateLimit
        );
      }
      throw new Error(`Create failed: ${error.message}`);
    }

    return createApiResponse(
      { status: data },
      201,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
