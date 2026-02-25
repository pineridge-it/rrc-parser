export const ErrorCodes = {
  CFG_FILE_NOT_FOUND:      'CFG-001',
  CFG_FILE_READ_FAILED:    'CFG-002',
  CFG_YAML_PARSE_FAILED:   'CFG-003',
  CFG_INVALID_ENCODING:    'CFG-004',
  CFG_INVALID_MIN_LENGTH:  'CFG-005',
  CFG_INVALID_STRICT_MODE: 'CFG-006',
  CFG_MISSING_SCHEMA_NAME: 'CFG-007',
  CFG_INVALID_RECORD_TYPE: 'CFG-008',
  CFG_INVALID_FIELD_RANGE: 'CFG-009',
  CFG_MISSING_FIELD_NAME:  'CFG-010',
  CFG_INVALID_FIELD_TYPE:  'CFG-011',
  CFG_GENERAL:             'CFG-099',

  VAL_INVALID_UUID:        'VAL-001',
  VAL_INVALID_COUNTY_CODE: 'VAL-002',
  VAL_INVALID_APP_TYPE:    'VAL-003',
  VAL_INVALID_WELL_TYPE:   'VAL-004',
  VAL_INVALID_FLAG:        'VAL-005',
  VAL_OUT_OF_RANGE:        'VAL-006',
  VAL_INVALID_DATE:        'VAL-007',
  VAL_INVALID_NUMBER:      'VAL-008',
  VAL_REQUIRED_FIELD:      'VAL-009',
  VAL_GENERAL:             'VAL-099',

  PAR_RECORD_TOO_SHORT:    'PAR-001',
  PAR_UNKNOWN_RECORD_TYPE: 'PAR-002',
  PAR_ORPHANED_RECORD:     'PAR-003',
  PAR_MALFORMED_RECORD:    'PAR-004',
  PAR_FILE_NOT_FOUND:      'PAR-005',
  PAR_FILE_READ_FAILED:    'PAR-006',
  PAR_GENERAL:             'PAR-099',

  PER_ACCESS_DENIED:       'PER-001',
  PER_WRITE_DENIED:        'PER-002',
  PER_GENERAL:             'PER-099',

  NET_TIMEOUT:             'NET-001',
  NET_CONNECTION_REFUSED:  'NET-002',
  NET_GENERAL:             'NET-099',

  UNK_GENERAL:             'UNK-001',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export const ERROR_DOCS_BASE_URL = 'https://docs.rrc-alerts.com/errors';

export function errorDocsUrl(code: ErrorCode): string {
  return `${ERROR_DOCS_BASE_URL}/${code.toLowerCase().replace('-', '/')}`;
}
