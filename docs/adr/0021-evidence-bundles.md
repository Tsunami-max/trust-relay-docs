---
id: 0021-evidence-bundles
sidebar_position: 22
title: "ADR-0021: Evidence Bundle System"
---

# ADR-0021: Evidence Bundle System for EU AI Act Chain-of-Thought Capture

**Date:** 2026-03-06 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Trust Relay is classified as a high-risk AI system under EU AI Act Annex III (creditworthiness assessment and risk scoring for financial services). Article 12 mandates automatic logging of all AI operations with sufficient detail to enable post-hoc auditing. Article 13 requires transparency -- users (compliance officers) must be able to understand how the system reached any recommendation. Article 14 requires human oversight with the ability to interpret AI outputs and override them.

The OSINT investigation pipeline uses PydanticAI agents that query external data sources, synthesize findings, and produce risk assessments. Each agent execution involves: input data selection (what sources were queried), model inference (which LLM processed the data, with what prompt), and output generation (findings with confidence scores). For regulatory compliance, the full chain of thought -- from raw input to final output -- must be captured, stored immutably, and retrievable per case.

A compliance officer reviewing a case must be able to answer: "What exact data did the AI see when it flagged this company as high-risk?" and "Can we reproduce this assessment if the regulator asks?" These questions cannot be answered from the final report alone -- they require the intermediate reasoning steps.

## Decision

We capture the full chain of thought for every PydanticAI agent execution as **Evidence Bundles** stored in MinIO. Each bundle is a structured JSON document containing:

1. **Input artifacts** -- for each data source consumed by the agent:
   - `source`: identifier of the data source (e.g., "kbo_api", "opensanctions", "tavily_search")
   - `sha256_hash`: hash of the raw input data at time of consumption
   - `confidence`: source reliability score
   - `timestamp`: when the data was retrieved

2. **Output findings** -- for each finding produced by the agent:
   - `description`: human-readable finding text
   - `source_url`: link to the original data source (when available)
   - `confidence`: finding confidence score with methodology reference
   - `severity`: classification (INFO, LOW, MEDIUM, HIGH, CRITICAL)

3. **Full PydanticAI message history** -- the complete `all_messages()` output:
   - Model name and version (e.g., "gpt-4o-2024-08-06", "claude-sonnet-4-20250514")
   - Token counts (prompt tokens, completion tokens)
   - Timestamps for each message exchange
   - `finish_reason` for each model response
   - Tool calls and tool results (when agents use tools)

4. **Determinism proof** -- SHA-256 hash of the serialized input bundle and SHA-256 hash of the serialized output bundle, stored as a pair for reproducibility verification.

Evidence bundles are stored at: `{case_id}/iteration-{n}/evidence_bundles/{agent_name}.json`

The feature is toggled via the `capture_evidence_bundles` configuration setting (enabled by default in production, can be disabled in development for performance).

## Consequences

### Positive
- Full EU AI Act Art. 12 compliance -- every AI operation is logged with sufficient detail for regulatory audit
- Art. 13 transparency -- officers can inspect exactly what data the AI processed and how it reached its conclusions
- Art. 14 human oversight -- the evidence bundle provides the context needed for an officer to meaningfully override an AI recommendation
- SHA-256 hash pairs enable determinism verification -- given the same input hash, the system should produce the same output hash
- MinIO storage means evidence bundles benefit from existing backup, retention, and access control infrastructure
- Evidence bundles are per-agent, enabling granular debugging ("the Registry Agent saw correct data, but the Synthesis Agent misinterpreted it")

### Negative
- Storage overhead -- a typical 4-agent investigation produces 4 evidence bundles totaling 50-200 KB. Over thousands of cases, this accumulates (mitigated by MinIO lifecycle policies)
- Performance impact -- serializing and uploading evidence bundles adds 200-500ms per agent execution. The `capture_evidence_bundles` toggle allows disabling this in development
- Message history captures the full prompt template -- if prompt templates contain proprietary logic, evidence bundles must be treated as confidential (same access control as case data)

### Neutral
- Evidence bundles are write-once, read-rarely -- most bundles are never read unless a specific case is audited or a decision is contested
- The bundle format is a Trust Relay-specific schema, not a standard like OpenTelemetry traces. Integration with external audit tools requires a mapping layer
- Langfuse traces complement but do not replace evidence bundles -- Langfuse captures operational telemetry while evidence bundles capture the regulatory audit trail

## Alternatives Considered

### Alternative 1: Database-only storage (PostgreSQL JSONB)
- Why rejected: Evidence bundles contain full message histories that can be large (50-200 KB per agent). Storing these as JSONB in PostgreSQL creates bloated rows that degrade query performance on the cases table. MinIO is purpose-built for object storage and already holds case documents, making it the natural location for evidence artifacts. PostgreSQL stores only the bundle metadata (path, hashes, timestamp) as lightweight references.

### Alternative 2: Unstructured logging (application logs)
- Why rejected: Application logs are ephemeral, unstructured, and not designed for regulatory audit. They lack the SHA-256 hash chain needed for determinism proof. Searching logs for a specific case's AI reasoning requires log aggregation infrastructure (ELK, Datadog) that adds operational complexity. Structured evidence bundles in MinIO are directly addressable by case ID and iteration number.

### Alternative 3: Third-party observability only (Langfuse)
- Why rejected: Langfuse excels at operational observability -- latency tracking, token usage monitoring, prompt version comparison. However, it does not capture the input/output SHA-256 hash chain required for EU AI Act reproducibility proof. It also stores data in a third-party system, which complicates data residency requirements (GDPR Art. 44-49 on international transfers). Evidence bundles in self-hosted MinIO keep all regulatory data within the deployment boundary. Langfuse is used as a complementary tool for operational monitoring, not as the audit trail.
