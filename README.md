
### Product Requirements Document (PRD)

### Product: Texas Drilling Permit Alerts + Operator Intelligence

**MVP Promise**: *If a permit is filed that matches your AOI + filters, you’ll reliably know—fast—without manual checking.*

---

### 1. Purpose

This product delivers a **real-time drilling permit alert and operator intelligence platform** tailored for independent landmen and small E&P companies in Texas.

#### Problem it solves
Users currently struggle with:
- Manually checking the RRC website for permits
- Missing permits filed over weekends/holidays
- Heavy, expensive, enterprise-grade tools (e.g., Enverus)

#### Solution
Provide **affordable**, **mobile-friendly**, and **intuitive tools** for monitoring drilling activity, with alerts, maps, and analytics.

#### Success Benchmarks

**North Star Metric (NSM)**
- **Weekly Actionable Alerts Opened** per active account  
  *(alert opened + map viewed or export initiated within 10 minutes)*

**Trust & Freshness SLOs (initial targets)**
- **Freshness**: 95% of new permit filings ingested + alert-evaluated within **2 hours** of source availability
- **Reliability**: 99.5% monthly uptime for the core alert delivery pipeline (excluding carrier/email provider outages)

**Growth & Monetization**
- **Activation Rate**: 60% of new signups create an Area of Interest (AOI) or Saved Search
- **Engagement**: 70% of paid users active weekly; avg. 10+ alerts per user per month (with fatigue controls)
- **Monetization**: 25% trial → paid conversion; 15% API adoption among Pro users

---

### 2. Role in the Project

This PRD defines **what** the product delivers and **why** it matters:

- **Aligns stakeholders**: developers, designers, and product managers around goals and SLOs
- **Informs design**: dictates onboarding flows, UX patterns, and map-first interactions
- **Guides engineering**: defines backend needs (idempotent ETL, PostGIS, event-driven alerts, external API)
- **Sets scope**: anchors what is included in MVP vs. post-MVP roadmap

---

### 3. User Needs & Use Cases

#### Primary users
- Independent landmen
- Small operators / E&P companies
- Field-based users with mobile-first needs

#### Core use cases
1. **Landman**: Draw AOI + set filters → receive SMS/email/in-app alerts for new permits (and amendments if desired)
2. **VP Exploration**: Track competitor activity + compare operators by county/AOI
3. **Small operator**: Export permit/well data for internal deal analysis; track activity around assets
4. **Consultant**: Monitor operator trends; generate client-ready maps/reports on a schedule

---

### 4. High-Level Requirements

#### Functional Requirements
- **User Accounts**: sign up/login with email (Supabase Auth)
- **Permits & Wells Search**: fast queryable database of permits + related well records where available
- **Mapping Interface**: draw AOIs, browse permits/wells, and view detail pages (Mapbox)
- **AOIs & Saved Searches**
  - AOI geometry + optional **buffer distance**
  - Saved filters (operator, county, status/type, dates, etc.)
- **Alerts**
  - Rules based on AOI + filters + **operator watchlists**
  - Delivery via **SMS**, **email**, and **in-app notifications**
  - Quiet hours + digest options to prevent alert fatigue
- **Operator Profiles**
  - Normalized operator identity (aliases / naming variants)
  - Activity timelines (permits, amendments, related wells where available)
  - Comparisons vs peers (by county/AOI)
- **Billing**: subscription-based via Stripe
- **Exports & Reports**
  - Async CSV/Excel exports with export history
  - Templated “AOI Activity Report” (MVP-lite)
- **API Access (Pro)**
  - External API with keys, rate limits, quotas, versioning, and usage metering

#### Non-Functional Requirements
- **Performance**
  - <2s for filtered list queries (typical AOI)
  - <300ms for map tile responses (panning/zooming)
- **Scalability**: 1M+ permits with PostGIS + caching + tile-based map rendering
- **Reliability**: ingestion + alerting monitored with SLOs; alert on lag, failures, and anomaly thresholds
- **Mobile Usability**: responsive design, field-ready UI
- **Affordability**: pricing starts at $99/month; cancel anytime

---

### 5. System Requirements (Architecture-Critical)

