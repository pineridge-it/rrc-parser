import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../../src/middleware/api-auth';
import { UsageService } from '../../../../../../../src/services/usage';
import { uuidSchema } from '@/lib/validators';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);

    // Validate workspace ID
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid workspace ID format' }],
        rateLimit
      );
    }

    // Ensure user has access to this workspace
    if (auth.workspaceId !== params.id) {
      return createApiResponse(
        { error: 'FORBIDDEN', message: 'Access denied to this workspace' },
        403,
        rateLimit
      );
    }

    const usageService = new UsageService();
    const usage = await usageService.getUsage(auth.workspaceId);
    const warnings = await usageService.checkWarnings(auth.workspaceId);
    const planLimits = await usageService.getPlanLimits(auth.workspaceId);

    return createApiResponse(
      {
        usage,
        warnings,
        planLimits: {
          aois: planLimits.aois,
          alertsPerMonth: planLimits.alertsPerMonth,
          exportsPerMonth: planLimits.exportsPerMonth,
          apiCallsPerMonth: planLimits.apiCallsPerMonth,
        },
      },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);

    // Validate workspace ID
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return createValidationErrorResponse(
        [{ field: 'id', message: 'Invalid workspace ID format' }],
        rateLimit
      );
    }

    // Ensure user has access to this workspace
    if (auth.workspaceId !== params.id) {
      return createApiResponse(
        { error: 'FORBIDDEN', message: 'Access denied to this workspace' },
        403,
        rateLimit
      );
    }

    const body = await request.json();
    const { resource, amount = 1 } = body;

    if (!['alerts', 'exports', 'apiCalls'].includes(resource)) {
      return createValidationErrorResponse(
        [{ field: 'resource', message: 'Invalid resource type. Must be alerts, exports, or apiCalls' }],
        rateLimit
      );
    }

    const usageService = new UsageService();
    await usageService.incrementUsage(
      auth.workspaceId,
      resource as 'alerts' | 'exports' | 'apiCalls',
      amount
    );

    const usage = await usageService.getUsage(auth.workspaceId);

    return createApiResponse(
      {
        success: true,
        usage,
      },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}