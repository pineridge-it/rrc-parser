/**
 * Alert Configuration Service
 *
 * Backend service for managing alert rules.
 * Provides CRUD operations, validation, and preview functionality.
 */

import {
  AlertConfig,
  AlertConfigForm,
  AlertListItem,
  AlertListResponse,
  AlertFilterOptions,
  AlertPreviewRequest,
  AlertPreviewResult,
  PreviewPermit,
  AlertHistoryEntry,
  AlertValidationResult,
  ValidationError,
  AlertToggleRequest,
  AlertDeleteRequest,
} from '../../types/alert-config';
import { AlertRule, CleanPermit } from '../../types/alert';
import { AlertRulesEngine } from './index';

type UUID = string;

/**
 * Storage interface for alert configurations
 * Can be implemented with database, Supabase, etc.
 */
export interface AlertConfigStorage {
  create(config: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertConfig>;
  getById(id: UUID): Promise<AlertConfig | null>;
  update(id: UUID, updates: Partial<AlertConfig>): Promise<AlertConfig | null>;
  delete(id: UUID, permanent?: boolean): Promise<boolean>;
  list(options: AlertFilterOptions): Promise<AlertListResponse>;
  getHistory(alertId: UUID, limit: number): Promise<AlertHistoryEntry[]>;
}

/**
 * Permit source interface for preview functionality
 */
export interface PermitSource {
  searchPermits(query: {
    workspaceId: UUID;
    filters?: Record<string, unknown>;
    limit: number;
  }): Promise<{ permits: CleanPermit[]; total: number }>;
}

/**
 * Alert Configuration Service
 */
export class AlertConfigService {
  private storage: AlertConfigStorage;
  private permitSource: PermitSource;
  private rulesEngine: AlertRulesEngine;

  constructor(storage: AlertConfigStorage, permitSource: PermitSource) {
    this.storage = storage;
    this.permitSource = permitSource;
    this.rulesEngine = new AlertRulesEngine();
  }

  /**
   * Create a new alert configuration
   */
  async createAlert(
    userId: UUID,
    workspaceId: UUID,
    form: AlertConfigForm
  ): Promise<{ success: boolean; alert?: AlertConfig; errors?: ValidationError[] }> {
    // Validate the form
    const validation = this.validateForm(form);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Convert form to alert config
    const config: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      workspaceId,
      name: form.name,
      isActive: true,
      config: form,
      triggerCount: 0,
    };

