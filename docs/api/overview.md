---
sidebar_position: 1
title: "API Overview"
---

# API Overview

The Trust Relay backend exposes a REST API built on FastAPI (Python). All endpoints return JSON unless otherwise noted.

## Base URL

```
http://localhost:8002
```

Production deployments will use HTTPS behind a reverse proxy. The base URL is configurable via the `PORTAL_BASE_URL` environment variable.

## Authentication

Trust Relay uses three authentication models depending on the endpoint group:

| Endpoint Group | Auth Method | Details |
|---|---|---|
| **Case Management** (`/api/cases/*`) | None (PoC) | Officer endpoints are unauthenticated in the PoC. Production will add JWT/session auth. |
| **Customer Portal** (`/api/portal/*`) | Portal token | Each case generates a unique `portal_token` embedded in the portal URL. The token is the path parameter itself. |
| **PEPPOL Verification** (`/v1/peppol/*`) | API key | `X-API-Key` header required. Keys are configured server-side with rate limits and requestor identity. |
| **Feature Config** (`/api/config/*`) | None | Public read-only endpoint. |

## Content Types

- **Request bodies**: `application/json` for all endpoints except file upload (`multipart/form-data`)
- **Response bodies**: `application/json` for all endpoints except report download (`application/pdf`)
- **SSE streams**: `text/event-stream` for the AG-UI agent endpoint

## Error Format

All error responses follow a consistent shape:

```json
{
  "detail": "Human-readable error message"
}
```

HTTP status codes used:

| Code | Meaning |
|---|---|
| `400` | Bad request (invalid input, workflow in wrong state) |
| `404` | Resource not found (case, workflow, or verification) |
| `413` | File too large (max 20MB for uploads) |
| `422` | Validation error (missing required fields, wrong file type) |
| `429` | Rate limit exceeded (PEPPOL endpoints only) |
| `503` | Upstream service unavailable (KBO, VIES, etc.) |

## Endpoint Groups

### [Case Management](/docs/api/cases)

Officer-facing endpoints for creating cases, viewing case details, submitting decisions, and managing the compliance workflow lifecycle.

**Prefix**: `/api/cases`

Key operations:
- Create and list compliance cases
- View case details with full Temporal workflow state
- Submit officer decisions (approve, reject, follow-up, escalate)
- Download PDF compliance reports
- View evidence chains and company profiles

### [Customer Portal](/docs/api/portal)

Customer-facing endpoints accessed via branded portal URLs. Customers upload documents, answer questions, and submit their compliance packages.

**Prefix**: `/api/portal`

Key operations:
- Retrieve portal state (required documents, questions, follow-up tasks)
- Upload documents to MinIO storage
- Submit completed document packages

### [PEPPOL and External APIs](/docs/api/webhooks)

Partner-facing endpoints for PEPPOL enterprise verification and system configuration.

**Prefix**: `/v1/peppol` and `/api/config`

Key operations:
- Run PEPPOL identity verification (synchronous or webhook)
- Retrieve evidence bundles
- Query feature flags

## Rate Limiting

PEPPOL endpoints enforce per-API-key rate limits. The current PoC implementation uses in-memory counters (reset on process restart). Production will use Redis or an API gateway.

| Tier | Requests/minute |
|---|---|
| Default | 60 |
| Elevated | 300 |

## Temporal Workflow State

Many case endpoints query Temporal workflow state in real-time via the `get_status` query. This means:

- Case status returned by the API reflects the **live workflow state**, not just the database snapshot.
- If the Temporal server is unreachable, endpoints gracefully fall back to the database record.
- Investigation results, follow-up tasks, and audit logs are stored in Temporal workflow state and returned via queries.

:::info
The Temporal query approach means the API is eventually consistent with the workflow. State transitions that are in-progress (e.g., document processing) are reflected immediately in the query response.
:::
