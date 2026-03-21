import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../../src/lib/database';
import { apiNumberSchema } from '@/lib/validators';

interface RouteParams {
  params: { permit_api_number: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { permit_api_number } = params;

    const apiValidation = apiNumberSchema.safeParse(permit_api_number);
    if (!apiValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'permit_api_number', message: 'Invalid API number format' }],
        rateLimit
      );
    }

    const { data: annotation } = await db
      .from('permit_annotations')
      .select('id')
      .eq('workspace_id', auth.workspaceId)
      .eq('permit_api_number', permit_api_number)
      .maybeSingle();

    if (!annotation) {
      return createApiResponse(
        { history: [] },
        200,
        rateLimit
      );
    }

    const { data, error } = await db
      .from('permit_annotation_history')
      .select(`
        id,
        changed_by,
        changed_at,
        field_name,
        old_value,
        new_value
      `)
      .eq('annotation_id', annotation.id)
      .order('changed_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return createApiResponse(
      { history: data },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