#### Data Ingestion & Quality
- Maintain **raw** and **clean** data layers (raw snapshots/records preserved for audit/debug)
- ETL must be **idempotent** (safe to rerun) and support **backfills** (e.g., last 30/90 days)
- Track **permit record versions** (new filings vs amendments) with `effective_at` and `source_seen_at`
- Automated QA checks and gates:
  - row-count deltas, null spikes, schema drift, geometry validity
  - “no-ingestion” alarms and ingestion lag alarms

#### Alerting System
- Alert evaluation produces durable **Alert Events** (not direct sends)
- Use **outbox + worker delivery** to prevent lost/duplicate notifications
- **Dedupe** per user/rule/permit event; support “notify on amendment” vs “notify once”
- Delivery channels: SMS, email, and **in-app notification center**
- Controls: quiet hours, daily/weekly digests, and per-account rate limits (cost + fatigue control)

#### Spatial/Map Architecture
- Prefer **vector tile** endpoints for browsing permits/wells; fetch full details on click
- Partition permits by time (e.g., year/quarter) and enforce spatial indexes (`GIST`) + common filter indexes
- Cache “AOI+filters” query signatures to speed repeat usage and reduce DB load

#### Security & Tenancy
- Introduce **Workspace** as the top-level tenant (supports future teams without major refactors)
- Enforce **Row Level Security (RLS)** for AOIs, alerts, exports, and API keys
- Maintain an **audit_log** for billing changes, API key actions, exports, and alert rule edits

#### External API Requirements (Pro)
- API keys per workspace, revocable; per-key rate limits and monthly quotas
- Usage metering surfaced in billing/admin UI
- Versioning policy (e.g., `/v1/`) and deprecation windows to avoid breaking customers

#### Export System Requirements
- Exports generated asynchronously with job status + history (prevents timeouts and stabilizes DB load)

---

### 6. Dependencies & Connections

- **User Flow**: onboarding drives activation (welcome → create AOI/saved search → set alert rules → receive first alert quickly)
- **Tech Stack**: Next.js + TypeScript + Supabase (Postgres + Auth) + PostGIS + Mapbox + Stripe + SendGrid + SMS provider
- **Schema Design**: driven by required entities:
  - workspaces, users, permits_raw, permits_clean, wells, AOIs, saved_searches, alert_rules, alert_events, notifications, operators, operator_aliases, exports, api_keys, audit_log
- **Styling & UX**: mobile-first map UI, fast filters, “last updated” indicators, clear alert relevance controls
- **Project Structure**: modularized by domains (auth/tenancy, ingestion, search/map, alerting, operator intelligence, billing, exports, external API)

---

### 7. Go-to-Market (Connection to Product Features)

#### Marketing narratives
- “Never Miss a Drilling Permit Near Your Acreage.”
- “Get alerted within hours—no weekend blind spots.”
- “Operator intelligence without enterprise tooling overhead.”

#### Landing page
- Pain points, feature highlights (alerts + AOI filters + operator pages), testimonials, pricing tiers

#### SEO/content strategy
- Educational content around RRC data, permit lifecycle, and practical workflows for landmen/operators

#### Acquisition channels
- Phase 1: Direct outreach → beta users
- Phase 2: Content/SEO
- Phase 3: Paid ads
- Phase 4: Partnerships

#### Onboarding flow (churn reduction)
- Guided tour → user creates AOI/saved search in <3 minutes
- First alert or “sample alerts” experience within 72 hours
- Upgrade CTA before trial end with usage + value proof (alerts received, operators tracked, exports generated)

---

### 8. Technical Roadmap

#### MVP Scope (sequenced)
- **Phase 1 (Trust Foundations)**: ETL + schema + raw/clean layers + QA gates + backfill tooling
- **Phase 2 (Durable Alerts)**: alert events + outbox + delivery workers + dedupe + quiet hours/digest
- **Phase 3 (Core UX)**: map/search + AOI drawing + saved filters + notification center
- **Phase 4 (Intelligence)**: operator profiles (aliases + timelines) + comparisons
- **Phase 5 (Monetization & Scale)**: Stripe + quotas + export jobs + beta launch polish

