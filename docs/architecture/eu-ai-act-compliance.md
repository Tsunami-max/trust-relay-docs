---
sidebar_position: 25
title: EU AI Act Compliance
description: How TrustRelay meets EU AI Act requirements for high-risk AI systems
components:
  - app/services/evoi_engine.py
  - app/services/automation_tier_service.py
  - app/prompts/registry.py
last_verified: 2026-03-29
status: implemented
---

# EU AI Act Compliance

## Classification

TrustRelay is classified as a **High-Risk AI System** under the EU AI Act (Article 6, Annex III, Point 5(b)) — AI systems used for risk assessment and fraud detection in financial services.

This classification is not incidental. TrustRelay makes or informs decisions that affect individuals' access to financial services and business relationships. The EU AI Act framework — technical documentation, automatic logging, transparency, human oversight, accuracy monitoring, and quality management — maps directly onto the architectural requirements for a production-grade KYB/KYC compliance platform.

## Article-by-Article Mapping

### Article 11 — Technical Documentation

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| General description of the AI system | Architecture docs at trust-relay.pages.dev | Product overview, data flow, tech stack pages |
| Design specifications and development methodology | S4U Methodology with design-before-code principle | ADR records (17 decisions documented) |
| Information about training data | Not applicable — TrustRelay uses deterministic algorithms + LLM API calls, no custom-trained models | EVOI engine uses mathematical decision theory, not ML training |
| Development and testing procedures | PoC methodology with 90% workflow coverage target | pytest + testcontainers, no mocking without approval |
| Intended purpose and foreseeable misuse | KYB/KYC compliance for financial services onboarding | Documented in PRD and business context |
| Post-market monitoring plan | Case intelligence pattern detection, officer decision calibration | Episodic memory, cross-case pattern analysis |

### Article 12 — Automatic Logging

Article 12 requires high-risk AI systems to automatically record events during operation to enable post-hoc traceability and auditability.

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| Automatic recording of events | `evoi_decisions` table logs every AI decision | 31 rows per case: belief state, EVOI score, decision rationale |
| Traceability of AI operations | `audit_events` table with full event history | Case lifecycle from creation to decision |
| Identification of input data | Every finding has `source` field citing data origin | INSEE, NorthData, OpenSanctions, GLEIF, VIES |
| Network investigation audit trail | Each entity scan logged with EVOI decision, depth, connection weight | Compound risk scores are deterministic and reproducible |
| Immutability | `audit_events` is append-only — never modified or deleted | Architectural constraint enforced at the database layer |
| Retention period | Minimum 5-year retention aligned with 6AMLD/AMLR | Deletion only on explicit officer action; case data retained per AML rules |

The `evoi_decisions` log is the primary compliance artifact for Article 12. Every inference, every investigation decision, every skipped agent is recorded with the inputs that produced it. An auditor can reconstruct the exact state of the belief model at any point in a case's lifecycle.

### Article 13 — Transparency

Article 13 requires that high-risk AI systems be designed so that deployers and affected persons can interpret their output and understand the basis for recommendations.

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| Users can interpret output | Confidence scoring with 4-dimension breakdown | Evidence completeness, source diversity, consistency, calibration |
| Logic behind alerts documented | Every finding includes description + cited sources | "Credible adverse media: Le Monde (2026-03-20), Reuters (2018-04-25)" |
| Risk scores explainable | Compound risk scoring uses deterministic formula | Jurisdiction +30, dissolved +20, shared directors +10 each |
| Recommendation reasoning | ESCALATE verdict includes specific risk drivers | "ESCALATE: corruption allegations; 5 secrecy entities; SPF missing" |
| Model identification | Every LLM call records model version and prompt template | PydanticAI `all_messages()` captured; PromptRegistry tracks version |
| Limitations disclosed | Investigation scope, missing sources, and data freshness surfaced | SPF check failures, VIES API unavailability reported in findings |

The confidence score decomposition — evidence completeness, source diversity, consistency, historical calibration — is specifically designed to satisfy Article 13(2)(b): the system must be interpretable to persons with reasonable technical knowledge. A compliance officer does not need to understand EVOI mathematics to understand "3/7 sources returned data; findings are internally consistent."

### Article 14 — Human Oversight

Article 14 is the most architecturally consequential EU AI Act requirement. It mandates that high-risk AI systems be designed to allow effective oversight by natural persons.

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| Human-in-the-loop by design | `REVIEW_PENDING` state requires officer decision | System never auto-approves — workflow waits for `officer_decision` signal |
| Override capability | Officers can accept/reject/follow-up/escalate | Decision recorded with timestamp and reasoning |
| System recommends, human decides | Recommendation is advisory ("ESCALATE"), not binding | Officer can approve despite escalation recommendation |
| Cannot suppress risk signals | Architectural constraint — findings cascade UP only | Network insights propagate to parent case as HIGH findings |
| Fallback mechanisms | Manual document review always available | Officer can upload/review documents independently of AI |
| Awareness of automation tendency | Confidence scores and source citations prevent blind trust | Officers see exactly which sources are missing |
| Audit of oversight decisions | Officer identity, timestamp, and reasoning recorded | `audit_events` table; decision immutable post-submission |

