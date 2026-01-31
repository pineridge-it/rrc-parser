#!/usr/bin/env node

import { program } from 'commander';
import { BackfillService } from '../src/services/backfill';
import { BackfillConfig } from '../src/types/backfill';

// Initialize the backfill service
const backfillService = new BackfillService({
  baseUrl: process.env.BACKFILL_API_URL || 'http://localhost:3000/api',
  apiKey: process.env.BACKFILL_API_KEY,
});

/**
 * Parse date from string
 */
function parseDate(dateString: string): Date {
  // Handle relative dates like "last 30 days"
  if (dateString.startsWith('last ')) {
    const match = dateString.match(/last (\d+) (day|days)/);
    if (match) {
      const days = parseInt(match[1]);
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    }
  }
  
  // Handle specific date formats
  return new Date(dateString);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

program
  .name('backfill')
  .description('CLI tool for backfilling historical permit data')
  .version('1.0.0');

program
  .command('run')
  .description('Run a backfill job')
  .option('-s, --start <date>', 'Start date (YYYY-MM-DD or "last X days")')
  .option('-e, --end <date>', 'End date (YYYY-MM-DD)')
  .option('-b, --batch-size <number>', 'Batch size', '100')
  .option('-d, --delay <ms>', 'Delay between batches in milliseconds', '1000')
  .option('--dry-run', 'Perform a dry run without actually processing data')
  .option('--resume', 'Resume from last checkpoint')
  .action(async (options) => {
    try {
      // Parse dates
      let startDate: Date;
      let endDate = new Date();
      
      if (options.resume) {
        // When resuming, we'll get the dates from the last checkpoint
        console.log('Resuming backfill from last checkpoint...');
      } else if (options.start) {
        startDate = parseDate(options.start);
        if (options.end) {
          endDate = parseDate(options.end);
        }
        console.log(`Backfilling data from ${formatDate(startDate)} to ${formatDate(endDate)}`);
      } else {
        console.error('Either --start date or --resume option is required');
        process.exit(1);
      }
      
      // Create backfill config
      const config: BackfillConfig = {
        startDate: startDate || new Date(),
        endDate,
        batchSize: parseInt(options.batchSize),
        delayBetweenBatches: parseInt(options.delay),
        dryRun: !!options.dryRun,
        resume: !!options.resume,
      };
      
      // Validate config
      const validation = await backfillService.validateConfig(config);
      if (!validation.valid) {
        console.error('Invalid configuration:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Configuration warnings:');
        validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
      }
      
      // Estimate duration
      const estimate = await backfillService.estimateDuration(config);
      console.log(`Estimated duration: ${estimate.estimatedHours.toFixed(1)} hours`);
      console.log(`Estimated records: ${estimate.estimatedRecords.toLocaleString()}`);
      
      if (config.dryRun) {
        console.log('Performing dry run...');
      }
      
      // Start backfill
      const result = await backfillService.startBackfill(config);
      console.log(`Started backfill job: ${result.id}`);
      
      // Monitor progress
      if (!config.dryRun) {
        monitorProgress(result.id);
      }
    } catch (error) {
      console.error('Error starting backfill:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check status of backfill jobs')
  .option('-i, --id <id>', 'Specific backfill job ID')
  .option('--running', 'Show only running jobs')
  .option('--completed', 'Show only completed jobs')
  .option('--failed', 'Show only failed jobs')
  .option('--cancelled', 'Show only cancelled jobs')
  .action(async (options) => {
    try {
      if (options.id) {
        // Get specific backfill job
        const result = await backfillService.getBackfillProgress(options.id);
        displayBackfillStatus(result);
      } else {
        // List backfill jobs
        const statusFilter = options.running ? 'running' : 
                           options.completed ? 'completed' : 
                           options.failed ? 'failed' : 
                           options.cancelled ? 'cancelled' : 
                           undefined;
        
        const results = await backfillService.listBackfills({
          status: statusFilter,
        });
        
        if (results.length === 0) {
          console.log('No backfill jobs found');
          return;
        }
        
        console.log('Backfill Jobs:');
        results.forEach(result => {
          displayBackfillStatus(result);
        });
      }
    } catch (error) {
      console.error('Error fetching backfill status:', error);
      process.exit(1);
    }
  });

program
  .command('cancel')
  .description('Cancel a running backfill job')
  .argument('<id>', 'Backfill job ID')
  .action(async (id) => {
    try {
      await backfillService.cancelBackfill(id);
      console.log(`Cancelled backfill job: ${id}`);
    } catch (error) {
      console.error('Error cancelling backfill:', error);
      process.exit(1);
    }
  });

program
  .command('retry')
  .description('Retry a failed backfill job')
  .argument('<id>', 'Backfill job ID')
  .action(async (id) => {
    try {
      const result = await backfillService.retryBackfill(id);
      console.log(`Retrying backfill job: ${result.id}`);
      monitorProgress(result.id);
    } catch (error) {
      console.error('Error retrying backfill:', error);
      process.exit(1);
    }
  });

program
  .command('presets')
  .description('Show available backfill configuration presets')
  .action(async () => {
    try {
      const presets = await backfillService.getConfigPresets();
      console.log('Available Presets:');
      console.log(`  Last 30 Days: ${formatDate(presets.last30Days.startDate)} to ${formatDate(presets.last30Days.endDate)}`);
      console.log(`  Last 90 Days: ${formatDate(presets.last90Days.startDate)} to ${formatDate(presets.last90Days.endDate)}`);
      console.log(`  Last Year: ${formatDate(presets.lastYear.startDate)} to ${formatDate(presets.lastYear.endDate)}`);
    } catch (error) {
      console.error('Error fetching presets:', error);
      process.exit(1);
    }
  });

/**
 * Display backfill status
 */
function displayBackfillStatus(result: any) {
  console.log(`\nID: ${result.id}`);
  console.log(`Status: ${result.status}`);
  console.log(`Start Date: ${formatDate(new Date(result.config.startDate))}`);
  console.log(`End Date: ${formatDate(new Date(result.config.endDate))}`);
  console.log(`Dry Run: ${result.config.dryRun ? 'Yes' : 'No'}`);
  
  if (result.progress) {
    console.log(`Progress: ${result.progress.completedDays}/${result.progress.totalDays} days`);
    console.log(`Records: ${result.progress.processedRecords}/${result.progress.totalRecords}`);
    console.log(`Errors: ${result.progress.errors}`);
    
    if (result.progress.startedAt) {
      console.log(`Started: ${new Date(result.progress.startedAt).toISOString()}`);
    }
    
    if (result.progress.estimatedCompletion) {
      console.log(`ETA: ${new Date(result.progress.estimatedCompletion).toISOString()}`);
    }
  }
  
  if (result.completedAt) {
    console.log(`Completed: ${new Date(result.completedAt).toISOString()}`);
  }
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
}

/**
 * Monitor backfill progress
 */
async function monitorProgress(backfillId: string) {
  console.log('\nMonitoring progress (Ctrl+C to exit)...');
  
  // Initial status
  let result = await backfillService.getBackfillProgress(backfillId);
  
  // Display initial status
  displayBackfillStatus(result);
  
  // Poll for updates
  const interval = setInterval(async () => {
    try {
      result = await backfillService.getBackfillProgress(backfillId);
      
      // Clear screen and show updated status
      process.stdout.write('\x1B[2J\x1B[0f');
      displayBackfillStatus(result);
      
      // Stop monitoring if job is completed
      if (result.status === 'completed' || result.status === 'failed' || result.status === 'cancelled') {
        clearInterval(interval);
        console.log(`\nBackfill ${result.status}`);
        process.exit(result.status === 'completed' ? 0 : 1);
      }
    } catch (error) {
      console.error('Error monitoring progress:', error);
      clearInterval(interval);
      process.exit(1);
    }
  }, 5000); // Poll every 5 seconds
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\nStopped monitoring. Job may still be running.');
    process.exit(0);
  });
}

program.parse();