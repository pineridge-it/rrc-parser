import { UUID } from './common';

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface TransformResult {
  success: boolean;
  cleanPermit?: any;
  validationErrors: ValidationError[];
  warnings: string[];
}

export interface PermitTransformerServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface TransformPermitRequest {
  rawPermitId: UUID;
}

export interface TransformBatchRequest {
  rawPermitIds: UUID[];
}

export interface ValidatePermitRequest {
  permit: any;
}

export interface NormalizePermitRequest {
  permit: any;
}

export interface CreateGeometryRequest {
  lat: number;
  lon: number;
}

export interface LinkOperatorRequest {
  operatorName: string;
}

export interface RetryTransformationRequest {
  rawPermitId: UUID;
}

export interface PreviewTransformationRequest {
  rawPermitId: UUID;
}

export interface ConfigureTransformerRequest {
  settings: {
    strictMode?: boolean;
    maxRetries?: number;
    validationLevel?: 'strict' | 'relaxed';
  };
}

export interface TransformationError {
  permitId: UUID;
  errors: ValidationError[];
  timestamp: Date;
}

export interface TransformerStats {
  totalTransformed: number;
  successful: number;
  failed: number;
  averageProcessingTime: number;
}