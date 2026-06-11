---
id: 0049-cross-reference-identity-mismatch
sidebar_position: 50
title: "ADR-0049: Cross-Reference Identity-Mismatch Detection"
---

# ADR-0049: Cross-reference registration-number identity-mismatch detection

**Status:** Accepted
**Date:** 2026-04-22
**Supersedes:** none
**Superseded by:** none

## Context

During a 2026-04-22 demo rehearsal on the Czech company **EP
Infrastructure, a.s.** the case was submitted with IČO ``04106864``
(wrong — off by one digit from the real ``02413507``). The platform's
reaction exposed a sharp gap in the cross-reference layer:

- **ARES** returned NOT_FOUND for ``04106864`` → critical finding.
- **NorthData** and **GLEIF** name-matched the entity independently
  and returned registration number ``02413507`` → both labelled
  "verified".
- The platform surfaced **both** findings without ever comparing the
  two IDs or telling the officer the submitted identity was wrong.
- Downstream findings cascaded as misleading consequences: no
  Sbírka listin filings (*symptom*, not gap), VIES invalid
  (*symptom*, not compliance risk), ``company_status=not_found``,
  null ``legal_form``, null NACE.

The officer saw seven findings and had to reverse-engineer the root
cause (mistyped IČO) from contradictions between them. That is
exactly the anti-pattern a KYB/KYC automation layer is supposed to
eliminate — "here are seven symptoms, you figure out which is
primary" is worse than no automation.

## Decision

Extend the ``cross_reference_service`` with a **registration-number
comparator** that runs **before** all other field comparisons. Its
output is a dedicated ``identity_mismatch`` finding — not mixed into
the generic field-discrepancy stream — because the identity layer is
causally upstream of every other comparison: if the registration
numbers disagree, every other field comparison becomes meaningless
symptom-noise.

### Severity rules

| State | Severity | Rationale |
|---|---|---|
| All sources agree on the same registration number | corroborated | The happy path. |
| Submitted value differs from ≥2 authoritative secondaries that agree with each other | **HIGH — identity_mismatch** | Near-certain input error. Surface the alternative value as a suggested correction so the officer can act in one click. |
| Secondaries disagree internally, no submitted | MEDIUM | Data-quality signal; not necessarily an error. |
| Only one source has a value | silent | No cross-reference possible. |

### Authoritativeness ordering

Primary: the country-specific registry (ARES for CZ, KBO for BE, INPI
for FR, CVR for DK, …). Secondaries: NorthData, GLEIF, VIES, regional
gazettes — any source that returns a canonical registration number.

The comparator uses **two agreeing secondaries** as the threshold
because a single secondary disagreeing with the primary could be a
secondary-source stale-cache artefact; two agreeing against the
primary is a stronger signal of input error.

## Architectural constraints

**Runs first.** Placed at the very start of the cross-reference
pipeline so that downstream field comparisons inherit the "we already
know the identity is suspect" context. Without this ordering, the
symptomatic findings fire before the root-cause finding — the exact
inverted ordering that confused the EP Infrastructure officer.

**Auto-suggested correction.** When the HIGH branch fires, the finding
includes an ``alternative_value`` field that the dashboard renders
as a one-click "accept suggested correction" button. The pipeline
then re-runs the investigation with the corrected ID.

**Does not auto-correct.** Even with two agreeing secondaries, the
platform does not silently overwrite the submitted value. An officer
makes the call and owns the audit trail — EU AI Act Art. 14 (human
oversight).

## Consequences

- **Root-cause-first finding order.** Identity mismatch fires as a
  critical-tier finding before symptomatic findings so the officer
  sees cause before effects.
- **Downstream suppression (optional future work).** When
  identity_mismatch fires, symptomatic findings could be grouped or
  deprioritized to reduce noise. Deferred — current scope is surfacing
  the root cause, not hiding the symptoms.
- **Cross-country applicability.** The comparator is country-agnostic
  — registration numbers are typed strings across all 12+ supported
  jurisdictions; the comparator only needs to know which sources are
  primary vs. secondary.
- **Integrates with the chatbot.** The chatbot can now surface
  "did you mean IČO 02413507?" directly in the conversation when an
  officer asks about a NOT_FOUND case.

## Alternatives considered

**Auto-correct silently when ≥2 secondaries agree.** Rejected.
Violates EU AI Act Art. 14 human oversight. Also silently masks the
possibility that the officer intentionally submitted a specific ID
(e.g., a known-wrong ID they want to investigate).

**Treat registration-number differences as ordinary field
discrepancies.** Rejected — that's the current behaviour and it's
exactly what broke on EP Infrastructure. Identity is structurally
upstream of field-level comparisons.

**Only compare against the primary registry.** Rejected. If the
primary returns NOT_FOUND (as it did here), there's no canonical
value to compare against. Secondary-pair consensus is what salvages
this case.

## References

- EU AI Act Art. 14 — human oversight
- AMLR Art. 11 — customer identification & verification obligation
- Related: ADR-0024 (entity matching / blocking keys),
  ADR-0043 (cross-country registry parity), ADR-0045 (sanctions FP
  suppression — complementary "symptom-from-cause" separation)
- Incident-driven: EP Infrastructure, a.s. demo rehearsal 2026-04-22