#### Post-MVP Features
- Custom report builder, scheduled reports, Slack/Zapier integrations, team collaboration, mobile app
- Predictive analytics (e.g., activity acceleration, probable next-county moves)
- Expanded data sources (to reduce dependency risk)

---

### 9. Risks & Mitigation

- **Technical (messy data)**: robust parsers + raw preservation + QA gates + anomaly alerts
- **Operational (silent pipeline failures)**: SLO-based monitoring, ingestion lag alerts, and “last updated” indicators in UI
- **Deliverability (provider issues)**: retries, dedupe, fallback to in-app, digest mode, and clear delivery status
- **Business (enterprise competitor response)**: niche focus + superior UX + faster/reliable alerting + flexible pricing/quotas
- **Founder bandwidth**: automation + clear scope sequencing; outsource support with playbooks
- **Data access risk**: archive raw data; diversify sources over time; design ingestion for schema drift and source changes

---

### 10. Success Criteria & Decision Points

- **Pre-Build (Week 0)**: 20 interviews, 100 signups, 5 willingness-to-pay confirmations
- **Beta Launch (Week 12)**:
  - 15 active users
  - 60% active weekly
  - NPS > 40
  - Freshness SLO met (95% within 2 hours) for a sustained 2-week window
- **Product-Market Fit (Month 6)**: 50 paying customers, $10K MRR, churn < 8%
- **Scale or Exit (Month 12)**: $50K MRR, 200 customers, churn 5%

---

### 11. Financial Model Highlights

- **Breakeven**: ~65 customers @ $186 blended ARPU (Month 5–6)
- **Target (Month 12)**: $50K MRR, ~220 customers
- **Costs**: ~$12K monthly (infra, data tools, contractors, marketing) + variable costs:
  - SMS (per-message), email, and map usage (tiles/geocoding if used)
  - Ensure pricing/quotas maintain target gross margin

#### Pricing/Packaging Guardrails
- Alert volume controls (digest/quiet hours) and optional paid add-ons (e.g., higher SMS volume, higher API quota)
- Track gross margin per tier to avoid unprofitable power users
- Make usage transparent (alerts sent, API calls, export jobs)

#### Exit scenarios
- Bootstrap lifestyle business, strategic acquisition, or raise & scale nationally

---

### 12. Summary

This PRD outlines a product with:
- A **clear MVP promise** and **trust-first SLOs**
- A defined audience (independent landmen, small E&P firms) with strong workflows (AOI + filters + watchlists)
- A defensible wedge: **reliable ingestion + durable alerting + operator normalization**
- A scalable, performant architecture (vector tiles, partitioning, caching, async exports)
- A realistic go-to-market path (direct outreach → SEO → paid acquisition) tied to product value

**Why it works**: underserved market, high pain from missed filings, strong retention mechanics (relevant alerts + intelligence), and an architecture built to earn trust early.

Section 2: System Architecture (The Diagram)

