---
sidebar_position: 6
title: "Memory API"
---

# Memory API

Compliance memory system endpoints for signal capture, system status, state management, memory block CRUD, archival passage operations, and confidence scoring. The memory system captures officer interaction signals and (optionally) stores them in Letta archival memory for RAG-based agent personalization.

All memory endpoints are under the `/api` prefix.

## Endpoints Summary

| Method | Path | Status | Description |
|---|---|---|---|
| `POST` | `/api/cases/{workflow_id}/signals` | 202 | Capture an officer action signal |
| `GET` | `/api/memory/status` | 200 | Memory system status and signal statistics |
| `POST` | `/api/memory/reset` | 200 | Reset all memory state (demo/showcase only) |
| `GET` | `/api/memory/case/{workflow_id}` | 200 | Memory story for a specific case |
| `GET` | `/api/memory/blocks/{officer_id}/{label}` | 200 | Read a memory block |
| `PUT` | `/api/memory/blocks/{officer_id}/{label}` | 200 | Update a memory block |
| `GET` | `/api/memory/passages/{officer_id}` | 200 | List archival memory passages |
| `POST` | `/api/memory/passages/{officer_id}/search` | 200 | Semantic search over archival passages |
| `DELETE` | `/api/memory/passages/{officer_id}/{passage_id}` | 200 | Delete a specific passage |
| `GET` | `/api/memory/confidence/{officer_id}` | 200 | Calculate memory confidence score |
| `GET` | `/api/memory/company-context` | 200 | Get company context configuration |
| `PUT` | `/api/memory/company-context` | 200 | Update company context configuration |

---

## Capture Signal

```
POST /api/cases/{workflow_id}/signals
```

Captures an officer action signal for the compliance memory system. The signal is classified deterministically, persisted to PostgreSQL, and (if Letta is enabled) asynchronously ingested into the officer's archival memory.

This endpoint always returns 202 -- signal capture is best-effort and non-blocking. Failures in classification, persistence, or Letta ingestion are logged but never propagated to the caller.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `workflow_id` | string | The workflow/case identifier |

**Request Body**

```json
{
  "signal_type": "case_approved",
  "source_component": "DecisionActions",
  "iteration": 1,
  "officer_id": "officer-001",
  "context_data": {
    "decision": "approve",
    "reason": "All documents verified, no adverse findings"
  }
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `signal_type` | string | Yes | -- | Signal type identifier (see [Signal Types](#signal-types)) |
| `source_component` | string | Yes | -- | UI component that generated the signal |
| `iteration` | integer | No | `1` | Current case iteration number |
| `officer_id` | string | No | `""` | Officer identifier (used for per-officer Letta agents) |
| `context_data` | object | No | `{}` | Arbitrary JSON context payload for the signal |

**Response** `202`

```json
{
  "status": "captured",
  "signal_category": "judgment",
  "safety_class": "non_suppressible"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"captured"` |
| `signal_category` | string | Classified category: `judgment`, `preference`, or `behavioral` |
| `safety_class` | string | Safety classification: `non_suppressible` or `preference_only` |

**Example: Capture a case approval signal**

```bash
curl -X POST http://localhost:8002/api/cases/wf_abc123/signals \
  -H "Content-Type: application/json" \
  -d '{
    "signal_type": "case_approved",
    "source_component": "DecisionActions",
    "iteration": 1,
    "officer_id": "officer-001",
    "context_data": {"decision": "approve", "reason": "Clean KYB"}
  }'
```

**Example: Capture a task dismissal signal**

```bash
curl -X POST http://localhost:8002/api/cases/wf_abc123/signals \
  -H "Content-Type: application/json" \
  -d '{
    "signal_type": "suggestion_dismissed",
    "source_component": "FollowUpTasks",
    "iteration": 2,
    "officer_id": "officer-001",
    "context_data": {"task_id": "task_xyz", "finding_id": "minor-address-mismatch"}
  }'
