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

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
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

  return {
    workspaceId: asUUID(data.workspace_id),
    apiKey,
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
  const db = createDatabaseClient();
  
  await db.from('api_usage_log').insert({
    workspace_id: workspaceId,
    api_key_id: apiKeyId,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
  });
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

  const apiKeyId = asUUID(apiKeyData.id);
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

export function createApiResponse<T>(
  data: T,
  statusCode: number = 200,
  rateLimit?: RateLimitInfo
): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  );

  if (rateLimit) {
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
  }

  return response;
}

export function createApiErrorResponse(
  error: Error | ApiAuthError,
  statusCode?: number
): NextResponse {
  const isAuthError = error instanceof ApiAuthError;
  const code = isAuthError ? error.code : 'INTERNAL_ERROR';
  const status = isAuthError ? error.statusCode : statusCode || 500;

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: error.message,
      },
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}
