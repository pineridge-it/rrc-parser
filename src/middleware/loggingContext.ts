import { Request, Response, NextFunction } from 'express';
import { generateCorrelationId, runWithContextAsync } from '../services/logger';
import { RequestContext } from '../types/logging';

export interface RequestWithContext extends Request {
  correlationId: string;
  startTime: number;
}

export function loggingContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  const startTime = Date.now();
  
  (req as RequestWithContext).correlationId = correlationId;
  (req as RequestWithContext).startTime = startTime;
  
  res.setHeader('X-Correlation-Id', correlationId);
  
  const context: RequestContext = {
    correlationId,
    requestId: req.headers['x-request-id'] as string,
    userId: (req as any).user?.id,
    workspaceId: (req as any).user?.workspaceId,
    path: req.path,
    method: req.method,
  };
  
  const originalEnd = res.end.bind(res);
  let ended = false;
  
  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    if (ended) return res;
    ended = true;
    
    const durationMs = Date.now() - startTime;

    if (res.statusCode >= 500) {
      console.error(`[${correlationId}] ${req.method} ${req.path} ${res.statusCode} (${durationMs}ms)`);
    } else if (res.statusCode >= 400) {
      console.warn(`[${correlationId}] ${req.method} ${req.path} ${res.statusCode} (${durationMs}ms)`);
    } else {
      console.info(`[${correlationId}] ${req.method} ${req.path} ${res.statusCode} (${durationMs}ms)`);
    }
    
    return originalEnd(chunk, encoding, cb);
  };
  
  runWithContextAsync(context, async () => {
    next();
  });
}

export function getCorrelationId(req: Request): string {
  return (req as RequestWithContext).correlationId;
}

export function getRequestDuration(req: Request): number {
  const startTime = (req as RequestWithContext).startTime;
  return Date.now() - startTime;
}
