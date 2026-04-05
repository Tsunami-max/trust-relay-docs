---
sidebar_position: 2
title: "Regulatory Compliance Architecture"
description: "EU AI Act, GDPR, and AML as architectural constraints — the five requirements for every AI output and the non-suppression principle"
---

# Regulatory Compliance Architecture

Trust Relay is a KYB/KYC compliance platform operating under three regulatory frameworks. These regulations are not features to add later — they are architectural constraints that shape every design decision from the database schema to the API response format.

---

## Applicable Regulations

### EU AI Act (Annex III — High-Risk AI System)

Trust Relay's AI-driven risk assessment qualifies as a high-risk AI system. The Act imposes specific requirements:

- **Article 11 (Technical Documentation):** Complete documentation of the AI system's design, development, and performance. Every model version, every prompt template, every training dataset must be recorded.
- **Article 12 (Automatic Logging):** All AI operations must be logged automatically, with sufficient granularity to reconstruct any individual decision.
- **Article 13 (Transparency):** Users must understand that they are interacting with an AI system and how AI decisions affect them.
- **Article 14 (Human Oversight):** Human officers must be able to override any AI decision. The system must support meaningful human review, not rubber-stamping.
- **Article 15 (Accuracy & Robustness):** Ongoing monitoring of AI system accuracy, with documented methodology for measuring and reporting performance.

### GDPR (Articles 22, 25, 30, 35)

Automated decision-making about individuals triggers specific rights:

- **Article 22:** Right to human review of automated decisions. Every AI-generated risk assessment must be reviewable by a human compliance officer.
- **Article 25:** Data protection by design. Privacy considerations are architectural constraints, not post-hoc additions.
- **Article 30:** Records of processing activities. Every data processing operation must be documented.
- **Article 35:** Data Protection Impact Assessment required for high-risk processing.

### AML Directives (6AMLD / AMLR)

Anti-money laundering regulations impose record-keeping and audit trail requirements:

- 5-year minimum retention for all KYB/KYC records.
- Audit trail supporting Suspicious Activity Report (SAR) generation.
- Documented risk-based methodology for risk assessment — the methodology itself must be auditable, not just the results.

---

## The Five Requirements for Every AI Output

Every AI-driven decision, recommendation, or risk assessment in the system must satisfy five requirements. These are non-negotiable architectural constraints — the system is designed so that producing an AI output without meeting all five requirements is structurally impossible.

### 1. Input Provenance

What data was the decision based on? Every AI output records its input sources as `SourcedFact` and `EvidenceReference` objects — structured references to the specific documents, database records, or external data sources that contributed to the decision. A regulator reviewing an AI risk assessment can trace every claim to its source data.

### 2. Model Identification

Which model, which version, which prompt template? Every AI execution records the model identifier (e.g., `claude-opus-4-20250514`), the prompt template name, and the prompt version ID. When a prompt template is updated, the `prompt_version_id` foreign key ensures that historical decisions reference the exact prompt that was used, not the current version.

### 3. Chain of Thought

The full reasoning captured. PydanticAI's `all_messages()` method records the complete conversation between the system and the AI model — the prompt, the model's response, any tool calls, and the final output. This is stored as immutable evidence, not as a summary.

### 4. Confidence Scoring

Quantified certainty with documented methodology. Every AI assessment includes a confidence score with a methodology reference explaining how the score was calculated. The scoring methodology is itself an auditable artifact.

### 5. Immutable Audit Log

An append-only `audit_events` table records every state transition in the compliance workflow. The table schema prevents updates and deletes — the immutability guarantee is enforced at the database level, not by application code that might forget to call the audit function. This means the audit trail is tamper-evident: any gap in the sequence of events is detectable.

---

## The Non-Suppression Principle

:::warning Foundational Design Constraint
The system can ADD scrutiny but NEVER suppress risk signals. This is the foundational design constraint for all AI-driven risk assessment in the platform.
:::

Concretely: if an AI model identifies a risk indicator (a sanctions match, a negative media mention, a registration anomaly), the system records the indicator and presents it to the compliance officer. A subsequent AI analysis that does not find the same risk does not remove the indicator — it adds a second opinion alongside the first. The compliance officer sees both and makes the final determination.

Any AI recommendation that would reduce the level of scrutiny applied to a case must be:

1. Traceable to specific evidence that justifies the reduction (not just "the model thinks the risk is low")
2. Flagged for human review before taking effect
3. Recorded in the audit trail with the full reasoning chain

This principle exists because the regulatory consequences of suppressing a legitimate risk signal (missed SAR filing, compliance failure) are orders of magnitude more severe than the operational cost of investigating a false positive. The system is architecturally biased toward caution.

**Evidence:** Trust Relay implements all five requirements through its evidence bundle system (`SourcedFact`, `EvidenceReference`, `evidence_service.py`), the `prompt_version_id` foreign key pattern across AI execution records, PydanticAI `all_messages()` capture, the confidence scoring methodology (Pillar 1), and the append-only `audit_events` table with 33 RLS-protected tables. See the [Evidence appendix](../evidence/trust-relay-metrics) for the architectural rigor metrics.
