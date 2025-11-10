
/**
 * Enhanced CLI with progress reporting and better UI
 * Location: src/cli/index.ts
 * 
 * IMPROVEMENTS:
 * - Removed all 'as any' type casts for better type safety
 * - Added proper type definitions for all functions
 * - Improved error handling with specific error messages
 * - Better input validation
 * - Extracted constants for magic values
 * - Added comprehensive JSDoc comments
 */

import * as fs from 'fs';
import { Config } from '../config';
import { PermitParser, ParseResult } from '../parser';
import { CSVExporter } from '../exporter';
import { ProgressReporter, Logger } from './ProgressReporter';
import { ConfigurationError } from '../utils/ParseError';
import { RecordSchema } from '../config';

// Constants
const EXIT_SUCCESS = 0;
const EXIT_ERROR = 1;
const AVERAGE_BYTES_PER_LINE = 100;

interface CLIArgs {
  input?: string;
  output?: string;
  config?: string;
  strict?: boolean;
  verbose?: boolean;
  help?: boolean;
  performance?: boolean;
  validationReport?: string;
}

interface PerformanceMetrics {
  avg: string;
  max: string;
  count: number;
}

/**
 * Parse command-line arguments
 * @returns Parsed arguments object
 */
function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    if (arg === '-h' || arg === '--help') {
      args.help = true;
    } else if (arg === '-i' || arg === '--input') {
      args.input = argv[++i];
    } else if (arg === '-o' || arg === '--output') {
      args.output = argv[++i];
    } else if (arg === '-c' || arg === '--config') {
      args.config = argv[++i];
    } else if (arg === '--strict') {
      args.strict = true;
    } else if (arg === '-v' || arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '-p' || arg === '--performance') {
      args.performance = true;
    } else if (arg === '--validation-report') {
      args.validationReport = argv[++i];
    }
  }
  
  return args;
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
DAF420 Permit Parser - TypeScript Edition v2.0
===============================================

Usage: npm run parse -- [options]

Required Options:
  -i, --input <file>           Input DAF420 file
  -o, --output <file>          Output CSV file

Optional:
  -c, --config <file>          Custom config file path
  --strict                     Strict mode - fail on errors
  -v, --verbose                Verbose logging
  -p, --performance            Show performance metrics
  --validation-report <file>   Export validation issues to CSV
  -h, --help                   Show this help message

