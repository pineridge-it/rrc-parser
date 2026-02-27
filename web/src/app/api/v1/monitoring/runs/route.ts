import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import type { ETLRunRecord } from '../../../../../../src/monitoring/types';
import { z } from 'zod';

const runsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['running', 'success', 'failed', 'cancelled']).optional(),
  runType: z.enum(['incremental', 'full', 'backfill']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') || '50',
      offset: url.searchParams.get('offset') || '0',
      status: url.searchParams.get('status') || undefined,
      runType: url.searchParams.get('runType') || undefined,
    };

    const validation = runsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        rateLimit
      );
    }

    const { limit, offset, status, runType } = validation.data;

    let query = db
      .from('etl_runs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (runType) {
      query = query.eq('run_type', runType);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch runs: ${error.message}`);
    }

    const runs: ETLRunRecord[] = (data || []).map((run) => ({
      id: run.id,
      runType: run.run_type,
      status: run.status,
      startedAt: new Date(run.started_at),
      completedAt: run.completed_at ? new Date(run.completed_at) : undefined,
      permitsProcessed: run.permits_processed || 0,
      permitsNew: run.permits_new || 0,
      permitsUpdated: run.permits_updated || 0,
      permitsFailed: run.permits_failed || 0,
      sourceFiles: run.source_files,
      errorMessage: run.error_message,
      errorStack: run.error_stack,
      durationMs: run.duration_ms,
    }));

    return createApiResponse(
      {
        runs,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
      rateLimit
    );
  } catch (error) {
    console.error('Runs API error:', error);
    return createApiErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}