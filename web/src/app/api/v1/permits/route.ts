import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import { PermitApiResponse } from '../../../../../src/types/api';
import {
  permitsQuerySchema,
  validateQuery,
} from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const url = new URL(request.url);

    // Build query params object from URL search params
    const queryParams: Record<string, string | undefined> = {
      page: url.searchParams.get('page') || '1',
      pageSize: url.searchParams.get('pageSize') || '50',
      county: url.searchParams.get('county') || undefined,
      operator: url.searchParams.get('operator') || undefined,
      status: url.searchParams.get('status') || undefined,
      filedAfter: url.searchParams.get('filedAfter') || undefined,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    // Validate query parameters
    const validation = validateQuery(queryParams, permitsQuerySchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { page, pageSize, county, operator, status, filedAfter } = validation.data;

    let query = db
      .from('permits')
      .select('*', { count: 'exact' })
      .order('issued_date', { ascending: false });

    if (county) {
      query = query.eq('county_code', county);
    }

    if (operator) {
      query = query.ilike('operator_name', `%${operator}%`);
    }

    if (status) {
      query = query.eq('well_status', status);
    }

    if (filedAfter) {
      query = query.gte('received_date', filedAfter);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

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
