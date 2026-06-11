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
| [ADR-0010](./0010-react-usestate) | React useState/useEffect for Frontend State Management | Accepted (PoC) — effectively superseded by TanStack React Query v5 | 2025-12-15 |
| [ADR-0011](./0011-auth-deferred) | ~~Authentication Deliberately Deferred for PoC~~ | Superseded 2026-04-18 — Keycloak OIDC implemented | 2025-12-15 |
| [ADR-0012](./0012-hybrid-scraping) | Hybrid Scraping Tool Selection per Data Source | Implemented | 2026-01-15 |
| [ADR-0013](./0013-copilotkit-v2) | CopilotKit v2 Migration | Accepted (supersedes ADR-0004) | 2026-02-01 |
| [ADR-0014](./0014-neo4j-knowledge-graph) | Neo4j Knowledge Graph (CQRS Read Layer) | Implemented | 2026-02-25 |
| [ADR-0015](./0015-session-diagnostics) | Session-Based Investigation Diagnostics | Accepted | 2026-03-08 |
| [ADR-0016](./0016-shared-regulatory-corpus) | Shared Regulatory Corpus Without Tenant RLS | Accepted | 2026-03-17 |
| [ADR-0017](./0017-trust-capsule) | Trust Capsule Cryptographic Architecture | Accepted | 2026-03-19 |
| [ADR-0018](./0018-dynamic-document-requirements) | Dynamic Document Requirements | Accepted | 2026-03-20 |
| [ADR-0019](./0019-multi-agent-osint-pipeline) | Multi-Agent OSINT Pipeline with Country Routing | Accepted | 2026-03-21 |
| [ADR-0020](./0020-eba-risk-matrix) | EBA Risk Matrix with Weighted-Max Aggregation | Accepted | 2026-03-22 |
| [ADR-0021](./0021-evidence-bundles) | Evidence Bundle System for EU AI Act | Accepted | 2026-03-22 |
| [ADR-0022](./0022-neo4j-knowledge-graph) | Neo4j Knowledge Graph with 20-Step ETL | Accepted | 2026-03-25 |
| [ADR-0023](./0023-postgresql-rls) | PostgreSQL Row-Level Security for Multi-Tenant Isolation | Accepted | 2026-03-25 |
| [ADR-0024](./0024-entity-matching) | Entity Matching with Blocking Keys and Trust-Weighted Survivorship | Accepted | 2026-03-26 |
| [ADR-0025](./0025-network-intelligence-hub) | Network Intelligence Hub with ReactFlow | Accepted | 2026-03-28 |
| [ADR-0026](./0026-prompt-centralization) | Prompt Centralization with DB-First Registry | Accepted | 2026-03-29 |
| [ADR-0027](./0027-goaml-export) | GoAML Export with Three-Layer Pipeline | Accepted | 2026-03-20 |
| [ADR-0028](./0028-white-label-branding) | White-Label Branding with WCAG AA Enforcement | Accepted | 2026-03-08 |
| [ADR-0029](./0029-cost-optimized-model-tiers) | Cost-Optimized Model Tiers for Agent Fleet | Accepted | 2026-03-31 |
| [ADR-0030](./0030-social-intelligence-brightdata) | Social Intelligence via BrightData MCP | Accepted | 2026-04-01 |
| [ADR-0031](./0031-regulatory-segments) | Regulatory Segment Profiles with Declarative YAML Compiler | Accepted | 2026-04-02 |
| [ADR-0032](./0032-circuit-breakers) | Circuit Breakers for OSINT Pipeline Resilience | Accepted | 2026-04-06 |
| [ADR-0033](./0033-document-gap-analysis) | Document Gap Analysis Engine | Accepted | 2026-04-02 |
| [ADR-0034](./0034-multi-country-registries) | Multi-Country Registry Architecture | Accepted | 2026-04-03 |
| [ADR-0035](./0035-atlas-reference-docs) | Atlas Reference Documentation within Docusaurus | Accepted | 2026-04-07 |
| [ADR-0036](./0036-pii-classification) | PII Classification Architecture | Accepted | 2026-04-07 |
| [ADR-0037](./0037-shared-package-extraction) | Shared Python Packages for Atlas Integration | Accepted | 2026-04-11 |
| [ADR-0038](./0038-shell-company-detection) | Shell Company Detection via Establishment Address Comparison | Accepted | 2026-04-14 |
| [ADR-0039](./0039-resilience-rollout-kbc-gap-signals) | Resilience Rollout Completion + KBC Acquiring Gap Signals | Accepted | 2026-04-14 |
| [ADR-0040](./0040-observability-metrics-state-persistence) | Observability Metrics + Breaker State Persistence | Accepted | 2026-04-14 |
| [ADR-0041](./0041-pure-mailbox-detection) | Pure-Mailbox Detection for Shell Companies | Accepted | 2026-04-17 |
| [ADR-0042](./0042-cz-regulatory-professional-registries) | Czech Regulatory + Professional Registry Coverage | Accepted | 2026-04-17 |
| [ADR-0043](./0043-cross-country-registry-parity) | Cross-Country Registry Parity (decoders, director shapes, KBO packed-layout fix) | Accepted | 2026-04-17 |
| ADR-0044 | *Withdrawn during review — number reserved* | Withdrawn | — |
| [ADR-0045](./0045-sanctions-fp-suppression) | Sanctions False-Positive Suppression (evidence-based, tenant-scoped, always visible) | Proposed | 2026-04-18 |
| [ADR-0046](./0046-nbb-cbso-csv-endpoint-degradation) | NBB CBSO CSV Endpoint Degradation and Honest Data-Gap Surfacing | Accepted | 2026-04-22 |
| [ADR-0047](./0047-async-docling-extraction) | Async Docling Extraction (Option B — background activity, idempotent MinIO writes) | Accepted | 2026-04-23 |
| [ADR-0048](./0048-financial-analysis-agent) | Financial Analysis Agent (ratios + distress models + peer benchmarks) | Accepted | 2026-04-22 |
| [ADR-0049](./0049-cross-reference-identity-mismatch) | Cross-Reference Registration-Number Identity-Mismatch Detection | Accepted | 2026-04-22 |

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
