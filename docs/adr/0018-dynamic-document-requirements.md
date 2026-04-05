---
id: 0018-dynamic-document-requirements
sidebar_position: 19
title: "ADR-0018: Dynamic Document Requirements"
---

# ADR-0018: Dynamic Document Requirements -- Pre-Investigation Resolution

| | |
|---|---|
| **Date** | 2026-04-02 |
| **Status** | `Accepted` |
| **Deciders** | Adrian Birlogeanu |
| **Context** | Cedric Neve (DigiTeal) feedback -- "only request documents OSINT can't find" |

## Decision

Flip the compliance workflow: run OSINT investigation **before** opening the customer portal. Auto-download official documents from registries (INPI, NBB, ARES), cross-reference all evidence, and compute risk-adaptive document requirements. The portal opens with only the documents the customer actually needs to provide.

### Workflow Change

**Before (static):**
```
CREATED -> AWAITING_DOCUMENTS -> DOCUMENTS_RECEIVED -> PROCESSING -> OSINT -> REVIEW_PENDING
```

**After (dynamic):**
```
CREATED -> PRE_INVESTIGATION -> DOCUMENT_GAP_ANALYSIS -> REQUIREMENTS_REVIEW ->
AWAITING_DOCUMENTS -> DOCUMENTS_RECEIVED -> VALIDATION -> REVIEW_PENDING
```

Three new states added to `CaseStatus` enum:

- **PRE_INVESTIGATION** -- OSINT and registry evidence collection runs before document collection
- **DOCUMENT_GAP_ANALYSIS** -- system computes which documents the customer needs to provide
- **REQUIREMENTS_REVIEW** -- officer reviews computed requirements before the portal opens

### Key Architectural Decisions

1. **Auto-retrieved documents are authoritative** -- official government PDFs from INPI/NBB are the source of truth. No confidence scoring needed for government-sourced documents.

2. **Risk-adaptive automation tiers** -- the review gate behavior (FULL_REVIEW / ASSISTED / AUTONOMOUS) is computed per-case based on risk signals, not configured globally. PEP detection, adverse events, and HIGH discrepancies force FULL_REVIEW. Clean cases get AUTONOMOUS (portal opens immediately).

3. **Cross-reference engine** -- every data point (address, directors, legal form, capital) is compared across all sources. Discrepancies become findings with severity classification. The system can ADD scrutiny but never suppress risk signals (per regulatory design principle).

4. **Fail-safe design** -- if any evidence collection step fails, the system falls back to requesting the document from the customer. The system never silently drops a requirement.

## Consequences

- Customer experience dramatically improves -- typical case may only need Director ID
- Investigation quality improves -- documents are cross-referenced before officer review
- Competitive differentiator vs. traditional platforms that always ask for everything
- New workflow states (PRE_INVESTIGATION, DOCUMENT_GAP_ANALYSIS, REQUIREMENTS_REVIEW) added to CaseStatus enum
- Officer gets a review checkpoint before portal opens (configurable by automation tier)

## Components

- `document_evidence_collector.py` -- downloads registry PDFs, stores in MinIO
- `cross_reference_service.py` -- corroboration matrix across all sources
- `document_gap_analyzer.py` -- coverage analysis + risk escalation + tier computation
- `document_resolution.py` -- Pydantic models for the above

## Related

- State machine: [Case Status State Machine](/docs/architecture/state-machine)
- Spec: `docs/superpowers/specs/2026-04-02-dynamic-document-requirements-design.md`
- EU AI Act Art. 12 (logging), Art. 14 (human oversight) compliance maintained via audit events
- AML risk-based approach: scrutiny proportional to risk (6AMLD/AMLR)
