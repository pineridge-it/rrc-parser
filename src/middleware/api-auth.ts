import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseClient } from '../lib/database';
import { UUID, asUUID } from '../types/common';
import { ApiKeyAuth, RateLimitInfo } from '../types/api';
import crypto from 'crypto';

export interface AuthenticatedRequest extends NextRequest {
  auth?: {
    workspaceId: UUID;
    apiKeyId: UUID;
    scopes: string[];
  };
}

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
    public readonly code: string = 'UNAUTHORIZED'
  ) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

/**
 * Hash an API key using HMAC-SHA256 with a pepper (server-side secret).
 *
 * SECURITY NOTE: We use HMAC instead of plain SHA256 to prevent rainbow table
 * attacks. The pepper (server-side secret) adds defense in depth even if the
 * database is compromised. For production, consider using bcrypt or Argon2.
 */
function hashApiKey(apiKey: string): string {
  // Use HMAC with a pepper from environment variable
  // Falls back to a default only in development (should be set in production)
  const pepper = process.env.API_KEY_PEPPER || 'dev-pepper-change-in-production';
  return crypto.createHmac('sha256', pepper).update(apiKey).digest('hex');
}

export async function validateApiKey(apiKey: string): Promise<ApiKeyAuth | null> {
  const db = createDatabaseClient();
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await db
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single();

  if (error || !data) {
    return null;
  }

  let workspaceId: UUID;
  try {
    workspaceId = asUUID(data.workspace_id);
  } catch {
    // Corrupt data in database - log internally but don't expose details
    console.error(`API key ${data.id} has invalid workspace_id format`);
    return null;
  }

  return {
    workspaceId,
    // Never return the raw API key - it's a security risk
    apiKey: '[REDACTED]',
    keyHash,
    scopes: data.scopes || [],
    rateLimit: {
      requestsPerMinute: data.rate_limit?.requestsPerMinute || 100,
      requestsPerDay: data.rate_limit?.requestsPerDay || 10000,
    },
    monthlyQuota: data.monthly_quota,
    revoked: false,
  };
}

async function checkRateLimit(
  workspaceId: UUID,
  apiKeyId: UUID
): Promise<RateLimitInfo> {
  const db = createDatabaseClient();
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);

  const { count, error } = await db
    .from('api_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('api_key_id', apiKeyId)
    .gte('timestamp', oneMinuteAgo.toISOString());

  if (error) {
    throw new Error('Failed to check rate limit');
  }

  const requestsInLastMinute = count || 0;
  const limit = 100;
  const remaining = Math.max(0, limit - requestsInLastMinute);
  const reset = Math.floor((oneMinuteAgo.getTime() + 60000) / 1000);

  return {
    limit,
    remaining,
    reset,
  };
}

async function logApiRequest(
  workspaceId: UUID,
  apiKeyId: UUID,
  endpoint: string,
  method: string
): Promise<void> {
  // Usage logging is best-effort - a failure must NOT block the request
  try {
    const db = createDatabaseClient();
    const { error } = await db.from('api_usage_log').insert({
      workspace_id: workspaceId,
      api_key_id: apiKeyId,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    });
    if (error) {
      // Log for ops visibility but don't surface to caller
      console.warn('Failed to log API request (non-fatal):', error.message);
    }
  } catch (err) {
    console.warn('Failed to log API request (non-fatal):', err);
  }
}

export async function authenticateApiRequest(
  request: NextRequest
): Promise<{
  auth: { workspaceId: UUID; apiKeyId: UUID; scopes: string[] };
  rateLimit: RateLimitInfo;
}> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new ApiAuthError('Missing Authorization header', 401, 'NO_AUTH_HEADER');
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    throw new ApiAuthError(
      'Invalid Authorization header format. Expected: Bearer <api-key>',
      401,
      'INVALID_AUTH_FORMAT'
    );
  }

  const apiKey = match[1];

  if (!apiKey || apiKey.length < 32) {
    throw new ApiAuthError('Invalid API key format', 401, 'INVALID_API_KEY');
  }

  const keyAuth = await validateApiKey(apiKey);

  if (!keyAuth) {
    throw new ApiAuthError('Invalid or revoked API key', 401, 'INVALID_API_KEY');
  }

  const db = createDatabaseClient();
  const { data: apiKeyData } = await db
    .from('api_keys')
    .select('id')
    .eq('key_hash', keyAuth.keyHash)
    .single();

  if (!apiKeyData) {
    throw new ApiAuthError('API key not found', 401, 'INVALID_API_KEY');
  }

  let apiKeyId: UUID;
  try {
    apiKeyId = asUUID(apiKeyData.id);
  } catch {
    // Corrupt data - log internally but return generic error to client
    console.error(`Database corruption: API key has invalid ID format`);
    throw new ApiAuthError('Internal server error', 500, 'INTERNAL_ERROR');
  }

  const rateLimit = await checkRateLimit(keyAuth.workspaceId, apiKeyId);

  if (rateLimit.remaining <= 0) {
    throw new ApiAuthError(
      'Rate limit exceeded. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }

  const url = new URL(request.url);
  await logApiRequest(
    keyAuth.workspaceId,
    apiKeyId,
    url.pathname,
    request.method
  );

  await db
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyId);

  return {
    auth: {
      workspaceId: keyAuth.workspaceId,
      apiKeyId,
      scopes: keyAuth.scopes,
    },
    rateLimit,
  };
}

