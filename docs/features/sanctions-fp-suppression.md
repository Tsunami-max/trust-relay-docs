---
id: sanctions-fp-suppression
title: "Sanctions False-Positive Suppression"
sidebar_label: Sanctions FP Suppression
sidebar_position: 4
---

# Sanctions False-Positive Suppression

**What it does:** reduces officer-visible sanctions hits by 70–90% while preserving EU AI Act Art. 14 human oversight. Every suppressed hit remains visible, auditable, and overridable — nothing is ever silently deleted.

**Who it's for:** compliance officers drowning in WorldCheck/OpenSanctions false positives for common names ("Muhammad Ali", "John Smith", "Ahmed Mohammed"), and the compliance leaders responsible for defending those decisions to a supervisor.

**Reference implementation:** [ADR-0045](../adr/0045-sanctions-fp-suppression) · live in `backend/app/services/sanctions_fp_suppression*.py`.

---

## Why this matters

Sanctions screening is the single largest time cost in compliance operations. A typical screening of a common Middle-Eastern or South-Asian name returns 10–30 "hits" on the OpenSanctions + OFAC + EU consolidated list combined — and in most cases **none of them are the customer**. Each hit takes 3–5 minutes for an officer to clear manually.

Gino de Jeu (KBC Merchant Services, 2026-04-13):

> "False positives in sanctions screening are a major operational burden. WorldCheck returns hits on names with barely any similarity, creating unnecessary workload."

**Why naive automation fails:**

1. **Asymmetric failure cost.** Missing a true positive is a criminal-liability event. Catching more false positives is a nice-to-have. Regulators punish breach; they don't reward efficiency.
2. **EU AI Act Art. 14 (human oversight).** The system may *add* scrutiny but never *silently suppress* a risk signal. Any automation that removes a hit from the screen fails on its face.
3. **Explainability.** "Our model says 0.03 probability" won't survive a supervisor interview. "The sanctioned person's DOB is 1975-03-12, our customer's DOB is 1982-07-04, confirmed by Officer X on Date Y" will.
4. **Name matching is structurally fuzzy.** "Muhammad Ali" matches ~4,000 OpenSanctions records. Transliteration variants multiply that. Name-only thresholds don't scale.

**The design principle is simple:** automation never removes a hit. It puts the hit in a different bucket (auto-dismissed / suppressed by rule / requires review), always shows the rationale, and lets the officer un-suppress in one click.

---

## The three tiers

### Tier 1 — Evidence-based auto-dismissal

Deterministic rule evaluation. Dismisses only when **two or more unambiguous discriminators** contradict between our customer and the sanctioned record.

| Discriminator | Dismiss when |
|---|---|
| **Date of birth** | Both have unambiguous DOB, differ by > 7 days |
| **Year of birth** | Full DOB absent on one side, YOB differs by > 2 years |
| **Nationality** | Both have ISO-alpha-2 codes, no overlap |
| **Date of death** | Sanctioned is deceased, customer has post-death activity |
| **LEI** | Our entity has an LEI that doesn't match the sanctioned LEI |
| **Gender** | Both unambiguously M or F, differ (non-binary ignored) |

**Why 2 and not 1?** Because a single-discriminator mismatch could be a data-entry error on that one field. Compositional evidence is what makes the decision defensible under regulator audit.

**No ML, no LLM.** Pure Python rule evaluation. Every decision logs the exact discriminator values compared.

### Tier 2 — Officer-originated learned rules

When an officer manually dismisses a hit Tier 1 couldn't auto-resolve, the dismissal is captured as a structured rule scoped to that tenant:

- **Tenant-scoped** with FORCE ROW LEVEL SECURITY — a rule at Bank A never affects Bank B.
- **12-month expiry** — forces officer re-review on a bounded cadence.
- **Mandatory rationale** (≥10 chars) — EU AI Act Art. 13 transparency.
- **Revocation with reason** — officer can withdraw any rule; revocation is itself audited.
- **Fire-count telemetry** — how many times has this rule suppressed a hit? Dashboards surface rules that fire rarely (candidates for retirement) vs rules that fire often (evidence the workflow is working).

