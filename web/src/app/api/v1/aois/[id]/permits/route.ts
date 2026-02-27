import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import { PermitApiResponse } from '../../../../../../src/types/api';
import {
  uuidSchema,
  validateQuery,
  paginationSchema,
} from '@/lib/validators';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);

    // Validate AOI ID format
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid AOI ID format' }],
        rateLimit
      );
    }

    const db = createDatabaseClient();
    const aoiId = params.id;

    const { data: aoiData, error: aoiError } = await db
      .from('aois')
      .select('id, geom')
      .eq('id', aoiId)
      .eq('workspace_id', auth.workspaceId)
      .single();

    if (aoiError || !aoiData) {
      throw new Error('AOI not found or access denied');
    }

    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('pageSize') || '50',
    };

    // Validate pagination parameters
    const paginationValidation = validateQuery(queryParams, paginationSchema);
    if (!paginationValidation.success) {
      return createValidationErrorResponse(paginationValidation.errors, rateLimit);
    }

    const { page, limit: pageSize } = paginationValidation.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await db
      .from('permits')
      .select('*', { count: 'exact' })
      .not('surface_location', 'is', null)
      .order('issued_date', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const permits: PermitApiResponse[] = (data || []).map((permit) => ({
      id: permit.id,
      permitNumber: permit.permit_number,
      operatorName: permit.operator_name,
      county: permit.county_code,
      district: permit.district,
      wellNumber: permit.well_number,
      filedDate: permit.received_date,
      status: permit.well_status,
      location: {
        latitude: permit.surface_latitude,
        longitude: permit.surface_longitude,
      },
    }));

    return createApiResponse(
      {
        aoiId,
        permits,
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
