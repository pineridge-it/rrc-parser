/**
 * API Access Control Middleware
 * Enforces free tier API access restrictions
 */

import { Request, Response, NextFunction } from 'express';
import { LimitsEnforcer, ApiAccessDeniedError } from '../services/limits';

/**
 * Middleware to check API access permissions
 * Blocks API requests for free tier workspaces
 */
export function apiAccessControl(limitsEnforcer: LimitsEnforcer) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId = req.headers['x-workspace-id'] as string;
      
      if (!workspaceId) {
        res.status(400).json({
          error: 'Missing workspace ID',
          message: 'X-Workspace-Id header is required',
        });
        return;
      }

      const result = await limitsEnforcer.checkLimit(
        workspaceId as `${string}-${string}-${string}-${string}-${string}`,
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
      const workspaceId = req.headers['x-workspace-id'] as string;
      
      if (!workspaceId) {
        res.status(400).json({
          error: 'Missing workspace ID',
          message: 'X-Workspace-Id header is required',
        });
        return;
      }

      await limitsEnforcer.enforceLimit(
        workspaceId as `${string}-${string}-${string}-${string}-${string}`,
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