This is not a paper commitment. The Temporal workflow is structurally incapable of transitioning from `REVIEW_PENDING` to `APPROVED` without a human signal. There is no code path that bypasses this gate. The system can recommend ESCALATE, APPROVE, or REJECT — but the state machine will not advance until an officer issues the `officer_decision` signal.

### Article 15 — Accuracy, Robustness, Cybersecurity

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| Accuracy monitoring | Confidence scoring tracks prediction quality | Historical calibration dimension (agreement rate with officer decisions) |
| Multi-source corroboration | 7+ independent data sources per investigation | Cross-referencing reduces single-source errors |
| Bias mitigation | Fuzzy name matching with diacritics normalization | "Cédric" and "Cedric" matched correctly |
| Data freshness | OpenSanctions auto-refresh (sanctions daily, PEPs weekly) | 831K entities, last refreshed tracked |
| Resilience to data gaps | Guard-and-swallow pattern — individual check failures don't block investigation | PEPPOL failure does not prevent OSINT completion |
| Resilience to adversarial inputs | Source diversity prevents manipulation via single-source poisoning | A false record in one registry is contradicted by others |
| Cybersecurity | Tenant isolation with Row Level Security on all 22 tenant-scoped tables | RLS enforced at DB layer, not application layer |

### Article 17 — Quality Management System

Article 17 requires providers of high-risk AI systems to implement a documented quality management system covering the entire lifecycle.

| Requirement | Implementation | Evidence |
|-------------|---------------|----------|
| Risk management process | EVOI engine with asymmetric utility function | `cost_false_negative` (10,000) >> `reward_correct_approve` (100) — 100x penalty for false approvals |
| Data governance | Source attribution on every fact | `source` field on all findings, SourceBadge in UI |
| Post-market monitoring | Case intelligence learns from officer decisions | Episodic memory, pattern detection across cases |
| Documentation management | ADR records + Docusaurus site | 17 ADRs, 90+ documentation pages |
| Testing and validation | Mandatory quality gates before every commit | ruff F-codes + TypeScript strict before merge |
| Corrective action process | ADR process for any deviation from PRD | New ADR required before implementing significant change |
| Traceability of changes | Git history + ADR records | Every architectural decision recorded with rationale |

---

## EVOI Decision Framework

The Expected Value of Investigation (EVOI) engine is the core AI decision-making component. It satisfies EU AI Act transparency requirements because every decision is mathematically grounded and auditable.

### Mathematical Foundation

```
EVOI(agent) = E[V(b_after)] - V(b_now) - cost(agent)
```

Where:
- `b_now` = current belief state (probability distribution over clean / risky / critical)
- `b_after` = expected belief state after running the agent
- `V(b)` = expected utility of making the optimal decision given belief state `b`
- `cost(agent)` = normalized cost of running the agent (time + API calls)

An agent is run if and only if `EVOI > 0`. This means: "the expected improvement in decision quality exceeds the cost of obtaining the information."

### Utility Function (Asymmetric by Design)

| Decision | Outcome | Utility |
|----------|---------|---------|
| Approve | Entity is clean | +100 |
| Approve | Entity is risky | -1,000 |
| Approve | Entity is critical | -10,000 |
| Reject | Entity is clean | -50 |
| Reject | Entity is risky | +500 |
| Reject | Entity is critical | +1,000 |

The 100x asymmetry between `cost_false_negative` and `reward_correct_approve` is an explicit policy decision: the cost of approving a criminal entity is one hundred times greater than the cost of incorrectly rejecting a clean one. This is encoded in the EVOI utility function, not in ad-hoc rules.

This asymmetry is disclosed to officers via the confidence scoring UI and documented in the ADR for the EVOI engine.

### Logged State Per Decision

Every row in `evoi_decisions` records:

| Field | Description |
|-------|-------------|
| `case_id` | Parent case |
| `iteration` | Workflow iteration number |
| `step_number` | Sequential step within iteration |
| `decision_type` | `investigate`, `skip`, or `snapshot` |
| `entity_id` | Entity being evaluated |
| `p_clean` | Probability mass on "clean" |
| `p_risky` | Probability mass on "risky" |
| `p_critical` | Probability mass on "critical" |
| `evoi_value` | Computed EVOI score |
| `connection_weight` | Strength of link to primary entity |
| `network_depth` | Depth in ownership/directorship graph |
| `scan_tier` | Investigation tier selected |
| `rationale` | Human-readable decision explanation |

For a typical Bolloré SE case, this table contains 31 rows covering the full investigation path: initial belief snapshots, 16 investigate decisions at depth 0, 6 skip decisions (budget exhausted), and 7 depth-1 discoveries.

