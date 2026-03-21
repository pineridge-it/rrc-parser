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

    // Fetch county heatmap data from the materialized view
    const { data, error } = await db
      .from('operator_county_heatmap')
      .select('*')
      .eq('operator_name', decodedOperatorName)
      .order('permit_count', { ascending: false });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Format the data for the heatmap
    const counties = (data || []).map(item => ({
      county: item.county,
      permit_count: item.permit_count,
      lat: item.lat,
      lng: item.lng,
    }));

    return createApiResponse(
      { counties },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}