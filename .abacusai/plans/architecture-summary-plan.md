Scope: Parser/ETL (requested)
Format: Bullets + short narrative

Purpose
- Project delivers a TypeScript DAF420 permit parser plus ETL pipeline for Texas RRC permit data.
- Core goals: type-safe parsing, streaming/memory-optimized processing, QA gates, monitoring, and operator normalization.

Key modules and responsibilities
- Parser core: src/parser/PermitParser.ts
  - Streaming parsing with memory buffering and disk-backed permit storage.
  - Optional checkpointing and resume support.
  - Produces ParseResult (permits + stats + validation report + performance).
- Config layer: src/config/*
  - YAML-based schema definitions and validation rules (Config, RecordSchema, FieldSpec).
- Models: src/models/*
  - Permit data container, ParseStats, ParsedRecord.
- Validation: src/validators/*
  - Field validation and ValidationReport aggregation.
- Export: src/exporter/*
  - CSVExporter for output.
- ETL pipeline: src/etl/Pipeline.ts
  - Orchestrates parse -> QA gates -> monitoring/metrics.
  - QA gates via src/qa; monitoring via src/monitoring; metrics via src/metrics.
- ETL service (operator normalization): src/services/etl/index.ts
  - Normalizes operator names via OperatorNormalizer and tracks confidence/needsReview.
  - Placeholder persistence hooks for permits/operators.
- CLI entry: src/cli/index.ts
  - Parses args, runs parser, prints summaries, optional validation report and perf metrics.
- Public API: src/index.ts
  - Re-exports Config, Parser, Exporter, Types, Utils for programmatic use.

Data flow (runtime)
- Input DAF420 file
  -> Config loads schemas and validation rules
  -> PermitParser streams file, routes records into Permit model
  -> Validator records errors/warnings
  -> ParseResult aggregated
  -> (ETL) QA gate checks on transformed records
  -> (ETL) Monitoring/metrics recorded
  -> CSVExporter writes output (CLI or programmatic)

Runtime entry points
- CLI: npm run parse -> dist/cli/index.js (built from src/cli/index.ts)
- Programmatic: import { Config, PermitParser, CSVExporter } from src/index.ts
- ETL: instantiate EtlPipeline from src/etl/Pipeline.ts

Short narrative summary
The system is a TypeScript DAF420 permit parser designed for reliability and scale. It loads YAML-based schemas, streams permit records through a stateful parser with validation and checkpointing, and emits typed permit objects plus stats and validation reports. The ETL layer wraps parsing with QA gates, monitoring, and metrics, and a service module adds operator-name normalization to support downstream intelligence. Outputs are typically exported via CSV, and the CLI provides the primary runtime interface.

Critical files referenced
- src/parser/PermitParser.ts
- src/etl/Pipeline.ts
- src/services/etl/index.ts
- src/cli/index.ts
- src/index.ts
- src/config/*
- src/models/*
- src/validators/*
- src/exporter/*
- src/qa/*
- src/monitoring/*
- src/metrics/*
