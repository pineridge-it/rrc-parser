import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../../src/lib/database';
import {
  customStatusUpdateSchema,
  validateBody,
  uuidSchema,
} from '@/lib/validators';

interface RouteParams {
  params: { id: string };
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
        [{ field: 'id', message: 'Invalid status ID format' }],
        rateLimit
      );
    }

    const body = await request.json();
    const validation = validateBody(body, customStatusUpdateSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.status_name !== undefined) {
      updateData.status_name = validation.data.status_name;
    }
    if (validation.data.color_hex !== undefined) {
      updateData.color_hex = validation.data.color_hex;
    }
    if (validation.data.sort_order !== undefined) {
      updateData.sort_order = validation.data.sort_order;
    }

    if (Object.keys(updateData).length === 0) {
      return createValidationErrorResponse(
        [{ field: 'body', message: 'No valid update fields provided' }],
        rateLimit
      );
    }

    const { data, error } = await db
      .from('workspace_custom_statuses')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', auth.workspaceId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return createValidationErrorResponse(
          [{ field: 'status_name', message: 'Status with this name already exists' }],
          rateLimit
        );
      }
      throw new Error(`Update failed: ${error.message}`);
    }

    if (!data) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Status not found' }],
        rateLimit
      );
    }

    return createApiResponse(
      { status: data },
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
        [{ field: 'id', message: 'Invalid status ID format' }],
        rateLimit
      );
    }

    const { error } = await db
      .from('workspace_custom_statuses')
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
