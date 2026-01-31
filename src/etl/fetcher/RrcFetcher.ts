import { RrcPermitParser, RrcParserOptions, RrcParseResult } from '../../parser/rrc';
import { PermitData } from '../../types/permit';

/**
 * Fetch result for ETL pipeline integration
 */
export interface RrcFetchResult {
  permits: PermitData[];
  totalCount: number;
  errorCount: number;
  warningCount: number;
  durationMs: number;
  metadata: {
    sourceFile: string;
    parserVersion: string;
    linesProcessed: number;
    recordsByType: Record<string, number>;
  };
}

/**
 * RRC Data Fetcher for ETL Pipeline
 * 
 * Fetches and parses RRC permit data from DAF420 files.
 * Integrates with the ETL pipeline as the Extract phase.
 */
export class RrcFetcher {
  private parser: RrcPermitParser;
  private options: RrcParserOptions;

  constructor(options: RrcParserOptions = {}) {
    this.options = {
      strictMode: false,
      verbose: true,
      maxMalformedTolerance: 100,
      ...options
    };
    this.parser = new RrcPermitParser(this.options);
  }

  /**
   * Fetch permits from a DAF420 file
   * 
   * @param filePath Path to the DAF420 file
   * @returns Fetch result with permits and metadata
   */
  async fetch(filePath: string): Promise<RrcFetchResult> {
    const startTime = Date.now();

    try {
      const parseResult = await this.parser.parseFile(filePath);
      const duration = Date.now() - startTime;

      // Convert permits map to array
      const permits = Object.values(parseResult.permits);

      // Convert recordsByType Map to plain object
      const recordsByType: Record<string, number> = {};
      parseResult.stats.recordsByType.forEach((count, type) => {
        recordsByType[type] = count;
      });

      return {
        permits,
        totalCount: permits.length,
        errorCount: parseResult.errors.length,
        warningCount: parseResult.warnings.length,
        durationMs: duration,
        metadata: {
          sourceFile: filePath,
          parserVersion: '1.0.0',
          linesProcessed: parseResult.stats.linesProcessed,
          recordsByType
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Return partial results if available
      return {
        permits: [],
        totalCount: 0,
        errorCount: 1,
        warningCount: 0,
        durationMs: duration,
        metadata: {
          sourceFile: filePath,
          parserVersion: '1.0.0',
          linesProcessed: 0,
          recordsByType: {}
        }
      };
    }
  }

  /**
   * Fetch with progress tracking
   */
  async fetchWithProgress(
    filePath: string,
    onProgress: (processed: number, total: number) => void
  ): Promise<RrcFetchResult> {
    // Estimate total lines (will be refined during parsing)
    let estimatedTotal = 1000;

    const options: RrcParserOptions = {
      ...this.options,
      onProgress: (lineNumber) => {
        onProgress(lineNumber, Math.max(lineNumber, estimatedTotal));
      }
    };

    const parser = new RrcPermitParser(options);
    const startTime = Date.now();

    const parseResult = await parser.parseFile(filePath);
    const duration = Date.now() - startTime;

    const permits = Object.values(parseResult.permits);
    
    const recordsByType: Record<string, number> = {};
    parseResult.stats.recordsByType.forEach((count, type) => {
      recordsByType[type] = count;
    });

    return {
      permits,
      totalCount: permits.length,
      errorCount: parseResult.errors.length,
      warningCount: parseResult.warnings.length,
      durationMs: duration,
      metadata: {
        sourceFile: filePath,
        parserVersion: '1.0.0',
        linesProcessed: parseResult.stats.linesProcessed,
        recordsByType
      }
    };
  }

  /**
   * Validate a DAF420 file without full parsing
   */
  async validate(filePath: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    stats: {
      totalLines: number;
      recordTypes: Record<string, number>;
    };
  }> {
    const options: RrcParserOptions = {
      ...this.options,
      strictMode: true,
      maxMalformedTolerance: 10
    };

    const parser = new RrcPermitParser(options);
    
    try {
      const result = await parser.parseFile(filePath);
      
      const recordTypes: Record<string, number> = {};
      result.stats.recordsByType.forEach((count, type) => {
        recordTypes[type] = count;
      });

      return {
        valid: result.errors.length === 0,
        errors: result.errors.map(e => `Line ${e.lineNumber}: ${e.error}`),
        warnings: result.warnings,
        stats: {
          totalLines: result.stats.linesProcessed,
          recordTypes
        }
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        stats: {
          totalLines: 0,
          recordTypes: {}
        }
      };
    }
  }
}

// Factory function
export function createRrcFetcher(options?: RrcParserOptions): RrcFetcher {
  return new RrcFetcher(options);
}
