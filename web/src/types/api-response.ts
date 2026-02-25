export type ApiErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'quota'
  | 'server';

export interface UpgradeInfo {
  url: string;
  features: string[];
  price?: string;
}

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
  upgrade?: UpgradeInfo;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  documentation?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

export interface ApiValidationFieldError {
  field: string;
  message: string;
  received?: unknown;
}

export interface ApiValidationError extends ApiError {
  category: 'validation';
  fields?: ApiValidationFieldError[];
}
