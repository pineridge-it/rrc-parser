import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../../src/middleware/api-auth';
import { ExportService } from '../../../../../../../src/services/export';
import { uuidSchema } from '@/lib/validators';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);

    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid export ID format' }],
        rateLimit
      );
    }

    const exportService = new ExportService();
    const job = await exportService.getExportStatus(params.id);

    if (!job) {
      return createApiResponse(
        { error: 'NOT_FOUND', message: 'Export job not found' },
        404,
        rateLimit
      );
    }

    if (job.workspaceId !== auth.workspaceId) {
      return createApiResponse(
        { error: 'FORBIDDEN', message: 'Access denied to this export' },
        403,
        rateLimit
      );
    }

    if (job.status === 'completed' && job.downloadUrl) {
      const expiresAt = job.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
      const isExpired = new Date() > expiresAt;

      if (isExpired) {
        return createApiResponse(
          {
            ...job,
            status: 'expired',
            downloadUrl: null,
            error: 'DOWNLOAD_EXPIRED',
            message: 'Download link has expired. Please create a new export.',
          },
          410,
          rateLimit
        );
      }
    }

    return createApiResponse(
      {
        id: job.id,
        status: job.status,
        format: job.format,
        recordCount: job.recordCount,
        downloadUrl: job.downloadUrl,
        expiresAt: job.expiresAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        errorMessage: job.errorMessage,
      },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);

    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid export ID format' }],
        rateLimit
      );
    }

    const exportService = new ExportService();
    const cancelled = await exportService.cancelExport(params.id);

    if (!cancelled) {
      return createApiResponse(
        { error: 'NOT_FOUND', message: 'Export job not found or cannot be cancelled' },
        404,
        rateLimit
      );
    }

    return createApiResponse(
      { success: true, message: 'Export job cancelled' },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
