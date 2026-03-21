import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import { OperatorApiResponse } from '../../../../../src/types/api';
import {
  operatorsQuerySchema,
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
      search: url.searchParams.get('search') || undefined,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    // Validate query parameters
    const validation = validateQuery(queryParams, operatorsQuerySchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { page, pageSize, search } = validation.data;

    let query = db
      .from('operators')
      .select('id, canonical_name', { count: 'exact' })
      .order('canonical_name', { ascending: true });

    if (search) {
      query = query.ilike('canonical_name', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const operatorIds = (data || []).map((op) => op.id);

    // Aggregate permit counts server-side to avoid fetching all rows
    const { data: permitCounts, error: countError } = await db
      .from('permits')
      .select('operator_id')
      .in('operator_id', operatorIds);

    if (countError) {
      throw new Error(`Failed to fetch permit counts: ${countError.message}`);
    }

    const permitCountMap = new Map<string, number>();
    (permitCounts || []).forEach((p) => {
      const id = p.operator_id;
      permitCountMap.set(id, (permitCountMap.get(id) || 0) + 1);
    });

    const operators: OperatorApiResponse[] = (data || []).map((operator) => ({
      id: operator.id,
      canonicalName: operator.canonical_name,
      permitCount: permitCountMap.get(operator.id) || 0,
    }));

    return createApiResponse(
      {
        operators,
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
