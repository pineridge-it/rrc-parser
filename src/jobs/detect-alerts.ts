import { AlertDetectionService } from '../services/alerts/AlertDetectionService';

/**
 * Scheduled job to detect permit status changes and create alert events
 * Runs every 15 minutes
 */
export async function detectAlertsJob(): Promise<void> {
  console.log('Starting alert detection job...');
  
  try {
    const alertService = new AlertDetectionService();
    await alertService.detectStatusChanges();
    
    console.log('Alert detection job completed successfully');
  } catch (error) {
    console.error('Alert detection job failed:', error);
  }
}

// Run the job immediately when imported (for testing)
// In production, this would be triggered by a cron scheduler
if (process.env.NODE_ENV !== 'test') {
  detectAlertsJob();
}