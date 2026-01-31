/**
 * Alert E2E Test Configuration
 * 
 * Configuration settings specifically for alert system E2E tests
 */

export const ALERT_E2E_CONFIG = {
  // Timing
  alertGenerationDelay: 5000,     // Wait for async processing
  notificationDeliveryDelay: 10000,
  
  // Rate limits (relaxed for testing)
  rateLimits: {
    perHour: 10,
    burst: 5
  },
  
  // Quiet hours
  quietHours: {
    start: '22:00',
    end: '06:00',
    timezone: 'America/Chicago'
  },
  
  // Test channels
  channels: ['email', 'in-app', 'sms']
};