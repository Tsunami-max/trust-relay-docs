---
sidebar_position: 1
title: "ADR Index"
---

# Architecture Decision Records

Architecture Decision Records (ADRs) capture significant architectural decisions made during the development of Trust Relay. Each ADR documents the context that motivated a decision, the decision itself, and its consequences -- both positive and negative.

ADRs are immutable once accepted. If a decision is superseded, the original ADR is marked as such and a new ADR is created.

## ADR Registry

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-0001](./0001-pydanticai-agui) | PydanticAI + AG-UI + CopilotKit as AI Layer | Accepted | 2026-02-20 |
| [ADR-0002](./0002-temporal-sdk) | Temporal for Workflow Orchestration | Accepted | 2026-02-20 |
| [ADR-0003](./0003-agui-on-fastapi) | AGUIAdapter on FastAPI (not standalone) | Accepted | 2026-02-20 |
| [ADR-0004](./0004-copilotkit-v1) | CopilotKit v1 API with v2 Migration Plan | Accepted | 2026-02-20 |
| [ADR-0005](./0005-state-snapshot) | STATE_SNAPSHOT over STATE_DELTA for AG-UI | Accepted | 2026-02-20 |
| [ADR-0006](./0006-peppol-rest) | PEPPOL Verify as Synchronous REST API | Accepted | 2026-02-20 |
| [ADR-0007](./0007-belgian-data-layer) | Belgian Data Layer, Country Routing, and PEPPOL UI | Implemented | 2026-02-23 |
| ADR-0008 | Raw SQL via SQLAlchemy text() for Database Access | Superseded (ORM migration complete) | 2026-02-24 |
| ADR-0009 | Minimal Error Handling with Silent Recovery for PoC | Superseded (exception hierarchy implemented) | 2026-02-24 |
| ADR-0010 | React useState/useEffect for Frontend State Management | Superseded by ADR-0014 | 2026-02-24 |
| ADR-0011 | Authentication Deliberately Deferred for PoC | Superseded (JWT/JWKS implemented) | 2026-02-24 |
| ADR-0012 | Hybrid Scraping Tool Selection per Data Source | Implemented | 2026-02-24 |
| [ADR-0013](./0013-neo4j-knowledge-graph) | Neo4j Knowledge Graph (CQRS Read Layer) | Implemented | 2026-02-25 |
| [ADR-0014](./0014-react-query-caching) | React Query for Frontend Caching | Implemented | 2026-02-25 |
| [ADR-0015](./0015-tiered-scan-agent) | Tiered Scan Agent (Portfolio-Scale Entity Screening) | Implemented | 2026-02-27 |
| [ADR-0016](./0016-compliance-memory-system) | Compliance Memory System | Accepted | 2026-03-01 |

## Implemented ADRs (Summaries)

The following decisions have been implemented or superseded. ADRs 0008-0012 are documented in summary form below. ADRs 0013-0015 have full ADR pages.

### ADR-0008: Raw SQL via SQLAlchemy text() for Database Access *(Superseded)*

Originally, the PoC used raw SQL via SQLAlchemy `text()` for database queries. This has been superseded by ORM model migration — all 7 tables have SQLAlchemy ORM models with Alembic migrations. One raw SQL call remains for PostgreSQL sequence operations.

### ADR-0009: Minimal Error Handling with Silent Recovery for PoC *(Superseded)*

Originally used "silent recovery" pattern with broad exception catching. Superseded by a structured `TrustRelayError` exception hierarchy with custom subtypes (`CaseNotFoundError`, `WorkflowError`, `ExternalServiceError`, etc.) and centralized logging.

### ADR-0010: React useState/useEffect for Frontend State Management *(Superseded by ADR-0014)*

Originally used plain React hooks (useState/useEffect) for data fetching. Superseded by React Query (`@tanstack/react-query`) via ADR-0014. Custom hooks (`useCaseDetail`, `useDecisionSubmit`, `usePeppolVerify`) now use `useQuery`/`useMutation` with cache invalidation.

### ADR-0011: Authentication Deliberately Deferred for PoC *(Superseded)*

Authentication has been implemented: JWT with JWKS validation in `deps/auth.py`, dual PoC/production mode, portal token expiry (30-day TTL), IP-based rate limiting, and API key authentication for PEPPOL.

### ADR-0012: Hybrid Scraping Tool Selection per Data Source

Each Belgian data source uses the best scraping tool for its characteristics: crawl4ai for Gazette (static HTML), direct REST for NBB (public API), BeautifulSoup for KBO, PEPPOL for inhoudingsplicht.

## ADR Template

New ADRs follow this structure:

```markdown
# ADR-NNNN: Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Implemented | Superseded by ADR-XXXX
**Deciders**: Names

## Context
Why this decision is needed.

## Decision
What was decided.

## Consequences
### Positive
### Negative
### Neutral

## Alternatives Considered
```
