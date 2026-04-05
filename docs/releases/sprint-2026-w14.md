---
title: "Sprint W14 — Mar 28–31, 2026"
sidebar_label: "W14 (Mar 28–31)"
---

# Sprint W14 Release Notes

**Period:** Friday March 28 – Monday March 31, 2026
**Commits:** 350 (146 features, 140 fixes, 64 chores/tests/docs)
**Validated:** 7 investigation cases (Bolloré SE + 6 related entities)

---

## Highlights

### Unified Risk Configuration Admin

Replaced the dual ARIA/EBA risk scoring architecture with a single, editable system. Compliance admins can now manage scoring parameters, reference datasets, and investigation checks through the UI — no more code deployments to update a FATF list.

- **EBA is the only risk matrix** — ARIA removed (400+ lines of dead code)
- **Versioned configs** — draft → activate workflow with audit trail
- **Admin page** at `/admin/risk-configuration` with 3 tabs: Scoring Model, Reference Datasets, Versions
- **Stale config banner** on case detail with one-click recalculate
- 9 API endpoints, 29 validation rules, in-memory cache with 60s TTL

### Chatbot Actions

The AI assistant can now take actions, not just analyze. Officers can resolve discrepancies, add notes, and confirm/reject findings directly through the chat.

- `resolve_discrepancy` — close a discrepancy with typed resolution (accepted_variance, verified_no_issue, customer_corrected, escalated)
- `add_case_note` — dictate investigation observations
- `submit_finding_feedback` — confirm or reject findings with comments
- Full audit trail via SignalEvent (EU AI Act Art. 12 compliant)
- `resolved_via: "chatbot"` distinguishes AI-mediated decisions from UI actions

### Investigation Pipeline Overhaul

- **MCC before risk reassessment** — product risk now feeds into initial scoring
- **13-agent pipeline** (was 10) — added verification_checks, quality_scorer, inhoudingsplicht
- **8-stage progress strip** — Registry → MCC → Screening → Financial → Synthesis → Quality → Tasks → Graph
- **DB sync** — `persist_workflow_state` activity ensures PostgreSQL matches Temporal at every transition

---

## Quality Metrics

| Metric | Value |
|--------|-------|
| Investigation quality scores | 7.8 – 8.8 / 10 |
| Findings per case (avg) | 8 |
| Tasks generated per case (avg) | 5.9 |
| Neo4j nodes (7 cases) | 544 |
| Missing regulatory basis | 0 |
| Prompt instruction leakage | 0 |
| DB sync failures | 0 |
| Summary sections complete | 5/5 on all cases |

---

## Other Notable Changes

**Network Intelligence Hub** — all 5 phases completed (Mar 28–30): Network Graph, Ownership Tree, Investigation Flow, recursive entity scanning, 22 components, ~5,800 lines

**Atlas Adoption** — 12 patterns adopted from co-founder's parallel implementation, 10/11 wired into pipeline, competitive analysis documented

**Structured Summary Renderer** — custom React component replacing raw markdown with colored sections, severity badges, verification status columns

**CopilotKit Auth** — proxy pattern for reliable JWT forwarding from browser → Next.js → backend

**Investigation Checklist** — honest completion tracking: only marks checks green if a matching finding category exists

**Docusaurus** — collapsible sidebar, hideable TOC panel, 9 architecture pages updated, 100% backend coverage

---

## Breaking Changes

- `EBA_RISK_MATRIX_ENABLED` env var removed — delete from `.env`
- `/api/reference-data` endpoint removed — replaced by `/api/risk-config/`
- `/admin/reference-data` redirects to `/admin/risk-configuration`
- `compute_initial_risk()` and ARIA scoring functions deleted from `risk_matrix_service.py`
- `risk_assessments.matrix_version` now stores config UUID (not string `"v1.0-fatf-2024"`)

---

## Database Migrations

| # | Name | Tables |
|---|------|--------|
| 038 | risk_configurations | `risk_configurations`, `risk_config_audit` |
| 039 | discrepancy_resolutions | `discrepancy_resolutions` |

All tables have RLS with `tenant_isolation` policy.
