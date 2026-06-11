---
title: Pipeline Resilience (Circuit Breakers)
components:
  - app/services/circuit_breaker.py
  - app/services/circuit_breaker_persistence.py
  - app/observability/metrics.py
last_verified: 2026-06-11
status: implemented
---

# Pipeline Resilience (Circuit Breakers)

The OSINT investigation pipeline queries 10+ external services per case. Without explicit resilience patterns, a single degraded upstream — a registry API under maintenance, a rate-limited third-party feed — causes the entire investigation to stall: activity retries pile up, Temporal activity timeouts are consumed, and the parallel pipeline (ADR-0019) is blocked at the registry agent, preventing downstream agents from starting.

Trust Relay uses a **circuit breaker registry** (ADR-0032) to detect persistent failures early, fail fast on subsequent calls, and allow graceful degradation rather than full pipeline stall.

## How It Works

A global singleton `circuit_registry` (instance of `CircuitRegistry`) holds one named `pybreaker.CircuitBreaker` per external service. All service clients call their upstream through:

```python
from app.services.circuit_breaker import circuit_registry, CircuitOpenError

result = await circuit_registry.call("northdata", fetch_company_data(company_id))
```

The breaker transitions through three states:

| State | Behavior |
|---|---|
| **CLOSED** | Calls pass through. Failures are counted. |
| **OPEN** | After `fail_max` consecutive failures, all calls raise `CircuitOpenError` immediately — no network request. |
| **HALF-OPEN** | After `reset_timeout` seconds, one probe request is allowed through. Success → CLOSED. Failure → OPEN again. |

Each service has its own breaker. A NorthData outage does not affect the GLEIF breaker.

## Default Thresholds

| Parameter | Default | Meaning |
|---|---|---|
| `fail_max` | 5 | Trip after 5 consecutive failures |
| `reset_timeout` | 30s | Allow probe request after 30 seconds |

## Service-Specific Overrides

Some services have different risk profiles:

| Service | `fail_max` | `reset_timeout` | Reason |
|---|---|---|---|
| `brightdata_social` | 3 | 120s | BrightData MCP polling takes up to 90s per attempt; 3 failures = 4.5 min wasted |
| `brightdata_person` | 3 | 120s | Same as above |
| `tavily` | 3 | 60s | Strict per-minute rate limits; fast trip prevents credit burn on concurrent investigations |

## 4xx Exclusion Rule

HTTP 4xx responses (`400–499`) are excluded from failure counting. A 404 "company not found" or a 403 "invalid API key" means the service is responding correctly — only 5xx server errors and connection failures count toward the breaker threshold.

## Current Coverage (as of 2026-06-11)

The resilience rollout completed (ADR-0039): **49 `circuit_registry.call` sites** now span the OSINT, registry, and verification services. Breaker names (one per upstream, endpoints sharing a name share failure state):

| Breaker name | Upstream | File(s) |
|---|---|---|
| `northdata` | NorthData company lookup + search | `northdata_service.py` |
| `gleif` | GLEIF LEI lookup (multiple methods) | `gleif_service.py`, `verification/gleif.py` |
| `nominatim` | Nominatim geocoding | `geocoding_service.py` |
| `tavily` | Tavily adverse media search | `adverse_media_agent.py` |
| `eba_register` | EBA register license fetch | `verification/license_registry.py` |
| `vies` | EU VIES VAT validation + VATSense fallback | `vies_service.py` |
| `crawl4ai` | crawl4ai website scraper | `crawl4ai_service.py` |
| `opensanctions` | OpenSanctions feed download | `sanctions_feed_service.py` |
| `brightdata_enrichment` | BrightData Crunchbase enrichment | `brightdata_enrichment_service.py` |
| `brightdata_social` | BrightData social intelligence | `agents/osint_agent.py` |
| `kbo` | KBO lookup + establishments | `kbo_service.py` |
| `nbb` | NBB filings/financials | `nbb_service.py` |
| `peppol_directory` | PEPPOL directory | `peppol_directory_service.py` |
| `cz_ares` | Czech ARES lookup + health probe | `registries/cz_ares_service.py` |
| `cz_justice` | Czech Justice registry | `registries/cz_justice_service.py` |
| `cz_isir` | Czech ISIR insolvency | `registries/cz_isir_service.py` |
| `cz_ubo` | Czech UBO registry | `registries/cz_ubo_service.py` |
| `registry_sk` | SK ORSR search + detail | `registries/sk_orsr_service.py` |
| `sk_ruz` | SK RUZ financials | `registries/sk_ruz_service.py` |
| `fr_inpi` | FR INPI | `registries/fr_inpi_service.py` |
| `fr_insee` | FR INSEE | `registries/fr_insee_service.py` |
| `fr_bodacc` | FR BODACC | `registries/fr_bodacc_service.py` |
| `dk_cvr` | DK CVR | `registries/dk_cvr_service.py` |
| `ee_ariregister` | EE Ariregister | `registries/ee_ariregister_service.py` |
| `fi_ytj` | FI YTJ | `registries/fi_ytj_service.py` |
| `nl_kvk` | NL KvK | `registries/nl_kvk_service.py` |
| `no_brreg` | NO BRREG | `registries/no_brreg_service.py` |
| `ro_anaf` | RO ANAF (company + VAT) | `registries/ro_anaf_service.py`, `registries/ro_anaf_company_service.py` |
| `ch_zefix` | CH Zefix | `registries/ch_zefix_service.py` |

