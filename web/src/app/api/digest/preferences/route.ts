import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import {
  digestPreferencesSchema,
  validateBody,
} from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    
    // API key authentication doesn't provide user context
    // Digest preferences are user-specific, so this endpoint requires user authentication
    return createValidationErrorResponse(
      [{ field: 'auth', message: 'User authentication required for digest preferences. API key authentication is not supported for this endpoint.' }],
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    
    // API key authentication doesn't provide user context
    // Digest preferences are user-specific, so this endpoint requires user authentication
    return createValidationErrorResponse(
      [{ field: 'auth', message: 'User authentication required for digest preferences. API key authentication is not supported for this endpoint.' }],
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
