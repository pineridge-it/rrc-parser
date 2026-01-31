/**
 * Alert Configuration Service types
 *
 * Backend service for managing alert rules - supports future frontend UI
 */

import { NotificationChannelType } from './notification';

type UUID = string;

/**
 * Alert configuration form data (from UI)
 */
export interface AlertConfigForm {
  /** Alert rule name */
  name: string;
  /** Optional AOI ID for spatial filtering */
  aoiId?: UUID;
  /** Optional saved search ID */
  savedSearchId?: UUID;
  /** Trigger conditions */
  triggers: {
    /** Notify on new permits */
    newPermits: boolean;
    /** Notify on status changes */
    statusChanges: boolean;
    /** Specific operators to watch */
    specificOperators?: UUID[];
  };
  /** Notification channels */
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  /** Notification frequency */
  frequency: 'immediate' | 'daily' | 'weekly';
  /** Quiet hours configuration */
  quietHours?: {
    start: string; // '22:00'
    end: string; // '07:00'
    timezone: string;
  };
}

/**
 * Alert configuration response
 */
export interface AlertConfig {
  id: UUID;
  userId: UUID;
  workspaceId: UUID;
  name: string;
  isActive: boolean;
  config: AlertConfigForm;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  triggerCount: number;
}

/**
 * Alert list item (summary view)
 */
export interface AlertListItem {
  id: UUID;
  name: string;
  isActive: boolean;
  frequency: string;
  channels: string[];
  triggerCount: number;
  lastTriggeredAt?: Date;
  createdAt: Date;
}

/**
 * Alert preview request
 */
export interface AlertPreviewRequest {
  config: AlertConfigForm;
  workspaceId: UUID;
  limit?: number;
}

/**
 * Alert preview result
 */
export interface AlertPreviewResult {
  /** Total matching permits */
  totalCount: number;
  /** Sample of matching permits */
  samplePermits: PreviewPermit[];
  /** Whether preview was truncated */
  isTruncated: boolean;
}

/**
 * Permit preview data
 */
export interface PreviewPermit {
  id: UUID;
  permitNumber: string;
  operatorName?: string;
  county?: string;
  status?: string;
  filedDate?: Date;
  surfaceLocation?: {
    lat: number;
    lon: number;
  };
}

/**
 * Alert history entry
 */
export interface AlertHistoryEntry {
  id: UUID;
  alertId: UUID;
  eventId: UUID;
  permitId: UUID;
  triggeredAt: Date;
  channelsSent: NotificationChannelType[];
  channelsDelivered: NotificationChannelType[];
}

/**
 * Alert filter options for list queries
 */
export interface AlertFilterOptions {
  workspaceId?: UUID;
  userId?: UUID;
  isActive?: boolean;
  searchTerm?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'lastTriggered';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

/**
 * Paginated alert list response
 */
export interface AlertListResponse {
  items: AlertListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Alert validation result
 */
export interface AlertValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Alert toggle request
 */
export interface AlertToggleRequest {
  alertId: UUID;
  isActive: boolean;
}

/**
 * Alert delete request
 */
export interface AlertDeleteRequest {
  alertId: UUID;
  /** Hard delete vs soft delete */
  permanent?: boolean;
}
