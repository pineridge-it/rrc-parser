// utils/validation.ts
import { z } from 'zod';

// Validation schema for alert subscription creation
export const alertSubscriptionCreateSchema = z.object({
  name: z.string().max(255).optional(),
  trigger_type: z.enum(['permit_status_change', 'search_result_change']),
  permit_api_number: z.string().max(50).optional(),
  saved_search_id: z.string().uuid().optional(),
  watched_statuses: z.array(z.string().max(50)).default([]),
  notify_channels: z.array(z.enum(['email', 'in_app'])).min(1, 'At least one notification channel required'),
}).refine(
  (data) => {
    if (data.trigger_type === 'permit_status_change' && !data.permit_api_number) {
      return false;
    }
    if (data.trigger_type === 'search_result_change' && !data.saved_search_id) {
      return false;
    }
    return true;
  },
  { 
    message: 'permit_api_number required for permit_status_change; saved_search_id required for search_result_change' 
  }
);

// Validation schema for alert subscription updates
export const alertSubscriptionUpdateSchema = z.object({
  name: z.string().max(255).optional(),
  watched_statuses: z.array(z.string().max(50)).optional(),
  notify_channels: z.array(z.enum(['email', 'in_app'])).min(1).optional(),
  is_active: z.boolean().optional(),
});

// Validation schema for permit API numbers
export const permitApiNumberSchema = z.string().min(1).max(50);

// Validation schema for UUIDs
export const uuidSchema = z.string().uuid();

// Function to validate permit API numbers
export function validatePermitApiNumber(apiNumber: string): { valid: true } | { valid: false; error: string } {
  const result = permitApiNumberSchema.safeParse(apiNumber);
  
  if (result.success) {
    return { valid: true };
  }
  
  return { 
    valid: false, 
    error: result.error.errors[0]?.message || 'Invalid permit API number format' 
  };
}

// Function to validate UUIDs
export function validateUuid(uuid: string): { valid: true } | { valid: false; error: string } {
  const result = uuidSchema.safeParse(uuid);
  
  if (result.success) {
    return { valid: true };
  }
  
  return { 
    valid: false, 
    error: result.error.errors[0]?.message || 'Invalid UUID format' 
  };
}

// Function to validate alert subscription creation input
export function validateAlertSubscriptionCreate(input: any): { 
  valid: true; 
  data: z.infer<typeof alertSubscriptionCreateSchema> 
} | { 
  valid: false; 
  errors: { field: string; message: string }[] 
} {
  const result = alertSubscriptionCreateSchema.safeParse(input);
  
  if (result.success) {
    return { valid: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
  
  return { valid: false, errors };
}

// Function to validate alert subscription update input
export function validateAlertSubscriptionUpdate(input: any): { 
  valid: true; 
  data: z.infer<typeof alertSubscriptionUpdateSchema> 
} | { 
  valid: false; 
  errors: { field: string; message: string }[] 
} {
  const result = alertSubscriptionUpdateSchema.safeParse(input);
  
  if (result.success) {
    return { valid: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
  
  return { valid: false, errors };
}