---
sidebar_position: 7
title: "Temporal Workflows"
components:
  - app/workflows/compliance_case.py
  - app/workflows/activities.py
  - app/worker.py
tests:
  - tests/test_workflow.py
last_verified: 2026-04-07
status: implemented
---

# Temporal Workflows

The workflow engine is one of the strongest parts of the architecture. Temporal provides durable execution guarantees, meaning the compliance loop survives process restarts, network failures, and long-running waits (up to 60 days for document submission).

## Why Temporal

We evaluated three alternatives for orchestrating the compliance case lifecycle:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Temporal** | Durable execution, built-in retries, signal/query pattern, workflow-as-code | Operational complexity, learning curve | **Selected** |
| Celery | Familiar, large ecosystem | No durable state, no signal pattern, poor long-running support | Rejected |
| Custom state machine | Simple, no dependencies | Must build persistence, retries, timeout handling manually | Rejected |

Temporal was chosen because the compliance loop has characteristics that map perfectly to its programming model:

1. **Long-running waits** -- Cases can wait 60 days for customer documents
2. **Signal-driven progression** -- Document submission and officer decisions are external events
3. **Iterative loops** -- Cases loop up to 5 times between officer and customer
4. **Durable state** -- Workflow state survives crashes without explicit persistence code
5. **Activity retries** -- Failed OSINT calls, Docling conversions, or database writes retry automatically

## ComplianceCaseWorkflow

The workflow is defined in `backend/app/workflows/compliance_case.py`.

### Class Structure

```python
@workflow.defn
class ComplianceCaseWorkflow:
    def __init__(self):
        self.status: str = CaseStatus.CREATED.value
        self.current_iteration: int = 0
        self.documents_submitted: bool = False
        self.officer_decision: OfficerDecisionSignal | None = None
        self.investigation_results: list[dict] = []
        self.mcc_classification: dict | None = None
        self.generated_tasks: list[dict] = []
        self.follow_up_tasks: list[dict] = []
        self.follow_up_reason: str | None = None
        self.audit_events: list[dict] = []
        self.validation_results: list[dict] = []
```

All state is held as instance attributes. Temporal serializes and replays these on recovery.

:::note
The internal state uses `TypedDict` definitions for type safety. Temporal's deterministic replay and serialization requirements constrain which types can be used -- standard library types (`dict`, `list`, `TypedDict`) are preferred over Pydantic models in workflow code to avoid non-deterministic behavior.
:::

### Input Dataclass

```python
@dataclass
class CaseInput:
    case_id: str
    company_name: str
    company_registration_number: str | None
    country: str
    template_id: str
    additional_data: dict
    max_iterations: int          # default: 5
    max_timeline_days: int       # default: 60
    portal_token: str
```

### Signals

Signals are the mechanism for external events to influence the running workflow:

| Signal | Payload | Source | Effect |
|--------|---------|--------|--------|
| `signal_documents_submitted` | None | Portal `/submit` endpoint | Sets `documents_submitted = True`, unblocking the wait |
| `signal_officer_decision` | `OfficerDecisionSignal` | Dashboard decision endpoint | Sets `officer_decision`, unblocking the review wait |
| `signal_mcc_update` | `dict` (MCC result) | Dashboard MCC reclassification | Updates `mcc_classification` and logs audit event |

### Queries

Queries provide read-only access to workflow state without affecting execution:

| Query | Returns | Used By |
|-------|---------|---------|
| `get_status` | Full state dict (status, iteration, results, tasks, audit events) | Dashboard `GET /api/cases/{id}` |

The `get_status` query returns the complete workflow state, which the API layer transforms into the `CaseResponse` model for the frontend.

### Extracted Helper Methods

The `run` method delegates investigation work to three extracted helpers, keeping the main dispatch loop to approximately 10 lines:

| Method | Purpose | Signature |
|--------|---------|-----------|
| `_run_kyc_investigation(input, doc_proc_result, _skipping, retry_policy)` | KYC natural person: `verify_identity` → `validate_fields` → `run_kyc_screening` | Returns `investigation_result: dict` |
| `_run_kyb_investigation(input, _doc_proc_result, _skipping, retry_policy)` | KYB entity: OSINT → PEPPOL → MCC classification | Returns `investigation_result: dict` |
| `_compute_and_store_confidence(input, investigation_result, _retry_policy)` | Confidence scoring via `compute_confidence_score` activity (shared, Pillar 1) | Returns `None` (appends to `self._state.confidence_scores`) |