// ── Response type definitions ──────────────────────────────────────────────

export type ApiErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'quota'
  | 'server';

export interface ApiError {
  code: string;
  category: ApiErrorCategory;
  title: string;
  message: string;
  suggestion?: string;
  example?: unknown;
  learnMore?: string;
  current?: number;
  limit?: number;
  resetsAt?: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  documentation?: string;
}

export interface StandardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

// ── Error code → rich metadata map ────────────────────────────────────────

const API_ERROR_METADATA: Record<string, Pick<ApiError, 'category' | 'title' | 'suggestion'>> = {
  NO_AUTH_HEADER: {
    category: 'authentication',
    title: 'Missing Authorization Header',
    suggestion: 'Add "Authorization: Bearer <your-api-key>" to your request headers.',
  },
  INVALID_AUTH_FORMAT: {
    category: 'authentication',
    title: 'Invalid Authorization Format',
    suggestion: 'Use the format: Authorization: Bearer <your-api-key>',
  },
  INVALID_API_KEY: {
    category: 'authentication',
    title: 'Invalid or Revoked API Key',
    suggestion: 'Check your API key in the dashboard. Generate a new one if it has been revoked.',
  },
  RATE_LIMIT_EXCEEDED: {
    category: 'quota',
    title: 'Rate Limit Exceeded',
    suggestion: 'Wait until your rate limit resets, or upgrade your plan for higher limits.',
  },
  INTERNAL_ERROR: {
    category: 'server',
    title: 'Internal Server Error',
    suggestion: 'This is our fault. Please try again later or contact support with your Request ID.',
  },
  VALIDATION_ERROR: {
    category: 'validation',
    title: 'Request Validation Failed',
    suggestion: 'Check the request parameters against the API documentation.',
  },
  FORBIDDEN: {
    category: 'authorization',
    title: 'Access Denied',
    suggestion: 'Your API key does not have permission for this resource. Check required scopes.',
  },
};

function buildMeta(requestId?: string): ApiMeta {
  return {
    requestId: requestId ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

function setResponseHeaders(response: NextResponse, requestId: string, rateLimit?: RateLimitInfo): void {
  response.headers.set('X-Request-Id', requestId);
  if (rateLimit) {
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
  }
}

// ── Public response helpers ────────────────────────────────────────────────

export function createApiResponse<T>(
  data: T,
  statusCode: number = 200,
  rateLimit?: RateLimitInfo
): NextResponse {
  const requestId = crypto.randomUUID();
  const response = NextResponse.json(
    {
      success: true,
      data,
      meta: buildMeta(requestId),
    } satisfies StandardApiResponse<T>,
    { status: statusCode }
  );
  setResponseHeaders(response, requestId, rateLimit);
  return response;
}

export function createApiErrorResponse(
  error: Error | ApiAuthError,
  statusCode?: number,
  rateLimit?: RateLimitInfo
): NextResponse {
  const isAuthError = error instanceof ApiAuthError;
  const code = isAuthError ? error.code : 'INTERNAL_ERROR';
  const status = isAuthError ? error.statusCode : statusCode ?? 500;
  const requestId = crypto.randomUUID();

  const meta = API_ERROR_METADATA[code] ?? API_ERROR_METADATA['INTERNAL_ERROR']!;

  const apiError: ApiError = {
    code,
    category: meta.category,
    title: meta.title,
    message: error.message,
    suggestion: meta.suggestion,
    learnMore: `https://docs.rrc-alerts.com/api/errors/${code.toLowerCase()}`,
  };

  const response = NextResponse.json(
    {
      success: false,
      error: apiError,
      meta: {
        ...buildMeta(requestId),
        documentation: `https://docs.rrc-alerts.com/api/errors/${code.toLowerCase()}`,
      },
    } satisfies StandardApiResponse,
    { status }
  );
  setResponseHeaders(response, requestId, rateLimit);
  return response;
}

export function createValidationErrorResponse(
  validationErrors: unknown,
  rateLimit?: RateLimitInfo,
  statusCode = 422
): NextResponse {
  const requestId = crypto.randomUUID();
  const meta = API_ERROR_METADATA['VALIDATION_ERROR']!;

  const apiError: ApiError = {
    code: 'VALIDATION_ERROR',
    category: meta.category,
    title: meta.title,
    message: 'One or more request parameters failed validation.',
    suggestion: meta.suggestion,
    example: validationErrors,
    learnMore: 'https://docs.rrc-alerts.com/api/errors/validation',
  };

  const response = NextResponse.json(
    {
      success: false,
      error: apiError,
      meta: {
        ...buildMeta(requestId),
        documentation: 'https://docs.rrc-alerts.com/api/errors/validation',
      },
    } satisfies StandardApiResponse,
    { status: statusCode }
  );
  setResponseHeaders(response, requestId, rateLimit);
  return response;
}