```

### Signal Types

Signals are classified into three categories based on their type:

**Judgment signals** (`non_suppressible`)

| Signal Type | Trigger |
|---|---|
| `suggestion_dismissed` | Officer dismisses an AI-suggested follow-up task |
| `case_approved` | Officer approves a case |
| `case_rejected` | Officer rejects a case |
| `case_escalated` | Officer escalates a case |
| `followup_requested` | Officer requests follow-up iteration |
| `finding_overridden` | Officer overrides an OSINT finding |
| `risk_level_changed` | Officer changes the risk level assessment |

**Preference signals** (`preference_only`)

| Signal Type | Trigger |
|---|---|
| `suggestion_accepted` | Officer accepts an AI-suggested task |
| `suggestion_modified` | Officer modifies an AI-suggested task before accepting |
| `custom_task_added` | Officer creates a custom follow-up task |
| `chat_correction` | Officer corrects AI assistant in chat |
| `chat_positive_feedback` | Officer gives positive feedback to AI assistant |
| `template_customized` | Officer customizes a workflow template |

**Behavioral signals** (`preference_only`)

| Signal Type | Trigger |
|---|---|
| `section_time_spent` | Time spent viewing a report section |
| `report_section_expanded` | Officer expands a report section for detail |
| `evidence_downloaded` | Officer downloads evidence artifacts |
| `chat_question` | Officer asks a question in AI assistant chat |

Unknown signal types are classified as `("behavioral", "preference_only")`.

---

## Memory Status

```
GET /api/memory/status
```

Returns the current state of the compliance memory system, including feature flag status, signal statistics, category breakdown, recent signals, and Letta connection status.

This endpoint always returns 200, even when the database or Letta is unreachable (returns default/zero values).

**Response** `200`

```json
{
  "signal_capture_enabled": true,
  "letta_enabled": false,
  "signals": {
    "total": 42,
    "by_category": {
      "judgment": 15,
      "preference": 20,
      "behavioral": 7
    },
    "recent": [
      {
        "signal_type": "case_approved",
        "category": "judgment",
        "safety_class": "non_suppressible",
        "source": "DecisionActions",
        "created_at": "2026-03-01T14:30:00+00:00"
      }
    ]
  },
  "letta": {
    "connected": false,
    "officer_agents": 0
  }
}
```

| Field | Type | Description |
|---|---|---|
| `signal_capture_enabled` | boolean | Whether signal capture is active (config flag) |
| `letta_enabled` | boolean | Whether Letta memory is enabled (config flag) |
| `signals.total` | integer | Total number of signal events in the database |
| `signals.by_category` | object | Signal count per category (`judgment`, `preference`, `behavioral`) |
| `signals.recent` | array | Last 10 signals ordered by creation time (most recent first) |
| `signals.recent[].signal_type` | string | The signal type identifier |
| `signals.recent[].category` | string | Signal category |
| `signals.recent[].safety_class` | string | Safety classification |
| `signals.recent[].source` | string | Source UI component |
| `signals.recent[].created_at` | string | ISO 8601 timestamp |
| `letta.connected` | boolean | Whether the Letta client is connected and functional |
| `letta.officer_agents` | integer | Number of officer agents currently cached |

**Example**

```bash
curl http://localhost:8002/api/memory/status
```

:::info
When the database is unreachable, the response still returns 200 with `signals.total = 0`, `signals.by_category = {}`, and `signals.recent = []`. This is by design -- the status endpoint is intended for debugging and demos and should never fail.
:::

---

## Memory Reset

```
POST /api/memory/reset
```

Resets all compliance memory state. This endpoint is intended for demo showcases where the operator needs to clear state between demonstrations.

Clears:
1. All rows from the `signal_events` PostgreSQL table
2. The in-memory Letta agent cache (does not delete Letta agents from the server)

**Response** `200`

```json
{
  "status": "reset_complete",
  "cleared": {
    "signal_events": 42,
    "letta_agents": 2
  }
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"reset_complete"` |
| `cleared.signal_events` | integer | Number of signal events deleted from PostgreSQL |
| `cleared.letta_agents` | integer | Number of officer agent entries cleared from the in-memory cache |

**Example**

```bash
curl -X POST http://localhost:8002/api/memory/reset
```

:::caution
This endpoint deletes all signal event data from the database. It is intended for demo and showcase purposes only. In production, consider implementing soft-delete or archival instead of hard deletion.
:::

---

## Case Memory

```
GET /api/memory/case/{workflow_id}
```

Returns the complete memory story for a specific case: all signals, AI context used during investigation, and sync status.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `workflow_id` | string | The workflow/case identifier |

**Response** `200`

```json
{
  "workflow_id": "wf_abc123",
  "signals": {
    "total": 5,
    "by_category": {
      "judgment": 3,
      "preference": 2
    },
    "items": [
      {
        "signal_type": "case_approved",
        "category": "judgment",
        "safety_class": "non_suppressible",
        "source": "DecisionActions",
        "letta_synced": true,
        "created_at": "2026-03-01T14:30:00+00:00"
      }
    ]
  },
  "ai_context": {
    "rules_applied": 3,
    "passages_matched": 5,
    "confidence_at_review": null,
    "synthesis_summary": "Company has clean KBO records...",
    "model_used": "openai/gpt-4o"
  },
  "learned": {
    "total_captured": 5,
    "synced_to_letta": 4,
    "pending_sync": 1,
    "categories": {
      "judgment": 3,
      "preference": 2
    }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `workflow_id` | string | The queried workflow ID |
| `signals.total` | integer | Total signals for this case |
| `signals.by_category` | object | Category breakdown |
| `signals.items` | array | All signals in chronological order |
| `signals.items[].letta_synced` | boolean | Whether this signal has been synced to Letta |
| `ai_context.rules_applied` | integer | Number of learned rules from `learned_procedures` block |
| `ai_context.passages_matched` | integer | Number of archival passages matching this case |
| `ai_context.synthesis_summary` | string | Last synthesis agent output summary (truncated to 500 chars) |
| `ai_context.model_used` | string | LLM model used for the last synthesis |
| `learned.total_captured` | integer | Total signals captured |
| `learned.synced_to_letta` | integer | Signals successfully ingested to Letta |
| `learned.pending_sync` | integer | Signals awaiting Letta ingestion |
| `learned.categories` | object | Per-category signal breakdown |

**Example**

```bash
curl http://localhost:8002/api/memory/case/wf_abc123
```

---

## Read Memory Block

```
GET /api/memory/blocks/{officer_id}/{label}
```

Read a Letta memory block for the specified officer. Memory blocks are structured JSON data that persist officer profile, preferences, learned rules, and company context.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `officer_id` | string | Officer identifier (e.g., `default`) |
| `label` | string | Block label. Must be one of: `active_preferences`, `learned_procedures`, `officer_profile` |

**Response** `200`

```json
{
  "officer_id": "default",
  "label": "learned_procedures",
  "value": {
    "rules": [
      "Belgian BVs always need gazette verification",
      "PSP merchants with crypto exposure require EDD"
    ],
    "last_updated": "2026-03-01T14:30:00+00:00",
    "consolidation_count": 0
  }
}
```

| Field | Type | Description |
|---|---|---|
| `officer_id` | string | The queried officer |
| `label` | string | Block label |
| `value` | object or null | Parsed JSON content of the block, or `null` if the block has not been initialized |

**Example**

```bash
curl http://localhost:8002/api/memory/blocks/default/learned_procedures
```

**Error Responses**

| Status | Condition |
|---|---|
| `400` | Invalid block label (not in allowed set) |

:::tip
The `value` field returns `null` when Letta is disabled or the officer agent has not been provisioned yet. This is the expected default state.
:::

---

## Update Memory Block

```
PUT /api/memory/blocks/{officer_id}/{label}
```

Update a Letta memory block with new JSON content. This overwrites the entire block value.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `officer_id` | string | Officer identifier (e.g., `default`) |
| `label` | string | Block label. Must be one of: `active_preferences`, `learned_procedures`, `officer_profile` |

**Request Body**

```json
{
  "value": {
    "rules": [
      "Belgian BVs always need gazette verification",
      "PSP merchants with crypto exposure require EDD",
      "Always verify LinkedIn profiles for directors"
    ],
    "last_updated": "2026-03-02T10:00:00+00:00",
    "consolidation_count": 0
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `value` | object | Yes | The new block content as a JSON object |

**Response** `200`

```json
{
  "status": "updated",
  "officer_id": "default",
  "label": "learned_procedures"
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `400` | Invalid block label |
| `503` | Memory service unavailable (Letta disabled or connection error) |

**Example**

```bash
curl -X PUT http://localhost:8002/api/memory/blocks/default/learned_procedures \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "rules": ["Always require gazette check for Belgian companies"],
      "last_updated": "2026-03-02T10:00:00+00:00",
      "consolidation_count": 0
    }
  }'
```

---

## List Passages

```
GET /api/memory/passages/{officer_id}
```

List archival memory passages for the specified officer, optionally filtered by tag.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `officer_id` | string | Officer identifier (e.g., `default`) |

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `tag` | string | -- | Optional tag filter (e.g., `category:judgment`) |
| `limit` | integer | `50` | Maximum passages to return (capped at 100) |

**Response** `200`

```json
{
  "officer_id": "default",
  "passages": [
    {
      "id": "passage_abc123",
      "text": "Officer approved case demo-001 (BE, psp_merchant_onboarding). Reason: Clean investigation.",
      "tags": ["signal:case_approved", "category:judgment", "safety:non_suppressible", "country:BE"],
      "created_at": "2026-03-01T14:30:00+00:00"
    }
  ],
  "count": 1
}
```

| Field | Type | Description |
|---|---|---|
| `officer_id` | string | The queried officer |
| `passages` | array | List of passage objects |
| `passages[].id` | string | Unique passage identifier (used for deletion) |
| `passages[].text` | string | Passage content (narrative text) |
| `passages[].tags` | array | Structural tags for filtering |
| `passages[].created_at` | string | ISO 8601 creation timestamp |
| `count` | integer | Number of passages returned |

**Example**

```bash
# List all passages
curl http://localhost:8002/api/memory/passages/default

# Filter by tag
curl "http://localhost:8002/api/memory/passages/default?tag=category:judgment&limit=20"
```

---

## Search Passages

```
POST /api/memory/passages/{officer_id}/search
```

Perform semantic search over the officer's archival memory passages. Uses Letta's vector similarity search to find passages relevant to the query.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `officer_id` | string | Officer identifier (e.g., `default`) |

**Request Body**

```json
{
  "query": "Belgian PSP merchant cases with sanctions risk",
  "tags": ["category:judgment"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Natural language search query (must not be empty) |
| `tags` | array | No | Optional tag filters to narrow results |

**Response** `200`

```json
{
  "officer_id": "default",
  "passages": [
    {
      "id": "passage_xyz789",
      "text": "Officer rejected case demo-003 (NL, psp_merchant_onboarding). Reason: Sanctions match confirmed.",
      "tags": ["signal:case_rejected", "category:judgment", "safety:non_suppressible", "country:NL"],
      "created_at": "2026-03-01T12:00:00+00:00"
    }
  ],
  "count": 1
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `400` | Empty or whitespace-only query |

**Example**

```bash
curl -X POST http://localhost:8002/api/memory/passages/default/search \
  -H "Content-Type: application/json" \
  -d '{"query": "sanctions match", "tags": ["category:judgment"]}'
```

:::tip
Semantic search returns passages ranked by vector similarity. It finds conceptually related passages even when exact keywords do not match. For example, searching "shell company risk" may return passages about "complex multi-jurisdictional ownership structures."
:::

---

## Delete Passage

```
DELETE /api/memory/passages/{officer_id}/{passage_id}
```

Delete a specific archival memory passage. This permanently removes the passage from Letta's archival memory.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `officer_id` | string | Officer identifier (e.g., `default`) |
| `passage_id` | string | The unique passage ID (obtained from list or search) |

**Response** `200`

```json
{
  "status": "deleted",
  "passage_id": "passage_abc123"
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `503` | Memory service unavailable (Letta disabled or connection error) |

**Example**

```bash
curl -X DELETE http://localhost:8002/api/memory/passages/default/passage_abc123
```

:::warning
Passage deletion is permanent. There is no undo. In the Memory Admin UI, delete buttons are hidden by default and appear on hover to prevent accidental deletions.
:::

---

## Confidence Score

```
GET /api/memory/confidence/{officer_id}
```

Calculate the memory confidence score for an officer, optionally scoped to a specific case type (template + country). The score reflects how much the system has learned about the officer's decision patterns for similar cases.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `officer_id` | string | Officer identifier (e.g., `default`) |

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `template_id` | string | `""` | Scope to a specific template (e.g., `psp_merchant_onboarding`) |
| `country` | string | `""` | Scope to a specific country code (e.g., `BE`) |

**Response** `200`

```json
{
  "score": 55,
  "level": "learning",
  "label": "I'm building experience with this type of case.",
  "rules_count": 3,
  "relevant_passages": 5
}
```

| Field | Type | Description |
|---|---|---|
| `score` | integer | Confidence score from 0 to 100 |
| `level` | string | Maturity level: `novice` (0-29), `learning` (30-69), or `experienced` (70-100) |
| `label` | string | Human-readable confidence description |
| `rules_count` | integer | Number of rules in the `learned_procedures` block |
| `relevant_passages` | integer | Number of archival passages matching the case type |

### Scoring Formula

The score combines two factors:

- **Rules contribution** (max 40%): `min(rules_count * 10, 40)` -- 4 rules reaches the cap
- **Passages contribution** (max 60%): `min(relevant_passages * 3, 60)` -- 20 passages reaches the cap

When `template_id` or `country` are provided, only passages matching those tags are counted. Without filters, all passages contribute.

**Example**

```bash
# Global confidence
curl http://localhost:8002/api/memory/confidence/default

# Scoped to Belgian PSP cases
curl "http://localhost:8002/api/memory/confidence/default?template_id=psp_merchant_onboarding&country=BE"
```

:::info
When Letta is disabled, the endpoint returns `score: 0`, `level: "novice"`, and `label: "Memory system disabled"`. This allows the frontend to always render the confidence meter without conditional logic.
:::

---

## Get Company Context

```
GET /api/memory/company-context
```

Returns the company context configuration from the Letta memory block. Used for tenant onboarding and organizational policy display.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `officer_id` | string | `"default"` | Officer identifier |

**Response** `200`

```json
{
  "company_context": {
    "status": "configured",
    "company_type": "Payment Service Provider",
    "jurisdiction": "Belgium",
    "primary_regulator": "NBB (National Bank of Belgium)",
    "services": ["merchant acquiring", "payment processing"],
    "regulatory_framework": "PSD2, AML6",
    "customer_segments": ["e-commerce merchants", "SaaS platforms"],
    "risk_appetite": "moderate",
    "prohibited_jurisdictions": ["DPRK", "Iran", "Syria"],
    "additional_notes": ""
  }
}
```

When the company context has not been configured, the response returns `{"company_context": {"status": "not_configured"}}`.

**Example**

```bash
curl http://localhost:8002/api/memory/company-context
```

---

## Update Company Context

```
PUT /api/memory/company-context
```

Update the company context configuration. Marks the context as `configured` and persists it to the Letta memory block.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `officer_id` | string | `"default"` | Officer identifier |

**Request Body**

```json
{
  "company_type": "Payment Service Provider",
  "jurisdiction": "Belgium",
  "primary_regulator": "NBB (National Bank of Belgium)",
  "services": ["merchant acquiring", "payment processing"],
  "regulatory_framework": "PSD2, AML6",
  "customer_segments": ["e-commerce merchants"],
  "risk_appetite": "moderate",
  "prohibited_jurisdictions": ["DPRK", "Iran", "Syria"],
  "additional_notes": ""
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `company_type` | string | No | `""` | Type of company (e.g., PSP, Bank, Consultancy) |
| `jurisdiction` | string | No | `""` | Primary jurisdiction |
| `primary_regulator` | string | No | `""` | Primary regulatory body |
| `services` | array | No | `[]` | List of services offered |
| `regulatory_framework` | string | No | `""` | Applicable regulations |
| `customer_segments` | array | No | `[]` | Target customer segments |
| `risk_appetite` | string | No | `""` | Risk appetite level |
| `prohibited_jurisdictions` | array | No | `[]` | Jurisdictions the company does not operate in |
| `additional_notes` | string | No | `""` | Free-form notes |

**Response** `200`

```json
{
  "success": true
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `503` | Memory service unavailable |

**Example**

```bash
curl -X PUT http://localhost:8002/api/memory/company-context \
  -H "Content-Type: application/json" \
  -d '{
    "company_type": "Payment Service Provider",
    "jurisdiction": "Belgium",
    "primary_regulator": "NBB",
    "services": ["merchant acquiring"],
    "risk_appetite": "moderate"
  }'
```