```text
                     ┌──────────────────────────────┐
                     │          Data Sources         │
                     │  - RRC permits (primary)      │
                     │  - (later) wells/completions  │
                     └───────────────┬──────────────┘
                                     │
                                     v
                        ┌───────────────────────────┐
                        │   Ingestion Scheduler      │
                        │  (hourly + backfill jobs)  │
                        └───────────────┬───────────┘
                                        │
                                        v
                 ┌────────────────────────────────────────┐
                 │         Ingestion Workers (ETL)         │
                 │  - fetch -> store raw -> parse/normalize│
                 │  - idempotent, incremental, backfillable│
                 │  - QA gates + anomaly checks            │
                 └───────────────┬───────────────┬────────┘
                                 │               │
                                 │               v
                                 │     ┌─────────────────────┐
                                 │     │ Observability Stack  │
                                 │     │ - metrics/SLOs/alerts │
                                 │     │ - error tracking      │
                                 │     └─────────────────────┘
                                 v
          ┌─────────────────────────────────────────────────────┐
          │                 Postgres (Supabase)                 │
          │  RAW: permit_raw_records, ingestion_runs, QA checks  │
          │  CLEAN/HISTORY: permits, permit_versions             │
          │  CURRENT: permits_current (view/materialized)        │
          │  CHANGE FEED: permit_changes                         │
          │  AOI/SEARCH: aois, saved_searches, watchlists        │
          │  ALERTING: alert_rules, alert_events, outbox, inbox  │
          │  EXPORTS: export_jobs                                │
          │  API: api_keys, api_usage_daily                      │
          │  AUDIT: audit_log                                    │
          └───────────────┬───────────────────┬─────────────────┘
                          │                   │
                          │                   │
                          v                   v
        ┌─────────────────────────┐     ┌───────────────────────┐
        │  Tile/Map Query Layer    │     │   Internal App API     │
        │ - ST_AsMVT vector tiles  │     │ (tRPC / Next.js API)   │
        │ - cached tiles/signatures│     │ - auth via Supabase    │
        └───────────────┬─────────┘     │ - AOI/search/alerts UI │
                        │               │ - operator profiles    │
                        │               └───────────┬───────────┘
                        │                           │
                        v                           v
               ┌──────────────────┐        ┌────────────────────────┐
               │   Mapbox Client   │        │      Next.js Frontend   │
               │ - map browsing    │        │ - onboarding            │
               │ - click -> details│        │ - alert center          │
               └──────────────────┘        │ - exports/report UI     │
                                           └────────────────────────┘

   Alerting (event-driven):
   ┌──────────────────────────┐
   │ Alert Evaluator Worker    │  consumes permit_changes cursor
   │ - matches AOIs + filters  │  -> writes alert_events (deduped)
   │ - respects rule settings  │
   └──────────────┬───────────┘
                  v
   ┌──────────────────────────┐
   │ Notification Workers      │  consume notification_outbox
   │ - retries/backoff/DLQ     │  -> SMS/Email/In-App delivery
   └───────┬─────────┬────────┘
           │         │
           v         v
   ┌────────────┐  ┌──────────────┐
   │ SMS Provider│  │ Email Provider│
   └────────────┘  └──────────────┘

   Exports:
   ┌──────────────────────────┐
   │ Export Worker             │ consumes export_jobs
   │ - runs heavy queries async│ -> stores file -> output_url
   └──────────────────────────┘

   External API (Pro):
   ┌──────────────────────────┐
   │ External REST API (/v1)   │
   │ - API key auth            │
   │ - rate limits + quotas    │
   │ - usage metering          │
   └──────────────────────────┘
```

Note to Agent: This diagram represents the high-level flow from RRC data ingestion to user notification.

Section 3: Data Schema (The Entities)



### Data model (entities + key indexes)

#### Guiding principles
- **Multi-tenant first**: every user-owned row carries `workspace_id` and is protected by **RLS**.
- **Raw + clean**: preserve source truth, make the clean layer queryable, and make history/versioning explicit.
- **Event-driven**: persist “what changed” as first-class rows so alerting/export systems don’t have to diff giant tables.
- **Spatial at scale**: AOIs and permits use `geometry` + `GIST`; map browsing uses **MVT tiles** and thin payloads.

---

#### 1) Identity & tenancy

##### `workspaces`
- `id uuid pk`
- `name text not null`
- `plan text not null` (e.g., `basic`, `pro`)
- `created_at timestamptz not null default now()`
- `stripe_customer_id text`, `stripe_subscription_id text`
- **Indexes**
  - `unique(stripe_customer_id)` (nullable unique)

##### `workspace_members`
- `workspace_id uuid fk -> workspaces(id)`
- `user_id uuid fk -> auth.users(id)`
- `role text not null` (e.g., `owner`, `admin`, `member`)
- `created_at timestamptz default now()`
- **PK**: `(workspace_id, user_id)`
- **Indexes**
  - `btree(user_id)` for “which workspaces can I access?”

**RLS note**: Most tables should enforce `workspace_id IN (select workspace_id from workspace_members where user_id = auth.uid())`.

---

#### 2) Source ingestion + QA (raw layer + run tracking)

##### `ingestion_runs`
- `id uuid pk`
- `source text not null` (e.g., `rrc_permits`)
- `started_at timestamptz not null`
- `finished_at timestamptz`
- `status text not null` (`running`, `success`, `failed`)
- `cursor jsonb` (e.g., last seen timestamp/page)
- `metrics jsonb` (counts, parse error totals)
- **Indexes**
  - `btree(source, started_at desc)`
  - `btree(status, started_at desc)`

