import { AlertNotificationService } from '../services/alerts/AlertNotificationService';

/**
 * Scheduled job to deliver alert notifications
 * Runs every 5 minutes
 */
export async function deliverAlertsJob(): Promise<void> {
  console.log('Starting alert notification delivery job...');
  
  try {
    const notificationService = new AlertNotificationService();
    await notificationService.deliverNotifications();
    
    console.log('Alert notification delivery job completed successfully');
  } catch (error) {
    console.error('Alert notification delivery job failed:', error);
  }
}

// Run the job immediately when imported (for testing)
// In production, this would be triggered by a cron scheduler
if (process.env.NODE_ENV !== 'test') {
  deliverAlertsJob();
}