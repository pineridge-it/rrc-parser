# Database Schema

This directory contains the database schema definitions for the RRC Permit Monitoring System.

## Directory Structure

```
database/
├── schema/          # Table schema definitions
│   ├── alert_rules.sql
│   ├── alert_events.sql
│   └── notifications.sql
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

### alert_events.sql

Defines the `alert_events` table implementing the outbox pattern for durable alert event storage.

**Purpose**: Provide a durable, immutable record of all triggered alerts with deduplication and retry capabilities.

**Key Features**:
- Outbox pattern for guaranteed delivery
- Deduplication via unique dedup_key
- Immutable audit trail of all alert triggers
- Status tracking (pending, processing, delivered, failed)
- Complete permit snapshot at time of match
- Workspace isolation via RLS

**Dependencies**:
- `workspaces(id)` - Workspace isolation
- `alert_rules(id)` - Alert rule that triggered the event
- `permits_clean(id)` - Permit that matched the rule

**Deduplication Strategy**:
- `dedup_key` format: `{rule_id}:{permit_id}:{version}`
- Prevents duplicate alerts for same permit/rule combination
- Version allows re-alerting on amendments if configured

**Match Reason Schema Example**:
```json
{
  "matched_filters": ["operator_watchlist", "county"],
  "operator_id": "uuid",
  "county": "Midland",
  "permit_status": "approved"
}
```

### notifications.sql

Defines the `notifications` table for tracking delivery attempts per channel.

**Purpose**: Track individual notification delivery attempts across multiple channels (email, SMS, in-app, webhook).

**Key Features**:
- Multi-channel support (email, SMS, in-app, webhook)
- Retry tracking with attempt count and timestamps
- Delivery status tracking (pending, sent, failed, bounced)
- Error message capture for debugging
- Channel-specific metadata storage
- Workspace isolation via RLS (inherited from alert_events)

**Dependencies**:
- `alert_events(id)` - Parent alert event

**Status Flow**:
1. `pending` - Created, awaiting delivery
2. `sent` - Successfully delivered
3. `failed` - Delivery failed, will retry
4. `bounced` - Permanent failure (e.g., invalid email)

## Usage

To apply the schema:

```bash
psql -d your_database -f database/schema/alert_rules.sql
psql -d your_database -f database/schema/alert_events.sql
psql -d your_database -f database/schema/notifications.sql
```

## Testing

Verify the schema was created correctly:

```sql
\d alert_rules
\d alert_events
\d notifications
SELECT * FROM pg_indexes WHERE tablename IN ('alert_rules', 'alert_events', 'notifications');
SELECT * FROM pg_policies WHERE tablename IN ('alert_rules', 'alert_events', 'notifications');
```

## Related Tasks

- **ubuntu-08m.1.1**: Create alert_rules table schema ✓
- **ubuntu-08m.2**: Durable Alert Events System (Outbox Pattern) ✓
- **ubuntu-08m.1**: Alert Rules Engine (parent)
- **ubuntu-08m**: EPIC: Phase 2 - Durable Alerting System (epic)
- **ubuntu-08m**: EPIC: Phase 2 - Durable Alerting System (epic)