The KYC/KYB dispatch:

```python
is_kyc = workflow.patched("kyc-v1") and input.template_id == "kyc_natural_person"

if is_kyc:
    investigation_result = await self._run_kyc_investigation(...)
else:
    investigation_result = await self._run_kyb_investigation(...)

# Shared for both paths
await self._compute_and_store_confidence(...)
```

### Version Gates (`workflow.patched()`)

Version gates ensure backward-compatible replay when new activities are added to a running workflow. Old workflow histories that pre-date a gate will skip that code path.

| Gate key | What it enables |
|----------|----------------|
| `kyc-v1` | KYC vs KYB activity fork (`_run_kyc_investigation`) |
| `fetch-answers-v1` | `fetch_case_answers` activity — reads portal-submitted answers from DB |
| `confidence-score-v1` | `compute_confidence_score` activity (Pillar 1) |
| `graph-etl-v1` | `populate_knowledge_graph` activity (KYB-only) |
| `peppol-v1` | `run_peppol_verification` activity (Belgian cases) |
| `peppol-cache-v1` | Reuse cached PEPPOL result across iterations |
| `skip-docs-v1` | `signal_skip_documents` — allow officer to bypass document upload step |

### Main Run Loop

The workflow's `run` method implements the compliance loop:

```python
@workflow.run
async def run(self, input: CaseInput) -> dict:
    retry_policy = RetryPolicy(
        initial_interval=timedelta(seconds=1),
        maximum_interval=timedelta(seconds=30),
        maximum_attempts=3,
    )

    self.status = CaseStatus.AWAITING_DOCUMENTS.value

    while self.current_iteration < input.max_iterations:
        # 1. Wait for documents (with timeline timeout)
        await workflow.wait_condition(
            lambda: self.documents_submitted,
            timeout=timedelta(days=remaining_days),
        )

        # 2. Process documents (Docling conversion)
        await workflow.execute_activity("process_documents", ...)

        # 3. Validate documents (AI agent)
        validation_result = await workflow.execute_activity("validate_documents", ...)
        # If validation fails, auto-loop back to AWAITING_DOCUMENTS

        # 4. Scrape company website (first iteration only, best-effort)
        await workflow.execute_activity("scrape_company_website", ...)

        # 5. Run OSINT investigation (4-agent pipeline)
        investigation_result = await workflow.execute_activity("run_osint_investigation", ...)

        # 6. Classify MCC
        mcc_result = await workflow.execute_activity("classify_mcc", ...)

        # 7. Generate follow-up tasks
        task_gen_result = await workflow.execute_activity("generate_follow_up_tasks", ...)

        # 8. Wait for officer decision
        self.status = CaseStatus.REVIEW_PENDING.value
        await workflow.wait_condition(lambda: self.officer_decision is not None)

        # 9. Process decision (approve/reject/escalate/follow-up)
        if decision == APPROVE: return result
        if decision == REJECT: return result
        if decision == ESCALATE: return result
        if decision == FOLLOW_UP: continue  # loop
```

### Validation Bounce-Back

A notable feature is the automatic document validation bounce-back. When required documents fail AI validation, the workflow:

1. Generates re-upload tasks from the validation failures
2. Transitions back to `AWAITING_DOCUMENTS`
3. Logs a `validation_bounce_back` audit event
4. Continues the while loop without incrementing to officer review

This means the customer can be asked to re-upload without officer intervention, saving time on obvious issues (wrong document type, illegible scans, etc.).

## Activities

Activities are defined in `backend/app/workflows/activities.py`. They are the bridge between Temporal's deterministic sandbox and the outside world.

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `process_documents` | 5 min | Download from MinIO, convert via Docling, store Markdown |
| `validate_documents` | 3 min | AI agent validates documents against requirements |
| `fetch_case_answers` | 10 sec | Read portal-submitted answers from PostgreSQL (KYC, best-effort) |
| `verify_identity` | 2 min | itsme/eIDAS identity verification (KYC path) |
| `validate_fields` | 1 min | NRN mod97, BSN 11-proof, IBAN ISO 13616 field checks (KYC path) |
| `run_kyc_screening` | 10 min | Sanctions, PEP, adverse media screening (KYC path) |
| `run_osint_investigation` | 30 min | Full OSINT pipeline (4 agents, cumulative evidence, KYB path) |
| `run_peppol_verification` | 5 min | Belgian PEPPOL/inhoudingsplicht check (KYB, BE only, best-effort) |
| `classify_mcc` | 2 min | MCC code classification agent (KYB path) |
| `compute_confidence_score` | 30 sec | Pillar 1 confidence scoring (shared, best-effort) |
| `generate_follow_up_tasks` | 2 min | Task suggestion agent |
| `populate_knowledge_graph` | 3 min | Neo4j ETL (KYB-only, best-effort) |
| `assign_automation_tier` | 30 sec | Supervised autonomy tier assignment (KYB-only, best-effort) |
| `persist_audit_event` | 30 sec | Write audit event to PostgreSQL |
| `scrape_company_website` | 2 min | Crawl company website, store in MinIO |
| `consolidate_investigation_memory` | 60 sec | Post-resolution episodic memory (best-effort) |
| `persist_workflow_state` | 30 sec | Sync Temporal in-memory state to PostgreSQL at `REVIEW_PENDING` and all terminal states (approve/reject/escalate/failed) |

