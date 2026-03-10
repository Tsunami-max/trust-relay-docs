---
sidebar_position: 15
title: "Regulatory Radar API"
---

# Regulatory Radar API

Pillar 5 endpoints for the regulatory knowledge base, compliance timeline, and impact analysis. The Regulatory Radar tracks EU and national regulations, their individual articles and obligations, upcoming compliance deadlines, and the compounding regulatory burden on specific verticals and jurisdictions.

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/regulatory/regulations` | List regulations |
| `GET` | `/api/regulatory/regulations/{regulation_id}` | Get regulation detail |
| `GET` | `/api/regulatory/articles` | List or search articles |
| `GET` | `/api/regulatory/articles/{article_id}` | Get article with obligations |
| `GET` | `/api/regulatory/timeline` | Regulatory timeline entries |
| `GET` | `/api/regulatory/calendar` | Upcoming compliance deadlines |
| `GET` | `/api/regulatory/compounding-impact` | Aggregate regulatory burden |
| `GET` | `/api/regulatory/stats` | Knowledge base statistics |
| `POST` | `/api/regulatory/changes` | Register a regulatory change |
| `GET` | `/api/regulatory/changes` | List recent changes |
| `GET` | `/api/regulatory/impact/{change_id}` | Analyze change impact |

---

## Regulations

### List Regulations

```
GET /api/regulatory/regulations
```

Returns all tracked regulations with optional filters.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | string | No | Filter by regulation status |
| `vertical` | string | No | Filter by industry vertical |
| `country` | string | No | Filter by country code |

**Response** `200`

```json
[
  {
    "id": "eu_ai_act",
    "name": "EU AI Act",
    "status": "enacted",
    "vertical": "all",
    "country": "EU",
    "effective_date": "2026-08-01",
    "article_count": 85
  }
]
```

### Get Regulation Detail

```
GET /api/regulatory/regulations/{regulation_id}
```

Returns full detail for a single regulation.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `regulation_id` | string | Yes | Regulation identifier |

**Status Codes:**

- `200` -- Success
- `404` -- Regulation not found

---

## Articles

### List or Search Articles

```
GET /api/regulatory/articles
```

Returns articles with optional filters, or performs a text search when the `q` parameter is provided.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `regulation_id` | string | No | Filter by parent regulation |
| `vertical` | string | No | Filter by industry vertical |
| `country` | string | No | Filter by country code |
| `status` | string | No | Filter by article status |
| `severity` | string | No | Filter by severity level |
| `q` | string | No | Full-text search query (overrides other filters) |

**Response** `200`

```json
[
  {
    "id": "eu_ai_act_art12",
    "regulation_id": "eu_ai_act",
    "article_number": "12",
    "title": "Record-keeping",
    "summary": "Automatic logging of high-risk AI system operations",
    "severity": "high",
    "status": "active"
  }
]
```

### Get Article with Obligations

```
GET /api/regulatory/articles/{article_id}
```

Returns full article detail including its associated compliance obligations.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `article_id` | string | Yes | Article identifier |

**Status Codes:**

- `200` -- Success
- `404` -- Article not found

---

## Timeline and Calendar

### Get Regulatory Timeline

```
GET /api/regulatory/timeline
```

Returns regulatory timeline entries showing key dates (enactment, enforcement, transitional deadlines) for tracked regulations.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `vertical` | string | No | Filter by industry vertical |
| `country` | string | No | Filter by country code |
| `from_date` | date | No | Start of date range (ISO 8601) |
| `to_date` | date | No | End of date range (ISO 8601) |

**Response** `200`

```json
[
  {
    "date": "2026-08-01",
    "regulation_id": "eu_ai_act",
    "event_type": "enforcement_start",
    "title": "EU AI Act full enforcement begins",
    "description": "All high-risk AI system requirements become enforceable"
  }
]
```

### Get Compliance Calendar

```
GET /api/regulatory/calendar
```

Returns upcoming compliance deadlines for the next N months, ordered chronologically.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `months_ahead` | integer | No | Lookahead window in months (default: `12`, min: `1`, max: `60`) |

**Response** `200`

Returns an array of calendar entries with dates and descriptions.

---

## Compounding Impact

### Get Compounding Impact

```
GET /api/regulatory/compounding-impact
```

Calculates the aggregate regulatory burden for a specific vertical and country combination. Shows how multiple overlapping regulations compound compliance requirements.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `vertical` | string | Yes | Industry vertical (e.g., `psp_merchant_onboarding`) |
| `country` | string | Yes | ISO country code |

**Response** `200`

```json
{
  "vertical": "psp_merchant_onboarding",
  "country": "BE",
  "total_obligations": 47,
  "regulations_applicable": 5,
  "burden_score": 72,
  "overlapping_requirements": [
    {
      "requirement": "Customer due diligence",
      "regulations": ["6AMLD", "DORA", "PSD2"]
    }
  ]
}
```

---

## Statistics

### Get Regulatory Stats

```
GET /api/regulatory/stats
```

Returns dashboard summary statistics for the regulatory knowledge base.

**Response** `200`

```json
{
  "total_regulations": 12,
  "total_articles": 340,
  "active_articles": 285,
  "upcoming_deadlines": 8,
  "verticals_covered": 4,
  "countries_covered": 6
}
```

---

## Change Management

### Register a Regulatory Change

```
POST /api/regulatory/changes
```

Registers a new regulatory change (e.g., amendment, new guidance, threshold update) for tracking and impact analysis.

**Request Body:**

```json
{
  "article_id": "eu_ai_act_art12",
  "change_type": "amendment",
  "description": "Extended logging retention from 6 months to 5 years",
  "effective_date": "2026-09-01",
  "old_value": "6 months retention",
  "new_value": "5 years retention",
  "source_url": "https://eur-lex.europa.eu/..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `article_id` | string | Yes | Article affected by the change |
| `change_type` | string | Yes | Type of change (e.g., `amendment`, `guidance`, `threshold`) |
| `description` | string | Yes | Human-readable description |
| `effective_date` | date | Yes | When the change takes effect |
| `old_value` | string | No | Previous requirement text |
| `new_value` | string | No | Updated requirement text |
| `source_url` | string | No | Link to official source |

**Response** `200`

Returns the created change record.

### List Recent Changes

```
GET /api/regulatory/changes
```

Returns recently registered regulatory changes.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `limit` | integer | No | Maximum results (default: `50`, min: `1`, max: `200`) |

**Response** `200`

Returns an array of change records ordered by registration date.

### Analyze Change Impact

```
GET /api/regulatory/impact/{change_id}
```

Performs impact analysis for a specific regulatory change, identifying affected cases, templates, and compliance processes.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `change_id` | string | Yes | Change record identifier |

**Response** `200`

Returns an impact analysis object with affected areas and recommended actions.
