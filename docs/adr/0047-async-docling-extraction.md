---
id: 0047-async-docling-extraction
sidebar_position: 48
title: "ADR-0047: Async Docling Extraction (Option B)"
---

# ADR-0047: Async Docling extraction (Option B)

**Status:** Accepted
**Date:** 2026-04-23
**Note:** Originally drafted as ADR-0046; renumbered 2026-04-24 after
collision with ADR-0046 (NBB CBSO CSV endpoint degradation, committed
2026-04-22).

## Context

The 2026-04-23 Czech-bank demo-prep work exposed that Docling OCR on
Sbírka listin filings (~30–90 seconds per PDF on Apple Silicon MPS)
was serialized inside the synchronous `registry_and_documents`
Temporal activity. Phase 2 wall-clock for large filers (ČEZ, Škoda,
Kooperativa scale) reached 7–10 minutes and occasionally exhausted the
15-minute `start_to_close_timeout`. Heartbeats fired correctly but the
pipeline-visible latency cost was real.

Investigation (see commit `97db83fc` and tonight's session log)
confirmed that the KYB decision path does **not** read Docling's
Markdown output:

* `cz_financials_extractor` + `cz_bank_financials_extractor` use
  `pypdf` directly for numerical extraction.
* OSINT agents (`registry_agent`, `synthesis_agent`, `osint_agent`)
  consume only the first ~2000 chars of each document as LLM prompt
  context — raw text from pypdf is functionally equivalent.
* Docling's layout-preserved Markdown is consumed **only** by the
  dashboard Evidence-tab renderer for human-readable document viewing.

Consequence: the pipeline was blocking the entire investigation on an
expensive computation whose output influenced nothing downstream.

## Decision

Split `registry_and_documents` into two phases along the decision/UX
axis:

1. **Fast synchronous path** (stays inside
   `registry_and_documents`) — download PDFs to MinIO, then invoke
   `_build_summaries_from_pypdf` (runs ~1s per filing) to produce
   short text summaries for the OSINT agents' prompts. Returns in
   ~30–60 seconds for typical filers.

2. **Background Docling activity** (new:
   `extract_documents_markdown` in `backend/app/workflows/docling_activity.py`)
   — runs Docling OCR in parallel with Phase 3 OSINT investigation.
   Writes `.md` files back to MinIO alongside the original PDFs.
   Idempotent via `MinIOService.object_exists()` guard; per-PDF 180s
   `asyncio.wait_for` timeout; heartbeats between PDFs. Budget:
   `start_to_close_timeout=30min`, `heartbeat_timeout=5min`.

The compliance workflow spawns the background activity via
`workflow.start_activity(...)` (detached — not awaited) inside a
try/except so spawn failure never blocks the case.

The dashboard Evidence tab polls a new endpoint
`GET /api/cases/{workflow_id}/documents/markdown-status` every 10
seconds while any document is still `pdf_only`, flipping to
`markdown_ready` as the background activity completes each file.
Per-document badges (amber "PDF" / emerald "MD") signal conversion
progress without blocking officer reading.

## Consequences

### Positive

- **Case wall-clock drops by 2–5 minutes on large filers.** Phase 2
  now returns in ~30–60 seconds instead of 4–10 minutes; the
  difference flows straight to Phase 3 start time.
- **Heartbeat-timeout failure class is eliminated for Phase 2.** The
  activity no longer makes 30–90s blocking Docling calls from its
  synchronous body — the pypdf path streams text in single-digit
  seconds per PDF.
- **Officer UX gains a progressive-enhancement contract.** Officers
  can begin reading PDFs and making decisions immediately; Markdown
  arrives as a cosmetic improvement when ready.
- **Idempotent background activity.** The `object_exists` guard makes
  it safe to retry, safe to re-run, and safe to co-exist with any
  eager Docling calls in the evidence-collector.

### Negative

- **One additional Temporal activity type to track per case.** Visible
  in Temporal UI alongside `run_osint_investigation` during the
  parallel window. The `docling_background_started` audit event and
  the `converted_count` / `timeout_count` return dict expose its
  behaviour.
- **Evidence tab gains a short "PDF only" state** that users must
  understand. The polling badge + tooltip + `aria-label` together
  communicate this; the WCAG 1.1.1 obligation is met.
- **Dashboard polling load.** Every 10 seconds while any doc is
  pending, the frontend calls the markdown-status endpoint. The
  endpoint is cheap (one Postgres read + N MinIO `stat_object` calls,
  bounded by the right-sizing caps at ≤6 docs), so cost is negligible.
  Polling stops entirely once all docs are `markdown_ready`.

## Alternatives considered

- **Aggressive right-sizing only** (shipped earlier in the same
  session: 3-year recency, 20-archive cap, 2-per-decision-type,
  duplicate-Docling elimination). Demo-day work reduced Phase 2 from
  7:11 to 2:52 on Home Credit. Complementary to Option B, not a
  substitute — the synchronous path still blocks on whatever Docling
  work remains after right-sizing.

- **Replace Docling with pypdf everywhere.** pypdf's flat text is
  cosmetically worse than Docling's layout-preserved Markdown for
  Evidence-tab rendering. An officer reading a multi-column IFRS
  balance sheet in flat text versus Markdown is noticeably worse UX.

- **Remove Docling entirely.** Same regression as above.

- **Run Docling in-process as a detached asyncio task** (no new
  activity). Loses Temporal's visibility, retry policy, heartbeat
  protection, and the workflow-history audit trail. The cost of an
  additional activity is one `activity.defn` registration; the
  benefits (retry + durability + observability) are large.

## Implementation

Delivered on branch `feature/docling-async` off master commit
`97db83fc`:

- Task 1 (`1cb87122` + `c1e6b297`) — pypdf summary builder.
- Task 2 (`b4d6192f` + `6d781be7`) — background activity + MinIO
  `object_exists` idempotency.
- Task 3 (`7715472c`) — worker registration.
- Task 4 (`6749125b` + `cc48e69c`) — workflow spawn with explicit
  `task_queue`.
- Task 5 (`aae85591` + `4489b54c` + `64d7ac1d`) — `GET /documents/markdown-status`
  endpoint with DI.
- Task 6 (`3459392b` + `d14cca3d`) — dashboard polling + badges with
  filename-keyed lookup + WCAG `aria-label` / `role="status"`.

All four quality gates green on the terminal commit: pytest (112
passed, 3 pre-existing unrelated failures), ruff `--select F` (clean),
tsc `--noEmit` (exit 0), docs-sync (all up to date).
