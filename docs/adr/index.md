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
| ADR-0008 | Scraping Tool Selection (Hybrid Approach) | Implemented | 2026-02-23 |
| ADR-0009 | OSINT Evidence Cache Strategy | Implemented | 2026-02-23 |
| ADR-0010 | Pre-Enrichment at Case Creation | Implemented | 2026-02-24 |
| ADR-0011 | Redis Caching for Inhoudingsplicht | Implemented | 2026-02-23 |
| ADR-0012 | CompanyProfile SourcedFact Pattern | Implemented | 2026-02-24 |
| [ADR-0013](./0013-neo4j-knowledge-graph) | Neo4j Knowledge Graph (CQRS Read Layer) | Implemented | 2026-02-25 |
| [ADR-0014](./0014-react-query-caching) | React Query for Frontend Caching | Implemented | 2026-02-25 |

## Implemented ADRs (Summaries)

The following decisions have been implemented. ADRs 0008-0012 are documented in summary form below. ADRs 0013-0014 have full ADR pages.

### ADR-0008: Scraping Tool Selection (Hybrid Approach)

The Belgian OSINT agent uses a different scraping tool for each of its four data sources based on site characteristics: crawl4ai for the Belgian Gazette (static HTML with full-text and PDF extraction), a direct REST API for NBB financial accounts (public API), the existing BeautifulSoup scraper for KBO, and PEPPOL for inhoudingsplicht. This replaced the original plan (ADR-0007 sub-decision 3) to use BrightData MCP for all sources.

### ADR-0009: OSINT Evidence Cache Strategy

On follow-up iterations (iteration > 1), cached agent outputs from the initial investigation are loaded from MinIO rather than re-running expensive registry, person validation, and adverse media agents. Only the synthesis agent re-runs with cached data plus new documents and customer responses.

### ADR-0010: Pre-Enrichment at Case Creation

Case creation runs VIES validation, NorthData scraping, Crunchbase lookup, and website validation concurrently via `asyncio.gather` with a 10-second global timeout. Results are stored in the CompanyProfile and passed to the workflow as `additional_data`.

### ADR-0011: Redis Caching for Inhoudingsplicht

The inhoudingsplicht verification service uses Redis to cache results by enterprise number, avoiding redundant lookups when the same enterprise is checked by both the PEPPOL pipeline and the Belgian OSINT agent.

### ADR-0012: CompanyProfile SourcedFact Pattern

A `CompanyProfile` model with `SourcedFact` entries tracks every data point with its source, timestamp, and evidence hash. When facts from different sources conflict, the system flags discrepancies for officer review rather than silently overwriting.

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
