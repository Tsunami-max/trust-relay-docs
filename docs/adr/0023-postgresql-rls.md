---
id: 0023-postgresql-rls
sidebar_position: 24
title: "ADR-0023: PostgreSQL Row-Level Security"
---

# ADR-0023: PostgreSQL Row-Level Security for Multi-Tenant Isolation

**Date:** 2026-03-08 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Trust Relay is a multi-tenant SaaS platform serving multiple financial institutions from a shared PostgreSQL database. Each tenant's data -- cases, documents, risk assessments, evidence bundles, audit trails, and officer actions -- must be strictly isolated. A compliance officer at Bank A must never see cases belonging to Bank B, even through indirect queries (e.g., dashboard aggregations, search results, or API responses).

Application-level isolation using `WHERE tenant_id = ?` clauses is the most common approach but is fundamentally fragile. Every query, every JOIN, every subquery, and every aggregation must include the tenant filter. A single missed clause in any of the 37+ service modules or 15+ API routers constitutes a data breach. Code review can catch some omissions, but as the codebase grows, the probability of a missed filter approaches certainty. This is not a theoretical risk -- multi-tenant data leaks via missing WHERE clauses are a well-documented vulnerability class.

Regulatory requirements reinforce this concern. GDPR Art. 25 mandates data protection by design and by default. ISO 27001 requires access controls that are enforced at the infrastructure level, not solely at the application level. Financial regulators expect defense-in-depth for data isolation.

## Decision

We implement PostgreSQL Row-Level Security (RLS) as the primary tenant isolation mechanism, with application-level filtering as a secondary defense layer.

**RLS configuration:**
- `FORCE ROW LEVEL SECURITY` enabled on all 25+ tenant-scoped tables (cases, documents, findings, risk_assessments, audit_events, evidence_references, discrepancy_resolutions, risk_configurations, risk_config_audit, etc.)
- Two policies per table:
  1. `tenant_isolation` -- `USING (tenant_id = current_setting('app.current_tenant')::uuid)` -- rows are visible only when the PostgreSQL session variable `app.current_tenant` matches the row's `tenant_id`
  2. `admin_bypass` -- `USING (current_setting('app.rls_bypass', true) = 'true')` -- allows migration tooling and administrative scripts to access all rows when explicitly enabled
- `FORCE` keyword ensures RLS applies even to table owners, preventing privilege escalation

**Session variable management:**
- FastAPI middleware sets `app.current_tenant` from the authenticated JWT's `tenant_id` claim at the start of each request using `SET LOCAL app.current_tenant = '{tenant_id}'`
- `SET LOCAL` scopes the variable to the current transaction, preventing cross-request leakage in connection pools
- If no tenant is identified (unauthenticated request), the session variable is not set, and all tenant-scoped queries return zero rows (fail-closed)

**Database role separation:**
- Application connects as `trustrelay_app` (non-superuser role) -- RLS is enforced
- Migration tooling connects as `trustrelay_admin` (superuser or with `rls_bypass`) -- RLS can be bypassed for schema changes
- This separation ensures that even if application code has a SQL injection vulnerability, the attacker cannot bypass RLS without the admin role

**Exempt tables:**
- Shared reference data tables are exempt from RLS: Lex regulatory corpus, NACE codes, country lists, FATF risk ratings, EBA factor definitions
- These tables contain no tenant-specific data and must be readable by all tenants

## Consequences

### Positive
- Defense-in-depth -- even if application code omits a `WHERE tenant_id = ?` clause, RLS prevents cross-tenant data access at the database level
- Fail-closed design -- if the middleware fails to set `app.current_tenant`, queries return zero rows rather than all rows
- GDPR Art. 25 compliance -- data protection is enforced by design at the infrastructure layer, not dependent on application correctness
- ISO 27001 alignment -- access controls are enforced at the database level, satisfying the requirement for infrastructure-level controls
- Connection pool safety -- `SET LOCAL` scopes tenant context to the transaction, so returning a connection to the pool cannot leak tenant context to the next request

### Negative
- RLS adds a filter predicate to every query on tenant-scoped tables, which has a small but measurable performance impact (typically &lt;5% overhead on indexed `tenant_id` columns)
- Debugging is harder -- queries that return unexpected empty results may be caused by an incorrect `app.current_tenant` value rather than missing data. Developers must be aware that RLS is active
- Migration complexity -- Alembic migrations that modify tenant-scoped tables must account for RLS policies. Adding a new tenant-scoped table requires creating the corresponding RLS policies in the same migration
- The `admin_bypass` policy is a security-sensitive escape hatch -- its usage must be audited and restricted to migration tooling only

### Neutral
- Application-level `WHERE tenant_id = ?` clauses remain in the codebase as a secondary defense layer and for query plan optimization (the query planner can use the explicit filter for index selection before RLS adds its own filter)
- RLS policies are defined in Alembic migrations alongside the table definitions, keeping security policy co-located with schema
- Testing requires setting `app.current_tenant` in test fixtures -- testcontainers-based tests must configure the session variable to match test data

## Alternatives Considered

### Alternative 1: Application-only filtering (WHERE tenant_id = ?)
- Why rejected: This approach relies on every developer, in every query, in every module, remembering to include the tenant filter. With 37+ service modules, 15+ API routers, and a growing codebase, the probability of a missing filter clause approaches certainty over time. A single omission is a data breach. Application-only filtering provides no defense-in-depth -- the application layer is the only barrier, and it is maintained by humans who make mistakes.

### Alternative 2: Separate database per tenant
- Why rejected: Schema synchronization across N tenant databases requires running every Alembic migration N times. With 39+ migrations and growing, this creates an O(N*M) operational burden (N tenants, M migrations). Connection pool management requires N separate pools, each consuming memory and connections. Cross-tenant analytics (e.g., platform-wide statistics for the Trust Relay operator) require federated queries across N databases. Backup and restore operations multiply by N. For a platform expecting 50+ tenants, this approach does not scale operationally.

### Alternative 3: Schema-per-tenant (shared database, separate schemas)
- Why rejected: Similar migration synchronization issues as separate databases -- each schema must be migrated independently. PostgreSQL's `search_path` mechanism for routing queries to the correct schema is error-prone -- a misconfigured `search_path` causes queries to hit the wrong schema (the exact class of bug RLS is designed to prevent). Additionally, some PostgreSQL features (extensions, certain index types) operate at the database level, not the schema level, creating unexpected cross-schema interactions.
