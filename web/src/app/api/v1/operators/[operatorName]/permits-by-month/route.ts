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

    // Fetch monthly permits data from the materialized view
    const { data, error } = await db
      .from('operator_permits_by_month')
      .select('*')
      .eq('operator_name', decodedOperatorName)
      .order('month', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Format the data for the chart
    const permits = (data || []).map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      permit_count: item.permit_count,
      approved_count: item.approved_count,
      denied_count: item.denied_count,
    }));

    return createApiResponse(
      { permits },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}