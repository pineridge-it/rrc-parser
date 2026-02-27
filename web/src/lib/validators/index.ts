/**
 * Input Validation Schemas using Zod
 * 
 * Provides runtime validation for all API inputs to prevent:
 * - Schema injection attacks
 * - Type confusion vulnerabilities  
 * - Oversized payload DoS attacks
 * - Data corruption from malformed inputs
 */

import { z } from 'zod';

// Time format validation (HH:MM)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// UUID v4 validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Timezone validation - check if valid IANA timezone
const isValidTimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/**
 * Quiet hours configuration schema
 */
export const quietHoursSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(timeRegex, 'Time must be in HH:MM format'),
  endTime: z.string().regex(timeRegex, 'Time must be in HH:MM format'),
  timezone: z.string()
    .min(1, 'Timezone is required')
    .max(100, 'Timezone too long')
    .refine(isValidTimezone, {
      message: 'Invalid IANA timezone identifier'
    }),
});

/**
 * Digest preferences schema
 */
export const digestPreferencesSchema = z.object({
  frequency: z.enum(['immediate', 'daily', 'weekly']),
  dailyTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
  weeklyDay: z.number().int().min(0).max(6).optional(),
  weeklyTime: z.string().regex(timeRegex, 'Time must be in HH:MM format').optional(),
  timezone: z.string()
    .min(1, 'Timezone is required')
    .max(100, 'Timezone too long')
    .refine(isValidTimezone, {
      message: 'Invalid IANA timezone identifier'
    }),
});

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  quietHours: quietHoursSchema.optional(),
  digest: digestPreferencesSchema.optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
}).strict(); // Reject unknown fields

/**
 * Workspace ID parameter schema
 */
export const workspaceIdSchema = z.string()
  .min(1, 'Workspace ID is required')
  .max(100, 'Workspace ID too long')
  .regex(uuidRegex, 'Invalid workspace ID format');

/**
 * UUID parameter schema
 */
export const uuidSchema = z.string()
  .min(1, 'ID is required')
  .max(100, 'ID too long')
  .regex(uuidRegex, 'Invalid UUID format');

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
  }
);

/**
 * Generic API error response
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Format Zod error for API response
 */
export function formatZodError(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Validate request body against schema
 * Returns parsed data or throws formatted error
 */
export function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(body);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: formatZodError(result.error) };
}

/**
 * Validate query parameters against schema
 */
export function validateQuery<T>(
  query: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(query);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: formatZodError(result.error) };
}

/**
 * AOI Geometry schema (GeoJSON)
 */
export const aoiGeometrySchema = z.object({
  type: z.enum(['Point', 'Polygon', 'MultiPolygon']),
  coordinates: z.array(z.any()), // GeoJSON coordinates structure
});

/**
 * AOI creation request schema
 */
export const aoiCreateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long (max 255 characters)'),
  geometry: aoiGeometrySchema,
  bufferMeters: z.number().int().min(0).max(10000).optional(),
}).strict();

/**
 * Permits query parameters schema
 */
export const permitsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  county: z.string().max(100).optional(),
  operator: z.string().max(255).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'approved', 'drilling', 'completed']).optional(),
  filedAfter: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
}).strict();

// Export types for TypeScript inference
export type QuietHoursInput = z.infer<typeof quietHoursSchema>;
export type DigestPreferencesInput = z.infer<typeof digestPreferencesSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type AoiGeometryInput = z.infer<typeof aoiGeometrySchema>;
export type AoiCreateInput = z.infer<typeof aoiCreateSchema>;
export type PermitsQueryInput = z.infer<typeof permitsQuerySchema>;

/**
 * Operators query parameters schema
 */
export const operatorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().max(255).optional(),
}).strict();

// Export types for TypeScript inference
export type OperatorsQueryInput = z.infer<typeof operatorsQuerySchema>;

/**
 * Payload size limits (in bytes)
 */
export const PAYLOAD_SIZE_LIMITS = {
  default: 1024 * 1024, // 1MB
  large: 10 * 1024 * 1024, // 10MB for file uploads
  small: 100 * 1024, // 100KB for simple forms
} as const;

/**
 * Validate payload size
 */
export function validatePayloadSize(
  contentLength: number | null,
  limit: number = PAYLOAD_SIZE_LIMITS.default
): { valid: true } | { valid: false; error: string } {
  if (contentLength === null) {
    return { valid: true }; // No content-length header
  }

  if (contentLength > limit) {
    const limitMB = (limit / (1024 * 1024)).toFixed(1);
    const actualMB = (contentLength / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Payload too large: ${actualMB}MB exceeds ${limitMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validation failure logger for security monitoring
 */
export function logValidationFailure(
  endpoint: string,
  errors: ValidationError[],
  ipAddress?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    endpoint,
    errors,
    ipAddress,
    severity: errors.length > 5 ? 'high' : 'medium',
  };

  // Log to console for now (could be sent to security monitoring service)
  console.warn('[VALIDATION_FAILURE]', JSON.stringify(logEntry));
}