##### `permit_raw_records` (append-only)
- `id bigserial pk`
- `source text not null` (rrc)
- `source_record_id text not null` (stable ID if available; else a derived identifier)
- `source_seen_at timestamptz not null` (when we observed it)
- `raw_payload jsonb not null`
- `raw_hash text not null` (hash of payload for change detection)
- `ingestion_run_id uuid fk -> ingestion_runs(id)`
- **Constraints**
  - `unique(source, source_record_id, raw_hash)` (idempotent ingest, allows multiple versions)
- **Indexes**
  - `btree(source, source_record_id)`
  - `btree(source_seen_at desc)`
  - `btree(ingestion_run_id)`

##### `data_quality_checks`
- `id bigserial pk`
- `ingestion_run_id uuid fk -> ingestion_runs(id)`
- `check_name text not null`
- `status text not null` (`pass`, `warn`, `fail`)
- `details jsonb`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(ingestion_run_id)`
  - `btree(status, created_at desc)`

---

#### 3) Domain entities (clean layer, versioning, and “what changed”)

##### `operators`
- `id uuid pk`
- `canonical_name text not null`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(lower(canonical_name))` (for fast search)
  - optional `gin` trigram on `canonical_name` (if you enable `pg_trgm`)

##### `operator_aliases`
- `id bigserial pk`
- `operator_id uuid fk -> operators(id)`
- `alias_name text not null`
- `source text` (rrc, manual)
- **Constraints**
  - `unique(lower(alias_name))` (enforces one canonical mapping; adjust if you need per-source)
- **Indexes**
  - `btree(operator_id)`
  - `btree(lower(alias_name))`

##### `permits` (logical permit identity)
- `id uuid pk`
- `source text not null` (rrc)
- `source_permit_no text not null` (or best stable identifier)
- `operator_id uuid fk -> operators(id)`
- `created_at timestamptz default now()`
- **Constraints**
  - `unique(source, source_permit_no)`
- **Indexes**
  - `btree(operator_id)`
  - `btree(source, source_permit_no)`

##### `permit_versions` (every parsed version; history)
- `id uuid pk`
- `permit_id uuid fk -> permits(id)`
- `source_seen_at timestamptz not null`
- `effective_at timestamptz` (from filing if available; else equal to source_seen_at)
- `version_hash text not null` (hash of normalized fields)
- `status text` (filed/approved/etc if available)
- `permit_type text`
- `county text`
- `filed_date date`
- `geom geometry(MultiPolygon, 4326)` *(or point/lines as appropriate)*
- `attributes jsonb not null` (normalized payload you actually query/display)
- **Constraints**
  - `unique(permit_id, version_hash)` (dedupe identical parsed versions)
- **Indexes**
  - `btree(permit_id, source_seen_at desc)`
  - `btree(filed_date desc)`
  - `btree(county)`
  - `btree(status)`
  - `btree(operator_id)` via join on permits (or denormalize `operator_id` here for speed)
  - `gist(geom)` (critical)
  - optional: `gin(attributes)` if you need ad-hoc filters

##### `permits_current` (recommended as a **view** or **materialized view**)
- Represents latest version per `permit_id` for fast app queries/map tiles.
- **Indexes if materialized**
  - Same as hot query indexes: `gist(geom)`, `btree(filed_date)`, `btree(operator_id)`, etc.

