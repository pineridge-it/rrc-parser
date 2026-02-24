# Structured Logging

Pino-based structured logging with correlation IDs and JSON output.

## Usage

```typescript
import { logger, StructuredLogger } from './lib/logging';

// Use default logger
logger.info('User logged in', { userId: '123', email: 'user@example.com' });
logger.error('Payment failed', new Error('Stripe timeout'), { orderId: '456' });

// Create custom logger
const customLogger = new StructuredLogger({
  service: 'payment-service',
  level: 'debug',
  pretty: true, // Human-readable output in dev
  redact: ['password', 'cardNumber', 'cvv'],
});

// Correlation IDs for request tracing
customLogger.setCorrelationId('req-123-abc');
customLogger.info('Processing payment');
customLogger.clearCorrelationId();

// Child loggers with bound context
const requestLogger = logger.child({ requestId: 'req-456' });
requestLogger.info('Request started');
```

## Features

- **Structured JSON logs**: Easy to parse and query
- **Correlation IDs**: Track requests across services
- **Auto-redaction**: Sensitive data never logged
- **Child loggers**: Bind context to logger instances
- **Pretty output**: Human-readable in development
- **Performance**: Pino is one of the fastest Node.js loggers