**Shared-breaker design:** services with multiple endpoints share one breaker name (e.g. `kbo` covers both `lookup` and `_fetch_establishments`; `vies` covers both VIES SOAP and VATSense fallback). All endpoints of the same service hit the same upstream, so one outage trips one breaker — not parallel breakers that never share failure state.

## Remaining Gaps (Not Yet Wrapped)

A small number of low-traffic services still call upstreams directly. PEPPOL Verify (the REST verification endpoint, distinct from the wrapped `peppol_directory`) is the main remaining target for a follow-up pass.

## Usage Pattern

Inner async function + `circuit_registry.call` + `CircuitOpenError` fallback:

```python
from app.services.circuit_breaker import CircuitOpenError, circuit_registry

async def lookup(company_id: str) -> CompanyData | None:
    async def _do_lookup() -> CompanyData:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/{company_id}")
            response.raise_for_status()
            return CompanyData(**response.json())

    try:
        return await circuit_registry.call("my_registry", _do_lookup())
    except CircuitOpenError:
        logger.warning("my_registry circuit open — skipping lookup")
        return None
    except Exception as exc:
        logger.error("my_registry lookup failed: %s", exc)
        return None
```

The inner function pattern (`_do_lookup`) ensures the coroutine object is created inside the call rather than at the call site — this matters for async: a coroutine created before `circuit_registry.call` is already partially advanced if awaited elsewhere.

## Operational Behavior

**When a breaker opens:**
- `CircuitOpenError(service)` is raised immediately, with the message `"Circuit breaker open for '{service}' — failing fast"`
- The calling service catches it and applies its fallback (returning `None`, an empty result, or a degraded `Finding`)
- The investigation continues with reduced data quality for that service; other services are unaffected

**Recovery (30s reset):**
- After `reset_timeout` seconds, the breaker enters HALF-OPEN state
- The next call is allowed through as a probe. If it succeeds, the breaker returns to CLOSED and full operation resumes
- If the probe fails, the breaker returns to OPEN and the timer resets

**After worker restart (state persistence — ADR-0040):**
- On startup the worker calls `restore_breakers_from_redis(circuit_registry)`, rehydrating each breaker's open/half-open state from Redis snapshots written by `schedule_publish()`. A breaker that was open before the restart stays open (respecting the elapsed `reset_timeout`), so a known-broken upstream is not re-probed by every fresh worker.
- If Redis is unavailable, restore is skipped (logged, non-fatal) and breakers start CLOSED — they then re-trip after `fail_max` failures if the upstream is still broken.

**Observability (ADR-0040):**
- Each state change publishes the Prometheus gauge `trustrelay_circuit_breaker_state` (labelled by `service`; 0=closed, 1=open, 2=half-open) via `app/observability/metrics.py`.
- The same hook fire-and-forgets a Redis snapshot of the breaker state for cross-process visibility and the restart-restore path above.