##### `permit_changes` (the “what changed” feed for alerting)
- `id bigserial pk`
- `permit_id uuid not null`
- `permit_version_id uuid not null`
- `change_type text not null` (`new`, `amended`, `status_changed`, etc.)
- `source_seen_at timestamptz not null`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(created_at)` (cursor-based consumption)
  - `btree(source_seen_at)`
  - `btree(permit_id)`
  - `btree(change_type, created_at)`

##### `wells` (if/when available)
- `id uuid pk`
- `source_well_id text`
- `operator_id uuid fk -> operators(id)`
- `api text` (if applicable)
- `geom geometry(Point, 4326)`
- `spud_date date`, `status text`, `attributes jsonb`
- **Indexes**
  - `btree(api)`
  - `btree(spud_date desc)`
  - `gist(geom)`
  - `btree(operator_id)`

---

#### 4) AOIs, saved searches, watchlists

##### `aois`
- `id uuid pk`
- `workspace_id uuid not null`
- `name text not null`
- `geom geometry(MultiPolygon, 4326) not null`
- `buffer_meters int` (nullable; applied at query time or precomputed)
- `created_by uuid fk -> auth.users(id)`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(workspace_id, created_at desc)`
  - `gist(geom)`
  - optional: `btree(created_by)`

##### `saved_searches`
- `id uuid pk`
- `workspace_id uuid not null`
- `name text not null`
- `filters jsonb not null` (operator_ids, counties, statuses, types, date ranges, etc.)
- `created_by uuid`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(workspace_id, created_at desc)`
  - `gin(filters)` (JSONB ops for flexible filter queries)

##### `operator_watchlists`
- `id uuid pk`
- `workspace_id uuid not null`
- `name text not null` (e.g., “Competitors”)
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(workspace_id)`

##### `operator_watchlist_items`
- `watchlist_id uuid fk -> operator_watchlists(id)`
- `operator_id uuid fk -> operators(id)`
- **PK**: `(watchlist_id, operator_id)`
- **Indexes**
  - `btree(operator_id)`

---

#### 5) Alert rules → alert events → notification outbox (durable delivery)

##### `alert_rules`
- `id uuid pk`
- `workspace_id uuid not null`
- `name text not null`
- `enabled boolean not null default true`
- `aoi_id uuid fk -> aois(id)` (nullable)
- `saved_search_id uuid fk -> saved_searches(id)` (nullable)
- `watchlist_id uuid fk -> operator_watchlists(id)` (nullable)
- `notify_on text not null` (e.g., `new_only`, `new_and_amendments`)
- `channels jsonb not null` (e.g., `{sms:true,email:true,in_app:true}`)
- `quiet_hours jsonb` (timezone + windows)
- `digest_mode text` (`none`, `daily`, `weekly`)
- `created_by uuid`
- `created_at timestamptz default now()`
- **Constraints**
  - check: at least one of (`aoi_id`, `saved_search_id`, `watchlist_id`) is non-null
- **Indexes**
  - `btree(workspace_id, enabled)`
  - `btree(aoi_id)`
  - `btree(saved_search_id)`
  - `btree(watchlist_id)`

##### `alert_events` (immutable “this rule matched this change”)
- `id uuid pk`
- `workspace_id uuid not null`
- `alert_rule_id uuid not null`
- `permit_id uuid not null`
- `permit_version_id uuid not null`
- `triggered_at timestamptz not null default now()`
- `dedupe_key text not null` (e.g., hash of workspace+rule+permit+event_type)
- `event_payload jsonb` (summary fields for fast rendering)
- **Constraints**
  - `unique(dedupe_key)` (global dedupe)
- **Indexes**
  - `btree(workspace_id, triggered_at desc)`
  - `btree(alert_rule_id, triggered_at desc)`
  - `btree(permit_id)`
  - `btree(permit_version_id)`

##### `notification_outbox` (delivery work queue)
- `id bigserial pk`
- `workspace_id uuid not null`
- `alert_event_id uuid fk -> alert_events(id)`
- `channel text not null` (`sms`, `email`, `in_app`)
- `to_address text` (phone/email; null for in_app if you route by user)
- `status text not null` (`pending`, `sending`, `sent`, `failed`, `dead`)
- `attempts int not null default 0`
- `next_attempt_at timestamptz not null default now()`
- `provider_message_id text`
- `last_error text`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(status, next_attempt_at)` (worker pull)
  - `btree(alert_event_id)`
  - `btree(workspace_id, created_at desc)`

##### `notifications` (in-app inbox)
- `id uuid pk`
- `workspace_id uuid not null`
- `user_id uuid not null`
- `alert_event_id uuid`
- `title text not null`
- `body text`
- `read_at timestamptz`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(user_id, created_at desc)`
  - `btree(workspace_id, created_at desc)`
  - `btree(read_at)` (optional partial index: `where read_at is null`)