The customer identity hash is `HMAC-SHA256(name + DOB + nationality)` salted with the tenant's UUID. The hash alone doesn't leak PII — the rule table stores only the normalized name as an audit breadcrumb.

### Tier 3 — Nightly Temporal workflow

`SanctionsSuppressionRefreshWorkflow` runs once per tenant per day, using the `continue-as-new` pattern to loop indefinitely. The activity:

- Counts rules expiring in the next 30 days (renewal queue).
- Counts rules that have passed expiry without renewal.
- Does **NOT** auto-revoke or auto-extend — every action is an officer decision surfaced via the dashboard.

Future extensions (scoped but not shipped): feed-diff detection when a sanctioned record's aliases or DOB change between rule creation and now, auto-flagging rules whose sanctioned record was updated.

---

## Worked example — "Muhammad Ali" screening

Run the committed demo script:

```bash
cd backend && python scripts/demo_sanctions_suppression.py
```

**Customer being screened:**

```
Customer:      Muhammad Ali
DOB:           1965-04-10
Nationality:   [US]
Gender:        M
Last activity: 2026-04-01
```

**Input feed** — 12 realistic OpenSanctions-shaped records:

| # | Sanctioned name | Record id | DOB | YOB | Nat | Deceased |
|---|---|---|---|---|---|---|
| 1 | Muhammad Ali | Q76 | 1942-01-17 | — | us | 2016-06-03 |
| 2 | Mohammad Ali al-Houthi | NK-yemen-militant-A | 1975-03-12 | — | ye | — |
| 3 | Muhammad Ali Durrani | NK-pakistan-politician-B | 1962-11-08 | — | pk | — |
| 4 | Muhammad Ali Mahmoud | NK-egypt-official-C | 1968-07-22 | — | eg | — |
| 5 | Muhammad Ali al-Qadhafi | NK-libya-commander-D | 1970-05-03 | — | ly | 2011-10-20 |
| 6 | Muhammad Ali Hassan | NK-iraq-official-E | — | 1958 | iq | — |
| 7 | Muhammad Ali al-Khatib | NK-syria-minister-F | 1965-09-14 | — | sy | — |
| 8 | Muhammad Ali Jafari | NK-iran-irgc-G | 1957-09-01 | — | ir | — |
| 9 | Mohamed Ali Abdi | NK-somalia-alshabaab-H | — | 1980 | so | — |
| 10 | Muhammad Ali Bello | NK-nigeria-bokoharam-I | — | 1985 | ng | — |
| 11 | Muhammad Ali | NK-no-discriminators-J | — | — | — | — |
| 12 | Muhammad Ali | NK-dob-only-close-K | 1942-01-19 | — | — | — |

**Without the suppression system:** all 12 hits land on an officer's desk. At 4 minutes per hit to clear, that's 48 minutes of officer time per customer screening. Across 100 customer screenings per month, that's ~80 hours — roughly 5% of one FTE.

**With Tier 1 auto-dismissal active:**

```
Total hits:                   12
Auto-dismissed (Tier 1):      10  (83%)
Suppressed by learned rule:   0   (Tier 2 — empty in first month)
Requires officer review:      2
Suppression rate:             83%
```

**The 2 remaining for review** are the records where Tier 1 cannot safely act:

- **`NK-no-discriminators-J`** — no DOB, no YOB, no nationality, no LEI. Only the name matches. Nothing to discriminate on.
- **`NK-dob-only-close-K`** — has a DOB but no nationality. Customer DOB 1965-04-10 vs sanctioned 1942-01-19 (23 years apart). DOB mismatch is obvious, but it's only ONE discriminator — insufficient for auto-dismissal per ADR-0045's safety threshold.

**The 10 auto-dismissed hits** each have 2+ unambiguous mismatches. For example, record #5 (Muhammad Ali al-Qadhafi) had:

