// services/alerts.ts
import { AlertSubscription, AlertSubscriptionCreateInput, AlertSubscriptionUpdateInput } from '@/types/alert';
import {
  validateAlertSubscriptionCreate,
  validateAlertSubscriptionUpdate,
  validatePermitApiNumber,
  validateUuid
} from '@/utils/validation';

const API_BASE_URL = '/api/alerts';

export async function fetchAlertSubscriptions(): Promise<AlertSubscription[]> {
  try {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch alert subscriptions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.subscriptions;
  } catch (error) {
    console.error('Error fetching alert subscriptions:', error);
    throw error;
  }
}

export async function fetchAlertSubscriptionById(id: string): Promise<AlertSubscription> {
  // Validate UUID format
  const uuidValidation = validateUuid(id);
  if (!uuidValidation.valid) {
    throw new Error(uuidValidation.error);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alert subscription: ${response.statusText}`);
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error fetching alert subscription:', error);
    throw error;
  }
}

export async function createAlertSubscription(input: AlertSubscriptionCreateInput): Promise<AlertSubscription> {
  // Validate input
  const validation = validateAlertSubscriptionCreate(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
  }

  // Additional validation for permit API number if provided
  if (input.permit_api_number) {
    const apiNumberValidation = validatePermitApiNumber(input.permit_api_number);
    if (!apiNumberValidation.valid) {
      throw new Error(apiNumberValidation.error);
    }
  }

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create alert subscription: ${response.statusText}`);
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error creating alert subscription:', error);
    throw error;
  }
}

export async function updateAlertSubscription(id: string, input: AlertSubscriptionUpdateInput): Promise<AlertSubscription> {
  // Validate UUID format
  const uuidValidation = validateUuid(id);
  if (!uuidValidation.valid) {
    throw new Error(uuidValidation.error);
  }

  // Validate input
  const validation = validateAlertSubscriptionUpdate(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update alert subscription: ${response.statusText}`);
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error updating alert subscription:', error);
    throw error;
  }
}

export async function deleteAlertSubscription(id: string): Promise<void> {
  // Validate UUID format
  const uuidValidation = validateUuid(id);
  if (!uuidValidation.valid) {
    throw new Error(uuidValidation.error);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete alert subscription: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting alert subscription:', error);
    throw error;
  }
}

export async function fetchAlertEvents(queryParams?: {
  page?: number;
  pageSize?: number;
  subscription_id?: string;
  notification_status?: 'pending' | 'sent' | 'failed';
}): Promise<{ events: any[]; pagination: any }> {
  try {
    const searchParams = new URLSearchParams();

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          // Validate subscription_id if provided
          if (key === 'subscription_id' && value) {
            const uuidValidation = validateUuid(value as string);
            if (!uuidValidation.valid) {
              throw new Error(`Invalid subscription_id: ${uuidValidation.error}`);
            }
          }

          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/events?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alert events: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching alert events:', error);
    throw error;
  }
}