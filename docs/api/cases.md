---
sidebar_position: 2
title: "Cases API"
---

# Case Management API

Officer-facing endpoints for managing compliance cases throughout their lifecycle. All endpoints are under the `/api` prefix.

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/countries` | List supported countries |
| `GET` | `/api/templates` | List workflow templates |
| `POST` | `/api/cases` | Create a new compliance case |
| `GET` | `/api/cases` | List all cases |
| `GET` | `/api/cases/{workflow_id}` | Get full case detail |
| `GET` | `/api/cases/{workflow_id}/ai-brief` | Get AI-generated case brief |
| `GET` | `/api/cases/{workflow_id}/audit` | Get audit log |
| `POST` | `/api/cases/{workflow_id}/decision` | Submit officer decision |
| `POST` | `/api/cases/{workflow_id}/regenerate-tasks` | Re-run task generation |
| `POST` | `/api/cases/{workflow_id}/mcc-decision` | Submit MCC classification decision |
| `POST` | `/api/cases/{workflow_id}/reclassify-mcc` | Re-run MCC classification |
| `GET` | `/api/cases/{workflow_id}/documents` | List case documents |
| `GET` | `/api/cases/{workflow_id}/documents/download` | Download a document |
| `GET` | `/api/cases/{workflow_id}/evidence` | Get evidence chain |
| `GET` | `/api/cases/{workflow_id}/company-profile` | Get company profile |
| `GET` | `/api/cases/{workflow_id}/report` | Download PDF compliance report |
| `GET` | `/api/cases/{workflow_id}/responses` | Get customer follow-up responses |
| `DELETE` | `/api/cases/{workflow_id}` | Delete case (cleanup) |

---

## List Countries

```
GET /api/countries
```

Returns the list of supported EEA countries for case creation.

**Response** `200`

```json
[
  { "code": "BE", "name": "Belgium" },
  { "code": "NL", "name": "Netherlands" },
  { "code": "DE", "name": "Germany" }
]
```

---

## List Templates

```
GET /api/templates
```

Returns available workflow templates that define document requirements and questions.

**Response** `200`

```json
[
  {
    "id": "psp_merchant_onboarding",
    "name": "PSP Merchant Onboarding",
    "description": "Standard KYB onboarding for payment service provider merchants",
    "document_count": 5,
    "question_count": 3
  }
]
```

---

## Create Case

```
POST /api/cases
```

Creates a new compliance case, starts a Temporal workflow, and returns the portal URL for the customer.

At creation time, the system runs concurrent pre-enrichment lookups (VIES, NorthData, Crunchbase, website validation) with a 10-second global timeout. Results are stored in the company profile and passed to the workflow.

**Request Body**

```json
{
  "company_name": "Acme Trading BVBA",
  "company_registration_number": "0456789012",
  "vat_number": "BE0456789012",
  "country": "BE",
  "template_id": "psp_merchant_onboarding",
  "website_url": "https://acme-trading.be",
  "additional_data": {}
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `company_name` | string | Yes | Legal company name |
| `company_registration_number` | string | No | National registration number. At least one of this or `vat_number` is required. |
| `vat_number` | string | No | VAT number (e.g., `BE0456789012`). For Belgian companies, the registration number is derived from this if not provided. |
| `country` | string | Yes | ISO 3166-1 alpha-2 country code. Must be a supported EEA country. |
| `template_id` | string | No | Workflow template ID. Defaults to `psp_merchant_onboarding`. |
| `website_url` | string | No | Company website URL. Validated and normalized (https:// prepended if missing). |
| `additional_data` | object | No | Arbitrary metadata passed to the workflow. |

**Response** `201`

```json
{
  "case_id": "case_a1b2c3d4e5f6",
  "workflow_id": "wf_f6e5d4c3b2a1",
  "status": "AWAITING_DOCUMENTS",
  "portal_token": "pt_1234567890abcdef",
  "portal_url": "http://localhost:3001/portal/pt_1234567890abcdef",
  "vies_enrichment": {
    "vies_valid": true,
    "vies_name": "ACME TRADING",
    "vies_address": "RUE DE LA LOI 1, 1000 BRUXELLES"
  },
  "northdata_enrichment": {
    "found": true,
    "company_name": "Acme Trading BVBA",
    "directors": ["Jan Peeters"]
  },
  "crunchbase_enrichment": null,
  "website_validation": {
    "url": "https://acme-trading.be",
    "accessible": true,
    "status_code": 200
  },
  "created_at": "2026-02-24T10:30:00Z"
}
```

:::info
Pre-enrichment results (`vies_enrichment`, `northdata_enrichment`, `crunchbase_enrichment`, `website_validation`) are best-effort. Any that fail or timeout are returned as `null`.
:::

---

## List Cases

```
GET /api/cases
```

Returns all compliance cases with real-time status from Temporal.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `status` | string | Filter by case status (e.g., `REVIEW_PENDING`, `APPROVED`) |

**Response** `200`

```json
{
  "cases": [
    {
      "case_id": "case_a1b2c3d4e5f6",
      "workflow_id": "wf_f6e5d4c3b2a1",
      "company_name": "Acme Trading BVBA",
      "country": "BE",
      "status": "REVIEW_PENDING",
      "current_iteration": 1,
      "created_at": "2026-02-24T10:30:00Z",
      "updated_at": "2026-02-24T11:45:00Z",
      "latest_risk_score": 0.42
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 50
}
```

The `status` field reflects the live Temporal workflow state, not the database snapshot. If Temporal is unreachable, the database status is used as fallback.

---

## Get Case Detail

```
GET /api/cases/{workflow_id}
```

Returns the full case record including workflow state, investigation results, follow-up tasks, MCC classification, and audit log.

**Response** `200`

```json
{
  "case_id": "case_a1b2c3d4e5f6",
  "workflow_id": "wf_f6e5d4c3b2a1",
  "status": "REVIEW_PENDING",
  "company_name": "Acme Trading BVBA",
  "company_registration_number": "0456789012",
  "country": "BE",
  "template_id": "psp_merchant_onboarding",
  "current_iteration": 1,
  "max_iterations": 5,
  "portal_token": "pt_1234567890abcdef",
  "portal_url": "http://localhost:3001/portal/pt_1234567890abcdef",
  "documents": [],
  "follow_up_tasks": [],
  "investigation_results": [
    {
      "iteration": 1,
      "risk_score": 0.42,
      "findings": [],
      "discrepancies": [],
      "summary": "Investigation complete."
    }
  ],
  "generated_tasks": [],
  "mcc_classification": {
    "primary_recommendation": {
      "mcc_code": "5411",
      "description": "Grocery Stores, Supermarkets"
    },
    "risk_tier": "low",
    "risk_flags": []
  },
  "validation_results": [],
  "audit_log": [
    {
      "event": "CASE_CREATED",
      "timestamp": "2026-02-24T10:30:00Z"
    }
  ],
  "created_at": "2026-02-24T10:30:00Z",
  "updated_at": "2026-02-24T11:45:00Z"
}
```

---

## Get AI Brief

```
GET /api/cases/{workflow_id}/ai-brief
```

Returns a deterministic (non-LLM) summary of the case's risk profile, trend analysis, key signals, and recommended action.

**Response** `200`

```json
{
  "summary": "Acme Trading BVBA presents LOW risk (0.25) after initial investigation. All checks passed with no discrepancies.",
  "risk_trend": "STABLE",
  "risk_scores": [0.25],
  "key_signals": [
    "3 findings, 0 unresolved discrepancies"
  ],
  "recommended_action": "approve",
  "generated_at": "2026-02-24T12:00:00Z"
}
```

| Field | Values |
|---|---|
| `risk_trend` | `IMPROVING`, `STABLE`, `WORSENING`, `INSUFFICIENT_DATA` |
| `recommended_action` | `approve`, `follow_up`, `escalate` |

---

## Submit Officer Decision

```
POST /api/cases/{workflow_id}/decision
```

Submits the compliance officer's decision on a case. This sends a Temporal signal to the workflow.

**Request Body**

```json
{
  "decision": "follow_up",
  "reason": "Address discrepancy needs clarification",
  "follow_up_tasks": [
    {
      "description": "Please provide a utility bill confirming your registered address",
      "response_type": "document",
      "document_type": "utility_bill",
      "required": true
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `decision` | string | Yes | One of: `approve`, `reject`, `follow_up`, `escalate` |
| `reason` | string | No | Officer's justification for the decision |
| `follow_up_tasks` | array | No | Required when decision is `follow_up`. List of tasks for the customer. |

**Follow-up task fields:**

| Field | Type | Description |
|---|---|---|
| `description` | string | Task description shown to customer |
| `response_type` | string | `text`, `document`, or `yes_no` |
| `document_type` | string | Document category (for `document` response type) |
| `required` | boolean | Whether the task is mandatory |

**Response** `200`

```json
{
  "status": "FOLLOW_UP_REQUIRED",
  "message": "Follow-up request sent to customer portal"
}
```

---

## Regenerate Tasks

```
POST /api/cases/{workflow_id}/regenerate-tasks
```

Re-runs the AI task generation agent on the current investigation results. Only available when status is `REVIEW_PENDING`.

**Response** `200`

```json
{
  "tasks": [
    {
      "description": "Confirm the discrepancy in registered address",
      "response_type": "text",
      "required": true,
      "justification": "KBO shows different address than submitted documents"
    }
  ],
  "reasoning": "Address discrepancy detected between official registry and uploaded documents."
}
```

---

## Submit MCC Decision

```
POST /api/cases/{workflow_id}/mcc-decision
```

Officer submits their decision on the AI-generated MCC (Merchant Category Code) classification.

**Request Body**

```json
{
  "action": "accept",
  "notes": "MCC classification looks correct"
}
```

| Field | Type | Values | Description |
|---|---|---|---|
| `action` | string | `accept`, `reject`, `override` | Decision on the MCC classification |
| `override_mcc` | string | -- | New MCC code (required when action is `override`) |
| `notes` | string | -- | Officer notes |

---

## Reclassify MCC

```
POST /api/cases/{workflow_id}/reclassify-mcc
```

Re-runs the MCC classification agent with optional officer feedback. Only available when status is `REVIEW_PENDING`.

**Request Body**

```json
{
  "notes": "This company primarily sells electronics, not groceries"
}
```

---

## List Documents

```
GET /api/cases/{workflow_id}/documents
```

Returns all documents uploaded for this case across all iterations, sourced from MinIO.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `source` | string | Filter by `customer` (uploaded files only) or `all` (includes system-generated) |

---

## Download Document

```
GET /api/cases/{workflow_id}/documents/download?key={minio_key}
```

Downloads a specific document from MinIO storage.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `key` | string | The MinIO object key (returned in document listings) |

**Response**: Binary file content with appropriate `Content-Type` header.

---

## Get Evidence Chain

```
GET /api/cases/{workflow_id}/evidence
```

Returns the evidence chain for the case, including Belgian evidence records with source URLs, timestamps, SHA-256 hashes, and raw data.

**Response** `200`

```json
{
  "evidence": [
    {
      "id": "ev_abc123",
      "source": "KBO/BCE",
      "source_url": "https://kbopub.economie.fgov.be/...",
      "data_hash": "sha256:a1b2c3...",
      "collected_at": "2026-02-24T10:31:00Z",
      "raw_data": { }
    }
  ],
  "bundle_hash": "sha256:d4e5f6..."
}
```

---

## Get Company Profile

```
GET /api/cases/{workflow_id}/company-profile
```

Returns the aggregated company profile with sourced facts from all enrichment sources. Each fact tracks its source, timestamp, and evidence hash. Discrepancies between sources are flagged.

**Response** `200`

```json
{
  "case_id": "case_a1b2c3d4e5f6",
  "facts": {
    "company_name": [
      { "value": "Acme Trading BVBA", "source": "officer_input", "timestamp": "2026-02-24T10:30:00Z" },
      { "value": "ACME TRADING", "source": "EU VIES", "timestamp": "2026-02-24T10:30:01Z", "evidence_hash": "sha256:..." }
    ]
  },
  "discrepancies": [],
  "evidence_refs": [
    { "source": "EU VIES", "evidence_hash": "sha256:...", "storage": "minio:case_abc/evidence/vies.json" }
  ]
}
```

---

## Download PDF Report

```
GET /api/cases/{workflow_id}/report
```

Generates and downloads a PDF compliance report. Only available for cases with status `APPROVED` or `REJECTED`.

**Response**: `application/pdf` binary content with `Content-Disposition` header.

**Error** `400`: If the case is not in a terminal status.

---

## Get Customer Responses

```
GET /api/cases/{workflow_id}/responses
```

Returns customer responses to follow-up tasks, sourced from the `task_responses.json` file in MinIO.

---

## Delete Case

```
DELETE /api/cases/{workflow_id}
```

Deletes a case and all associated data. This:

1. Terminates the Temporal workflow
2. Purges all MinIO objects under the case prefix
3. Deletes all database records (audit events, MCC classifications, PEPPOL verifications, Belgian evidence, agent executions, and the case itself)

:::warning
This is a destructive operation intended for development and testing. There is no undo.
:::

**Response** `200`

```json
{
  "status": "deleted",
  "workflow_id": "wf_f6e5d4c3b2a1"
}
```
