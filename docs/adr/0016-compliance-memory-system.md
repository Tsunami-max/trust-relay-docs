---
id: 0016-compliance-memory-system
sidebar_position: 17
title: "ADR-0016: Compliance Memory System"
---

# ADR-0016: Compliance Memory System

| | |
|---|---|
| **Date** | 2026-03-01 |
| **Status** | `Accepted` |
| **Deciders** | Adrian Birlogeanu |

## Context

Pipeline agents (synthesis, task generation, MCC classification) lack knowledge of officer interaction patterns. When an officer dismisses an AI-suggested task, approves a case despite an amber finding, or corrects the AI assistant, the system forgets this immediately. The next case starts from zero context.

This creates three problems:

1. **Repeated mistakes**: The synthesis agent may flag the same type of minor address discrepancy that the officer has consistently dismissed across 20 cases. The task generator creates follow-up tasks that the officer always deletes. The officer wastes time re-correcting the same AI behaviors.

2. **No institutional knowledge**: When a compliance team develops internal policies (e.g., "Belgian companies with NL/FR address variants are not discrepancies"), these policies exist only in officer memory. New officers or the AI have no access to accumulated organizational knowledge.

3. **Risk of over-adaptation**: A naive learning system could learn to suppress risk signals based on officer approvals. If an officer approves several cases with sanctions fuzzy matches, the system might learn to de-emphasize sanctions -- which would be a compliance failure. Any memory system must include a hard safety guarantee against risk suppression.

## Decision

Implement a three-layer compliance memory system:

### Layer 1: Signal Capture (PostgreSQL)

Every officer interaction is classified deterministically and persisted to a `signal_events` table:

- **Judgment signals** (7 types): case approvals, rejections, escalations, finding overrides, risk level changes. Classified as `non_suppressible` -- these represent compliance decisions.
- **Preference signals** (6 types): suggestion acceptances, modifications, custom tasks, chat corrections. Classified as `preference_only` -- these inform personalization.
- **Behavioral signals** (4 types): section time spent, report expansions, evidence downloads, chat questions. Classified as `preference_only` -- lowest-priority learning signal.

Signal capture is guarded by `signal_capture_enabled` (default `True`). When disabled, all capture methods are silent no-ops. Errors are logged but never propagated -- signal capture is non-blocking and best-effort.

### Layer 2: Letta Archival Memory (Optional RAG)

Officer signals are asynchronously ingested from PostgreSQL into Letta's archival memory. Each officer gets a dedicated Letta agent with:

- **Memory blocks**: `officer_profile` (identity), `active_preferences` (evolving)
- **Archival memory**: Vector-stored signal passages with metadata for semantic search
- **RAG retrieval**: Pipeline agents query the officer's archival memory at runtime, receiving up to 3 relevant precedents that are injected into the LLM prompt

Letta is guarded by `letta_enabled` (default `False`). When disabled, no RAG context is injected and the pipeline runs identically to the pre-memory system. The Letta SDK is imported lazily -- if the `letta-client` package is not installed, the service degrades to disabled mode without import errors.

Letta runs self-hosted in docker-compose. No signal data leaves the deployment infrastructure.

### Layer 3: Safety Invariant (PydanticAI Output Validator)

A PydanticAI output validator on the synthesis agent enforces the cardinal safety rule:

> **The system may learn to ADD scrutiny but NEVER SUPPRESS risk signals.**

The validator (`validate_no_risk_suppression`) checks that all high/critical OSINT risk signals from adverse media and person validation data appear in the synthesis output. If any risk category is missing from the output, the validator raises `ModelRetry`, forcing the LLM to re-generate with the missing risks included.

The safety invariant is **unconditional** -- it runs regardless of feature flag state, whether Letta is enabled, or whether RAG context was injected. This makes the non-suppression guarantee independent of all configuration.

### API Surface

- `POST /api/cases/{wid}/signals` (202) -- capture a signal (fire-and-forget)
- `GET /api/memory/status` -- system status with signal counts and Letta connection state
- `POST /api/memory/reset` -- clear all memory state (demo/showcase)

### Frontend Integration

A `captureSignal()` helper in `frontend/src/lib/signals.ts` provides fire-and-forget signal emission. Three UI components emit signals: DecisionActions (decisions), FollowUpTasks (task interactions), and AI Assistant Chat (corrections/feedback).

## Consequences

### Positive

- **Progressive improvement**: Officers get better AI suggestions over time as the system learns their patterns and preferences. A synthesis agent that has seen 50 officer decisions produces more relevant reports than one starting cold.
- **Safety guarantee**: The PydanticAI output validator makes risk suppression impossible at the architectural level. Even if RAG context suggests de-emphasizing a risk, the validator will catch and reject the output.
- **Zero-impact degradation**: With `letta_enabled=False` (the default), the system operates identically to the pre-memory implementation. Signal capture to PostgreSQL still occurs (for future analysis) but no RAG context is injected.
- **EU-first data sovereignty**: Letta runs self-hosted in docker-compose. Officer behavior data stays within the deployment boundary. No external API calls for memory operations.
- **Institutional knowledge accumulation**: Signal data in PostgreSQL provides a queryable record of officer decision patterns, useful for compliance audits and team onboarding.

### Negative

- **Letta operational overhead**: Running Letta adds a container to docker-compose with its own model and embedding configuration. Letta's archival memory uses vector storage that consumes disk and memory proportional to signal volume.
- **Cold start**: New officers have empty archival memory. The system provides no benefit until sufficient signals accumulate (estimated 20-50 decisions for meaningful RAG context).
- **Signal volume growth**: The `signal_events` table grows with every officer interaction. Production deployments will need a retention policy or archival mechanism for old signals.

### Neutral

- The safety validator adds one validation pass per synthesis generation. In cases with no high/critical OSINT risks (the majority), the validation is a no-op that returns immediately.
- Signal classification is fully deterministic (no LLM, no configuration). Adding a new signal type requires a code change to the classification sets.
- The Letta agent-per-officer model means officer preferences are isolated. Cross-officer knowledge sharing is not supported in this design.

## Alternatives Considered

### Fine-tuning LLMs on officer feedback

Train a custom model variant on officer decision history. Rejected because fine-tuning requires significant data volume (thousands of examples), creates model versioning complexity, and makes safety guarantees harder to enforce. RAG provides equivalent personalization with a simple output validator for safety.

### In-process vector store (Chroma/FAISS)

Use an in-process embedding store instead of Letta. Rejected because Letta provides agent-scoped memory management, sleep-time consolidation, and a well-defined archival memory API. An in-process store would require building these abstractions from scratch.

### Rule-based preference system (no LLM retrieval)

Store officer preferences as structured rules (e.g., "ignore address mismatches below severity X") and apply them deterministically. Rejected because the space of possible preferences is too large to enumerate, and natural-language RAG handles nuanced preferences (e.g., "this officer prefers concise reports") that rules cannot capture.

### Shared team memory (single Letta agent for all officers)

Use one Letta agent for the entire compliance team. Rejected because officer preferences can conflict (one officer may be more risk-tolerant than another), and shared memory would create interference. Per-officer agents ensure clean isolation. Cross-team knowledge sharing can be added later via a separate "organizational policy" agent.

### Prompt-only memory (append signal history to every prompt)

Include the last N signals directly in the synthesis prompt without archival memory or RAG. Rejected because prompt context windows are finite and the signal history grows linearly. RAG retrieves only the most relevant signals, keeping prompt size bounded regardless of history length.
