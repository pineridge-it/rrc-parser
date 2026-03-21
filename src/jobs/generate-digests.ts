import { DigestGenerationWorker } from '../workers/DigestGenerationWorker';

/**
 * Scheduled job to generate and send digest emails
 * Runs every hour to check for users eligible for digests
 */
export async function generateDigestsJob(): Promise<void> {
  console.log('Starting digest generation job...');
  
  try {
    const worker = new DigestGenerationWorker();
    await worker.run();
    
    console.log('Digest generation job completed successfully');
  } catch (error) {
    console.error('Digest generation job failed:', error);
  }
}

// Run the job immediately when imported (for testing)
// In production, this would be triggered by a cron scheduler
if (process.env.NODE_ENV !== 'test') {
  generateDigestsJob();
}