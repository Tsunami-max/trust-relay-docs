---
sidebar_position: 14
title: Case Intelligence API
description: AI-driven decision support aggregating assessment, similar cases, rules, and corrections
---

# Case Intelligence API

Decision support endpoint aggregating AI assessment, similar cases, applicable rules, and officer corrections for a specific compliance case.

## Endpoints

### Get Case Intelligence

```
GET /api/cases/{workflow_id}/case-intelligence
GET /api/cases/{workflow_id}/case-intelligence?retry=true
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `retry` | boolean | `false` | Clear cached assessment and re-trigger generation |

**Response:**

```json
{
  "assessment": {
    "summary": "Based on 3 similar Belgian PSP cases, this case aligns with the approved pattern. Key risk: single-director control structure matches 2 prior escalations.",
    "pattern": "approved",
    "key_differences": [
      "Revenue decline exceeds threshold seen in approved cases",
      "Single-director pattern flagged in 2 of 3 precedents"
    ],
    "assessment_confidence": 0.82,
    "similar_count": 3,
    "approved_count": 2,
    "generated_at": "2026-03-17T14:23:00Z"
  },
  "assessment_status": "ready",
  "similar_cases": [
    {
      "workflow_id": "wf-abc-123",
      "company_name": "FinTech Solutions BV",
      "registration_number": "BE0123456789",
      "country": "BE",
      "template_type": "PSP Merchant",
      "risk_score": 0.35,
      "outcome": "approved",
      "decided_at": "2026-03-10T09:15:00Z",
      "similarity_score": 0.87,
      "key_shared_factors": ["BE", "PSP Merchant"]
    }
  ],
  "applicable_rules": [
    {
      "text": "For Belgian management companies where a single natural person occupies all key roles, always require a live interview before approval.",
      "scope": "BE management companies",
      "trigger": "sole natural person in all key roles",
      "action": "create live interview task",
      "risk_rationale": "Single-person control structures elevate risk",
      "source": "officer-taught",
      "created_at": "2026-02-15T10:30:00Z"
    }
  ],
  "officer_corrections": [
    {
      "id": "corr-456",
      "finding_category": "financial_health",
      "signal_type": "finding_rejected",
      "rejection_reason": "Revenue decline is seasonal, not structural",
      "description": "Revenue declined 34% YoY — HIGH risk signal",
      "created_at": "2026-03-16T11:00:00Z",
      "has_analysis": true
    }
  ]
}
```

**Assessment Status Values:**

| Status | Meaning | Frontend Behavior |
|---|---|---|
| `ready` | Assessment cached and available | Display assessment |
| `generating` | Background task running | Show spinner, poll every 2s |
| `failed` | Generation failed | Show retry button |

**Authentication:** Bearer JWT token required. Officer must have access to the case's tenant.

**Multi-tenancy:** All database queries use `get_tenant_session(tenant_id)` for RLS enforcement.

## Response Types

### CaseAssessment

| Field | Type | Description |
|---|---|---|
| `summary` | string | 2-4 sentence prose assessment |
| `pattern` | enum | `approved`, `rejected`, `mixed`, `insufficient` |
| `key_differences` | string[] | Max 3 differences that could change outcome |
| `assessment_confidence` | float | 0-1, distinct from 4-dimension confidence scoring |
| `similar_count` | int | Number of similar cases considered |
| `approved_count` | int | Number approved among similar cases |
| `generated_at` | string | ISO timestamp |

### SimilarCaseMatch

| Field | Type | Description |
|---|---|---|
| `workflow_id` | string | Deep-linkable case identifier |
| `company_name` | string | Real company name from cases table |
| `registration_number` | string | Enterprise/registration number |
| `country` | string | ISO country code |
| `template_type` | string | Workflow template ID |
| `risk_score` | float? | From confidence_score JSONB |
| `outcome` | enum | `approved`, `rejected`, `follow_up`, `escalated`, `pending` |
| `decided_at` | string? | ISO timestamp of latest decision |
| `similarity_score` | float | 0-1 from Letta archival search |
| `key_shared_factors` | string[] | Common attributes |

### CaseIntelligenceRule

| Field | Type | Description |
|---|---|---|
| `text` | string | Rule description |
| `scope` | string | Applicability scope |
| `trigger` | string? | Activation condition |
| `action` | string? | Required response |
| `risk_rationale` | string? | Why this rule exists |
| `source` | enum | `auto-learned` or `officer-taught` |
| `created_at` | string? | ISO timestamp |

### OfficerCorrection

| Field | Type | Description |
|---|---|---|
| `id` | string | Correction identifier |
| `finding_category` | string | Risk domain category |
| `signal_type` | enum | `finding_confirmed` or `finding_rejected` |
| `rejection_reason` | string? | Why finding was rejected |
| `description` | string | Original finding text |
| `created_at` | string | ISO timestamp |
| `has_analysis` | boolean | Whether FindingAnalysis exists |