---

#### 6) Exports & reports (async jobs)

##### `export_jobs`
- `id uuid pk`
- `workspace_id uuid not null`
- `created_by uuid not null`
- `job_type text not null` (`csv_export`, `xlsx_export`, `aoi_activity_report`)
- `params jsonb not null` (AOI id, filters, date range, columns)
- `status text not null` (`queued`, `running`, `completed`, `failed`)
- `row_count int`
- `output_url text` (signed URL to storage)
- `error text`
- `created_at timestamptz default now()`
- `started_at timestamptz`, `finished_at timestamptz`
- `expires_at timestamptz`
- **Indexes**
  - `btree(workspace_id, created_at desc)`
  - `btree(status, created_at)`
  - `btree(created_by, created_at desc)`

---

#### 7) External API (Pro)

##### `api_keys`
- `id uuid pk`
- `workspace_id uuid not null`
- `name text not null`
- `key_prefix text not null` (first N chars for display)
- `key_hash text not null` (store only hash)
- `scopes jsonb not null` (e.g., `{permits:read, exports:write}`)
- `rate_limit jsonb` (per-minute/day)
- `monthly_quota int`
- `revoked_at timestamptz`
- `last_used_at timestamptz`
- `created_at timestamptz default now()`
- **Constraints**
  - `unique(key_hash)`
- **Indexes**
  - `btree(workspace_id, created_at desc)`
  - `btree(revoked_at)`
  - `btree(last_used_at desc)`

##### `api_usage_daily` (metering)
- `workspace_id uuid not null`
- `api_key_id uuid not null`
- `day date not null`
- `requests int not null`
- `errors int not null`
- **PK**: `(api_key_id, day)`
- **Indexes**
  - `btree(workspace_id, day desc)`

---

#### 8) Auditing

##### `audit_log`
- `id bigserial pk`
- `workspace_id uuid not null`
- `actor_user_id uuid`
- `action text not null` (e.g., `alert_rule.created`, `export.started`, `api_key.revoked`)
- `entity_type text`, `entity_id text`
- `metadata jsonb`
- `ip text`, `user_agent text`
- `created_at timestamptz default now()`
- **Indexes**
  - `btree(workspace_id, created_at desc)`
  - `btree(actor_user_id, created_at desc)`
  - `btree(action, created_at desc)`

---

#### Partitioning & materialization recommendations (performance)
- Partition `permit_versions` (or `permits_current` if it’s a physical table) by `filed_date` **or** `source_seen_at` (monthly/quarterly).
- Maintain a **materialized view** (or cached table) for “current permits” optimized for:
  - map tiles (geometry + minimal fields),
  - list/search (common filters).
- Consider an aggregated table like `operator_stats_daily(operator_id, day, county, permits_count, …)` to power fast operator charts.

Note to Agent: Use these table definitions and indexes to inform all SQL generation, API route design, and RLS policy creation.
=======

# DAF420 Parser - TypeScript Edition

A fully-typed TypeScript implementation of the DAF420 permit parser, providing enhanced type safety, modern best practices, and comprehensive interfaces.

## 🎯 Overview

This TypeScript version maintains **100% functional compatibility** with the Python parser while offering:

- **Strong Type Safety** with TypeScript's strict mode enabled
- **Modern ES2020+ Features** including async/await and optional chaining
- **Comprehensive Interfaces** for all data structures
- **Enhanced IDE Support** with full IntelliSense and autocomplete
- **Improved Error Handling** with typed exceptions
- **Better Maintainability** through explicit type definitions

## 📦 Installation

```bash
npm install
```

## 🏗️ Building

```bash
# Build the project
npm run build

# Watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean
```

## 🚀 Usage

### Command-Line Interface

```bash
# Basic usage
npm run parse -- -i input.dat -o output.csv

# With verbose logging
npm run parse -- -i input.dat -o output.csv -v

# Strict mode (fail on errors)
npm run parse -- -i input.dat -o output.csv --strict

# Custom config file
npm run parse -- -i input.dat -o output.csv -c custom_config.yaml
```

### Programmatic Usage

