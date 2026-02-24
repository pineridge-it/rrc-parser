# Metrics Collection

Performance monitoring with histograms, counters, and gauges.

## Usage

```typescript
import { metrics, MetricsCollector } from './lib/metrics';

// Counters: Track counts over time
metrics.incrementCounter({ name: 'requests.total' });
metrics.incrementCounter({ name: 'errors.total', increment: 1, tags: { endpoint: '/api/users' } });

// Gauges: Current value snapshots
metrics.setGauge({ name: 'memory.heap_used_mb', value: process.memoryUsage().heapUsed / 1024 / 1024 });
metrics.setGauge({ name: 'active_connections', value: 42 });

// Histograms: Distribution of values
metrics.recordHistogram({ name: 'request.duration_ms', value: 125 });

// Automatic timing
metrics.timing('db.query', 45.2, { table: 'users' });

// Measure async operations
const users = await metrics.measure('fetch_users', async () => {
  return await database.getUsers();
}, { source: 'postgres' });

// Get statistics
const stats = metrics.getHistogramStats('request.duration_ms');
console.log(`P95 latency: ${stats?.p95}ms`);

// Export for Prometheus
const prometheusFormat = metrics.exportPrometheus();
```

## Features

- **Counters**: Monotonically increasing values
- **Gauges**: Point-in-time measurements
- **Histograms**: Distribution with percentiles (p50, p95, p99)
- **Auto-measurement**: Wrap functions to track success/error/duration
- **Prometheus export**: Compatible with standard monitoring stacks
- **Tagging**: Add dimensions to metrics for filtering
