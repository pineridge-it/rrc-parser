import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../../src/lib/database';

interface RouteParams {
  params: { name: string };
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { name } = params;

    if (!name || name.length > 50) {
      return createValidationErrorResponse(
        [{ field: 'name', message: 'Invalid tag name' }],
        rateLimit
      );
    }

    const { error } = await db
      .from('workspace_tag_definitions')
      .delete()
      .eq('workspace_id', auth.workspaceId)
      .eq('tag_name', decodeURIComponent(name));

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