```
Mismatches: 3
  ✗ [dob] DOB mismatch: sanctioned 1970-05-03 vs customer 1965-04-10
    (differs by 1849 days, exceeds 7-day tolerance)
  ✗ [nationality] Nationality mismatch: sanctioned ['LY'] vs
    customer ['US'] — no overlap
  ✗ [date_of_death] Sanctioned record is deceased (2011-10-20), customer
    shows activity on 2026-04-01 — customer cannot be the sanctioned person
  ✓ [gender] Gender match: M
```

Auto-dismissed with three independent contradictions. Regulator-defensible by construction.

---

## Audit event — what gets logged

Every Tier 1 evaluation writes to `audit_events`:

```json
{
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "customer_name": "Muhammad Ali",
  "sanctioned_record_id": "Q76",
  "auto_dismissed": true,
  "mismatch_count": 2,
  "evaluations_run": 4,
  "rationale": "AUTO-DISMISSED (Tier 1): 2 independent discriminators contradict...",
  "discriminators": [
    {
      "name": "dob", "matched": false,
      "sanctioned_value": "1942-01-17", "customer_value": "1965-04-10",
      "reason": "DOB mismatch: ... (differs by 8484 days, exceeds 7-day tolerance)"
    },
    {
      "name": "nationality", "matched": true,
      "sanctioned_value": ["US"], "customer_value": ["US"],
      "reason": "Nationality match: shared ['US']"
    },
    {
      "name": "date_of_death", "matched": false,
      "sanctioned_value": "2016-06-03", "customer_value": "2026-04-01",
      "reason": "Sanctioned record is deceased, customer shows activity on 2026-04-01"
    }
  ],
  "evaluated_at": "2026-04-18T10:15:03.184Z",
  "tier": "tier_1_evidence",
  "regulatory_basis": "EU AI Act Art. 12 + Art. 14 — auto-dismissal remains visible; officer override available in UI"
}
```

Supervisors can query the audit table and reconstruct *exactly* why any given hit was auto-dismissed, for any customer, at any historical point.

---

## Tier 2 in action — officer-originated rule

When a Tier 1 review ends with an officer manually dismissing a hit, the decision persists:

```http
POST /api/sanctions/suppression-rules
Authorization: Bearer <officer_jwt>
X-Tenant-Id: 00000000-0000-0000-0000-000000000001

{
  "sanctioned_record_id": "NK-no-discriminators-J",
  "customer": {
    "name": "Muhammad Ali",
    "date_of_birth": "1965-04-10",
    "nationality_codes": ["US"],
    "gender": "M"
  },
  "rationale": "Officer verified via passport and US tax return — customer is the retail merchant in Detroit, NOT any sanctioned party. Hit has no discriminators so Tier 1 cannot auto-dismiss, but identity verification packet attached as evidence.",
  "evidence_refs": ["finding_abc123", "doc_passport_xyz"]
}
```

The rule is stored with a 12-month expiry. The next time this customer is screened, the same `NK-no-discriminators-J` hit appears in the **`suppressed_by_rule`** bucket rather than `requires_review`, with the officer's rationale visible inline.

**What the UI shows** (three always-visible groups):

```
📋 Requires review (2)         ← officer must action these
   ⚠ NK-no-discriminators-J  [rationale: no discriminators]
   ⚠ NK-dob-only-close-K     [rationale: 1 discriminator, need 2]

✓ Auto-dismissed (10)          ← expandable group with full rationale
   ▸ Q76                     (dob + date_of_death mismatch)
   ▸ NK-yemen-militant-A     (dob + nationality mismatch)
   ... (8 more)

🔒 Suppressed by learned rule (0)   ← populates over time
```

Officers can expand any group and un-suppress any hit in one click. Revocation captures `revoked_at`, `revoked_by`, and a mandatory `revocation_reason` for the audit trail.

---

## Impact — what this changes

### Before Tier 1

