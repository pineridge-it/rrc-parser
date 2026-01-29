import { PermitParser, ParserOptions } from '../parser/PermitParser';
import { Config } from '../config';
import { ParseResult } from '../parser/PermitParser';

export interface EtlPipelineOptions {
  config?: Config;
  parserOptions?: ParserOptions;
  enableCheckpoints?: boolean;
  checkpointPath?: string;
}

export interface EtlResult {
  permitsProcessed: number;
  permitsUpserted: number;
  permitsSkipped: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
}

export class EtlPipeline {
  private readonly config: Config;
  private readonly parserOptions: ParserOptions;

  constructor(options: EtlPipelineOptions = {}) {
    this.config = options.config || new Config();
    this.parserOptions = {
      enableCheckpoints: options.enableCheckpoints ?? true,
      checkpointPath: options.checkpointPath || './.checkpoints/etl-checkpoint.json',
      resumeFromCheckpoint: true,
      strictMode: false,
      verbose: true,
      ...options.parserOptions
    };
  }

  /**
   * Execute the complete ETL pipeline
   * @param inputPath Path to the RRC permit data file
   * @returns EtlResult with processing statistics
   */
  async execute(inputPath: string): Promise<EtlResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let permitsProcessed = 0;
    let permitsUpserted = 0;
    let permitsSkipped = 0;

    try {
      console.log(`Starting ETL pipeline for ${inputPath}`);
      
      // Step 1: Fetch (already done - we're reading from file)
      console.log('Step 1: Fetch - Reading permit data from file');
      
      // Step 2: Parse the data
      console.log('Step 2: Parse - Processing permit data');
      const parser = new PermitParser(this.config, this.parserOptions);
      const parseResult: ParseResult = await parser.parseFile(inputPath);
      
      permitsProcessed = Object.keys(parseResult.permits).length;
      console.log(`Parsed ${permitsProcessed} permits`);
      
    } catch (error) {
      const errorMsg = `ETL pipeline failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);
      
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    return {
      permitsProcessed,
      permitsUpserted,
      permitsSkipped,
      errors,
      startTime,
      endTime,
      durationMs
    };
  }
}