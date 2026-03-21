import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import {
  annotationUpsertSchema,
  validateBody,
  apiNumberSchema,
} from '@/lib/validators';

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

    const validation = apiNumberSchema.safeParse(permit_api_number);
    if (!validation.success) {
      return createValidationErrorResponse(
        [{ field: 'permit_api_number', message: 'Invalid API number format' }],
        rateLimit
      );
    }

    const { data, error } = await db
      .from('permit_annotations')
      .select(`
        id,
        workspace_id,
        permit_api_number,
        notes,
        tags,
        custom_status,
        assignee_user_id,
        created_by,
        created_at,
        updated_at
      `)
      .eq('workspace_id', auth.workspaceId)
      .eq('permit_api_number', permit_api_number)
      .maybeSingle();

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return createApiResponse(
      { annotation: data },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function PUT(
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

    const body = await request.json();
    const validation = validateBody(body, annotationUpsertSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { notes, tags, custom_status, assignee_user_id } = validation.data;

    const upsertData = {
      workspace_id: auth.workspaceId,
      permit_api_number,
      notes: notes ?? null,
      tags: tags ?? [],
      custom_status,
      assignee_user_id,
      created_by: auth.userId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('permit_annotations')
      .upsert(upsertData, {
        onConflict: 'workspace_id,permit_api_number',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Upsert failed: ${error.message}`);
    }

    return createApiResponse(
      { annotation: data },
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
    const { permit_api_number } = params;

    const apiValidation = apiNumberSchema.safeParse(permit_api_number);
    if (!apiValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'permit_api_number', message: 'Invalid API number format' }],
        rateLimit
      );
    }

    const { error } = await db
      .from('permit_annotations')
      .delete()
      .eq('workspace_id', auth.workspaceId)
      .eq('permit_api_number', permit_api_number);

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
