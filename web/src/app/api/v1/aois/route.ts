import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import { AoiApiResponse } from '../../../../../src/types/api';
import {
  aoiCreateSchema,
  validateBody,
  validateQuery,
  paginationSchema,
  validatePayloadSize,
  PAYLOAD_SIZE_LIMITS,
} from '@/lib/validators';

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
      .select('id, name, created_at', { count: 'exact' })
      .eq('workspace_id', auth.workspaceId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const aois: AoiApiResponse[] = (data || []).map((aoi) => ({
      id: aoi.id,
      name: aoi.name,
      createdAt: aoi.created_at,
    }));

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

export async function POST(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    // Validate payload size
    const contentLength = request.headers.get('content-length');
    const payloadValidation = validatePayloadSize(
      contentLength ? parseInt(contentLength, 10) : null,
      PAYLOAD_SIZE_LIMITS.default
    );
    if (!payloadValidation.valid) {
      return createValidationErrorResponse(
        [{ field: 'payload', message: payloadValidation.error }],
        rateLimit
      );
    }

    const body = await request.json();

    // Validate request body against schema
    const validation = validateBody(body, aoiCreateSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { name, geometry, bufferMeters } = validation.data;

    const { data, error } = await db
      .from('aois')
      .insert({
        workspace_id: auth.workspaceId,
        name,
        geom: geometry,
        buffer_meters: bufferMeters || null,
        created_at: new Date().toISOString(),
      })
      .select('id, name, created_at')
      .single();

    if (error) {
      throw new Error(`Failed to create AOI: ${error.message}`);
    }

    const aoi: AoiApiResponse = {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
    };

    return createApiResponse(aoi, 201, rateLimit);
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
