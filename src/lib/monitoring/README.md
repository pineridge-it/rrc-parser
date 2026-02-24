# Alert Management

Rule-based alerting with cooldowns and PagerDuty integration.

## Usage

```typescript
import { alertManager, AlertManager, createCommonAlertRules } from './lib/monitoring';
import { metrics } from './lib/metrics';

// Register alert rules
alertManager.registerRule({
  name: 'high_error_rate',
  condition: async () => {
    const errorCount = metrics.getSummary().counters.get('errors.total') || 0;
    const requestCount = metrics.getSummary().counters.get('requests.total') || 0;
    return requestCount > 0 && (errorCount / requestCount) > 0.01;
  },
  severity: 'critical',
  message: 'Error rate exceeds 1%',
  cooldownMs: 300000, // 5 minutes
  metadata: { team: 'backend', escalate: true },
});

// Check rules periodically
setInterval(async () => {
  const alerts = await alertManager.checkRules();
  if (alerts.length > 0) {
    console.log('Alerts triggered:', alerts);
  }
}, 60000); // Every minute

// Register common rules
createCommonAlertRules().forEach(rule => alertManager.registerRule(rule));

// Create custom alert manager with PagerDuty
const productionAlerts = new AlertManager({
  enablePagerDuty: true,
  pagerDutyApiKey: process.env.PAGERDUTY_API_KEY,
});
```

## Features

- **Rule-based**: Define conditions as async functions
- **Cooldowns**: Prevent alert spam
- **Severity levels**: critical, high, medium, low
- **PagerDuty integration**: Automatic escalation for critical alerts
- **Flexible conditions**: Any async function returning boolean
- **Metadata**: Attach context to alerts