### `persist_workflow_state` — State Durability Pattern

This activity was added to close a reliability gap: before its introduction, the workflow's in-memory state was authoritative but PostgreSQL reflected it only via the query response at request time. If the workflow was unexpectedly terminated between status transitions, the PostgreSQL record could become stale.

`persist_workflow_state` is called at two points:
1. **Before `REVIEW_PENDING`** — after investigation completes and before waiting for the officer decision
2. **At all terminal states** — `APPROVED`, `REJECTED`, `ESCALATED`, and `FAILED`

At each checkpoint it writes:
- `status` — current workflow status string
- `investigation_results` — serialised investigation result JSONB
- `generated_tasks` — task list JSONB
- `mcc_classification` — MCC result JSONB
- `current_iteration` — integer iteration counter
- `completed_at` — timestamp for terminal states

This means the case list and case detail pages load immediately from PostgreSQL without requiring a live Temporal query, improving dashboard performance and resilience against Temporal server restarts.

### `fetch_case_answers` — Workflow Input Immutability Pattern

This activity solves a Temporal determinism constraint: the `signal_documents_submitted` signal must remain parameterless (signals cannot safely carry large payloads and changing signal signatures breaks replay). Customer answers submitted through the portal are instead persisted to PostgreSQL by the portal endpoint, then fetched by this activity immediately after the signal is received.

**Error handling**: errors are silently swallowed (`except Exception: pass`). If the activity fails, the workflow falls back to the original `input.additional_data["answers"]` provided at case creation time. This is acceptable because KYC answers are also passed at creation for the initial submission, and the DB fetch is an authoritative refresh for follow-up iterations.

### Retry Policy

All activities share a common retry policy:

```python
RetryPolicy(
    initial_interval=timedelta(seconds=1),
    maximum_interval=timedelta(seconds=30),
    maximum_attempts=3,
)
```

This means a failed activity will retry up to 3 times with exponential backoff (1s, then up to 30s). The `start_to_close_timeout` varies by activity -- OSINT investigation gets 10 minutes because it involves multiple external API calls, while audit event persistence gets 30 seconds.

### Cumulative Evidence Collection

The `run_osint_investigation` activity collects Markdown from all previous iterations, not just the current one:

```python
for i in range(1, iteration + 1):
    prefix = f"{case_id}/iteration-{i}/"
    files = minio.list_objects(prefix)
    for file_key in files:
        if file_key.endswith(".md"):
            content = minio.download_as_string(file_key)
            all_markdown.append({"source": file_key, "content": content})
```

This ensures the synthesis agent always has the complete evidence picture, even when the case has gone through multiple follow-up iterations.

## Temporal Testing

Workflow tests use Temporal's in-memory time-skipping environment:

```python
async with await WorkflowEnvironment.start_time_skipping() as env:
    # Start workflow
    handle = await env.client.start_workflow(
        ComplianceCaseWorkflow.run,
        case_input,
        id="test-workflow",
        task_queue="test-queue",
    )
    # Send signals, query state, etc.
```

This runs a real Temporal server in-memory with accelerated time, allowing tests to exercise timeout logic, signal handling, and state transitions without waiting for real time to pass.

:::tip
The project uses `start_time_skipping()` instead of `start_local()` because time-skipping mode enables testing of the 60-day timeline timeout in milliseconds.
:::

## NACE/Segment Code Merging

The workflow includes a utility function `_build_segment_codes()` that merges NACE codes from three sources in priority order:

1. Officer-provided segment codes (from case creation form)
2. NorthData enrichment codes (from pre-enrichment at case creation)
3. OSINT investigation codes (from the registry agent)

