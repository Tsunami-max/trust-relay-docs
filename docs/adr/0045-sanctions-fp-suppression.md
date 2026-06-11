---
id: 0045-sanctions-fp-suppression
sidebar_position: 46
title: "ADR-0045: Sanctions FP Suppression"
---

# ADR-0045: Sanctions False-Positive Suppression — Evidence-Based, Tenant-Scoped, Always Visible

**Status:** Proposed
**Date:** 2026-04-18

## Context

Sanctions screening (OpenSanctions bulk feeds, plus forthcoming commercial enrichers) returns many hits per case. Based on Gino de Jeu's 2026-04-13 observation ("false positives in sanctions screening are a major operational burden; WorldCheck returns hits on names with barely any similarity, creating unnecessary workload") the burden on compliance officers is the single largest time-cost in the current workflow.

A naive approach — "let the model learn which hits to dismiss" — is regulator-hostile for four reasons:

1. **Asymmetric failure cost.** A single missed true-positive is a felony-grade breach (sanctions-list party transacts). A 10% drop in false-positive rate is convenience. Regulators do not reward efficiency; they punish breach.
2. **EU AI Act Art. 14 — human oversight.** The system may ADD scrutiny but never silently SUPPRESS a risk signal. Any automation that removes a hit from view is legally suspect.
3. **Explainability.** "Our model estimates 0.03 probability" will not survive a supervisor interview. "The sanctioned person's DOB is 1975-03-12 but our customer's is 1982-07-04, confirmed by Officer X on Date Y" will.
4. **Name matching is fuzzy.** "Muhammad Ali" matches ~4,000 OpenSanctions records. Common-name matching without discriminators is structurally high-FP.

The `sanctions_suppression_rules` / `false_positive` pattern does not exist in the codebase today (verified via grep). Officer feedback via `submit_finding_feedback` is captured but not written back as future-screening suppression rules — the feedback loop is open.

## Decision

Build a **three-tier suppression engine** where every dismissal is rule-based, regulator-auditable, tenant-scoped, and visible (never deleted) to preserve Art. 14 human oversight.

### Tier 1 — Evidence-based auto-dismissal

Automatic dismissal only when **two or more unambiguous discriminators** contradict the sanctioned record:

| Discriminator | Auto-dismiss when |
|---|---|
| **Date of birth** | Both records have unambiguous DOB AND differ by more than 7 days |
| **Year of birth** | Both have YOB (when full DOB absent) AND differ by more than 2 years |
| **Nationality** | Both records have unambiguous nationality AND differ |
| **Date of death** | Sanctioned record is deceased AND our customer shows activity post-death |
| **LEI** | Our entity has an LEI AND it doesn't match any sanctioned LEI |
| **Gender** | Both have unambiguous gender AND differ (use cautiously — gender data is unreliable for non-binary names) |

**Threshold: at least 2 independent discriminators must mismatch.** Single-discriminator mismatches remain in the "Requires review" queue — the cost of a data-entry error on DOB is too high to dismiss on DOB alone.

**No ML.** Deterministic rule evaluation. Every dismissal logs the exact discriminator values compared.

**Expected impact:** 20–30% of incoming hits auto-dismissed, regulator-defensible by construction.

### Tier 2 — Officer-originated learned rules (tenant-scoped)

When an officer manually dismisses a hit that Tier 1 couldn't auto-resolve, capture the decision as a structured suppression rule stored in a new `sanctions_suppression_rules` table:

