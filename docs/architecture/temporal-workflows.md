---
sidebar_position: 7
title: "Temporal Workflows"
components:
  - app/workflows/compliance_case.py
  - app/workflows/activities.py
  - app/workflows/registry_activity.py
  - app/workflows/continuous_monitoring.py
  - app/models/workflow_state.py
  - app/worker.py
tests:
  - tests/test_workflow.py
last_verified: 2026-06-11
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

All workflow state lives in a single `WorkflowState` dataclass (`app/models/workflow_state.py`), held as `self._state`. Grouping the ~25 state fields into one dataclass keeps the workflow body readable and gives the state a typed shape:

```python
@workflow.defn
class ComplianceCaseWorkflow:
    def __init__(self) -> None:
        self._state: WorkflowState = WorkflowState(
            status=CaseStatus.CREATED.value,
        )
```

`WorkflowState` carries `status`, `current_iteration`, `documents_submitted`, `skip_documents`, `officer_decision`, `requirements_approved`, `resolved_requirements`, `investigation_results`, `mcc_classification`, `generated_tasks`, `follow_up_tasks`, `follow_up_reason`, `audit_events`, `validation_results`, `confidence_scores`, `document_extracted_data`, `peppol_result`/`peppol_error`, `cross_reference_result`, `decision_restrictions`, and the KYC/customs fields (`identity_verification`, `field_validation`, `fiscal_rep_data`, `verification_checks`, `quality_scores`/`quality_flag`, `document_manifest`). Temporal serializes and replays this state on recovery.

:::note
Temporal's deterministic replay and serialization requirements constrain which types can be used inside the workflow sandbox -- standard library types (`dict`, `list`, dataclasses, `TypedDict`) are preferred over Pydantic models in workflow code to avoid non-deterministic behavior.
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
    tenant_id: str = ""          # multi-tenant scoping (ADR-0023)
```

### Signals

Signals are the mechanism for external events to influence the running workflow:

| Signal | Payload | Source | Effect |
|--------|---------|--------|--------|
| `signal_documents_submitted` | None | Portal `/submit` endpoint | Sets `documents_submitted = True`, unblocking the wait |
| `signal_officer_decision` | `OfficerDecisionSignal` | Dashboard decision endpoint | Sets `officer_decision`, unblocking the review wait |
| `signal_skip_documents` | None | Dashboard "Skip & Continue" | Sets `skip_documents = True` and `documents_submitted = True`, bypassing the portal upload step |
| `signal_requirements_approved` | `dict` (modifications) | Requirements review gate | Sets `requirements_approved = True`; applies any `resolved_requirements` modifications the officer made |
| `signal_mcc_update` | `dict` (MCC result) | Dashboard MCC reclassification | Updates `mcc_classification` and logs `mcc_reclassified` audit event |

### Queries

Queries provide read-only access to workflow state without affecting execution:

| Query | Returns | Used By |
|-------|---------|---------|
| `get_status` | Full state dict (status, iteration, investigation results, MCC, tasks, audit events, confidence scores, PEPPOL, cross-reference result, resolved requirements, decision restrictions, etc.) | Dashboard `GET /api/cases/{id}` |
| `get_resolved_requirements` | Current resolved document requirements dict | Requirements review UI |

The `get_status` query returns the complete workflow state, which the API layer transforms into the `CaseResponse` model for the frontend.

### Extracted Helper Methods

The `run` method delegates investigation work to extracted helpers, keeping the main loop readable:

| Method | Purpose | Returns |
|--------|---------|---------|
| `_run_kyc_investigation(input, doc_proc_result, _skipping, retry_policy)` | KYC natural person: `verify_identity` → `validate_fields` → `run_kyc_screening` | `investigation_result: dict` |
| `_run_kyb_investigation(input, _doc_proc_result, _skipping, retry_policy, registry_result=None)` | KYB entity: OSINT → MCC → risk reassessment → verification checks → PEPPOL | `investigation_result: dict` |
| `_compute_and_store_confidence(input, investigation_result, _retry_policy)` | Confidence scoring via `compute_confidence_score` activity (shared, Pillar 1) | `None` (appends to `self._state.confidence_scores`) |

The KYC/KYB dispatch is a plain template check (no version gate):

```python
is_kyc = input.template_id == "kyc_natural_person"

# First iteration reuses the pre-investigation result; later iterations
# re-run the appropriate path.
if _pre_investigated and self._state.investigation_results:
    investigation_result = self._state.investigation_results[-1]
elif is_kyc:
    investigation_result = await self._run_kyc_investigation(...)
else:
    investigation_result = await self._run_kyb_investigation(...)
