import { UUID } from './common';

export interface ApiKeyAuth {
  workspaceId: UUID;
  apiKey: string;
  keyHash: string;
  scopes: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  monthlyQuota?: number;
  revoked: boolean;
}

export interface ApiRequest {
  workspaceId: UUID;
  apiKeyId: UUID;
  endpoint: string;
  method: string;
  timestamp: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    requestId?: string;
  };
}

export interface PermitApiResponse {
  id: UUID;
  permitNumber: string;
  operatorName?: string;
  county?: string;
  district?: string;
  wellNumber?: string;
  filedDate?: string;
  status?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface OperatorApiResponse {
  id: UUID | string;
  canonicalName: string;
  permitCount?: number;
  activeSince?: string | null;
  lastFilingDate?: string | null;
  approvalRate?: number | null;
  approvedCount?: number;
  deniedCount?: number;
  pendingCount?: number;
}

export interface AoiApiResponse {
  id: UUID;
  name: string;
  createdAt: string;
}

export interface ApiUsageMetrics {
  workspaceId: UUID;
  apiKeyId: UUID;
  period: string;
  requestCount: number;
  quotaUsed: number;
  quotaLimit?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}