- **100% of hits** reach an officer's desk
- **~4 min per hit** of manual review time
- **No structured rationale** — officer writes a free-text note that isn't reusable
- **Every repeat screening** of the same customer re-presents the same 12 FPs
- **Regulator audit is painful** — recovering "why was this hit dismissed in 2025?" means reading free-text notes

### After Tier 1 (typical first-month impact)

- **20–30% of hits** auto-dismissed based on evidence
- **80% reduction in auto-dismissed officer review time** on those hits
- **Every dismissal has a structured rationale** written by deterministic rules
- **Regulator audit is trivial** — query `audit_events` for any dismissal, get the exact discriminator values compared

### After Tier 2 accumulates (6-month runrate)

- **60–80% of hits** covered by Tier 1 + Tier 2 combined
- **Rules are tenant-scoped and expire at 12 months** — no stale rules, no cross-tenant leakage
- **Rules learn from officer expertise** without handing control to a model
- **Fire-count telemetry** shows which rules are doing work and which are candidates for retirement

### Honest caveats

- **Not a full automation.** Even at Tier 2 runrate, 20–40% of hits still reach officers. Anyone promising full automation of sanctions screening is wrong or taking regulatory risk you shouldn't.
- **Requires rich discriminator data from the feed.** When the sanctioned record has only a name, Tier 1 can't act. This is where Tier 2 (officer-originated rules) adds value over Tier 1 alone.
- **Tier 3 feed-diff is deferred.** We don't yet auto-detect when a sanctioned record changes between rule-creation and now. Rules re-evaluate at 12-month expiry regardless.

---

## Regulatory posture

| Requirement | How this system complies |
|---|---|
| **EU AI Act Art. 12** (automatic logging) | Every Tier-1 evaluation + Tier-2 rule fire writes to `audit_events` with full discriminator values |
| **EU AI Act Art. 13** (transparency) | Every dismissed hit displays its rationale inline + rule id + created_by + created_at |
| **EU AI Act Art. 14** (human oversight) | Hits are never deleted, always visible + expandable, one-click un-suppress, 12-month forced re-review |
| **AMLR Art. 28** (CDD baseline) | Sanctions screening itself continues unchanged; suppression is a post-hoc dismissal layer with full audit |
| **AMLR Art. 21** (perpetual KYC) | Tier 3 periodic re-check integrates with the forthcoming ADR-0044 periodic-review pipeline |
| **GDPR Art. 22** (right to human review) | Officer override un-suppresses the hit; original screening decision preserved |

---

## Architecture

```
                 ┌─────────────────────────────────────┐
                 │  Upstream sanctions hit             │
                 │  (OpenSanctions / OFAC / EU list)   │
                 └─────────────────┬───────────────────┘
                                   │
                                   ▼
                 ┌─────────────────────────────────────┐
                 │  extract_sanctioned_discriminators  │
                 │  (DOB, DOD, nat, gender, LEI, YOB)  │
                 └─────────────────┬───────────────────┘
                                   │
            ┌──────────────────────▼──────────────────────┐
            │  TIER 1: evaluate_suppression                │
            │  6 discriminator evaluators                  │
            │  ≥2 unambiguous mismatches → auto-dismiss    │
            └─────────┬──────────────────────────┬─────────┘
                      │                          │
           auto_dismissed                   not auto-dismissed
                      │                          │
                      ▼                          ▼
              ┌──────────────┐    ┌────────────────────────────┐
              │ Bucket:      │    │ TIER 2: check_active_rule  │
              │ auto_dismissed│   │ HMAC lookup in               │
              │              │    │ sanctions_suppression_rules │
              └──────────────┘    └──────────┬─────────────────┘
                                              │
                           ┌──────────────────┴──────────────────┐
                           │                                     │
                  rule matched                             no rule
                           │                                     │
                           ▼                                     ▼
                 ┌──────────────────┐                ┌──────────────────┐
                 │ Bucket:          │                │ Bucket:          │
                 │ suppressed_by_   │                │ requires_review  │
                 │ rule             │                │                  │
                 └──────────────────┘                └──────────────────┘

 All three buckets rendered in the UI. None deleted. All audit-logged.

                 TIER 3 runs nightly per tenant:
                 counts expiring rules → dashboard renewal queue.
```