```

### Determinism & Version Gates

:::note
**No `workflow.patched()` version gates remain in the codebase.** Because the project carries zero in-flight production workflows (the "no backward compatibility needed" decision), the ~23 historical `workflow.patched()` guards were removed and replaced with plain conditionals (template checks, `if registry_result:`, etc.). New features are added directly. Determinism inside the workflow sandbox is preserved through standard practices: all I/O is delegated to activities, `workflow.now()` replaces `datetime.now()`, and non-deterministic imports are wrapped in `workflow.unsafe.imports_passed_through()`.
:::

### Main Run Loop

The workflow's `run` method implements the compliance loop:

The flow is **investigation-first** (ADR-0018): OSINT, registry collection, cross-referencing, and gap analysis all run *before* the customer portal opens, so the officer can review computed requirements at the gate. The customer-document loop runs afterward.

```python
@workflow.run
async def run(self, input: CaseInput) -> dict:
    retry_policy = RetryPolicy(maximum_attempts=3, ...)
    critical_retry = RetryPolicy(maximum_attempts=5, ...)

    # ── Pre-investigation (before portal) ──
    s.status = CaseStatus.PRE_INVESTIGATION.value
    registry_result = await workflow.execute_activity("registry_and_documents", ...)
    workflow.start_activity("extract_documents_markdown", ...)   # detached Docling
    investigation_result = await self._run_kyb_investigation(input, ..., registry_result)
    s.status = CaseStatus.DOCUMENT_GAP_ANALYSIS.value
    await workflow.execute_activity("cross_reference_evidence", ...)
    await workflow.execute_activity("analyze_document_gaps", ...)   # → automation_tier

    # ── Requirements review gate (tier-based) ──
    s.status = CaseStatus.REQUIREMENTS_REVIEW.value
    if automation_tier == "AUTONOMOUS":
        s.requirements_approved = True
    elif automation_tier == "ASSISTED":
        await workflow.wait_condition(lambda: s.requirements_approved,
                                      timeout=timedelta(minutes=15))   # auto-release
    else:  # FULL_REVIEW
        await workflow.wait_condition(lambda: s.requirements_approved)

    s.status = CaseStatus.AWAITING_DOCUMENTS.value

    # ── Customer-document iteration loop ──
    while s.current_iteration < input.max_iterations:
        await workflow.wait_condition(lambda: s.documents_submitted,
                                      timeout=timedelta(days=remaining_days))
        s.current_iteration += 1
        await workflow.execute_activity("process_documents", ...)
        validation_result = await workflow.execute_activity("validate_documents", ...)
        # If a required doc fails validation → auto-loop to AWAITING_DOCUMENTS

        # First iteration reuses the pre-investigation result; otherwise re-run
        if not pre_investigated:
            investigation_result = await self._run_kyb_investigation(...)  # or KYC

        await workflow.execute_activity("generate_follow_up_tasks", ...)
        s.status = CaseStatus.REVIEW_PENDING.value
        await workflow.execute_activity("persist_workflow_state", ...)
        await workflow.wait_condition(lambda: s.officer_decision is not None)

        # Process decision (approve / approve_with_restrictions / reject / escalate / follow_up)
        if decision in (APPROVE, APPROVE_WITH_RESTRICTIONS, REJECT, ESCALATE):
            return self._result(...)
        if decision == FOLLOW_UP:
            continue  # loop
