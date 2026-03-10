---
sidebar_position: 10
title: "Confidence Scoring API"
---

# Confidence Scoring API

Pillar 1 endpoint that computes a multi-dimensional confidence score for a case's latest investigation. The score is derived from document completeness, OSINT corroboration, discrepancy analysis, officer calibration history, and optional reasoning-template caps.

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/cases/{workflow_id}/confidence` | Compute confidence score for a case |

---

## Get Confidence Score

```
GET /api/cases/{workflow_id}/confidence
```

Computes and returns the confidence score for a case's latest investigation iteration. The score aggregates four dimensions (0-25 each, totaling 0-100):

1. **Document completeness** -- ratio of valid documents received vs. required
2. **OSINT corroboration** -- number of independently confirmed data points
3. **Discrepancy analysis** -- penalty for unresolved discrepancies between sources
4. **Officer calibration** -- historical agreement rate for the officer on similar cases

If a Pillar 2 reasoning template applies to the case, it may impose a **confidence cap** that limits the maximum achievable score when red flag rules are triggered.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_id` | string | Yes | Temporal workflow ID of the case |

**Response** `200`

```json
{
  "case_id": "case-abc-123",
  "iteration": 2,
  "total": 72,
  "document_score": 20,
  "corroboration_score": 22,
  "discrepancy_score": 15,
  "calibration_score": 15,
  "reasoning_template_id": "be_psp_aml",
  "confidence_cap_reason": "Reasoning template 'be_psp_aml' triggered red flag rule(s) capping confidence at 75.0"
}
```

The response is a `ConfidenceScore` object. When no investigation results exist yet, the endpoint returns a score with `iteration: 0` and all dimension scores at their defaults.

**Status Codes:**

- `200` -- Success
- `404` -- Case not found or workflow not running
