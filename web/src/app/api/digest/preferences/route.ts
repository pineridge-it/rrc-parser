import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createValidationErrorResponse,
  createApiErrorResponse,
} from '../../../../../src/middleware/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { rateLimit } = await authenticateApiRequest(request);
    
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
    const { rateLimit } = await authenticateApiRequest(request);
    
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
