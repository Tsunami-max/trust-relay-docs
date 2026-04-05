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
| [ADR-0004](./0004-copilotkit-v1) | CopilotKit v1 API with v2 Migration Plan | Superseded by ADR-0013 | 2026-02-20 |
| [ADR-0005](./0005-state-snapshot) | STATE_SNAPSHOT over STATE_DELTA for AG-UI | Accepted | 2026-02-20 |
| [ADR-0006](./0006-peppol-rest) | PEPPOL Verify as Synchronous REST API | Accepted | 2026-02-20 |
| [ADR-0007](./0007-belgian-data-layer) | Belgian Data Layer, Country Routing, and PEPPOL UI | Implemented | 2026-02-23 |
| [ADR-0008](./0008-raw-sql) | Raw SQL via SQLAlchemy text() for Database Access | Accepted | 2025-12-15 |
| [ADR-0009](./0009-silent-recovery) | Minimal Error Handling with Silent Recovery for PoC | Accepted | 2025-12-15 |
| [ADR-0010](./0010-react-usestate) | React useState/useEffect for Frontend State Management | Superseded by ADR-0015 | 2025-12-15 |
| [ADR-0011](./0011-auth-deferred) | Authentication Deliberately Deferred for PoC | Accepted (superseded by Pillar 0) | 2025-12-15 |
| [ADR-0012](./0012-hybrid-scraping) | Hybrid Scraping Tool Selection per Data Source | Implemented | 2026-01-15 |
| [ADR-0013](./0013-copilotkit-v2) | CopilotKit v2 Migration | Accepted (supersedes ADR-0004) | 2026-02-01 |
| [ADR-0014](./0014-neo4j-knowledge-graph) | Neo4j Knowledge Graph (CQRS Read Layer) | Implemented | 2026-02-25 |
| [ADR-0015](./0015-session-diagnostics) | Session-Based Investigation Diagnostics | Accepted | 2026-03-08 |
| [ADR-0016](./0016-shared-regulatory-corpus) | Shared Regulatory Corpus Without Tenant RLS | Accepted | 2026-03-17 |
| [ADR-0017](./0017-trust-capsule) | Trust Capsule Cryptographic Architecture | Accepted | 2026-03-19 |

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
