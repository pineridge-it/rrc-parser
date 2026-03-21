import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import {
  paginationSchema,
  validateQuery,
  aoiUpdateSchema,
  validateBody,
} from '@/lib/validators';

interface RouteParams {
  params: { id: string };
}

// Get all AOIs in the library
export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') || '1',
      pageSize: url.searchParams.get('pageSize') || '50',
    };

    // Validate query parameters
    const validation = validateQuery(queryParams, paginationSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { page, limit: pageSize } = validation.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await db
      .from('aois')
      .select('id, name, created_at, updated_at, aoi_type', { count: 'exact' })
      .eq('workspace_id', auth.workspaceId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const aois = data || [];

    return createApiResponse(
      {
        aois,
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

// Update an AOI
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { id } = params;

    const body = await request.json();

    // Validate request body
    const validation = validateBody(body, aoiUpdateSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { name } = validation.data;

    // Update AOI
    const { data, error } = await db
      .from('aois')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', auth.workspaceId)
      .select('id, name, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(`Failed to update AOI: ${error.message}`);
    }

    if (!data) {
      return createApiResponse(
        { error: 'AOI not found' },
        404,
        rateLimit
      );
    }

    return createApiResponse(data, 200, rateLimit);
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

// Delete an AOI
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { id } = params;

    // Delete AOI
    const { error } = await db
      .from('aois')
      .delete()
      .eq('id', id)
      .eq('workspace_id', auth.workspaceId);

    if (error) {
      throw new Error(`Failed to delete AOI: ${error.message}`);
    }

    return createApiResponse(
      { message: 'AOI deleted successfully' },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}