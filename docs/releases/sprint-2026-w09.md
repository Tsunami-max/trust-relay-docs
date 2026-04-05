---
title: "Sprint W09 — Feb 20–27, 2026"
sidebar_label: "W09 (Feb 20–27)"
---

# Sprint W09 Release Notes

**Period:** Friday February 20 – Friday February 27, 2026
**Commits:** 225 (118 features, 55 fixes)
**Dev effort:** ~58h (1 architect + Claude Opus)

---

## Business Impact

The platform went from a prototype to a secure, production-shaped foundation. Compliance officers can now log in, run investigations, and — for the first time — see how companies and directors connect across multiple cases through a live entity network graph. The groundwork for every subsequent feature was laid in this sprint.

## Key Deliverables

### Entity Network Knowledge Graph
The Neo4j knowledge graph went live, backed by a full entity ETL pipeline and query API. Compliance officers can now visualise cross-case connections — co-directorships, shared beneficial owners, linked corporate structures — from a single dashboard view. Patterns that would have required hours of manual cross-referencing now surface automatically.

### Officer Authentication
OIDC/Keycloak integration was completed, giving every officer a verified identity tied to their actions. All investigation decisions and audit events are now attributed to a named officer, satisfying EU AI Act Art. 14 human oversight requirements and creating an immutable chain of custody from day one.

### Portal Token Security
Customer portal links now carry a 30-day expiry. Tokens that exceed the deadline are automatically invalidated, preventing stale access to active cases while keeping the customer experience frictionless for in-window submissions.

### Belgian Evidence Downloads
Officers can download official Belgian evidence PDFs directly from the case view. Source documents are preserved in MinIO alongside the extracted investigation data, so the evidentiary basis for every finding is a single click away at audit time.

### Cross-Case Entity Linking
The system now detects when a director or beneficial owner appears in multiple open cases and surfaces the link automatically. Fraud patterns and co-directorship rings that span separate cases are visible without any manual searching.

## Metrics

| Metric | Value |
|--------|-------|
| Commits | 225 |
| Features shipped | 118 |
| Fixes | 55 |
| Dev effort | ~58h |
| Alembic migrations introduced | Yes (baseline) |

## What We Learned

Speed of delivery at this scale (225 commits, 118 features in a single week) is only possible when the architect focuses on decisions and the AI handles execution — the human-AI pair model is already proving its thesis before the platform is even feature-complete.
