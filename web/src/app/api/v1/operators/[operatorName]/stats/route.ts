import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';

interface RouteParams {
  params: { operatorName: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();
    const { operatorName } = params;

    // Decode the operator name from URL param
    const decodedOperatorName = decodeURIComponent(operatorName);

    // Fetch operator stats from the materialized view
    const { data, error } = await db
      .from('operator_stats_summary')
      .select('*')
      .eq('operator_name', decodedOperatorName)
      .single();

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data) {
      return createApiResponse(
        { error: 'Operator not found' },
        404,
        rateLimit
      );
    }

    return createApiResponse(
      { stats: data },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}