```sql
CREATE TABLE sanctions_suppression_rules (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id),
    sanctioned_record_id        TEXT NOT NULL,   -- OpenSanctions entity ID or similar
    our_discriminator_hash      TEXT NOT NULL,   -- HMAC(name + dob + nat) tenant-salted
    normalized_name             TEXT NOT NULL,   -- audit breadcrumb
    rationale                   TEXT NOT NULL,   -- free text, mandatory
    evidence_refs               JSONB DEFAULT '[]',
    created_by                  UUID NOT NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at                  TIMESTAMPTZ NOT NULL,   -- default now() + 12 months
    last_fired_at               TIMESTAMPTZ,
    fire_count                  INTEGER NOT NULL DEFAULT 0,
    revoked_at                  TIMESTAMPTZ,
    revoked_by                  UUID,
    revocation_reason           TEXT
);

ALTER TABLE sanctions_suppression_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_suppression_rules FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON sanctions_suppression_rules
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

Future hits matching a rule's `sanctioned_record_id + our_discriminator_hash + tenant` are rendered as "previously dismissed" collapsed rows with the rationale visible and a one-click un-suppress.

**Tenant-scoped, not global**: a customer confirmed as "Muhammad Ali the athlete" at Bank A does not exonerate a different "Muhammad Ali" at Bank B.

**12-month expiry**: sanctions lists change, customer circumstances change, regulatory stances change.

### Tier 3 — Periodic re-check (safety net)

A Temporal `SanctionsSuppressionRefreshWorkflow` that runs nightly:

1. Re-fetches the latest sanctions feed (already cached, ADR-0032 circuit breaker applies)
2. For each active suppression rule, re-evaluates Tier-1 discriminators against the latest sanctioned record
3. If the sanctioned record changed (new alias, corrected DOB, deceased date added), flag the rule for officer re-review
4. If the customer now matches a **different** sanctioned record (new OFAC listing), the new hit is NOT covered by the old rule → surfaces in "Requires review"
5. Rules within 30 days of expiry surface in a "Pending renewal" queue

## The visibility contract

**Automation NEVER:**
- Removes a hit from the UI
- Deletes a suppression rule without officer action
- Uses opaque ML models that cannot justify a dismissal in one sentence
- Suppresses on single-discriminator evidence
- Applies one officer's dismissal to another officer's customer

**Automation ALWAYS:**
- Renders suppressed hits in a collapsed "Auto-dismissed (N)" or "Previously dismissed (N)" group
- Shows rationale + created-by + created-at on every suppressed hit
- Logs audit events on every auto-dismissal, every rule creation, every rule fire, every override
- Expires rules at 12 months and forces re-review
- Re-evaluates rules against live sanctions data

## Regulatory mapping

| Requirement | Implementation |
|---|---|
| EU AI Act Art. 12 (automatic logging) | Every Tier-1 auto-dismiss + Tier-2 rule fire writes to `audit_events` with the discriminator values |
| EU AI Act Art. 13 (transparency) | Every suppressed hit renders its rationale + rule-id inline; officer sees why |
| EU AI Act Art. 14 (human oversight) | Hits are never deleted, always visible + expandable, one-click override, 12-month forced re-review |
| AMLR Art. 28 (CDD baseline) | Sanctions screening itself continues; suppression is a post-hoc dismissal layer |
| AMLR Art. 21 (perpetual KYC) | Tier 3 batch re-check feeds the periodic-review pipeline (ADR-0044, forthcoming) |
| GDPR Art. 22 (right to human review) | Officer's override un-suppresses the hit; original screening decision preserved in audit |

## Alternatives considered

### A) Machine-learning dismissal classifier

Train a model on officer decisions to predict dismissal probability. Rejected:
- Explainability gap for regulator interviews ("why did the model suppress this?").
- Asymmetric failure cost — a misclassified true-positive is catastrophic.
- Model drift requires regular re-training and calibration against live sanctions data.
- No clear regulator precedent; supervisory tolerance is unclear.

We may re-visit this as a **confidence-tier advisor** (recommending officer attention to the highest-risk hits) without gating dismissal.

### B) Threshold-based auto-dismissal on name similarity alone

Reject any hit below a fuzzy-similarity threshold. Rejected:
- Fuzzy matching is semantically noisy — transliterations, aliases, and common-name collisions defeat name-only thresholds.
- Removes the cheapest and highest-value discriminators (DOB, nationality) from consideration.
- Single-signal decisions fail the "defensible under supervisor review" bar.

### C) Global (cross-tenant) suppression rules

A customer confirmed as FP at Bank A is auto-dismissed at Bank B. Rejected:
- Pillar 6 (data sharing between tenants) was explicitly dropped (see `memory/feedback_pillar6_dropped.md`) — compliance officers reject any form of cross-tenant data sharing.
- Different tenants operate under different regulatory umbrellas; a dismissal rationale at Bank A may not apply at Bank B.
- GDPR Art. 6 (lawful basis) is weaker for cross-tenant data flows than for single-tenant learning.

## Measurable outcomes

| Metric | Target | Safety check |
|---|---|---|
| Tier 1 auto-dismissal coverage | 20–30% of incoming hits | Officer override rate on auto-dismissals ≤ 2% |
| Tier 2 learned-rule coverage (6-month runrate) | +30% of post-Tier-1 hits | Officer override rate on learned rules ≤ 2% |
| Average officer time per sanctions hit | -80% vs baseline | SAR filing rate unchanged |
| % of rules still active at 12-month expiry (renewal rate) | 40–60% (not 100% — rules should age out) | Manual review rate at expiry tracked |
| Regulator-audit findings on suppression | 0 | Full audit trail available at all times |

## Implementation order

1. **Week 1 (this ADR + Tier 1):** Alembic migration, ORM model, Tier-1 rule engine, wire into sanctions resolver output, UI groups "Requires review" / "Auto-dismissed (N)", officer override restores hit. Ship-able on its own.
2. **Week 2 (Tier 2):** Officer-dismissal capture UX (rationale + evidence_refs), suppression-rule write path, rule-fire matching at screening time.
3. **Week 3 (Tier 3):** `SanctionsSuppressionRefreshWorkflow` Temporal nightly job, rule-expiry queue in dashboard, re-evaluation against updated feeds.

## Consequences

### Positive
- Reduces sanctions-screening officer burden by 50–80% over 6 months as rules accumulate.
- Regulator-defensible by construction (every dismissal has a structured audit row and a rationale).
- Tenant-scoped design preserves GDPR isolation and regulator trust.
- Learns from officer expertise over time (Tier 2) without handing control to a model.
- Completes the `submit_finding_feedback` loop that exists but has no write-back path.

### Negative
- Not a full automation — officers still review 50–80% of hits in the first 6 months. The promise is honest.
- Operational overhead of rule expiry + renewal queue.
- Curation burden: as Tier 1 discriminator logic encounters edge cases (e.g., sanctioned records with missing DOB vs customer with full DOB), the "safe" threshold will need tightening over time.
- No cross-tenant learning (a chosen constraint, but a real cost in network effect).

### Risks
- **Poorly curated rules let true positives through.** Mitigated by: Tier 1 requires ≥2 discriminators, Tier 2 requires officer rationale, Tier 3 re-evaluates nightly, 12-month expiry forces re-review.
- **Customer identity theft or typo corrections create stale dismissal rules.** Mitigated by: rules are hash-scoped (`name + dob + nat`); if the customer's DOB is corrected, the rule no longer matches and the hit resurfaces.
- **Sanctions feed gap-out.** Mitigated by: circuit breaker (ADR-0032) + last-known-good cache.

## Follow-ups

- **Future ADR** — cross-referencing sanctions suppression with perpetual KYC (ADR-0044): when a periodic review re-runs, previously-suppressed hits must be re-evaluated against the latest feed, not assumed stale.
- **Fuzzy-name discriminator** — when the sanctioned record name and the customer name share a partial match (e.g., "Ahmed Mohammed" vs "Mohamed Ahmed"), consider a linguistic-distance discriminator as a 7th auto-dismiss signal. Risky — deferred until Tier 1 is observed in production.
- **Commercial list integration** — WorldCheck, Dow Jones, LexisNexis — if integrated, extend the auto-dismissal engine to their schema.
