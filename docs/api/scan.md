---
sidebar_position: 5
title: "Scan API"
---

# Scan API

Tiered entity scanning endpoints for automated KYB compliance checks. The scan system provides four depth levels, from instant graph-based risk scoring (Tier 0) to full compliance case investigation (Tier 3).

All scan endpoints require officer authentication and are under the `/api` prefix.

## Tier Overview

| Tier | Name | LLM Calls | Latency | Cost | Description |
|---|---|---|---|---|---|
| 0 | E-VAL | 0 | &lt;100ms | 0c | Graph-only risk score from cross-investigation signals |
| 1 | Lightweight Scan | 0 | 2-8s | 1c | KBO registry + PEPPOL verification + sanctions screening |
| 2 | Standard Scan | 1 | 10-20s | 2-6c | Tier 1 + adverse media search + LLM synthesis |
| 3 | Full Investigation | 5+ | 60-160s | -- | Creates a full compliance case with Temporal workflow |

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/scan/entity/{reg_number}` | Scan a single entity at a specified tier |
| `GET` | `/api/scan/entity/{reg_number}/results` | Get scan history for an entity |
| `POST` | `/api/scan/entity/{reg_number}/escalate` | Escalate to a higher scan tier |
| `POST` | `/api/scan/portfolio` | Batch scan a portfolio of entities |
| `GET` | `/api/scan/portfolio/{portfolio_id}/results` | Get results for a portfolio scan |

---

## Scan Entity

```
POST /api/scan/entity/{reg_number}
```

Scans a single entity at the specified tier depth. Tiers 0-2 return results synchronously. Tier 3 creates a full compliance case and starts a Temporal workflow.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `reg_number` | string | Belgian enterprise/registration number (e.g., `0456789012`) |

**Request Body**

```json
{
  "tier": 1,
  "segment_id": "psp-merchants-eu"
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `tier` | integer | No | `1` | Scan depth: `0` (E-VAL), `1` (lightweight), `2` (standard), `3` (full investigation) |
| `segment_id` | string | No | `null` | Optional segment identifier for portfolio grouping |

### Tier 0 Response

**Response** `200`

```json
{
  "registration_number": "0456789012",
  "eval_score": 0.15,
  "graph_degree": 3,
  "cross_investigation_count": 1,
  "above_threshold": false
}
```

| Field | Type | Description |
|---|---|---|
| `registration_number` | string | The queried registration number |
| `eval_score` | float | Risk score from 0.0 (safe) to 1.0 (high risk), derived from graph signals |
| `graph_degree` | integer | Number of graph connections for this entity |
| `cross_investigation_count` | integer | Number of other investigations that have touched this entity |
| `above_threshold` | boolean | Whether `eval_score` exceeds the configured threshold (default 0.3) |

### Tier 1 Response

**Response** `200`

```json
{
  "scan_id": "scan-0456789012-t1-20260227143022",
  "registration_number": "0456789012",
  "tier": 1,
  "risk_tier": "green",
  "confidence": 0.8,
  "eval_score": 0.15,
  "company_status": "active",
  "legal_name": "Acme Trading BVBA",
  "nace_codes": ["47.19", "62.01"],
  "director_count": 2,
  "ubo_count": 0,
  "sanctions_exact_matches": 0,
  "sanctions_fuzzy_matches": 0,
  "peppol_registered": true,
  "withholding_obligations": false,
  "tax_debt_detected": false,
  "social_debt_detected": false,
  "adverse_media_hits": 0,
  "adverse_media_summary": "",
  "synthesis_summary": "",
  "flags": [],
  "scan_cost_cents": 1,
  "scanned_at": "2026-02-27T14:30:22Z",
  "cached": false
}
```

### Tier 2 Response

**Response** `200`

Returns the same `ScanResult` schema as Tier 1, with additional fields populated:

```json
{
  "scan_id": "scan-0456789012-t2-20260227143055",
  "registration_number": "0456789012",
  "tier": 2,
  "risk_tier": "amber",
  "confidence": 0.9,
  "eval_score": 0.15,
  "company_status": "active",
  "legal_name": "Acme Trading BVBA",
  "nace_codes": ["47.19", "62.01"],
  "director_count": 2,
  "ubo_count": 0,
  "sanctions_exact_matches": 0,
  "sanctions_fuzzy_matches": 1,
  "peppol_registered": true,
  "withholding_obligations": false,
  "tax_debt_detected": false,
  "social_debt_detected": false,
  "adverse_media_hits": 3,
  "adverse_media_summary": "Found 3 articles mentioning regulatory inquiries in 2025.",
  "synthesis_summary": "Entity shows moderate risk due to adverse media coverage. KBO and PEPPOL checks passed. Recommend Tier 3 investigation for regulatory clarity.",
  "flags": ["SANCTIONS_FUZZY", "ADVERSE_MEDIA_FOUND"],
  "scan_cost_cents": 6,
  "scanned_at": "2026-02-27T14:30:55Z",
  "cached": false
}
```

Key differences from Tier 1:
- `adverse_media_hits` and `adverse_media_summary` are populated from media search
- `synthesis_summary` contains an LLM-generated risk narrative
- `sanctions_fuzzy_matches` may be refined via LLM resolution of ambiguous matches
- `confidence` is typically higher (+0.1 over Tier 1)
- `scan_cost_cents` is higher (2c base + 3c if adverse media hits found)

### Tier 3 Response

**Response** `200`

Tier 3 creates a full compliance case with a Temporal workflow. The response is a case creation payload, not a `ScanResult`.

```json
{
  "case_id": "case_a1b2c3d4e5f6",
  "workflow_id": "wf_f6e5d4c3b2a1",
  "portal_token": "pt_1234567890abcdef",
  "portal_url": "http://localhost:3001/portal/pt_1234567890abcdef",
  "company_name": "Acme Trading BVBA",
  "registration_number": "0456789012",
  "status": "CREATED",
  "created_at": "2026-02-27T14:31:00Z"
}
```

The created case follows the standard [Case Management](/docs/api/cases) lifecycle. The case's `additional_data` will include `{"escalated_from_scan": true}`.

### ScanResult Schema

Full schema for Tier 1 and Tier 2 responses:

| Field | Type | Description |
|---|---|---|
| `scan_id` | string | Unique scan identifier (format: `scan-{reg}-t{tier}-{timestamp}`) |
| `registration_number` | string | The scanned entity's registration number |
| `tier` | integer | Scan tier that was executed (1 or 2) |
| `risk_tier` | string | Overall risk classification: `green`, `amber`, or `red` |
| `confidence` | float | Confidence score (0.0-1.0) based on data availability |
| `eval_score` | float | Graph-based E-VAL risk score (0.0-1.0) |
| `company_status` | string | KBO company status (e.g., `active`, `ceased`, `bankrupt`) |
| `legal_name` | string | Legal company name from KBO registry |
| `nace_codes` | string[] | NACE activity codes from KBO |
| `director_count` | integer | Number of directors found in KBO |
| `ubo_count` | integer | Number of UBOs identified |
| `sanctions_exact_matches` | integer | Exact sanctions list matches |
| `sanctions_fuzzy_matches` | integer | Fuzzy/partial sanctions matches |
| `peppol_registered` | boolean | Whether entity is registered in PEPPOL directory |
| `withholding_obligations` | boolean | Whether withholding obligations exist (from inhoudingsplicht) |
| `tax_debt_detected` | boolean | Tax debt flag from PEPPOL/inhoudingsplicht check |
| `social_debt_detected` | boolean | Social security debt flag |
| `adverse_media_hits` | integer | Number of adverse media articles found (Tier 2 only) |
| `adverse_media_summary` | string | Summary of adverse media findings (Tier 2 only) |
| `synthesis_summary` | string | LLM-generated risk narrative (Tier 2 only) |
| `flags` | string[] | Risk flags raised during scan (see below) |
| `scan_cost_cents` | integer | Estimated cost of this scan in cents |
| `scanned_at` | datetime | ISO 8601 timestamp of scan execution |
| `cached` | boolean | Whether result was served from cache |

### Risk Flags

| Flag | Meaning |
|---|---|
| `KBO_UNAVAILABLE` | KBO registry lookup failed or returned no data |
| `PEPPOL_UNAVAILABLE` | PEPPOL verification service unreachable |
| `SANCTIONS_HIT` | Exact match found on sanctions list (sets `risk_tier` to `red`) |
| `SANCTIONS_FUZZY` | Fuzzy match found on sanctions list (sets `risk_tier` to `amber`) |
| `WITHHOLDING_OBLIGATIONS` | Tax or social security debt detected |
| `COMPANY_INACTIVE` | Company status indicates ceased, dissolved, or bankrupt |
| `ADVERSE_MEDIA_FOUND` | Adverse media articles found (Tier 2 only) |
| `ADVERSE_MEDIA_UNAVAILABLE` | Adverse media search failed (Tier 2 only) |

**Example: Tier 1 scan**

```bash
curl -X POST http://localhost:8002/api/scan/entity/0456789012 \
  -H "Content-Type: application/json" \
  -d '{"tier": 1}'
```

**Example: Tier 0 E-VAL score**

```bash
curl -X POST http://localhost:8002/api/scan/entity/0456789012 \
  -H "Content-Type: application/json" \
  -d '{"tier": 0}'
```

**Example: Tier 2 standard scan**

```bash
curl -X POST http://localhost:8002/api/scan/entity/0456789012 \
  -H "Content-Type: application/json" \
  -d '{"tier": 2}'
```

**Example: Tier 3 full investigation**

```bash
curl -X POST http://localhost:8002/api/scan/entity/0456789012 \
  -H "Content-Type: application/json" \
  -d '{"tier": 3}'
```

---

## Get Scan Results

```
GET /api/scan/entity/{reg_number}/results
```

Returns the scan history for an entity, retrieved from the graph database. Results are ordered by scan date, with the most recent first. Includes results from all tiers.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `reg_number` | string | Belgian enterprise/registration number |

**Response** `200`

```json
[
  {
    "scan_id": "scan-0456789012-t2-20260227143055",
    "registration_number": "0456789012",
    "tier": 2,
    "risk_tier": "amber",
    "confidence": 0.9,
    "eval_score": 0.15,
    "scanned_at": "2026-02-27T14:30:55Z",
    "flags": ["SANCTIONS_FUZZY", "ADVERSE_MEDIA_FOUND"],
    "scan_cost_cents": 6
  },
  {
    "scan_id": "scan-0456789012-t1-20260225100000",
    "registration_number": "0456789012",
    "tier": 1,
    "risk_tier": "green",
    "confidence": 0.8,
    "eval_score": 0.1,
    "scanned_at": "2026-02-25T10:00:00Z",
    "flags": [],
    "scan_cost_cents": 1
  }
]
```

Returns an empty array `[]` if no scans exist for the entity.

**Example**

```bash
curl http://localhost:8002/api/scan/entity/0456789012/results
```

---

## Escalate Scan

```
POST /api/scan/entity/{reg_number}/escalate
```

Escalates an entity to a higher scan tier. Typically used when a lower-tier scan reveals risk signals that warrant deeper investigation. Tier 1 escalation forces a fresh scan (bypasses cache).

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `reg_number` | string | Belgian enterprise/registration number |

**Request Body**

```json
{
  "target_tier": 2
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `target_tier` | integer | Yes | Target tier to escalate to: `1`, `2`, or `3` |

**Response** `200`

- **Target tier 1**: Returns a `ScanResult` (fresh, bypasses cache)
- **Target tier 2**: Returns a `ScanResult` with adverse media and synthesis
- **Target tier 3**: Returns a case creation payload (same as Tier 3 in Scan Entity)

**Example: Escalate to Tier 2**

```bash
curl -X POST http://localhost:8002/api/scan/entity/0456789012/escalate \
  -H "Content-Type: application/json" \
  -d '{"target_tier": 2}'
```

**Example: Escalate to full investigation**

```bash
curl -X POST http://localhost:8002/api/scan/entity/0456789012/escalate \
  -H "Content-Type: application/json" \
  -d '{"target_tier": 3}'
```

:::info
Escalating to Tier 3 creates a full compliance case with a Temporal workflow. This is a significant action -- the entity will appear in the officer dashboard as a new case requiring document collection and review.
:::

---

## Scan Portfolio

```
POST /api/scan/portfolio
```

Submits a batch of entities for parallel Tier 1 scanning. Entities are scanned concurrently (up to 20 in parallel) with rate limiting. Results are persisted to the graph database and linked to a portfolio node.

**Request Body**

```json
{
  "name": "Q1 2026 PSP Merchants",
  "registration_numbers": [
    "0456789012",
    "0567890123",
    "0678901234"
  ],
  "segment_id": "psp-merchants-eu"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Human-readable portfolio name |
| `registration_numbers` | string[] | Yes | List of registration numbers to scan |
| `segment_id` | string | No | Optional segment identifier for categorization |

**Response** `200`

```json
{
  "portfolio_id": "portfolio-a1b2c3d4e5f6",
  "portfolio_name": "Q1 2026 PSP Merchants",
  "total_entities": 3,
  "scanned": 3,
  "failed": 0,
  "summary": {
    "green": 2,
    "amber": 1,
    "red": 0
  },
  "results": [
    {
      "scan_id": "scan-0456789012-t1-20260227143022",
      "registration_number": "0456789012",
      "tier": 1,
      "risk_tier": "green",
      "confidence": 0.8,
      "eval_score": 0.1,
      "company_status": "active",
      "legal_name": "Acme Trading BVBA",
      "nace_codes": ["47.19"],
      "director_count": 2,
      "ubo_count": 0,
      "sanctions_exact_matches": 0,
      "sanctions_fuzzy_matches": 0,
      "peppol_registered": true,
      "withholding_obligations": false,
      "tax_debt_detected": false,
      "social_debt_detected": false,
      "adverse_media_hits": 0,
      "adverse_media_summary": "",
      "synthesis_summary": "",
      "flags": [],
      "scan_cost_cents": 1,
      "scanned_at": "2026-02-27T14:30:22Z",
      "cached": false
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `portfolio_id` | string | Unique portfolio identifier (format: `portfolio-{hex}`) |
| `portfolio_name` | string | The submitted portfolio name |
| `total_entities` | integer | Total number of registration numbers submitted |
| `scanned` | integer | Number of entities successfully scanned |
| `failed` | integer | Number of entities that failed to scan |
| `summary` | object | Risk tier distribution: counts of `green`, `amber`, and `red` |
| `results` | ScanResult[] | Array of individual scan results (Tier 1 schema) |

**Example**

```bash
curl -X POST http://localhost:8002/api/scan/portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2026 PSP Merchants",
    "registration_numbers": ["0456789012", "0567890123", "0678901234"],
    "segment_id": "psp-merchants-eu"
  }'
```

:::info
Portfolio scans always run at Tier 1. Entities flagged as `amber` or `red` can be individually escalated to higher tiers using the [Escalate Scan](#escalate-scan) endpoint.
:::

---

## Get Portfolio Results

```
GET /api/scan/portfolio/{portfolio_id}/results
```

Returns the scan results for all entities in a portfolio, retrieved from the graph database. This is useful for retrieving results after the initial batch scan or for checking updated results after individual entity escalations.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `portfolio_id` | string | Portfolio identifier (returned by the Scan Portfolio endpoint) |

**Response** `200`

```json
{
  "portfolio_id": "portfolio-a1b2c3d4e5f6",
  "results": [
    {
      "scan_id": "scan-0456789012-t1-20260227143022",
      "registration_number": "0456789012",
      "tier": 1,
      "risk_tier": "green",
      "scanned_at": "2026-02-27T14:30:22Z"
    },
    {
      "scan_id": "scan-0567890123-t1-20260227143023",
      "registration_number": "0567890123",
      "tier": 1,
      "risk_tier": "amber",
      "scanned_at": "2026-02-27T14:30:23Z"
    }
  ]
}
```

Returns an empty `results` array if the portfolio has no scan results.

**Example**

```bash
curl http://localhost:8002/api/scan/portfolio/portfolio-a1b2c3d4e5f6/results
```