Codes are deduplicated by their numeric prefix, and the merged list is passed to the MCC classifier for accurate categorization.

## Post-Document Re-Synthesis Activity (2026-04-06)

The `refresh_synthesis_after_documents` activity is a new pipeline step that runs after document validation to update the investigation summary with customer-uploaded evidence. It is guarded by `workflow.patched("post-doc-synthesis-v1")`.

### When It Runs

The activity executes when all three conditions are met:
1. The `post-doc-synthesis-v1` version gate is open
2. `validation_results` is non-empty (customer uploaded and validated documents)
3. `current_iteration >= 1` (always true in practice)

### What It Does

1. **Builds verified-document findings**: Iterates through validation results and creates `document_verified_*` findings for each valid document with `severity: verified` and regulatory basis `AMLD-IV Art. 14 / AMLR Art. 28`
2. **Merges UBO data**: If document extraction found UBOs (from uploaded UBO register extract), creates a `ubo_verification` finding
3. **Removes stale findings**: Filters out `medium`-severity UBO findings marked as "unverified" when they are now verified by uploaded documents
4. **Strikes through satisfied Next Steps**: Uses keyword matching against validated requirement names to add strikethrough (`~~`) to completed action items
5. **Appends verification section**: Adds a `## Document Verification (Post-Portal)` section to the existing summary

### Design Decision

The activity does NOT re-run the synthesis agent. It mechanically merges new findings and appends a summary section. This preserves the original OSINT-derived narrative while adding document verification results. Re-running synthesis would be more expensive (another GPT-5.2 call) and risks losing well-crafted findings from the initial run. For production, a full re-synthesis with the complete evidence corpus would produce a more unified narrative.

### Failure Handling

On any exception, the activity returns the original `investigation_result` unchanged. This is a guard-and-swallow pattern -- document re-synthesis is best-effort and should never block the pipeline.

## Skip Path Upload Processing (2026-04-06)

When an officer clicks "Skip & Continue" to bypass the document upload portal, the workflow now checks for officer-uploaded documents in MinIO before proceeding. This handles the case where an officer uploads documents via the inline upload component at the `REQUIREMENTS_REVIEW` stage and then skips the portal.

Guarded by `workflow.patched("skip-check-uploads-v1")`.

## Nondeterminism Protection (2026-04-06)

The Skip & Continue button exposed a race condition: the `signal_skip_documents` handler sets both `skip_documents = True` and `documents_submitted = True`, but the main loop at the top of each iteration resets `documents_submitted = False`. If the signal arrived before the loop started waiting, the reset would overwrite the signal.

Fix: `workflow.patched("skip-race-fix-v1")` guards the reset -- if `skip_documents` is already true, the reset is skipped, preserving the signal state.

### Version Gate Inventory

As of 2026-04-07, there are 23 `workflow.patched()` gates in the workflow. Each guard protects a code path that was added after the initial workflow version, preventing nondeterminism during replay of older workflow histories.

| Gate | Purpose |
|------|---------|
| `pre-investigation-v1` | OSINT before customer documents |
| `fetch-company-details-v1` | Re-read company details from DB |
| `verification-checks-v1` | Verification checks pipeline |
| `peppol-v1` | PEPPOL verification (BE only) |
| `peppol-cache-v1` | Reuse cached PEPPOL result |
| `persist-awaiting-v1` | Persist AWAITING_DOCUMENTS to DB |
| `skip-race-fix-v1` | Skip & Continue race condition |
| `skip-docs-v1` | Skip documents feature |
| `fetch-answers-v1` | Fetch portal answers from DB |
| `skip-check-uploads-v1` | Check officer uploads on skip |
| `followup-completion-v1` | Mark follow-up tasks completed |
| `doc-extraction-v1` | UBO extraction from documents |
| `fetch-website-v1` | Website scrape |
| `kyc-v1` | KYC vs KYB fork |
| `customs-shield-v1` | Customs Shield integration |
| `post-doc-synthesis-v1` | Post-document re-synthesis |
| `graph-etl-v1` | Knowledge graph ETL |
| `quality-scorer-v1` | LLM-as-judge quality scoring |
| `confidence-score-v1` | Pillar 1 confidence scoring |

:::note
Per `feedback_no_backward_compat.md`, these guards exist as a safety measure but the project has zero in-flight production workflows. All 23 guards could be removed to simplify the workflow code, since `workflow.patched()` always returns `True` for new workflows.
:::
