---
id: 0039-resilience-rollout-kbc-gap-signals
sidebar_position: 40
title: "ADR-0039: Resilience Rollout & KBC Gap Signals"
---

# ADR-0039: Resilience Rollout Completion + KBC Acquiring Gap Signals

**Status:** Accepted
**Date:** 2026-04-14

## Context

Following the initial circuit breaker rollout (ADR-0032) and the shell company detector (ADR-0038), five related improvements were needed in the same session:

1. **Resilience coverage gap** -- only 6 of ~20 external services were wrapped with circuit breakers. A Czech ARES, Estonian Ariregister, or BODACC outage could still stall an investigation for the full Temporal activity timeout.
2. **Conditional approval restrictions not surfaced** -- `MerchantRestrictions` were persisted correctly to `cases.decision_restrictions` but no dashboard component displayed the captured blocked MCCs, volume caps, or secondary-review flags.
3. **Establishment data under-exploited** -- the shell detector produces one binary HIGH finding, but the Gino/KBC acquiring meeting (2026-04-13) identified additional signals: geographic concentration and recent establishment bursts.
4. **Czech demo narrative thin** -- the Prague demo needed richer Czech-specific evidence; the sbírka listin PDF download was a known gap.
5. **NL KvK rate limit ignored** -- the Dutch Chamber of Commerce API enforces 3 req/sec; 429s were expected during any real run.

## Decision

Ship all five improvements as focused, independent merges:

1. **Complete circuit breaker rollout** -- apply the ADR-0032 pattern to 15 additional services (NBB, PEPPOL directory, CZ Justice/ISIR, SK RUZ, CH Zefix, FR INPI/INSEE/BODACC, DK CVR, EE Ariregister, FI YTJ, NL KvK, NO BRREG, RO ANAF). Pure orchestrators are skipped since their downstreams have their own breakers. Final coverage: **39 `circuit_registry.call` sites across 25 unique breaker names** -- every external network-calling service is wrapped.

2. **RestrictionsSummaryCard** -- add `decision_restrictions: MerchantRestrictions | None` to `CaseResponse` (Pydantic v2 coerces the JSONB dict). The orange-bordered shadcn `Card` renders conditionally and cites EU-AMLR Art. 26 + Art. 8(3).

3. **Establishment enrichment service** -- `analyze_establishments(establishments, country)` returns `list[Finding]`: `establishment_concentration` (MEDIUM) when ≥3 establishments share a postal code (AMLR Art. 28 §2(a)), and `establishment_recent_burst` (MEDIUM) when all ≥3 dated establishments were created within 365 days (Art. 28 §2(b)). Wired in after shell detection with guard-and-swallow.

4. **CZ Justice sbírka listin PDF download** -- `download_justice_document()` resolves the detail href, extracts the PDF URL from the `<iframe src>`, downloads the bytes, and uploads to MinIO. Reuses the existing `cz_justice` breaker.

5. **NL KvK sliding-window rate limiter** -- `_kvk_rate_limit()` uses a `deque(maxlen=3)` of monotonic timestamps under an `asyncio.Lock`, sleeping when the 3-req/sec window is saturated.

## Consequences

### Positive
- Complete resilience coverage -- no external service can stall the pipeline for more than ~30s
- Officers can now see captured conditional-approval restrictions, including on case re-open
- Three additional AMLR Art. 28 signals (concentration, recent burst, shell detection) each cite their regulatory basis
- Demo-ready Czech narrative with full sbírka listin documents; graceful KvK throughput with no 429 storms

### Negative
- Breaker state still resets on worker restart (known ADR-0032 gap; Redis-backed state is a follow-up)
- The rate limiter is per-process -- three workers each get a 3 req/sec bucket (9 req/sec effective); global coordination is deferred
- Establishment signals use only postal code and start date -- city-name and industry clustering deferred

### Risks
- False positives on legitimate structures (e.g. a law firm with 3 notarial offices at one postal code) -- mitigated by MEDIUM severity and officer-final decisioning
- The recent-burst threshold is hardcoded at 365 days and may need per-segment tuning
- PDF download depends on the Justice.cz iframe pattern; an HTML change makes downloads silently return None (caught by the guard)
