export interface OperatorReviewItem {
  id: UUID;
  suggestedOperator: Operator;
  rawName: string;
  confidence: number;
  permitCount: number;  // How many permits affected
  createdAt: string;
  sourcePermitId?: string;
  sourceFile?: string;
}

export interface OperatorAdminServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: { id: UUID; error: string }[];
}