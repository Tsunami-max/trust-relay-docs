---
sidebar_position: 7
title: "Temporal Workflows"
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

The workflow is defined in `backend/app/workflows/compliance_case.py` (401 lines).

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

Six activities are defined in `backend/app/workflows/activities.py` (470 lines). Activities are the bridge between Temporal's deterministic sandbox and the outside world.

| Activity | Timeout | Purpose |
|----------|---------|---------|
| `process_documents` | 5 min | Download from MinIO, convert via Docling, store Markdown |
| `validate_documents` | 3 min | AI agent validates documents against requirements |
| `run_osint_investigation` | 10 min | Full OSINT pipeline (4 agents, cumulative evidence) |
| `classify_mcc` | 2 min | MCC code classification agent |
| `generate_follow_up_tasks` | 2 min | Task suggestion agent |
| `persist_audit_event` | 30 sec | Write audit event to PostgreSQL |
| `scrape_company_website` | 2 min | Crawl company website, store in MinIO |

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
