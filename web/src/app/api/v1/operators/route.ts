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
      search: url.searchParams.get('search') || url.searchParams.get('q') || undefined,
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

    // Use operator_stats_summary materialized view for fast queries
    let query = db
      .from('operator_stats_summary')
      .select('operator_name, total_permits, active_since, last_filing_date, approval_rate_pct, approved_count, denied_count, pending_count', { count: 'exact' })
      .order('total_permits', { ascending: false });

    if (search) {
      query = query.ilike('operator_name', `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const operators: OperatorApiResponse[] = (data || []).map((op) => ({
      id: op.operator_name,
      canonicalName: op.operator_name,
      permitCount: op.total_permits || 0,
      activeSince: op.active_since,
      lastFilingDate: op.last_filing_date,
      approvalRate: op.approval_rate_pct,
      approvedCount: op.approved_count,
      deniedCount: op.denied_count,
      pendingCount: op.pending_count,
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