```

### Validation Bounce-Back

A notable feature is the automatic document validation bounce-back. When required documents fail AI validation, the workflow:

1. Generates re-upload tasks from the validation failures
2. Transitions back to `AWAITING_DOCUMENTS`
3. Logs a `validation_bounce_back` audit event
4. Continues the while loop without incrementing to officer review

This means the customer can be asked to re-upload without officer intervention, saving time on obvious issues (wrong document type, illegible scans, etc.).

## Activities

Most activities are defined in `backend/app/workflows/activities.py` (44 `@activity.defn` functions); the registry/document collection activity lives in `app/workflows/registry_activity.py` (`registry_and_documents`) and Docling extraction in `app/workflows/docling_activity.py` (`extract_documents_markdown`). Activities are the bridge between Temporal's deterministic sandbox and the outside world. The worker registers all of them on the `compliance-case-queue` task queue.

**Pre-investigation & evidence (KYB):**

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `registry_and_documents` | 15 min | Phase 2 — run registry agents and download official PDFs (KBO, NBB, INPI, ARES, etc.) |
| `extract_documents_markdown` | 30 min | Background Docling conversion of registry PDFs (detached `start_activity`, Option B — ADR-0047) |
| `run_osint_investigation` | 30 min | Full OSINT pipeline, cumulative evidence (KYB path) |
| `collect_registry_documents` | 5 min | Fallback document collection when Phase 2 downloaded none |
| `cross_reference_evidence` | 60 sec | Build corroboration matrix, flag discrepancies by severity |
| `analyze_document_gaps` | 30 sec | Compute coverage, customer-required docs, and automation tier |
| `reconcile_nace_vs_mcc` | 10 sec | Declared NACE vs inferred MCC divergence signal |
| `upsert_entity_baseline` | 15 sec | Seed the entity/network graph baseline before requirements review |
| `populate_goaml_entities` | 15 sec | Populate goAML canonical entities from findings |

**Documents & validation:**

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `process_documents` | 5 min | Download from MinIO, convert via Docling, store Markdown |
| `validate_documents` | 3 min | AI agent validates uploads against requirements |
| `extract_document_data` | 3 min | Structured UBO extraction from uploaded documents |
| `refresh_synthesis_after_documents` | 3 min | Merge verified-document findings into the summary (post-portal) |
| `fetch_case_answers` | 10 sec | Read portal-submitted answers from PostgreSQL (best-effort) |
| `fetch_company_details` | 10 sec | Re-read officer-corrected company details from PostgreSQL |
| `scrape_company_website` | 2 min | Crawl company website, store in MinIO |

**KYC path:**

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `verify_identity` | 2 min | itsme/eIDAS identity verification |
| `validate_fields` | 1 min | NRN mod97, BSN 11-proof, IBAN ISO 13616 field checks |
| `run_kyc_screening` | 10 min | Sanctions, PEP, adverse media screening |

**Risk, MCC & verification (KYB):**

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `classify_mcc` | 2 min | MCC code classification agent |
| `reassess_risk` | 30 sec | EBA risk re-scoring at 3 checkpoints (post-OSINT, post-verification, post-network) |
| `run_verification_checks` | 3 min | Verification tool suite (sanctions, LEI, VIES, license registry, etc.) |
| `run_peppol_verification` | 5 min | Belgian PEPPOL/inhoudingsplicht check (BE only, best-effort) |
| `score_investigation_quality` | 30 sec | LLM-as-judge quality scoring (best-effort) |
| `compute_confidence_score` | 30 sec | Pillar 1 confidence scoring (shared, best-effort) |
| `assign_automation_tier` | 30 sec | Supervised autonomy tier assignment (best-effort) |
| `generate_follow_up_tasks` | 2 min | Task suggestion agent |
| `populate_knowledge_graph` | 3 min | Neo4j ETL (KYB-only, best-effort) |

**Customs Shield (template `customs_fiscal_representative`):**

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `validate_eori` | 2 min | EORI number validation |
| `verify_iban` | 2 min | Verification-of-Payee on guarantee/company IBANs |
| `build_trade_profile` | 30 sec | Assemble trade profile from selected services |
| `assemble_trust_capsule` | 5 min | Cryptographic Trust Capsule on terminal decision (ADR-0017) |

**Persistence & audit:**

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `persist_workflow_state` | 30 sec | Sync in-memory state to PostgreSQL at `REQUIREMENTS_REVIEW`, `AWAITING_DOCUMENTS`, `REVIEW_PENDING`, and all terminal states |
| `persist_audit_event` | 30 sec | Write a single audit event to PostgreSQL |
| `persist_domain_events` | 30 sec | Write the correlation/causation domain-event chain to PostgreSQL |
| `consolidate_investigation_memory` | 60 sec | Post-resolution episodic memory (best-effort) |

In addition, the shipment-compliance and continuous-monitoring activities (`process_shipment_documents`, `classify_shipment_documents`, `extract_shipment_data`, `cross_reference_shipment`, `update_shipment_status`, `fetch_active_customs_cases`, `run_monitoring_checks`, `update_monitoring_last_run`) and `refresh_suppression_rules` are registered on the same worker for the other workflows (see below).

### `persist_workflow_state` — State Durability Pattern

This activity was added to close a reliability gap: before its introduction, the workflow's in-memory state was authoritative but PostgreSQL reflected it only via the query response at request time. If the workflow was unexpectedly terminated between status transitions, the PostgreSQL record could become stale.

`persist_workflow_state` is called at every durable checkpoint:
1. **At `REQUIREMENTS_REVIEW`** — so the DB reflects the case is waiting at the gate
2. **At `AWAITING_DOCUMENTS`** — so the DB reflects the portal is open
3. **Before `REVIEW_PENDING`** — after investigation completes and before waiting for the officer decision
4. **At all terminal states** — via `_persist_final_state()`: `APPROVED`, `APPROVED_WITH_RESTRICTIONS`, `REJECTED`, `ESCALATED`, and `FAILED`

At each checkpoint it writes:
- `status` — current workflow status string
- `investigation_results` — serialised investigation result JSONB
- `generated_tasks` — task list JSONB
- `current_iteration` — integer iteration counter
- `resolved_requirements` — resolved document requirements JSONB
- `cross_reference_result` — corroboration matrix JSONB (via `COALESCE` so a `None` does not clobber a prior value)

This means the case list and case detail pages load immediately from PostgreSQL without requiring a live Temporal query, improving dashboard performance and resilience against Temporal server restarts.

#### 2026-04-13 reliability hardening

Multi-country E2E validation surfaced two persistence races inside this activity and both are now fixed:

1. **asyncpg `AmbiguousParameterError`** — The previous `CASE WHEN :xref IS NOT NULL THEN CAST(:xref AS jsonb) ELSE cross_reference_result END` triggered parameter-type inference failure when `:xref` was `None`, silently aborting the whole `UPDATE cases`. Replaced with `COALESCE(CAST(:xref AS jsonb), cross_reference_result)` — the cast annotates the parameter type regardless of value. Same treatment applied to `resolved_requirements`.
2. **Race with `_persist_decision_artifacts`** — `additional_data = CAST(:ad AS jsonb)` did a full-row replacement. When the decision endpoint wrote `decision_artifacts` concurrently (via its own `||` merge), the activity's subsequent full-replacement write silently discarded those keys. The UPDATE now uses `additional_data = COALESCE(additional_data, '{}'::jsonb) || CAST(:ad AS jsonb)`, preserving any concurrently-added keys.

Commit: `dc5f1d4a`.

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

This is the baseline policy. Investigation-critical steps (OSINT, MCC, task generation) use a `critical_retry` policy with `maximum_attempts=5` and a longer cap, while `registry_and_documents` runs with `maximum_attempts=1` (it is best-effort). The `start_to_close_timeout` varies by activity -- OSINT investigation gets 30 minutes (with a 10-minute heartbeat) because it orchestrates multiple external API calls, while audit event persistence gets 30 seconds.

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

The workflow calls the model helper `build_segment_codes()` (imported from `app/models/mcc_classification.py`) to merge NACE/segment codes from three sources in priority order:

1. Officer-provided segment codes (from case creation form)
2. NorthData enrichment codes (from pre-enrichment at case creation)
3. OSINT investigation codes (from the registry agent)

Codes are deduplicated by their numeric prefix, and the merged list is passed to the MCC classifier for accurate categorization.

## Post-Document Re-Synthesis Activity

The `refresh_synthesis_after_documents` activity runs after document validation to update the investigation summary with customer-uploaded evidence.

### When It Runs

The activity executes when both conditions are met:
1. `validation_results` is non-empty (customer uploaded and validated documents)
2. `current_iteration >= 1` (always true in practice)

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

## Skip Path Upload Processing

When an officer clicks "Skip & Continue" to bypass the document upload portal, the workflow checks for officer-uploaded documents in MinIO before proceeding. This handles the case where an officer uploads documents via the inline upload component at the `REQUIREMENTS_REVIEW` stage and then skips the portal.

## Skip & Continue Race Handling

The "Skip & Continue" button exposes a potential race: the `signal_skip_documents` handler sets both `skip_documents = True` and `documents_submitted = True`, but the top of each loop iteration resets `documents_submitted = False`. The reset is therefore guarded with a plain conditional — if `skip_documents` is already true, the reset is skipped, preserving the signal state:

```python
if s.skip_documents:
    pass  # preserve documents_submitted=True from skip signal
else:
    s.documents_submitted = False
```

## Other Workflows on the Worker

The compliance worker (`app/worker.py`) registers **five** workflow types on the `compliance-case-queue` task queue, all sharing the same activity pool:

| Workflow | Module | Purpose |
|----------|--------|---------|
| `ComplianceCaseWorkflow` | `compliance_case.py` | The main KYB/KYC compliance loop documented above |
| `ShipmentComplianceWorkflow` | `shipment_compliance.py` | Customs Shield shipment document compliance |
| `ContinuousMonitoringWorkflow` | `continuous_monitoring.py` | Scheduled (cron) per-tenant monitoring of active customs cases |
| `BatchRiskReEvaluationWorkflow` | `batch_risk.py` | Bulk risk re-evaluation across a case portfolio |
| `SanctionsSuppressionRefreshWorkflow` | `sanctions_suppression_refresh.py` | Periodic refresh of sanctions false-positive suppression rules (ADR-0045) |

`ContinuousMonitoringWorkflow` takes a `MonitoringInput(tenant_id, enabled_checks)`, fetches active customs cases via `fetch_active_customs_cases`, runs `run_monitoring_checks` per case sequentially, then writes `update_monitoring_last_run`.