Examples:
  # Basic usage
  npm run parse -- -i input.dat -o output.csv
  
  # Verbose mode with progress
  npm run parse -- -i input.dat -o output.csv -v
  
  # Strict mode with validation report
  npm run parse -- -i input.dat -o output.csv --strict --validation-report issues.csv
  
  # With performance monitoring
  npm run parse -- -i input.dat -o output.csv -p
  `);
}

/**
 * Print parsing summary
 * @param result - Parse result containing stats and validation report
 * @param schemas - Map of record type to schema
 */
function printSummary(result: ParseResult, schemas: Map<string, RecordSchema>): void {
  const stats = result.stats;
  
  console.log('\n' + '='.repeat(80));
  console.log('PROCESSING SUMMARY');
  console.log('='.repeat(80));
  console.log(`Lines processed:      ${stats.linesProcessed.toLocaleString()}`);
  console.log(`Unique permits:       ${stats.successfulPermits.toLocaleString()}`);
  console.log(`Malformed records:    ${stats.malformedRecords.toLocaleString()}`);
  console.log(`Orphaned records:     ${stats.orphanedRecords.toLocaleString()}`);
  console.log(`  - Recovered:        ${stats.recoveredRecords.toLocaleString()}`);
  console.log(`  - Lost:             ${(stats.orphanedRecords - stats.recoveredRecords).toLocaleString()}`);
  
  const valSummary = result.validationReport.getSummary();
  console.log(`Validation errors:    ${valSummary.totalErrors.toLocaleString()}`);
  console.log(`Validation warnings:  ${valSummary.totalWarnings.toLocaleString()}`);
  
  console.log('\nRecords by Type:');
  
  // Properly typed sort operation
  const entries: [string, number][] = Array.from(stats.recordsByType.entries());
  const sortedTypes: [string, number][] = entries.sort((a, b) => a[0].localeCompare(b[0]));

  for (const [recType, count] of sortedTypes) {
    const schema = schemas.get(recType);
    const schemaName = schema ? schema.name : 'UNKNOWN';
    console.log(`  ${recType} (${schemaName.padEnd(15)}): ${count.toLocaleString()}`);
  }
}

/**
 * Print performance metrics
 * @param performance - Performance data from parse result
 */
function printPerformanceMetrics(performance: Record<string, unknown>): void {
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE METRICS');
  console.log('='.repeat(80));
  
  for (const [label, metricsData] of Object.entries(performance)) {
    // Type guard to ensure we have the expected structure
    if (isPerformanceMetrics(metricsData)) {
      console.log(
        `${label.padEnd(30)} | ` +
        `Avg: ${metricsData.avg.padStart(10)} | ` +
        `Max: ${metricsData.max.padStart(10)} | ` +
        `Count: ${metricsData.count}`
      );
    }
  }
}

/**
 * Type guard to check if value is PerformanceMetrics
 * @param value - Value to check
 * @returns True if value is PerformanceMetrics
 */
function isPerformanceMetrics(value: unknown): value is PerformanceMetrics {
  return (
    typeof value === 'object' &&
    value !== null &&
    'avg' in value &&
    'max' in value &&
    'count' in value &&
    typeof (value as PerformanceMetrics).avg === 'string' &&
    typeof (value as PerformanceMetrics).max === 'string' &&
    typeof (value as PerformanceMetrics).count === 'number'
  );
}

/**
 * Estimate total lines in file (for progress bar)
 * @param filePath - Path to the file
 * @returns Estimated line count
 */
function estimateLineCount(filePath: string): number {
  const stats = fs.statSync(filePath);
  // Rough estimate: assume average line is ~100 bytes
  return Math.floor(stats.size / AVERAGE_BYTES_PER_LINE);
}

/**
 * Validate input arguments
 * @param args - Parsed command-line arguments
 * @param logger - Logger instance
 * @returns True if valid, false otherwise
 */
function validateArgs(args: CLIArgs, logger: Logger): boolean {
  if (!args.input || !args.output) {
    logger.error('Both input (-i) and output (-o) files are required\n');
    return false;
  }

  if (!fs.existsSync(args.input)) {
    logger.error(`Input file not found: ${args.input}`);
    return false;
  }

  return true;
}

/**
 * Main CLI entry point
 * @returns Exit code (0 for success, 1 for error)
 */
async function main(): Promise<number> {
  const logger = new Logger();
  const args = parseArgs();
  
  // Show help
  if (args.help) {
    printUsage();
    return EXIT_SUCCESS;
  }
  
  // Validate required arguments
  if (!validateArgs(args, logger)) {
    printUsage();
    return EXIT_ERROR;
  }

  // TypeScript now knows args.input and args.output are defined
  const inputPath = args.input!;
  const outputPath = args.output!;
  
  try {
    // Load configuration
    logger.info('Loading configuration...');
    const config = new Config(args.config);
    const configSummary = config.getSummary();
    
    if (args.verbose) {
      logger.info(`Loaded ${configSummary.schemasCount} schemas and ${configSummary.lookupTablesCount} lookup tables`);
    }
    
    // File info
    const fileStats = fs.statSync(inputPath);
    logger.info(`Processing: ${inputPath}`);
    logger.info(`File size: ${fileStats.size.toLocaleString()} bytes`);
    
    // Setup progress reporter
    const estimatedLines = estimateLineCount(inputPath);
    const progress = args.verbose ? new ProgressReporter(estimatedLines) : null;
    
    // Create parser
    const parser = new PermitParser(config, {
      strictMode: args.strict || false,
      verbose: args.verbose || false,
      enablePerformanceMonitoring: args.performance || false,
      onProgress: progress ? (line, stats) => progress.update(line, stats) : undefined
    });
    
    // Parse file
    logger.info('Parsing file...\n');
    const startTime = Date.now();
    
    let result: ParseResult;
    try {
      result = await parser.parseFile(inputPath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (progress) {
        progress.error(errorMsg);
      } else {
        logger.error(errorMsg);
      }
      throw error;
    }
    
    const elapsed = Date.now() - startTime;
    
    // Show completion
    if (progress) {
      progress.complete(result.stats, elapsed);
    } else {
      logger.success(`Parsing complete in ${(elapsed / 1000).toFixed(2)}s`);
    }
    
    // Export to CSV
    logger.info('Exporting to CSV...');
    const exporter = new CSVExporter(config);
    await exporter.export(result.permits, outputPath);
    logger.success(`Output written to: ${outputPath}`);
    
    // Export validation report if requested
    if (args.validationReport && result.validationReport.getSummary().total > 0) {
      logger.info('Exporting validation report...');
      await result.validationReport.exportToCSV(args.validationReport);
      logger.success(`Validation report written to: ${args.validationReport}`);
    }
    
    // Print summary
    printSummary(result, config.schemas);
    
    // Print performance metrics if requested
    if (args.performance && result.performance) {
      printPerformanceMetrics(result.performance);
    }
    
    // Print validation summary if there are issues
    if (result.validationReport.getSummary().total > 0) {
      result.validationReport.printSummary();
    }
    
    // Exit with error code if there were validation errors in strict mode
    if (args.strict && result.validationReport.hasErrors()) {
      logger.warning('Validation errors detected in strict mode');
      return EXIT_ERROR;
    }
    
    return EXIT_SUCCESS;
    
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    
    if (error instanceof ConfigurationError) {
      logger.error('Configuration Error:');
      console.error(error.toString());
    } else if (error instanceof Error) {
      logger.error('Error during processing:');
      console.error(error.message);
      if (args.verbose && error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      logger.error('Unknown error during processing:');
      console.error(String(error));
    }
    
    return EXIT_ERROR;
  }
}

// Run the CLI
if (require.main === module) {
  main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(EXIT_ERROR);
    });
}

export { main };