### Budget and Depth Constraints

The EVOI engine operates under two hard constraints:

- **Budget cap**: Network investigation budget is capped at 3× the primary investigation cost. The system cannot spend unbounded resources on recursive entity discovery.
- **Depth cap**: Recursive network scanning is bounded at `max_network_depth=2`. There are no infinite loops; the recursion terminates by construction.

Both constraints are logged. When an investigation is truncated by budget or depth, the truncation reason is recorded in `audit_events`.

---

## Network Investigation Audit Trail

The network investigation module (entity graph scanning) presents a specific Article 12 compliance challenge: the investigation visits dozens of entities, each with its own risk signal, and the final case finding is a compound of all discovered signals. An auditor must be able to reproduce exactly why the system flagged a subsidiary three hops removed from the primary entity.

The audit trail design handles this as follows:

1. **Entity scan log**: Every entity scanned — primary, subsidiary, director, UBO — is logged with the EVOI decision that authorized the scan.
2. **Finding provenance**: Every finding records which entity it originated from, what scan tier produced it, and which external source returned the data.
3. **Signal propagation log**: When a network finding is promoted to a parent case finding, the propagation is recorded with the connection weight and depth that justified promotion.
4. **Deterministic reproducibility**: Because EVOI is a deterministic mathematical function given the belief state, any historical investigation can be replayed from the logged inputs.

---

## Regulatory Alignment Summary

| EU AI Act Article | Compliance Level | Implementation Mechanism |
|-------------------|-----------------|--------------------------|
| Art. 6 + Annex III (Classification) | Classified correctly | Point 5(b): risk assessment in financial services |
| Art. 11 (Technical Documentation) | Full | ADRs, Docusaurus, methodology, PRD |
| Art. 12 (Automatic Logging) | Full | `evoi_decisions` + `audit_events` tables |
| Art. 13 (Transparency) | Full | Explainable scores, cited sources, model identification |
| Art. 14 (Human Oversight) | Full | Human-in-the-loop by Temporal workflow design |
| Art. 15 (Accuracy & Robustness) | Full | Multi-source, calibration, diacritics normalization |
| Art. 17 (Quality Management) | Full | EVOI asymmetric utility, ADR process, testing gates |

---

## Additional Regulatory Coverage

The EU AI Act compliance architecture intersects with and reinforces several other regulatory frameworks:

### GDPR

| Article | Requirement | Implementation |
|---------|-------------|----------------|
| Art. 22 | Right to human review of automated decisions | Officer decision required — no automated final decisions |
| Art. 25 | Privacy by design | Tenant isolation, Row Level Security on all 22 tenant-scoped tables |
| Art. 30 | Records of processing activities | Audit log captures all processing steps |
| Art. 35 | Data Protection Impact Assessment | Architecture supports DPIA; formal document pending (known gap) |

### AML Directives (6AMLD / AMLR)

| Requirement | Implementation |
|-------------|----------------|
| 5-year minimum retention | Audit events and case data retained; deletion requires explicit officer action |
| SAR-ready audit trail | goAML XML export (Phase 1) generates structured transaction reports |
| Risk-based methodology | EVOI utility function is a documented, auditable risk-based approach |
| Documented due diligence | Each case produces a full investigation report with source citations |

### ISO 42001 — AI Management System

The EVOI framework aligns directly with ISO 42001's risk-based approach to AI governance:

- **Clause 6.1** (Risk assessment): EVOI utility function is a formal risk assessment model with documented parameters.
- **Clause 8.4** (AI system impact assessment): Confidence scoring provides the required uncertainty quantification.
- **Clause 9.1** (Monitoring and measurement): Historical calibration dimension tracks AI decision quality over time.
- **Clause 10.2** (Nonconformity and corrective action): ADR process provides the required corrective action mechanism.

### ISO 27001 — Information Security Management

| Domain | Implementation |
|--------|----------------|
| A.8 (Asset management) | MinIO object storage with tenant-scoped prefixes |
| A.9 (Access control) | Keycloak OIDC, JWKS token validation, RLS at DB layer |
| A.12 (Operations security) | Audit logging, immutable event records |
| A.18 (Compliance) | This documentation; ADR process; testing gates |

---

## Known Gaps

| Gap | Status | Mitigation |
|-----|--------|------------|
| GDPR Art. 35 formal DPIA document | Architecture supports it; document not yet drafted | Low risk — DPIA can be produced from existing documentation |
| ISO 42001 formal certification | Not yet pursued | Framework alignment enables rapid certification path |
| ISO 27001 formal certification | Not yet pursued | Prerequisite for enterprise sales; planned post-PoC |
| Art. 13 transparency notice to data subjects | Portal discloses AI-assisted review | Full notice template pending legal review |

These gaps are known and tracked. None affect the architectural correctness of the compliance implementation; they represent documentation and process formalization work that follows the PoC phase.
