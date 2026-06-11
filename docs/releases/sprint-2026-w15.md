---
title: "Sprint W15 — Apr 12–13, 2026"
sidebar_label: "W15 (Apr 12–13)"
---

# Sprint W15 Release Notes

**Period:** Saturday April 12 – Monday April 13, 2026
**Commits:** 5 (4 fixes, 1 docs, 1 chore)
**Validated:** 18 investigation cases across 18 countries — 14 through the full decision pipeline with persisted artifacts; 4 uncovered a worker-zombie bug that the same sprint patched

---

## Highlights

### Data persistence race conditions — fixed

Multi-country E2E validation surfaced four interlocking bugs that meant
**commit `c0e7b0a0`'s "comprehensive data persistence" work was
persisting nothing** — all data was landing only in Temporal's in-memory
state. All four fixes shipped this sprint (commit `dc5f1d4a`):

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `app/services/eba_risk_matrix.py` | `TypeError: float() argument must be a string or a real number, not 'dict'` in `reassess_risk` — inline `ref_datasets.get(key)` returned the nested entry dict, not the numeric score | `_unwrap_score` helper mirroring `ReferenceDataService.get_risk_score`; routed 4 call sites |
| 2a | `app/workflows/activities.py::persist_workflow_state` | asyncpg `AmbiguousParameterError $5` — untyped `:xref` inside `CASE WHEN … IS NOT NULL` aborted the whole UPDATE | `COALESCE(CAST(:xref AS jsonb), cross_reference_result)` |
| 2b | Same | Full-row `additional_data = CAST(:ad AS jsonb)` raced with the API's `_persist_decision_artifacts` merge write, silently dropping keys | `additional_data = COALESCE(additional_data, '{}'::jsonb) \|\| CAST(:ad AS jsonb)` |
| 3 | `app/services/mcc_service.py` | `NotNullViolationError` on `risk_tier`; `or`-coercion clobbered legitimate `0.0` confidence; flat-vs-nested payload mismatch | `_first_nonempty` / `_first_not_none` helpers preserve falsy-but-valid values; support both shapes |
| 4 | `app/services/decision_service.py::_record_calibration` | Used `workflow_id` as `case_id` → FK violation on every decision; `_persist_decision_artifacts` failure swallowed at DEBUG log | Fixed `case_id` lookup; raised persist-failure log to WARNING |

### BrightData MCP hard timeouts — worker zombie eliminated

Under sustained load the worker would go to 0% CPU with CLOSE_WAIT
sockets against BrightData's Cloudfront endpoint. Root cause:
PydanticAI's `MCPServerStreamableHTTP` held streaming connections open
when inner tasks were cancelled, and Temporal activity heartbeats
lapsed. Four workflows (NL ASML, DE SAP, CZ Škoda, DK Novo Nordisk)
transitioned to `FAILED` before the fix landed.

Commit `1baa085c` wraps every `agent.run()` inside `async with agent:`
with `asyncio.wait_for(..., timeout=N)` so cancellation cleanly runs
the MCP client's `__aexit__`:

| Call site | Timeout | Finding category on timeout |
|-----------|---------|----------------------------|
| `social_intelligence_agent` | 180s | `social_intelligence_timeout` |
| `person_validation_agent` | 300s | `person_validation_timeout` |
| `brightdata_enrichment_service.lookup_crunchbase` | 90s | (no finding — returns empty `CrunchbaseResult`) |

Post-patch: 13 consecutive cases completed cleanly on the same worker
process.

### Multi-country E2E validation — 14/18 through full decision pipeline

Every case used a real listed entity with real OSINT (Tavily
pay-as-you-go, live NorthData, live BrightData, live GLEIF, live VIES):

