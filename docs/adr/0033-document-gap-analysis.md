---
id: 0033-document-gap-analysis
sidebar_position: 34
title: "ADR-0033: Document Gap Analysis Engine"
---

# ADR-0033: Document Gap Analysis Engine

**Status:** Accepted
**Date:** 2026-04-06

## Context

ADR-0018 established the principle of running OSINT before the customer portal opens, so the system only requests documents that OSINT cannot provide. This ADR documents the engine that implements that decision -- the three-step gap analysis algorithm that determines exactly which documents a customer must submit.

The challenge is non-trivial: the system must compare heterogeneous evidence (structured API responses, scraped web data, cross-referenced findings, downloaded registry PDFs) against a template's document requirements and determine which requirements are "covered" by OSINT evidence. Different countries have different registry capabilities -- Belgium's Staatsblad gazette publication IS the official articles of association, while France's INPI provides separate legal acts. The coverage logic must encode these country-specific equivalences.

Beyond simple coverage, risk signals discovered during pre-investigation may trigger additional document requirements. A company with PEP directors, adverse media hits, or HIGH-severity discrepancies needs more scrutiny, which means more documents -- even if the base template requirements are covered by OSINT.

## Decision

Implement a stateless `DocumentGapAnalyzer` with a three-step pipeline:

1. **Coverage analysis** -- maps each template requirement against OSINT evidence using three mechanisms:
   - **Corroboration map** (`_CORROBORATION_MAP`): if multiple OSINT sources agree on a fact (e.g., registered address confirmed by both registry and VIES), the corresponding document requirement is marked as covered
   - **Document type map** (`_REQUIREMENT_TO_DOC_TYPES`): if the registry document collector downloaded a document that satisfies a requirement (e.g., Belgian gazette publication covers `articles_of_association`), mark it as covered
   - **Never-covered set** (`_NEVER_COVERED`): physical documents like `director_id` can never be auto-retrieved and always require customer submission

2. **Risk escalation** -- examines pre-investigation findings for risk triggers and adds document requirements that were not in the base template. PEP detection adds enhanced due diligence documents. HIGH-severity discrepancies add supporting evidence requirements. Young companies (< 12 months) may trigger additional documentation.

3. **Automation tier computation** -- classifies the case into one of three tiers based on the aggregate risk profile:
   - `AUTONOMOUS`: clean case, portal opens immediately without officer review
   - `ASSISTED`: moderate signals, officer gets 15-minute timeout to review before portal auto-opens
   - `FULL_REVIEW`: PEP, adverse events, or HIGH discrepancies detected -- officer must explicitly approve before portal opens

The output is a `ResolvedDocumentRequirements` object containing the manifest of required documents, cross-reference results, and the computed automation tier. This is stored with the case and drives the portal's document upload form.

## Consequences

### Positive
- Customers typically only need to provide Director ID -- dramatically better experience than uploading 5-10 documents
- Risk-proportionate: clean cases move fast, risky cases get more scrutiny (AML risk-based approach per 6AMLD)
- Country-specific document equivalences are encoded declaratively in maps, not scattered in conditionals
- Fail-safe: if OSINT coverage analysis fails or evidence is ambiguous, the document falls back to "required from customer"

### Negative
- Coverage maps (`_CORROBORATION_MAP`, `_REQUIREMENT_TO_DOC_TYPES`) must be maintained per country as new registries are added
- The "never covered" set is hardcoded -- future biometric identity verification could make `director_id` auto-retrievable, requiring code changes
- Automation tier thresholds are currently fixed in code rather than configurable per segment profile

### Risks
- Over-aggressive coverage marking could skip a document that OSINT data appears to cover but actually contains errors -- mitigated by the cross-reference engine flagging discrepancies
- Under-coverage (requesting documents OSINT already has) wastes customer time but has no compliance risk -- the fail-safe direction
