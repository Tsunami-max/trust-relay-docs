---
sidebar_position: 35
title: "Sanctions Screening"
description: "Sanctions list matching, EU consolidated feed ingestion, and the ADR-0045 three-tier false-positive suppression pipeline"
components:
  - app/services/sanctions_screening_pipeline.py
  - app/services/sanctions_fp_suppression.py
  - app/services/sanctions_suppression_service.py
  - app/services/sanctions_suppression_integration.py
  - app/services/sanctions_matcher_service.py
  - app/services/sanctions_feed_service.py
  - app/services/sanctions_constants.py
  - app/services/portfolio_service.py
last_verified: 2026-06-11
status: implemented
---

# Sanctions Screening

Sanctions screening infrastructure for matching entities against international sanctions lists, plus the ADR-0045 three-tier false-positive (FP) suppression pipeline that keeps officer review queues clean without ever deleting a hit.

Screening runs during the OSINT investigation stage. The subject company (name + LEI) and each director (name + DOB + nationality, when ARES/KBO provide them) are screened against the locally-cached OpenSanctions table, and every raw hit is partitioned into one of three visible buckets: `auto_dismissed` (Tier 1 evidence), `suppressed_by_rule` (Tier 2 learned rule), or `requires_review` (officer must decide).

## False-Positive Suppression Pipeline (ADR-0045)

The suppression engine is the core of this page. It is **evidence-based and always visible** — the system can ADD scrutiny but never silently suppress a risk signal. Three tiers:

| Tier | Module | Behavior |
|------|--------|----------|
| Tier 0 — name-token pre-filter | `sanctions_suppression_integration.py` | Runs the two-token surname matcher (`score_person_match`); auto-dismisses hits whose surname similarity falls below `SURNAME_MATCH_THRESHOLD`, filtering OpenSanctions prefix/phonetic false positives (e.g. "PERKA"→"Peroutka") before they reach review |
| Tier 1 — evidence-based auto-dismissal | `sanctions_fp_suppression.py` | Deterministic, no ML. Evaluates up to 6 discriminators (DOB, YOB, nationality, date-of-death vs. activity, LEI, gender) and auto-dismisses **only** when ≥ 2 independent discriminators contradict |
| Tier 2 — officer-originated learned rules | `sanctions_suppression_service.py` | Persists officer dismissals as `sanctions_suppression_rules` (HMAC-SHA256 discriminator hash, tenant-salted, 12-month expiry) and checks active rules at screening time |
| Tier 3 — periodic re-check | `sanctions_suppression_service.py` (`flag_rules_for_review`) | Conservative housekeeping pass surfacing expiring/expired rules into the dashboard renewal queue; never auto-revokes or auto-extends |

Tier 1 requires **compositional evidence** — a single-discriminator mismatch (which could be a data-entry error) never auto-dismisses. Every Tier-1 evaluation emits a structured `sanctions_fp_tier1_evaluated` audit event citing the exact discriminator values compared (EU AI Act Art. 12 / Art. 14). Every Tier-2 dismissal requires a non-empty officer rationale (Art. 13) and writes an audit event.

## Components

| Module | Purpose |
|--------|---------|
| `sanctions_screening_pipeline.py` | Orchestrates per-entity screening: queries OpenSanctions via `match_local`, normalises rows, calls `partition_hits`, and aggregates the result for the OSINT payload (`screen_entities`, `build_company_query`, `build_director_queries`, `summarize_screening`). Fails soft when OpenSanctions data is not loaded |
| `sanctions_fp_suppression.py` | Tier 1 deterministic discriminator evaluation (`evaluate_suppression`, `build_audit_event_payload`). Defines `CustomerDiscriminators` and `SanctionedRecordDiscriminators` |
| `sanctions_suppression_service.py` | Tier 2/3 `SanctionsSuppressionService`: `record_dismissal`, `revoke_rule`, `check_active_rule`, `list_rules`, `flag_rules_for_review`, plus the tenant-salted HMAC discriminator hash |
| `sanctions_suppression_integration.py` | Adapter wiring Tier 0 + Tier 1 + Tier 2 over a hit list (`partition_hits`); returns the three-bucket `PartitionedScreening` |
| `sanctions_matcher_service.py` | Local EU sanctions list matching with three tiers: exact (normalized name), fuzzy (Jaro-Winkler), and LLM resolution for the 0.80–0.95 ambiguous zone |
| `sanctions_feed_service.py` | EU Consolidated Financial Sanctions List ingestion — fetches/parses the EU XML to produce sanctioned **country codes**, Redis-cached 24h, with hardcoded fallback |
| `sanctions_constants.py` | Sanctioned and high-risk country sets (EU 833/2014, UN consolidated, OFAC SDN informational) for per-shipment compliance checks |
| `portfolio_service.py` | Rate-limited parallel Tier 1 batch scans across an entity portfolio (`PortfolioService.batch_scan`), persisting a Portfolio graph node with `CONTAINS` edges |

## API

- `app/api/sanctions.py` — screening endpoints (screen, results)
- `app/api/sanctions_suppression.py` — suppression-rule CRUD under `/api/sanctions/suppression-rules` (record dismissal, list by status bucket, revoke)

## Related ADRs

- **ADR-0045** — Sanctions false-positive suppression (3-tier engine, evidence-based, always visible)
