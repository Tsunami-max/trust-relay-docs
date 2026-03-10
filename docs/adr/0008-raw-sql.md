---
id: 0008-raw-sql
sidebar_position: 9
title: "ADR-0008: Raw SQL via SQLAlchemy text()"
---

# ADR-0008: Raw SQL via SQLAlchemy text()

| | |
|---|---|
| **Date** | 2025-12-15 |
| **Status** | `Partially Superseded` |
| **Deciders** | Adrian Birlogeanu |

## Context

Need database access pattern for PostgreSQL queries. Options: SQLAlchemy ORM models, raw SQL strings, or SQLAlchemy `text()`.

## Decision

Use `sqlalchemy.text()` for all database queries (raw SQL with named parameter binding). No ORM models.

## Rationale

- Full control over SQL queries for complex compliance data
- No ORM abstraction overhead or N+1 query risks
- Named parameters (`:param`) prevent SQL injection
- CAST patterns for UUID/JSONB: `CAST(:param AS uuid)`, `CAST(:param AS jsonb)`
- Consistent with ADR-0009 (minimal complexity)

## Consequences

- Must write SQL manually (no model-generated queries)
- Schema changes require manual query updates
- `asyncpg` gotcha: use `CAST(:param AS jsonb)` not `:param::jsonb`

## Partial Supersession (2026-03-08)

Key modules have been migrated from raw `sqlalchemy.text()` to the ORM Repository pattern using `BaseRepository[T]` with typed queries:

- **`admin.py`** -- fully migrated to `UserRepository` and `TenantRepository`
- **`auth.py`** -- JIT user provisioning (`_ensure_db_user()`) migrated to `UserRepository`

The remaining modules continue to use parameterized `sqlalchemy.text()` calls as described in this ADR. Migration to the Repository pattern is incremental and ongoing, prioritized by module complexity and change frequency. The ORM approach does not change query behavior -- it adds type safety and reduces boilerplate.
