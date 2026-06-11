---
sidebar_position: 39
title: "Continuous Monitoring"
description: "Post-onboarding entity monitoring: scheduled fiscal-rep re-checks, change detection, baselines, and alerts"
components:
  - app/services/monitoring_service.py
  - app/services/monitoring_check_service.py
  - app/services/monitoring_schedule_service.py
last_verified: 2026-06-11
status: implemented
---

# Continuous Monitoring

Post-onboarding continuous monitoring infrastructure for ongoing entity surveillance. A per-tenant Temporal Schedule triggers `ContinuousMonitoringWorkflow` on a configurable cron; each run executes the active checks, compares current state against the last persisted state field-by-field, and records a `MonitoringEvent` with a `change_detected` flag and severity (INFO / WARNING / CRITICAL).

## Components

| Module | Purpose |
|--------|---------|
| `monitoring_service.py` | Database access layer (`MonitoringService`): list/acknowledge events, aggregate summary, monitoring config get/update on the tenant record, and reads for entity **baselines**, **alerts**, and **investigation deltas**. Each method opens its own tenant-scoped session |
| `monitoring_check_service.py` | Per-check execution (`MonitoringCheckService.run_check`): dispatches by `MonitoringCheckType`, fetches the previous state, runs the check, diffs against the baseline, and persists the event |
| `monitoring_schedule_service.py` | Manages the per-tenant Temporal Schedule (`monitoring-{tenant_id}`): create/update/pause/delete, plus `validate_monitoring_config` against AMLR Article 26 cadence rules |

## Check Types

`MonitoringCheckService` implements five check types. Two run against live integrations; three are explicitly in mock mode pending live wiring:

| Check | Status | Source |
|-------|--------|--------|
| `eori_validity` | Live | `EORIService.validate` — flags CRITICAL when an EORI becomes invalid, WARNING on trader name/address change |
| `vop_reverification` | Live | `VoPService.verify_batch` — flags CRITICAL on full_match → no_match, WARNING on full_match → partial_match |
| `company_status` | Mock | KBO/Crossroads Bank legal-status query deferred |
| `ubo_screening` | Mock | UBO sanctions/PEP re-screening deferred |
| `aeo_status` | Mock | EU AEO database query deferred |

> The current check set is oriented toward the **customs fiscal-representative** monitoring use case (EORI + VoP). General registry/adverse-media re-checks are not yet wired; `company_status` and `ubo_screening` return INFO mock events.

## Baselines, Alerts & Deltas

`MonitoringService` also exposes the portfolio-level read surface consumed by the dashboard:

- **Entity baselines** — per-entity risk score/tier, last-investigated timestamp, and `next_review_due` driven by `monitoring_cadence_months`
- **Monitoring alerts** — risk-delta-triggered alerts (`risk_score_before/after`, `risk_delta`, `material_changes_summary`) filterable by status
- **Investigation deltas** — field-level change records between investigation runs (dimension, previous/current value, risk impact, source)

## API

`app/api/monitoring.py` — events list, summary, manual `{case_id}/recheck`, event acknowledge, config get/update/validate, Temporal `schedule/start` + `schedule/stop`, baselines, alerts, alert count, and per-workflow investigation deltas.