    try {
      const alert = await this.storage.create(config);
      return { success: true, alert };
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'general', message: 'Failed to create alert' }],
      };
    }
  }

  /**
   * Get alert by ID
   */
  async getAlert(id: UUID): Promise<AlertConfig | null> {
    return this.storage.getById(id);
  }

  /**
   * Update an existing alert
   */
  async updateAlert(
    id: UUID,
    form: Partial<AlertConfigForm>
  ): Promise<{ success: boolean; alert?: AlertConfig; errors?: ValidationError[] }> {
    const existing = await this.storage.getById(id);
    if (!existing) {
      return { success: false, errors: [{ field: 'id', message: 'Alert not found' }] };
    }

    // Merge with existing config
    const mergedForm: AlertConfigForm = {
      ...existing.config,
      ...form,
      triggers: { ...existing.config.triggers, ...form.triggers },
      channels: { ...existing.config.channels, ...form.channels },
    };

    // Validate merged form
    const validation = this.validateForm(mergedForm);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    try {
      const alert = await this.storage.update(id, {
        name: mergedForm.name,
        config: mergedForm,
        updatedAt: new Date(),
      });
      return { success: true, alert: alert || undefined };
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'general', message: 'Failed to update alert' }],
      };
    }
  }

  /**
   * Toggle alert active status (pause/resume)
   */
  async toggleAlert(request: AlertToggleRequest): Promise<{ success: boolean; alert?: AlertConfig }> {
    const existing = await this.storage.getById(request.alertId);
    if (!existing) {
      return { success: false };
    }

    const alert = await this.storage.update(request.alertId, {
      isActive: request.isActive,
      updatedAt: new Date(),
    });

    return { success: true, alert: alert || undefined };
  }

  /**
   * Delete an alert
   */
  async deleteAlert(request: AlertDeleteRequest): Promise<{ success: boolean }> {
    const result = await this.storage.delete(request.alertId, request.permanent);
    return { success: result };
  }

  /**
   * List alerts with filtering and pagination
   */
  async listAlerts(options: AlertFilterOptions): Promise<AlertListResponse> {
    return this.storage.list(options);
  }

  /**
   * Get user's alerts for a workspace
   */
  async getUserAlerts(
    userId: UUID,
    workspaceId: UUID,
    options: Omit<AlertFilterOptions, 'userId' | 'workspaceId'> = {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 50,
      offset: 0,
    }
  ): Promise<AlertListResponse> {
    return this.listAlerts({
      ...options,
      userId,
      workspaceId,
    });
  }

  /**
   * Preview which permits would match an alert configuration
   */
  async previewAlert(request: AlertPreviewRequest): Promise<AlertPreviewResult> {
    const limit = request.limit || 10;

    // Build filter criteria from config
    const filters: Record<string, unknown> = {};

    if (request.config.aoiId) {
      filters.aoiId = request.config.aoiId;
    }

    if (request.config.triggers.specificOperators?.length) {
      filters.operatorIds = request.config.triggers.specificOperators;
    }

    // Search for matching permits
    const { permits, total } = await this.permitSource.searchPermits({
      workspaceId: request.workspaceId,
      filters,
      limit: limit + 1, // Get one extra to check if truncated
    });

    const isTruncated = permits.length > limit;
    const samplePermits = permits.slice(0, limit).map(this.mapToPreviewPermit);

    return {
      totalCount: total,
      samplePermits,
      isTruncated,
    };
  }

  /**
   * Get alert history (past notifications)
   */
  async getAlertHistory(alertId: UUID, limit: number = 50): Promise<AlertHistoryEntry[]> {
    return this.storage.getHistory(alertId, limit);
  }

  /**
   * Validate alert configuration form
   */
  validateForm(form: AlertConfigForm): AlertValidationResult {
    const errors: ValidationError[] = [];

    // Name validation
    if (!form.name || form.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Alert name is required' });
    } else if (form.name.length > 100) {
      errors.push({ field: 'name', message: 'Alert name must be 100 characters or less' });
    }

    // At least one trigger must be selected
    if (!form.triggers.newPermits && !form.triggers.statusChanges) {
      if (!form.triggers.specificOperators || form.triggers.specificOperators.length === 0) {
        errors.push({ field: 'triggers', message: 'At least one trigger condition is required' });
      }
    }

    // At least one channel must be selected
    if (!form.channels.email && !form.channels.sms && !form.channels.inApp) {
      errors.push({ field: 'channels', message: 'At least one notification channel is required' });
    }

    // Quiet hours validation
    if (form.quietHours) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(form.quietHours.start)) {
        errors.push({ field: 'quietHours.start', message: 'Invalid time format (use HH:MM)' });
      }
      if (!timeRegex.test(form.quietHours.end)) {
        errors.push({ field: 'quietHours.end', message: 'Invalid time format (use HH:MM)' });
      }
      if (!form.quietHours.timezone) {
        errors.push({ field: 'quietHours.timezone', message: 'Timezone is required for quiet hours' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert form config to AlertRule for the rules engine
   */
  formToAlertRule(form: AlertConfigForm, workspaceId: UUID): AlertRule {
    const channels: Array<{ type: 'email' | 'sms' | 'push'; config: Record<string, unknown> }> = [];

    if (form.channels.email) {
      channels.push({ type: 'email', config: {} });
    }
    if (form.channels.sms) {
      channels.push({ type: 'sms', config: {} });
    }
    if (form.channels.inApp) {
      channels.push({ type: 'push', config: {} });
    }

    return {
      id: crypto.randomUUID(),
      workspaceId,
      name: form.name,
      aoiIds: form.aoiId ? [form.aoiId] : [],
      filters: this.buildFilters(form),
      operatorWatchlist: form.triggers.specificOperators || [],
      notifyOnAmendment: form.triggers.statusChanges || false,
      channels,
      isActive: true,
    };
  }

  /**
   * Build RuleFilters from form config
   */
  private buildFilters(form: AlertConfigForm): RuleFilters {
    const filters: RuleFilters = {};

    // Status filter for status changes
    if (form.triggers.statusChanges) {
      filters.statuses = ['approved', 'pending', 'amended'];
    }

    // Operator filter
    if (form.triggers.specificOperators?.length) {
      filters.operators = form.triggers.specificOperators;
    }

    return filters;
  }

  /**
   * Map CleanPermit to PreviewPermit
   */
  private mapToPreviewPermit(permit: CleanPermit): PreviewPermit {
    return {
      id: permit.id,
      permitNumber: permit.permitNumber,
      operatorName: permit.operatorName,
      county: permit.county,
      status: permit.status,
      filedDate: permit.filedDate,
      surfaceLocation:
        permit.surfaceLat !== undefined && permit.surfaceLon !== undefined
          ? { lat: permit.surfaceLat, lon: permit.surfaceLon }
          : undefined,
    };
  }
}

/**
 * In-memory storage implementation for testing
 */
export class InMemoryAlertStorage implements AlertConfigStorage {
  private alerts: Map<UUID, AlertConfig> = new Map();
  private history: Map<UUID, AlertHistoryEntry[]> = new Map();

  async create(config: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertConfig> {
    const id = crypto.randomUUID();
    const now = new Date();
    const alert: AlertConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getById(id: UUID): Promise<AlertConfig | null> {
    return this.alerts.get(id) || null;
  }

  async update(id: UUID, updates: Partial<AlertConfig>): Promise<AlertConfig | null> {
    const existing = this.alerts.get(id);
    if (!existing) return null;

    const updated: AlertConfig = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date(),
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async delete(id: UUID, permanent?: boolean): Promise<boolean> {
    if (permanent) {
      return this.alerts.delete(id);
    }
    // Soft delete - just mark as inactive
    const existing = this.alerts.get(id);
    if (existing) {
      existing.isActive = false;
      existing.updatedAt = new Date();
      return true;
    }
    return false;
  }

  async list(options: AlertFilterOptions): Promise<AlertListResponse> {
    let items = Array.from(this.alerts.values());

    // Apply filters
    if (options.workspaceId) {
      items = items.filter(a => a.workspaceId === options.workspaceId);
    }
    if (options.userId) {
      items = items.filter(a => a.userId === options.userId);
    }
    if (options.isActive !== undefined) {
      items = items.filter(a => a.isActive === options.isActive);
    }
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      items = items.filter(a => a.name.toLowerCase().includes(term));
    }

    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      switch (options.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'lastTriggered':
          comparison =
            (a.lastTriggeredAt?.getTime() || 0) - (b.lastTriggeredAt?.getTime() || 0);
          break;
        case 'createdAt':
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      return options.sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = items.length;

    // Paginate
    const paginatedItems = items.slice(options.offset, options.offset + options.limit);

    // Map to list items
    const listItems: AlertListItem[] = paginatedItems.map(a => ({
      id: a.id,
      name: a.name,
      isActive: a.isActive,
      frequency: a.config.frequency,
      channels: Object.entries(a.config.channels)
        .filter(([, enabled]) => enabled)
        .map(([channel]) => channel),
      triggerCount: a.triggerCount,
      lastTriggeredAt: a.lastTriggeredAt,
      createdAt: a.createdAt,
    }));

    return {
      items: listItems,
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  async getHistory(alertId: UUID, limit: number): Promise<AlertHistoryEntry[]> {
    const history = this.history.get(alertId) || [];
    return history.slice(0, limit);
  }

  // Test helper methods
  clear(): void {
    this.alerts.clear();
    this.history.clear();
  }

  getAllAlerts(): AlertConfig[] {
    return Array.from(this.alerts.values());
  }
}

/**
 * Mock permit source for testing
 */
export class MockPermitSource implements PermitSource {
  private permits: CleanPermit[] = [];

  constructor(permits: CleanPermit[] = []) {
    this.permits = permits;
  }

  async searchPermits(query: {
    workspaceId: UUID;
    filters?: Record<string, unknown>;
    limit: number;
  }): Promise<{ permits: CleanPermit[]; total: number }> {
    let results = this.permits;

    // Apply simple filters
    if (query.filters?.operatorIds) {
      const operatorIds = query.filters.operatorIds as UUID[];
      results = results.filter(p => p.operatorId && operatorIds.includes(p.operatorId));
    }

    return {
      permits: results.slice(0, query.limit),
      total: results.length,
    };
  }

  setPermits(permits: CleanPermit[]): void {
    this.permits = permits;
  }
}