```typescript
import { Config, PermitParser, CSVExporter } from './src';

// Initialize with config
const config = new Config();
const parser = new PermitParser(config);

// Parse file
const { permits, stats } = await parser.parseFile('input.dat');

// Export to CSV
const exporter = new CSVExporter(config);
await exporter.export(permits, 'output.csv');

// Access statistics
console.log(`Permits parsed: ${stats.successfulPermits}`);
console.log(`Errors: ${stats.validationErrors}`);
```

## 📁 Project Structure

```
refactored_parser_ts/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── common.ts       # Common types and enums
│   │   ├── config.ts       # Configuration-related types
│   │   └── permit.ts       # Permit and record types
│   ├── models/             # Data models
│   │   ├── Permit.ts       # Permit class with typed fields
│   │   ├── ParseStats.ts   # Parsing statistics
│   │   └── ParsedRecord.ts # Individual record wrapper
│   ├── config/             # Configuration management
│   │   ├── Config.ts       # Main configuration manager
│   │   ├── RecordSchema.ts # Schema definitions
│   │   └── FieldSpec.ts    # Field specifications
│   ├── validators/         # Validation logic
│   │   └── Validator.ts    # Field validators
│   ├── parser/             # Core parsing engine
│   │   └── PermitParser.ts # State machine parser
│   ├── exporter/           # CSV export
│   │   └── CSVExporter.ts  # Export engine
│   ├── cli/                # Command-line interface
│   │   └── index.ts        # CLI entry point
│   ├── utils/              # Utility functions
│   │   └── typeConverters.ts # Date, int, float converters
│   └── index.ts            # Main export file
├── config.yaml             # Schema and lookup tables
├── tsconfig.json           # TypeScript configuration
├── package.json            # NPM dependencies
└── README.md               # This file
```

## 🔑 Key TypeScript Features

### Strong Typing

All data structures are strongly typed:

```typescript
interface PermitData {
  daroot: DaRootRecord | null;
  dapermit: DaPermitRecord | null;
  dafield: DaFieldRecord[];
  dalease: DaLeaseRecord[];
  // ... more typed fields
}

interface ParseStats {
  linesProcessed: number;
  recordsByType: Map<string, number>;
  validationErrors: number;
  // ... more typed fields
}
```

### Type-Safe Configuration

```typescript
interface FieldSpec {
  name: string;
  start: number;
  end: number;
  type: FieldType;
  required: boolean;
  validator?: ValidatorType;
}

type FieldType = 'str' | 'date' | 'int' | 'float';
type ValidatorType = 'county_code' | 'app_type' | 'well_type' | 'flag' | 'depth' | 'latitude' | 'longitude';
```

### Error Handling

```typescript
class ParseError extends Error {
  constructor(
    message: string,
    public readonly lineNumber: number,
    public readonly recordType?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm test:watch
```

## 🔍 Linting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📊 Type Coverage

This project maintains 100% type coverage with:
- No implicit `any` types
- Strict null checks enabled
- All functions have explicit return types
- Full interface definitions for all data structures

## 🔄 Migration from Python

Key differences from the Python version:

| Python | TypeScript |
|--------|-----------|
| `Dict[str, Any]` | Typed interfaces |
| `@dataclass` | `class` with explicit types |
| `Optional[T]` | `T \| null` or `T \| undefined` |
| `List[T]` | `T[]` or `Array<T>` |
| `Counter` | `Map<string, number>` |
| `defaultdict` | `Map` with default values |

## 🎓 Advanced Usage

### Custom Validators

```typescript
class CustomValidator extends Validator {
  validateCustomField(value: string, context: string): boolean {
    // Your validation logic
    return true;
  }
}
```

### Extending Record Types

```typescript
interface CustomRecord extends BaseRecord {
  customField: string;
  customValue: number;
}
```

## 📝 Documentation

- **Type Definitions**: See `src/types/` for all interfaces and types
- **API Reference**: Generated from TSDoc comments
- **Examples**: See test files for usage examples

## 🤝 Contributing

1. Ensure all code is properly typed
2. Add TSDoc comments for public APIs
3. Run tests and linting before committing
4. Update type definitions as needed

