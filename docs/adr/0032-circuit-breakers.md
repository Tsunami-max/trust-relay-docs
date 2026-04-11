---
id: 0032-circuit-breakers
sidebar_position: 33
title: "ADR-0032: Circuit Breakers"
---

# ADR-0032: Circuit Breakers for OSINT Pipeline Resilience

**Status:** Accepted
**Date:** 2026-04-06

## Context

The OSINT investigation pipeline queries 10+ external services (government registries, NorthData, BrightData, OpenSanctions, Tavily, GLEIF, VIES, and others) per case. These services have varying reliability: government APIs may go down for maintenance, rate limiters may throttle during peak hours, and third-party services may experience outages. Without resilience patterns, a single degraded service can cascade failures through the pipeline -- the agent retries repeatedly against a down service, consuming Temporal activity timeouts and delaying the entire investigation.

The problem is compounded by the parallel execution architecture (ADR-0019): if the registry agent is stuck retrying against a down NorthData API, the downstream person validation and adverse media agents cannot start, turning a single-service outage into a full pipeline stall.

The system needed a way to detect persistent failures early, stop wasting resources on known-broken services, and allow the pipeline to degrade gracefully rather than fail completely.

## Decision

Implement a global circuit breaker registry using PyBreaker, exposed as a singleton `circuit_registry` that all service clients call through.

**Key design choices:**

1. **Per-service breakers** -- each external service (e.g., `northdata`, `gleif`, `vies`, `brightdata`) gets its own named circuit breaker. A NorthData outage does not affect the GLEIF breaker.

2. **Fail-fast after 5 failures** (`fail_max=5`) -- after 5 consecutive failures to a service, the breaker opens and all subsequent calls raise `CircuitOpenError` immediately without making the network request. The breaker resets after 30 seconds (`reset_timeout=30`), allowing a single probe request to test recovery.

3. **HTTP 4xx exclusion** -- client errors (400-499) are excluded from failure counting. A 404 "company not found" or a 403 "invalid API key" means the service is responding correctly -- only 5xx errors and connection failures count toward the breaker threshold.

4. **Async-compatible execution** -- since all service calls are async coroutines, the registry wraps PyBreaker's synchronous state machine to support `await`, driving the state transitions manually around the async call.

**Usage pattern:**
```python
from app.services.circuit_breaker import circuit_registry
result = await circuit_registry.call("northdata", fetch_company_data(company_id))
```

## Consequences

### Positive
- A down service is detected within 5 calls and all subsequent calls fail instantly, saving network round-trips and Temporal activity time
- Pipeline degrades gracefully -- if NorthData is down, the registry agent falls back to the next tier in the fallback chain (ADR-0019) rather than hanging
- 30-second reset window allows automatic recovery detection without manual intervention
- 4xx exclusion prevents legitimate business responses from tripping the breaker

### Negative
- Fixed thresholds (5 failures, 30s reset) may not be optimal for all services -- a slow API that times out at 10s takes 50s to trip the breaker
- No persistent state -- if the Temporal worker restarts, all breakers reset to closed, potentially hitting a still-broken service again
- No metrics or alerting built in -- breaker state transitions are logged but not exposed to monitoring systems

### Risks
- False trips during transient network issues could cause unnecessary fallbacks and reduce investigation quality
- Half-open probe requests are single-threaded -- under high concurrency, multiple investigations could all try to probe a recovering service simultaneously
