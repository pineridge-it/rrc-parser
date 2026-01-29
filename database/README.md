# Database Schema

This directory contains the database schema definitions for the RRC Permit Monitoring System.

## Directory Structure

```
database/
├── schema/          # Table schema definitions
│   └── alert_rules.sql
└── migrations/      # Database migration scripts
```

## Schema Files

### alert_rules.sql

Defines the `alert_rules` table for storing user-defined alert configurations.

**Purpose**: Enable users to create custom alerts for permit activity monitoring based on spatial criteria, operator watchlists, and various filters.

**Key Features**:
- Workspace isolation via Row Level Security (RLS)
- Flexible JSONB filters for complex query criteria
- Array-based AOI and operator watchlists with GIN indexes
- Notification channel configuration (email, SMS, in-app)
- Quiet hours and digest frequency settings
- Amendment tracking capability

**Dependencies**:
- `workspaces(id)` - Workspace isolation
- `aois(id)` - Area of Interest references (future)
- `operators(id)` - Operator references (future)
- `users` table with `auth.uid()` function for RLS

**Filter Schema Example**:
```json
{
  "operators": ["uuid1", "uuid2"],
  "counties": ["Midland", "Martin"],
  "statuses": ["approved"],
  "permit_types": ["drilling"],
  "filed_after": "2024-01-01"
}
```

## Usage

To apply the schema:

```bash
psql -d your_database -f database/schema/alert_rules.sql
```

## Testing

Verify the schema was created correctly:

```sql
\d alert_rules
SELECT * FROM pg_indexes WHERE tablename = 'alert_rules';
SELECT * FROM pg_policies WHERE tablename = 'alert_rules';
```

## Related Tasks

- **ubuntu-08m.1.1**: Create alert_rules table schema ✓
- **ubuntu-08m.1**: Alert Rules Engine (parent)
- **ubuntu-08m**: EPIC: Phase 2 - Durable Alerting System (epic)
