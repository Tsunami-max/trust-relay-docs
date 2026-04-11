---
id: 0016-shared-regulatory-corpus
sidebar_position: 17
title: "ADR-0016: Shared Regulatory Corpus Without Tenant RLS"
---

# ADR-0016: Shared Regulatory Corpus Without Tenant RLS

| | |
|---|---|
| **Date** | 2026-03-17 |
| **Status** | `Accepted` |
| **Deciders** | Adrian Birlogeanu |
| **Context** | Lex Regulatory Knowledge Layer |

## Decision

The Lex regulatory corpus tables (`lex_regulations`, `lex_articles`, `lex_article_references`, `lex_chunks`) are **shared reference data without Row Level Security**. The integration tables (`lex_radar_links`, `lex_ingestion_log`) are tenant-scoped with RLS.

## Context

The existing codebase has FORCE ROW LEVEL SECURITY on all 30+ tenant-scoped tables. The Lex module introduces a new category: universal reference data (EU regulations are identical for every tenant).

## Rationale

- EU regulations are universal truth -- the AMLR text is identical for every tenant
- Duplicating the corpus per tenant wastes storage and creates consistency issues on re-ingestion
- The corpus is read-only reference data, not tenant-generated content
- How a tenant *uses* the corpus (radar links, ingestion audit trail) IS tenant-specific

## Session Management

Ingestion writes to both shared tables (admin session, no RLS) and tenant-scoped tables (tenant session, RLS enforced). The `LexIngestionService` uses dual-context session management:

1. **Shared table writes** (`lex_regulations`, `lex_articles`, `lex_chunks`, `lex_article_references`): Use `get_admin_session()` which bypasses RLS.
2. **Tenant-scoped writes** (`lex_ingestion_log`, `lex_radar_links`): Use `get_tenant_session(tenant_id)` which sets `app.current_tenant` for RLS.
3. **Cross-RLS JOINs**: `lex_radar_links` (tenant-filtered via RLS) -> `lex_articles` (shared, no filter). The tenant sees only their own radar links, but the underlying article text is universal.

## Consequences

- Introduces a precedent: not all tables in the system have RLS
- Future shared reference data can follow this pattern
- Developers must distinguish between shared and tenant-scoped tables when writing queries
- Ingestion authorization limited to `admin` or `compliance_manager` roles
