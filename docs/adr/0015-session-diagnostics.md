---
id: 0015-session-diagnostics
sidebar_position: 16
title: "ADR-0015: Session-Based Investigation Diagnostics"
---

# ADR-0015: Session-Based Investigation Diagnostics

| | |
|---|---|
| **Date** | 2026-03-08 |
| **Status** | `Accepted` |
| **Deciders** | Adrian Birlogeanu |

## Context

Trust Relay records extensive telemetry (audit events, tool invocations, governance checks, EVOI decisions) but lacks a unified way to:
1. Time individual pipeline stages within an investigation iteration
2. Reconstruct a full investigation session for debugging
3. Capture officer quality feedback and auto-classify root causes
4. Surface aggregate system health metrics on the Intelligence Dashboard

Officers encountering poor investigation quality had no feedback channel beyond manual escalation, and engineering had no structured way to identify recurring failure patterns.

## Decision

Add a lightweight diagnostics layer that:
- Introduces 2 new tables (`pipeline_stages`, `investigation_feedback`) for stage timing and officer feedback
- JOINs across 6 existing telemetry tables for session reconstruction (no data duplication)
- Uses deterministic rule-based classification (no LLM) for failure root-cause analysis
- Gates all diagnostic code behind `diagnostics_enabled` config flag with guard-and-swallow semantics (ADR-0009)
- Integrates with the existing Pattern Engine for alert generation on significant findings

## Rationale

### Why not a separate observability system?

The investigation context (stages, tools, governance, EVOI) is already in PostgreSQL. Exporting to an external system (Grafana, Datadog) would duplicate data and lose the relational JOINs needed for reconstruction. The overhead of 2 new tables is minimal compared to the value of in-context diagnostics.

### Why deterministic classification (not LLM)?

Compliance audit trail requires reproducible results. The FailureClassifier uses priority-ordered rules mirroring the RedFlagEngine pattern. Officer-selected categories take highest priority ("officer knows best"), followed by document failures, source availability, investigation completeness, and a fallback.

### Why manual timing in activities (not the decorator)?

Temporal's `@activity.defn` cannot be stacked with custom decorators. Activities use a manual `try/except/finally` pattern with `time.monotonic()` for stage recording. The `@diagnostic_stage` decorator is available for non-Temporal async functions.

## Consequences

- **Positive:** Officers get a feedback channel; engineering gets stage-level timing and failure taxonomy; Intelligence Dashboard shows system health trends
- **Positive:** Guard-and-swallow guarantees diagnostic code never breaks investigation execution
- **Negative:** Manual timing boilerplate in 6 activities (~15 lines each)
- **Negative:** Reconstruction queries are sequential (6 queries per request); acceptable for PoC, may need CTEs at scale
