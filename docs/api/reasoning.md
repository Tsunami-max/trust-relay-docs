---
sidebar_position: 11
title: "Reasoning Templates API"
---

# Reasoning Templates API

Pillar 2 endpoints for managing reasoning templates and retrieving rule evaluation results. Reasoning templates define deterministic red-flag rules and verification chains that apply to specific country/vertical combinations. The RedFlagEngine evaluates these rules without any LLM involvement.

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/reasoning-templates` | List all reasoning templates |
| `GET` | `/api/reasoning-templates/{template_id}` | Get full template detail |
| `GET` | `/api/cases/{workflow_id}/rule-evaluations` | Get rule evaluation results for a case |

---

## List Reasoning Templates

```
GET /api/reasoning-templates
```

Returns all registered reasoning templates, optionally filtered by country.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `country` | string | No | ISO country code to filter templates (e.g., `BE`, `NL`) |

**Response** `200`

```json
[
  {
    "id": "be_psp_aml",
    "name": "Belgium PSP AML Template",
    "country": "BE",
    "vertical": "psp_merchant_onboarding",
    "version": "1.0",
    "enabled": true,
    "rule_count": 12,
    "verification_steps": 5,
    "workflow_template_id": "psp_merchant_onboarding",
    "regulatory_framework": "6AMLD"
  }
]
```

---

## Get Template Detail

```
GET /api/reasoning-templates/{template_id}
```

Returns the full reasoning template including all red flag rules, verification chain steps, condition types, and action types.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `template_id` | string | Yes | Reasoning template identifier |

**Response** `200`

Returns the complete template model including `red_flag_rules` (with 10 condition types and 5 action types) and `verification_chain` steps.

**Status Codes:**

- `200` -- Success
- `404` -- Reasoning template not found

---

## Get Rule Evaluations

```
GET /api/cases/{workflow_id}/rule-evaluations
```

Retrieves the rule evaluation results for a specific case. These are the outcomes of running the RedFlagEngine against the case's investigation findings.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `workflow_id` | string | Yes | Temporal workflow ID of the case |

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `iteration` | integer | No | Specific iteration to retrieve (defaults to latest) |

**Response** `200`

```json
{
  "evaluated": true,
  "template_id": "be_psp_aml",
  "rules_triggered": 2,
  "confidence_cap": 65.0,
  "evidence_gate": 0.8,
  "results": [
    {
      "rule_id": "shell_company_indicators",
      "triggered": true,
      "condition_type": "finding_category_present",
      "action_type": "cap_confidence",
      "action_value": 65.0,
      "evidence": "Finding 'no_physical_presence' matched category"
    }
  ]
}
```

When no evaluation has been performed yet, the response returns `{"evaluated": false, "results": []}`.

**Status Codes:**

- `200` -- Success (returns empty results if no evaluation exists)
