import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { ExportService, UsageLimitExceededError } from '../../../../../../src/services/export';
import { z } from 'zod';

const createExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'geojson', 'shapefile', 'kml']),
  filters: z.record(z.any()).optional(),
  fields: z.array(z.string()).optional(),
  includeGeometry: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const exportService = new ExportService();

    const exports = await exportService.listExports(auth.workspaceId, 50);

    return createApiResponse(
      {
        exports: exports.map((job) => ({
          id: job.id,
          format: job.format,
          status: job.status,
          recordCount: job.recordCount,
          downloadUrl: job.downloadUrl,
          expiresAt: job.expiresAt,
          createdAt: job.createdAt,
          errorMessage: job.errorMessage,
        })),
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
    const exportService = new ExportService();

    const body = await request.json();
    const validation = createExportSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(
        validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
        rateLimit
      );
    }

    const { format, filters, fields, includeGeometry } = validation.data;

    const job = await exportService.createExport({
      workspaceId: auth.workspaceId,
      format,
      filters,
      fields,
      includeGeometry,
    });

    return createApiResponse(
      {
        id: job.id,
        status: job.status,
        format: job.format,
        createdAt: job.createdAt,
      },
      202,
      rateLimit
    );
  } catch (error) {
    if (error instanceof UsageLimitExceededError) {
      return createApiResponse(
        {
          error: 'LIMIT_EXCEEDED',
          message: 'Export limit reached. Please upgrade your plan to create more exports.',
        },
        402
      );
    }
    return createApiErrorResponse(error as Error);
  }
}
