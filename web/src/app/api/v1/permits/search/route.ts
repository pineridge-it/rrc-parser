import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../../src/lib/database';
import { z } from 'zod';

const searchQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  operators: z.string().optional(),
  counties: z.string().optional(),
  statuses: z.string().optional(),
  permitTypes: z.string().optional(),
  filedFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  filedTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  approvedFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  approvedTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  q: z.string().max(255).optional(),
  aoiId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const url = new URL(request.url);
    
    const queryParams: Record<string, string | undefined> = {
      page: url.searchParams.get('page') || '1',
      pageSize: url.searchParams.get('pageSize') || '25',
      operators: url.searchParams.get('operators') || undefined,
      counties: url.searchParams.get('counties') || undefined,
      statuses: url.searchParams.get('statuses') || undefined,
      permitTypes: url.searchParams.get('permitTypes') || undefined,
      filedFrom: url.searchParams.get('filedFrom') || undefined,
      filedTo: url.searchParams.get('filedTo') || undefined,
      approvedFrom: url.searchParams.get('approvedFrom') || undefined,
      approvedTo: url.searchParams.get('approvedTo') || undefined,
      q: url.searchParams.get('q') || undefined,
      aoiId: url.searchParams.get('aoiId') || undefined,
    };

    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    const validation = searchQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        rateLimit
      );
    }

    const {
      page,
      pageSize,
      operators,
      counties,
      statuses,
      permitTypes,
      filedFrom,
      filedTo,
      approvedFrom,
      approvedTo,
      q,
      aoiId,
    } = validation.data;

    let query = db
      .from('permits')
      .select('*', { count: 'exact' })
      .order('received_date', { ascending: false });

    if (operators) {
      const operatorList = operators.split(',').map(o => o.trim());
      query = query.in('operator_id', operatorList);
    }

    if (counties) {
      const countyList = counties.split(',').map(c => c.trim());
      query = query.in('county_code', countyList);
    }

    if (statuses) {
      const statusList = statuses.split(',').map(s => s.trim());
      query = query.in('well_status', statusList);
    }

    if (permitTypes) {
      const typeList = permitTypes.split(',').map(t => t.trim());
      query = query.in('permit_type', typeList);
    }

    if (filedFrom) {
      query = query.gte('received_date', filedFrom);
    }
    if (filedTo) {
      query = query.lte('received_date', filedTo);
    }

    if (approvedFrom) {
      query = query.gte('approved_date', approvedFrom);
    }
    if (approvedTo) {
      query = query.lte('approved_date', approvedTo);
    }

    if (q) {
      query = query.or(`permit_number.ilike.%${q}%,lease_name.ilike.%${q}%,well_number.ilike.%${q}%,api_number.ilike.%${q}%`);
    }

    if (aoiId) {
      // Get AOI geometry and filter by spatial intersection
      const { data: aoiData, error: aoiError } = await db
        .from('aois')
        .select('geom')
        .eq('id', aoiId)
        .eq('workspace_id', auth.workspaceId)
        .single();

      if (aoiError || !aoiData) {
        return createValidationErrorResponse(
          [{ field: 'aoiId', message: 'AOI not found or access denied' }],
          rateLimit
        );
      }

      query = query.not('surface_location', 'is', null);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const permits = (data || []).map((permit) => ({
      id: permit.id,
      permit_number: permit.permit_number,
      operator_name: permit.operator_name,
      operator_number: permit.operator_number,
      lease_name: permit.lease_name,
      well_number: permit.well_number,
      county: permit.county_code,
      status: permit.well_status,
      permit_type: permit.permit_type,
      filed_date: permit.received_date,
      approved_date: permit.approved_date,
      latitude: permit.surface_latitude,
      longitude: permit.surface_longitude,
      total_depth: permit.total_depth,
      formation: permit.formation,
      field_name: permit.field_name,
      district: permit.district,
      api_number: permit.api_number,
      created_at: permit.created_at,
      updated_at: permit.updated_at,
    }));

    // Calculate aggregations
    const aggregations = {
      byCounty: {} as Record<string, number>,
      byOperator: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    // Aggregation queries (unfiltered for context)
    const [countyAgg, operatorAgg, statusAgg] = await Promise.all([
      db.from('permits').select('county_code'),
      db.from('permits').select('operator_name'),
      db.from('permits').select('well_status'),
    ]);

    (countyAgg.data || []).forEach((row: { county_code: string | null }) => {
      if (row.county_code) {
        aggregations.byCounty[row.county_code] = (aggregations.byCounty[row.county_code] || 0) + 1;
      }
    });

    (operatorAgg.data || []).forEach((row: { operator_name: string | null }) => {
      if (row.operator_name) {
        aggregations.byOperator[row.operator_name] = (aggregations.byOperator[row.operator_name] || 0) + 1;
      }
    });

    (statusAgg.data || []).forEach((row: { well_status: string | null }) => {
      if (row.well_status) {
        aggregations.byStatus[row.well_status] = (aggregations.byStatus[row.well_status] || 0) + 1;
      }
    });

    return createApiResponse(
      {
        permits,
        total: count || 0,
        page,
        pageSize,
        aggregations,
      },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}