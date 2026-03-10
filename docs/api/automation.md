---
sidebar_position: 14
title: "Supervised Autonomy API"
---

# Supervised Autonomy API

Pillar 4 endpoints for managing automation tiers. The Supervised Autonomy system assigns one of three review tiers to each (officer, template, country) combination based on the officer's track record: **Full Review**, **Guided Review**, or **Express Approval**. A Compliance Manager can force-override tiers when needed.

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/automation/tiers` | List all tier states for the current officer |
| `GET` | `/api/automation/tiers/{template_id}/{country}` | Get tier for a specific template/country |
| `POST` | `/api/automation/override` | Force a tier override (Compliance Manager) |
| `DELETE` | `/api/automation/override/{template_id}/{country}` | Release a forced override |
| `GET` | `/api/automation/stats` | Aggregate tier statistics |

---

## List Officer Tiers

```
GET /api/automation/tiers
```

Returns all automation tier states for the currently authenticated officer. Each entry represents a (template, country) combination with its current tier, earned tier, and override status.

**Response** `200`

```json
[
  {
    "officer_id": "default",
    "template_id": "psp_merchant_onboarding",
    "country": "BE",
    "current_tier": "guided_review",
    "earned_tier": "guided_review",
    "forced_tier": null,
    "forced_by": null,
    "force_reason": null,
    "cases_completed": 15,
    "agreement_rate": 0.87
  }
]
```

---

## Get Specific Tier

```
GET /api/automation/tiers/{template_id}/{country}
```

Returns the tier state for a specific template and country combination.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `template_id` | string | Yes | Workflow template identifier |
| `country` | string | Yes | ISO country code |

**Response** `200`

Returns a single tier state object (same shape as list items above).

**Status Codes:**

- `200` -- Success
- `404` -- No tier state found for this template/country combination

---

## Force Tier Override

```
POST /api/automation/override
```

Allows a Compliance Manager to force an officer to a specific tier, regardless of their earned tier. Typically used to downgrade an officer to Full Review after quality concerns. The override persists until explicitly released.

**Request Body:**

```json
{
  "officer_id": "officer-uuid",
  "template_id": "psp_merchant_onboarding",
  "country": "BE",
  "forced_tier": "full_review",
  "reason": "Quality audit revealed missed sanctions matches in 2 recent cases"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `officer_id` | string | Yes | Target officer to override |
| `template_id` | string | Yes | Workflow template identifier |
| `country` | string | Yes | ISO country code |
| `forced_tier` | string | No | Tier to force (default: `full_review`). One of: `full_review`, `guided_review`, `express_approval` |
| `reason` | string | Yes | Mandatory explanation for the override |

**Response** `200`

Returns the updated tier state object.

**Status Codes:**

- `200` -- Success
- `400` -- Reason is required but was empty

---

## Release Override

```
DELETE /api/automation/override/{template_id}/{country}
```

Releases a forced tier override for the current officer, allowing the system to recompute the earned tier based on the officer's rolling window of case decisions.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `template_id` | string | Yes | Workflow template identifier |
| `country` | string | Yes | ISO country code |

**Response** `200`

Returns the updated tier state object with the recomputed earned tier.

---

## Tier Statistics

```
GET /api/automation/stats
```

Returns aggregate statistics about the current officer's tier distribution across all template/country combinations.

**Response** `200`

```json
{
  "officer_id": "default",
  "tier_counts": {
    "full_review": 2,
    "guided_review": 5,
    "express_approval": 1
  },
  "total_combos": 8,
  "tiers": [
    {
      "officer_id": "default",
      "template_id": "psp_merchant_onboarding",
      "country": "BE",
      "current_tier": "guided_review",
      "earned_tier": "guided_review",
      "forced_tier": null,
      "cases_completed": 15,
      "agreement_rate": 0.87
    }
  ]
}
```
