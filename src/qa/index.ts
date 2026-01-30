/**
 * QA Gates Module
 * Automated data quality checks for the DAF420 permit parser
 */

// Types
export {
  CheckSeverity,
  CheckStage,
  QACheck,
  QAMetrics,
  QAResult,
  VolumeThresholds,
  SchemaThresholds,
  ValueThresholds,
  QAGateConfig,
  DEFAULT_QA_CONFIG
} from './types';

// Checks
export { VolumeChecks, VolumeCheckContext } from './checks/VolumeChecks';
export { SchemaChecks, SchemaCheckContext } from './checks/SchemaChecks';
export { ValueChecks, ValueCheckContext } from './checks/ValueChecks';

// Main Gate
export { QAGate, QAGateRunner, QAGateContext } from './QAGate';
