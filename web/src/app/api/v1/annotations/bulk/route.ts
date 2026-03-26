import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import {
  bulkAnnotationSchema,
  validateBody,
} from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const body = await request.json();
    const validation = validateBody(body, bulkAnnotationSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { permit_api_numbers, tags, custom_status, assignee_user_id } = validation.data;

    const upserts = permit_api_numbers.map((api_number) => ({
      workspace_id: auth.workspaceId,
      permit_api_number: api_number,
      tags,
      custom_status,
      assignee_user_id,
      created_by: auth.apiKeyId, // Track which API key made the change
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await db
      .from('permit_annotations')
      .upsert(upserts, {
        onConflict: 'workspace_id,permit_api_number',
      })
      .select();

    if (error) {
      throw new Error(`Bulk upsert failed: ${error.message}`);
    }

    return createApiResponse(
      {
        success: true,
        updated_count: data?.length || 0,
        permit_api_numbers,
      },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