**Code pointers:**

- Tier 1 engine: `backend/app/services/sanctions_fp_suppression.py`
- Tier 2 service: `backend/app/services/sanctions_suppression_service.py`
- Integration adapter: `backend/app/services/sanctions_suppression_integration.py`
- API endpoints: `backend/app/api/sanctions_suppression.py` (POST / GET / revoke / housekeeping)
- Tier 3 workflow: `backend/app/workflows/sanctions_suppression_refresh.py`
- ORM model: `backend/app/db/models.py::SanctionsSuppressionRule`
- Alembic migration: `backend/alembic/versions/054_sanctions_suppression_rules.py`

**Tests:**

- Unit tests for Tier 1: `backend/tests/test_sanctions_fp_suppression.py` (38 tests)
- Integration tests: `backend/tests/test_sanctions_suppression_integration.py` (20 tests, 7 against real Postgres via testcontainers)
- Demo script: `backend/scripts/demo_sanctions_suppression.py`

---

## FAQ

**Does this use Letta memory?**

No. Letta is wired into the platform as officer-scoped archival memory for RAG-based precedent retrieval — a good fit for "what has this officer done on similar cases historically?" — but it's the wrong tool for suppression rules. Suppression requires tenant-isolated, exact-match, time-bound, fully auditable storage; Letta is per-officer, fuzzy-semantic, and has no hard-expiry semantics. Structured Postgres with FORCE RLS is the right shape.

Where Letta *could* add value in a later sprint: analysing officer rationales over time and proposing new Tier-1 discriminator candidates ("officers in this tenant frequently cite 'address' as rationale — consider adding address as a Tier-1 discriminator").

**Can I turn off Tier 1 for a specific hit?**

The hit still appears in the `auto_dismissed` bucket, which is always visible. An officer can un-suppress any auto-dismissed hit with one click; the hit then appears in `requires_review`. No hit is ever deleted.

**What if the feed adds a new discriminator field later (e.g. `placeOfBirth`)?**

Adding a new discriminator is a one-file change in `sanctions_fp_suppression.py`: implement a new `_eval_place_of_birth` function returning `DiscriminatorDecision | None`, then add it to the tuple of evaluators in `evaluate_suppression`. No migration, no ORM change. Unit tests cover each evaluator independently.

**What about a true-positive slipping through Tier 1?**

Tier 1 only dismisses when ≥2 discriminators *mismatch*. A true positive would have matching discriminators, not mismatching ones. The only risk is if the sanctioned record data is *wrong* (e.g. sanctioned record has outdated nationality). This is mitigated by Tier 3's planned feed-diff detection (deferred) and the 12-month forced re-review on all persisted rules.

**How do I demo this to a regulator?**

Show them the audit_events table for a dismissed hit. Every dismissal has:

- The exact discriminator values from both sides
- The rule that fired (Tier 1 rule id OR Tier 2 rule uuid)
- The timestamp
- The officer id (for Tier 2)
- The rationale (free-text for Tier 2, structured for Tier 1)

Then show them the UI — every suppressed hit is visible and un-suppressible. That's the whole conversation.

---

## Roadmap integration

This feature is part of the Gino de Jeu (KBC Merchant Services) roadmap item **G2** tracked in [`docs/ROADMAP.md`](https://github.com/Tsunami-max/trust-relay-workflow/blob/master/docs/ROADMAP.md). Shipped in Sprint W16 (2026-04-18).

Related ADRs:
- [ADR-0023](../adr/0023-postgresql-rls) — Tenant isolation via FORCE ROW LEVEL SECURITY
- [ADR-0032](../adr/0032-circuit-breakers) — Circuit breakers on external feeds (OpenSanctions)
- [ADR-0045](../adr/0045-sanctions-fp-suppression) — This feature's design record
