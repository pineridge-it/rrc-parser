"use strict";
/**
 * Command-line interface for the DAF420 parser
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const config_1 = require("../config");
const parser_1 = require("../parser");
const exporter_1 = require("../exporter");
/**
 * Parse command-line arguments
 * @returns Parsed arguments
 */
function parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '-h' || arg === '--help') {
            args.help = true;
        }
        else if (arg === '-i' || arg === '--input') {
            args.input = argv[++i];
        }
        else if (arg === '-o' || arg === '--output') {
            args.output = argv[++i];
        }
        else if (arg === '-c' || arg === '--config') {
            args.config = argv[++i];
        }
        else if (arg === '--strict') {
            args.strict = true;
        }
        else if (arg === '-v' || arg === '--verbose') {
            args.verbose = true;
        }
    }
    return args;
}
/**
 * Print usage information
 */
function printUsage() {
    console.log(`
DAF420 Permit Parser - TypeScript Edition
==========================================

Usage: npm run parse -- [options]

Options:
  -i, --input <file>      Input DAF420 file (required)
  -o, --output <file>     Output CSV file (required)
  -c, --config <file>     Custom config file path (optional)
  --strict                Strict mode - fail on errors (optional)
  -v, --verbose           Verbose logging (optional)
  -h, --help              Show this help message

Examples:
  npm run parse -- -i input.dat -o output.csv
  npm run parse -- -i input.dat -o output.csv -v
  npm run parse -- -i input.dat -o output.csv --strict
  npm run parse -- -i input.dat -o output.csv -c custom_config.yaml
  `);
}
/**
 * Print parsing summary
 * @param stats - Parse statistics
 * @param schemas - Schema map
 */
function printSummary(stats, schemas) {
    console.log('\n' + '='.repeat(80));
    console.log('PROCESSING SUMMARY');
    console.log('='.repeat(80));
    console.log(`Lines processed:      ${stats.linesProcessed.toLocaleString()}`);
    console.log(`Unique permits:       ${stats.successfulPermits.toLocaleString()}`);
    console.log(`Malformed records:    ${stats.malformedRecords.toLocaleString()}`);
    console.log(`Orphaned records:     ${stats.orphanedRecords.toLocaleString()}`);
    console.log(`  - Recovered:        ${stats.recoveredRecords.toLocaleString()}`);
    console.log(`  - Lost:             ${(stats.orphanedRecords - stats.recoveredRecords).toLocaleString()}`);
    console.log(`Validation errors:    ${stats.validationErrors.toLocaleString()}`);
    console.log(`Validation warnings:  ${stats.validationWarnings.toLocaleString()}`);
    console.log('\nRecords by Type:');
    const sortedTypes = Array.from(stats.recordsByType.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [recType, count] of sortedTypes) {
        const schema = schemas.get(recType);
        const schemaName = schema ? schema.name : 'UNKNOWN';
        console.log(`  ${recType} (${schemaName.padEnd(15)}): ${count.toLocaleString()}`);
    }
}
/**
 * Main CLI entry point
 */
async function main() {
    const args = parseArgs();
    // Show help
    if (args.help) {
        printUsage();
        return 0;
    }
    // Validate required arguments
    if (!args.input || !args.output) {
        console.error('Error: Both input (-i) and output (-o) files are required\n');
        printUsage();
        return 1;
    }
    // Check if input file exists
    if (!fs.existsSync(args.input)) {
        console.error(`Error: Input file not found: ${args.input}`);
        return 1;
    }
    try {
        // Load configuration
        const config = new config_1.Config(args.config);
        console.log(`Processing: ${args.input}`);
        const stats = fs.statSync(args.input);
        console.log(`File size: ${stats.size.toLocaleString()} bytes`);
        // Create parser
        const parser = new parser_1.PermitParser(config, {
            strictMode: args.strict || false,
            verbose: args.verbose || false
        });
        // Parse file
        const startTime = Date.now();
        const { permits, stats: parseStats } = await parser.parseFile(args.input);
        const elapsed = Date.now() - startTime;
        // Export to CSV
        const exporter = new exporter_1.CSVExporter(config);
        await exporter.export(permits, args.output);
        // Print summary
        printSummary(parseStats, config.schemas);
        console.log(`\nProcessing time: ${(elapsed / 1000).toFixed(2)}s`);
        console.log(`Output written to: ${args.output}`);
        return 0;
    }
    catch (error) {
        console.error('\nError during processing:');
        console.error(error);
        return 1;
    }
}
// Run the CLI
if (require.main === module) {
    main()
        .then(exitCode => process.exit(exitCode))
        .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map