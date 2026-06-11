---
id: 0040-observability-metrics-state-persistence
sidebar_position: 41
title: "ADR-0040: Observability Metrics & State Persistence"
---

# ADR-0040: Observability Metrics + Breaker State Persistence

**Status:** Accepted
**Date:** 2026-04-14

## Context

ADR-0032 introduced circuit breakers for OSINT pipeline resilience; ADR-0039 completed the rollout to 25 named services. Two operational gaps remained:

1. **No visibility into breaker state** -- operators could only infer open/closed state from log scraping. No structured metric, no dashboard, no alertable signal.
2. **Breaker state evaporates on worker restart** -- a Temporal worker restart flipped every open breaker back to closed, potentially hammering a still-broken upstream and re-triggering the outage.

Additionally, Trust Relay had no Prometheus metrics surface at all -- the observability foundation was missing entirely.

## Decision

Address both gaps with a layered approach on the same `_publish_state()` hook inside `circuit_registry.call`.

1. **Prometheus metrics foundation** -- add `prometheus-client>=0.20` and create `app/observability/metrics.py` as the single registration point for all Trust Relay metrics. Expose a scrape endpoint at `GET /metrics`. First metric: `trustrelay_circuit_breaker_state{service}` (0 = closed, 1 = open, 2 = half-open), updated at three sites in `circuit_registry.call` (entry, success, failure).

2. **Redis-backed breaker snapshot persistence (memory-primary)** -- pybreaker's in-memory state stays authoritative; the hot path never awaits Redis. After every transition, `_publish_state()` fire-and-forgets a snapshot via `asyncio.create_task`. On FastAPI/worker startup, `restore_breakers_from_redis()` scans `trustrelay:circuit_breaker:*` keys and force-restores open breakers with their original `opened_at` (so the half-open window respects the original outage). Snapshots carry a 24h TTL. **Graceful degradation invariant**: if Redis is unavailable at any boundary, breakers continue on in-memory state only; Redis errors are logged and swallowed (asserted by an end-to-end test).

3. **FP suppression feeds back into risk scoring (closes KBC gap #4)** -- the missing piece was that the current iteration's EBA score still included rejected findings. `get_rejected_finding_keys(case_id, tenant_id)` reads `signal_events` rows with `signal_type = 'finding_rejected'` into a set of `"category::description"` keys; `_extract_eba_input_from_investigation` filters them out before scoring at both call sites. Rejected findings are suppressed from scoring but never deleted from evidence -- satisfying EU AI Act Art. 12 (automatic logging).

## Consequences

### Positive
- Operators can scrape `/metrics` and alert on any service with `circuit_breaker_state == 1` for > N minutes
- A worker restart during a degraded outage no longer resumes hammering the broken service
- Officer dismissals now genuinely reduce the EBA score on next recomputation
- `app/observability/metrics.py` is a foundation for future metrics; all three features layer on the same `_publish_state()` hook for future sinks (CloudWatch, Sentry, OpenTelemetry)

### Negative
- Prometheus client adds ~2MB to the wheel
- Redis snapshot TTL is 24h -- breakers stuck open longer lose persisted state on restart (by design; stale state is worse than none)
- Rejected-finding suppression uses exact category+description matching; paraphrased findings wouldn't be suppressed (mitigated by the OSINT iteration loop feeding rejection text back to the LLM)

### Risks
- A bug in the fire-and-forget publish could leak coroutines -- mitigated by an end-to-end test proving behavior when Redis is down
- `get_rejected_finding_keys` reads all rejections per recompute (small N, but could hot-spot under heavy reassessment; a cache would help if it ever matters)