| Country | Company | Final Status | Findings | Directors | MCC | Risk | Artifacts |
|---|---|---|---|---|---|---|---|
| FR | Bolloré SE | ESCALATED | 12 | 9 | 4214 | medium/44.56 | ✓ |
| BE | Umicore SA | APPROVED | 12 | 33 | 5094 | low/38.17 | ✓ |
| CH | Nestlé SA | APPROVED | 14 | 38 | 5411 | medium/49.39 | ✓ |
| EE | Bolt Technology OÜ | APPROVED | 12 | 13 | 4121 | low/30.08 | ✓ |
| FI | Nokia Oyj | APPROVED | 12 | 14 | 4812 | low/30.08 | ✓ |
| NO | Equinor ASA | APPROVED | 21 | 21 | 1381 | low/37.81 | ✓ |
| RO | OMV Petrom SA | APPROVED | 11 | 6 | 5541 | low/30.08 | ✓ |
| SK | Slovnaft a.s. | APPROVED | 15 | 15 | 5541 | low/37.81 | ✓ |
| IT | Enel SpA | APPROVED | 12 | 1 | 4900 | low/27.67 | ✓ |
| ES | Telefónica SA | APPROVED | 13 | 113 | 4814 | low/37.81 | ✓ |
| AT | OMV AG | APPROVED | 12 | 25 | 5541 | low/37.81 | ✓ |
| IE | Ryanair Holdings | APPROVED | 13 | 12 | 4511 | medium/44.56 | ✓ |
| PL | PKN Orlen | APPROVED | 11 | 10 | 5541 | low/37.81 | ✓ |
| SE | AB Volvo | APPROVED | 12 | 10 | 5013 | low/30.57 | ✓ |
| NL | ASML Holding | FAILED (Temporal) | 0 | 0 | — | — | ✗ |
| DE | SAP SE | FAILED (Temporal) | 0 | 0 | — | — | ✗ |
| CZ | Škoda Auto | FAILED (Temporal) | 0 | 0 | — | — | ✗ |
| DK | Novo Nordisk | FAILED (Temporal) | 0 | 0 | — | — | ✗ |

All 14 successful cases populated every validated field: `status`,
`cross_reference_result`, `resolved_requirements`, `quality_scores`,
`confidence_score`, `decision_artifacts`, 26+ successful agent runs,
11-21 synthesized findings with `severity` + `regulatory_basis`, 7-14
generated follow-up tasks, a `mcc_classifications` row, and all 7
EBA-dimension factor scores. Full field-level audit at
`docs/country-validation-report.md` in the repo (2000 lines).

### Atlas migration contracts — refreshed for Monday demo

- `docs/migration/openapi-spec.json` re-exported (269 paths)
- `docs/migration/schema.sql` fully populated (5255 lines) — previously
  empty because `pg_dump` wasn't available on the host; now extracted
  via `docker exec ... pg_dump`
- All 7 shared packages (`trustrelay-{models,protocols,registries,engines,compliance,pii,ui}`)
  pass: `./scripts/demo_packages.sh` — 6/6 core packages verified,
  127 tests green
- `examples/atlas_integration.py` — 10/10 integration sections pass

Commit `09ca2f72`.

---

## Operational lessons (for next sprint)

- **Worker zombification was the #1 instability source.** The
  `asyncio.wait_for` patches eliminate it at the Python layer; production
  should still add a supervisor (systemd liveness probe or Kubernetes)
  for defence in depth.
- **Worker startup is slow** — 2-5 min to reach "Worker started on task
  queue" after Langfuse init. Worth investigating Temporal sandbox
  module-import strategy.
- **`cases.status` column lags Temporal.** Always read via
  `case_crud.get_case` (Temporal-query with DB-fallback); never trust a
  raw `SELECT status FROM cases`.
- **NorthData fallback > some native registries** for richness. SAP SE
  returned 50 directors and 42 related companies from NorthData alone.
- **Tavily pay-as-you-go tier** eliminates the rate-limit HTTP 432 that
  plagued the earlier parts of this sprint.

## Known issues carried forward

- 4 Temporal workflows (`wf_629cdb6d5815`, `wf_7d5eefe88731`,
  `wf_3266e4a67aff`, `wf_e2783aec6070`) are in terminal `FAILED` state
  from pre-fix heartbeat timeouts. Cannot be resumed; would need fresh
  case creation.
- Swiss Zefix `company_status` returns `unknown` for Nestlé SA —
  investigate API response mapping.
- Some registries don't expose `legal_form`/`industry`/`incorporation_date`
  (e.g. Nokia via YTJ, ASML via KVK). Either enhance registry agents or
  document as real API gaps.
