/**
 * API Access Control Middleware
 * Enforces free tier API access restrictions
 */

import { Request, Response, NextFunction } from 'express';
import { LimitsEnforcer, ApiAccessDeniedError } from '../services/limits';
import { asUUID, UUID } from '../types/common';

/**
 * Middleware to check API access permissions
 * Blocks API requests for free tier workspaces
 */
export function apiAccessControl(limitsEnforcer: LimitsEnforcer) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.headers['x-workspace-id'];

      // Validate header exists and is a string
      if (!workspaceId || typeof workspaceId !== 'string') {
        res.status(400).json({
          error: 'Missing workspace ID',
          message: 'X-Workspace-Id header is required and must be a string',
        });
        return;
      }

      // Validate UUID format before conversion
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(workspaceId.trim())) {
        res.status(400).json({
          error: 'Invalid workspace ID format',
          message: 'X-Workspace-Id must be a valid UUID'
        });
        return;
      }

      let validatedWorkspaceId: UUID;
      try {
        validatedWorkspaceId = asUUID(workspaceId.trim());
      } catch {
        // Should not happen due to regex validation, but handle defensively
        res.status(400).json({
          error: 'Invalid workspace ID format',
          message: 'X-Workspace-Id must be a valid UUID'
        });
        return;
      }

      const result = await limitsEnforcer.checkLimit(
        validatedWorkspaceId,
        'apiAccess'
      );

      if (!result.allowed) {
        res.status(403).json({
          error: 'API Access Denied',
          message: result.message,
          upgradeRequired: true,
          currentPlan: 'free',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof ApiAccessDeniedError) {
        res.status(403).json({
          error: 'API Access Denied',
          message: error.message,
          upgradeRequired: true,
          currentPlan: 'free',
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Middleware factory for specific resource limit checking
 */
export function requireResourceLimit(
  limitsEnforcer: LimitsEnforcer,
  resource: 'aois' | 'alerts' | 'exports'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.headers['x-workspace-id'];

      // Validate header exists and is a string
      if (!workspaceId || typeof workspaceId !== 'string') {
        res.status(400).json({
          error: 'Missing workspace ID',
          message: 'X-Workspace-Id header is required and must be a string',
        });
        return;
      }

      // Validate UUID format before conversion
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(workspaceId.trim())) {
        res.status(400).json({
          error: 'Invalid workspace ID format',
          message: 'X-Workspace-Id must be a valid UUID'
        });
        return;
      }

      let validatedWorkspaceId: UUID;
      try {
        validatedWorkspaceId = asUUID(workspaceId.trim());
      } catch {
        // Should not happen due to regex validation, but handle defensively
        res.status(400).json({
          error: 'Invalid workspace ID format',
          message: 'X-Workspace-Id must be a valid UUID'
        });
        return;
      }

      await limitsEnforcer.enforceLimit(
        validatedWorkspaceId,
        resource
      );

      next();
    } catch (error) {
      if (error instanceof Error && error.name === 'FreeTierLimitExceededError') {
        res.status(429).json({
          error: 'Limit Exceeded',
          message: error.message,
          upgradeRequired: true,
          currentPlan: 'free',
        });
        return;
      }

      next(error);
    }
  };
}

export default apiAccessControl;
