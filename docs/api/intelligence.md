---
sidebar_position: 12
title: "Cross-Case Intelligence API"
---

# Cross-Case Intelligence API

Pillar 3 endpoints for cross-case pattern detection alerts. The intelligence layer identifies patterns across multiple cases (e.g., shared directors, phoenix companies, circular ownership) and surfaces them as actionable alerts for compliance officers. All routes are under the `/intelligence/` prefix.

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/intelligence/alerts` | List pattern alerts |
| `GET` | `/intelligence/alerts/for-case/{workflow_id}` | Get alerts linked to a specific case |
| `GET` | `/intelligence/alerts/{alert_id}` | Get full alert detail |
| `PATCH` | `/intelligence/alerts/{alert_id}` | Acknowledge or dismiss an alert |
| `GET` | `/intelligence/stats` | Aggregate alert statistics |
| `GET` | `/intelligence/trends` | Portfolio-level risk trends |

---

## List Alerts

```
GET /intelligence/alerts
```

Returns pattern alerts with optional filters. Alerts represent cross-case risk patterns detected by the PatternEngine.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pattern_type` | string | No | Filter by pattern type (e.g., `phoenix`, `shared_director`, `circular`, `dormant`, `contagion`) |
| `severity` | string | No | Filter by severity level |
| `status` | string | No | Alert status filter (default: `active`) |
| `limit` | integer | No | Maximum results to return (default: `50`) |
| `offset` | integer | No | Pagination offset (default: `0`) |

**Response** `200`

```json
[
  {
    "id": "alert-uuid",
    "pattern_type": "shared_director",
    "severity": "high",
    "status": "active",
    "title": "Shared director across 3 cases",
    "linked_case_ids": ["case-1", "case-2", "case-3"],
    "created_at": "2026-03-01T10:00:00Z"
  }
]
```

---

## Get Alerts for Case

```
GET /intelligence/alerts/for-case/{workflow_id}
```

Returns all alerts where the specified case is in the `linked_case_ids` list. Useful for showing cross-case risk context on the case detail page.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_id` | string | Yes | Temporal workflow ID of the case |

**Response** `200`

Returns an array of alert objects linked to the specified case.

---

## Get Alert Detail

```
GET /intelligence/alerts/{alert_id}
```

Returns the full alert detail including the `evidence_snapshot` with all supporting data for the detected pattern.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `alert_id` | string | Yes | Alert UUID |

**Response** `200`

```json
{
  "id": "alert-uuid",
  "pattern_type": "phoenix",
  "severity": "critical",
  "status": "active",
  "title": "Phoenix company pattern detected",
  "description": "Company dissolved and re-registered with same director within 6 months",
  "linked_case_ids": ["case-1", "case-2"],
  "evidence_snapshot": {
    "entities": ["..."],
    "relationships": ["..."],
    "motif_details": {}
  },
  "created_at": "2026-03-01T10:00:00Z"
}
```

**Status Codes:**

- `200` -- Success
- `404` -- Alert not found

---

## Update Alert (Acknowledge / Dismiss)

```
PATCH /intelligence/alerts/{alert_id}
```

Acknowledge or dismiss an alert. Dismissals require a reason to comply with EU AI Act Art. 14 (human oversight of AI-generated risk signals).

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `alert_id` | string | Yes | Alert UUID |

**Request Body:**

```json
{
  "action": "dismiss",
  "reason": "false_positive",
  "reason_text": "Director resigned before company B was incorporated"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Either `acknowledge` or `dismiss` |
| `reason` | string | Conditional | Required for dismiss. Valid values from `DismissReason` enum |
| `reason_text` | string | No | Optional free-text explanation |

**Response** `200`

```json
{ "status": "acknowledged" }
```

or

```json
{ "status": "dismissed" }
```

**Status Codes:**

- `200` -- Success
- `400` -- Invalid action, missing dismiss reason, or invalid dismiss reason value
- `404` -- Alert not found

---

## Get Alert Statistics

```
GET /intelligence/stats
```

Returns aggregate statistics for the alert dashboard.

**Response** `200`

```json
{
  "active_count": 12,
  "critical_count": 3,
  "cases_affected": 8
}
```

---

## Get Risk Trends

```
GET /intelligence/trends
```

Returns portfolio-level risk trend metrics computed by the PatternEngine over a rolling window.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `days` | integer | No | Lookback window in days (default: `30`) |

**Response** `200`

```json
{
  "period_days": 30,
  "trend_data": [
    { "date": "2026-03-01", "risk_score": 42, "alert_count": 3 }
  ],
  "summary": {
    "avg_risk": 38.5,
    "max_risk": 67,
    "total_alerts": 15
  }
}
```
