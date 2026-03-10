---
sidebar_position: 13
title: "Diagnostics"
---

# Diagnostics API

Session reconstruction and investigation quality feedback endpoints. All endpoints require authentication and are feature-gated by `diagnostics_enabled` (returns `404` when disabled).

## Endpoints Summary

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/diagnostics/stats` | Officer | Aggregated diagnostics statistics |
| `GET` | `/api/diagnostics/{case_id}` | Officer | Per-iteration summary for a case |
| `GET` | `/api/diagnostics/{case_id}/iterations/{n}` | Officer | Full session reconstruction |
| `POST` | `/api/diagnostics/{case_id}/iterations/{n}/feedback` | Officer | Submit quality feedback |
| `GET` | `/api/diagnostics/{case_id}/iterations/{n}/feedback` | Officer | Retrieve feedback for iteration |

---

## Statistics

### Get Diagnostic Stats

```
GET /api/diagnostics/stats
```

Returns aggregated diagnostics for the admin dashboard: stage failure rates, quality trends, root cause distribution, and source reliability.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `days` | integer | No | Lookback window in days (default: `30`) |

**Response** `200`

```json
{
  "stage_reliability": [
    {
      "stage": "osint_investigation",
      "total": 142,
      "failed": 8,
      "failure_rate": 5.6
    }
  ],
  "quality_trend": [
    {
      "date": "2026-03-07",
      "avg_rating": 4.2,
      "count": 12
    }
  ],
  "root_cause_distribution": [
    {
      "root_cause": "source_timeout",
      "count": 5
    }
  ],
  "source_reliability": [
    {
      "tool_name": "kbo_scraper",
      "total": 89,
      "succeeded": 85,
      "success_rate": 95.5
    }
  ]
}
```

---

## Case Summary

### Get Case Summary

```
GET /api/diagnostics/{case_id}
```

Returns per-iteration aggregates for a case: stage counts, total duration, success/failure counts, and average feedback rating.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string (UUID) | Yes | Case identifier |

**Response** `200`

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "iterations": [
    {
      "iteration": 1,
      "stage_count": 11,
      "total_duration_ms": 34520,
      "success_count": 10,
      "failed_count": 1,
      "started_at": "2026-03-07T10:00:00Z",
      "completed_at": "2026-03-07T10:00:34Z",
      "avg_rating": 3.5,
      "feedback_count": 2
    }
  ]
}
```

---

## Session Reconstruction

### Get Full Reconstruction

```
GET /api/diagnostics/{case_id}/iterations/{n}
```

Full session reconstruction for a single iteration, joining across all 6 telemetry tables: pipeline stages, tool invocations, audit events, governance checks, EVOI decisions, and investigation feedback.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string (UUID) | Yes | Case identifier |
| `n` | integer | Yes | Iteration number (1-indexed) |

**Response** `200`

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "iteration": 1,
  "total_duration_ms": 34520,
  "stages": [
    {
      "id": "stage-uuid",
      "stage": "osint_investigation",
      "sequence": 4,
      "status": "success",
      "duration_ms": 12300,
      "details": {"sources_consulted": 5},
      "error_type": null,
      "parent_stage_id": null,
      "created_at": "2026-03-07T10:00:05Z"
    }
  ],
  "tool_invocations": [
    {
      "id": "tool-uuid",
      "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "agent_name": "belgian_osint_agent",
      "tool_name": "kbo_scraper",
      "cost_category": "scraping",
      "duration_ms": 2100,
      "success": true,
      "error_type": null,
      "cost_eur": 0.0,
      "tokens_used": 0,
      "created_at": "2026-03-07T10:00:06Z"
    }
  ],
  "audit_trail": [
    {
      "id": "audit-uuid",
      "event_type": "case_created",
      "details": {},
      "created_at": "2026-03-07T09:55:00Z"
    }
  ],
  "governance_checks": [
    {
      "id": "gov-uuid",
      "event_type": "pre_execution",
      "mechanism": "mandatory_agents",
      "agent_name": "belgian_osint_agent",
      "approved": true,
      "action": "allow",
      "violations": [],
      "created_at": "2026-03-07T10:00:04Z"
    }
  ],
  "evoi_decisions": [
    {
      "id": "evoi-uuid",
      "step_number": 1,
      "decision_type": "invoke",
      "candidate_agent": "belgian_osint_agent",
      "evoi_value": 0.85,
      "decision": "invoke",
      "reason": "High expected value of information",
      "created_at": "2026-03-07T10:00:04Z"
    }
  ],
  "feedback": [
    {
      "id": "feedback-uuid",
      "officer_id": "demo",
      "rating": 4,
      "categories": [],
      "comment": "Good coverage",
      "root_cause": null,
      "severity": null,
      "failure_stage": null,
      "suggested_action": null,
      "classified_at": null,
      "created_at": "2026-03-07T10:15:00Z"
    }
  ]
}
```

---

## Feedback

### Submit Feedback

```
POST /api/diagnostics/{case_id}/iterations/{n}/feedback
```

Record officer quality feedback on an investigation iteration. When the rating is 1 or 2 and `diagnostics_auto_classify` is enabled, the `FailureClassifier` automatically determines root cause, severity, failure stage, and suggested action.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string (UUID) | Yes | Case identifier |
| `n` | integer | Yes | Iteration number (1-indexed) |

**Request Body:**

```json
{
  "rating": 2,
  "categories": ["missing_source"],
  "comment": "NBB data was not included in the report"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating` | integer | Yes | Quality rating from 1 (poor) to 5 (excellent) |
| `categories` | string[] | No | Feedback categories: `hallucination`, `wrong_entity`, `missing_source`, `incomplete`, `outdated_data` |
| `comment` | string | No | Free-text comment explaining the quality issue |

**Response** `200`

```json
{
  "id": "feedback-uuid",
  "status": "recorded"
}
```

### Get Iteration Feedback

```
GET /api/diagnostics/{case_id}/iterations/{n}/feedback
```

Retrieve all feedback entries for a specific iteration, including auto-classification results.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string (UUID) | Yes | Case identifier |
| `n` | integer | Yes | Iteration number (1-indexed) |

**Response** `200`

```json
[
  {
    "id": "feedback-uuid",
    "officer_id": "demo",
    "rating": 2,
    "categories": ["missing_source"],
    "comment": "NBB data was not included in the report",
    "root_cause": "investigation_incomplete",
    "severity": "medium",
    "failure_stage": "osint_investigation",
    "suggested_action": "Verify OSINT agent configuration; check if source is enabled for this template",
    "classified_at": "2026-03-07T10:20:00Z",
    "created_at": "2026-03-07T10:19:55Z"
  }
]
```

**Status Codes (all endpoints):**

- `200` -- Success
- `404` -- Diagnostics not enabled, or resource not found
- `422` -- Validation error (e.g., rating outside 1-5)
