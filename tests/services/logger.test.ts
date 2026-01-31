import {
  createLogger,
  generateCorrelationId,
  runWithContext,
  getRequestContext,
} from '../../src/services/logger';
import { RequestContext } from '../../src/types/logging';

describe('Structured Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create a logger with default config', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should create a logger with custom config', () => {
      const logger = createLogger({
        service: 'test-service',
        version: '1.0.0',
        minLevel: 'debug',
      });
      expect(logger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      const logger = createLogger({ service: 'test', version: '1.0.0' });
      logger.info('Test message', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log debug when minLevel is info', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const logger = createLogger({ service: 'test', version: '1.0.0', minLevel: 'info' });
      logger.debug('Debug message');
      expect(debugSpy).not.toHaveBeenCalled();
      debugSpy.mockRestore();
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      const logger = createLogger({ service: 'test', version: '1.0.0' });
      const childLogger = logger.child({ requestId: '123' });
      expect(childLogger).toBeDefined();
    });
  });

  describe('correlation ID', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create logger with specific correlation ID', () => {
      const logger = createLogger({ service: 'test', version: '1.0.0' });
      const loggerWithId = logger.withCorrelationId('custom-id-123');
      expect(loggerWithId).toBeDefined();
    });
  });

  describe('async context', () => {
    it('should store and retrieve request context', () => {
      const context: RequestContext = {
        correlationId: 'test-correlation-id',
        requestId: 'req-123',
        path: '/test',
        method: 'GET',
      };

      runWithContext(context, () => {
        const retrieved = getRequestContext();
        expect(retrieved).toEqual(context);
      });
    });

    it('should return undefined when no context is set', () => {
      const retrieved = getRequestContext();
      expect(retrieved).toBeUndefined();
    });
  });
});
