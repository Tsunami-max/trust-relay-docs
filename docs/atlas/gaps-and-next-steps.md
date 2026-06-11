---
sidebar_position: 21
title: "Known Gaps, Issues & Next Steps"
description: "Internal engineering status register: confirmed defects from the 2026-06-11 multi-agent code review, doc/code drift corrected during the documentation rebuild, test/build status, and a prioritized remediation plan. Not for external distribution."
last_verified: 2026-06-11
status: reference
---

# Known Gaps, Issues & Next Steps

:::danger Internal engineering document — do not publish externally
This page is an **engineering status register**. It names live, currently-exploitable
security defects (cross-tenant data access, inert row-level security) and unfinished
capabilities. It must be **excluded from any public deploy** of `trust-relay.pages.dev`
until at least the Critical items below are remediated. Share with the engineering team
and trusted reviewers only.
:::

## How this register was produced

On **2026-06-11** the codebase was put through a structured, multi-agent review and a
full documentation-vs-code reconciliation:

- **Code review** — 12 scoped finder agents (auth, tenancy/RLS, SQL, Temporal
  determinism, PII/crypto, migrations, risk engine, sanctions, frontend, resilience,
  compliance/audit) produced 97 raw findings. Each survivor was put through an
  **adversarial verification panel** (skeptics instructed to *refute*; critical/high
  findings required a 3-lens correctness/impact/sanction majority). **35 findings were
  confirmed; 59 were refuted** as non-issues or sanctioned-by-ADR.
- **Documentation rebuild** — 14 domain agents verified all **74 code-tracking pages**
  (54 `architecture/`, 20 `atlas/`) against the actual code, corrected drift in place,
  refreshed frontmatter, and reported **83 doc/code mismatches**. The docs have been
  corrected to describe what the code *actually does*; the recurring themes are captured
  in [Documentation drift corrected](#7-documentation-drift-corrected) below.

Severity legend: **Critical** = cross-tenant data exposure or a risk signal that can be
silently suppressed; **High** = isolation/correctness defect with a realistic trigger;
**Medium** = correctness defect behind a misconfiguration or narrow path.

Items below are tagged **✅ Fixed (2026-06-11)** where a fix has already landed and been
verified to the extent possible (frontend via Jest + `tsc`; backend via `ruff --select F`
+ byte-compile + inspection — the backend pytest suite is blocked, see §8). Untagged items
remain open.

### Resolved in this pass (11 findings)

Surgical, low-risk fixes that did not require the sequencing-sensitive RLS role flip or
the (blocked) backend test suite to verify:

- **Frontend (Jest-verified, 859/859 green):** `AIAssessmentCard` conditional-hooks crash
  (hooks moved above the early returns); portal infinite-refetch loop (one-shot mount
  effect); `FollowUpTaskCard` answer erasure (preserve `yes_no` on comment).
- **Backend authorization / scoping (ruff-F + byte-compile clean):** monitoring IDOR
  (`list_events` + `summary` now derive tenant from the JWT); `clone_template` IDOR
  (ownership check added); `POST /memory/reset` (super_admin gate + explicit tenant
  predicate); `confidence` IDOR (tenant-scoped ownership check before the Temporal query);
  `case_evidence` PEPPOL IDOR (tenant-scoped `get_verification`, gates both PDF and JSON);
  customs cross-tenant leak (explicit `Case.tenant_id` predicate in both the fetch and the
  per-case monitoring activity); sanctions screening missing-`tenant_id` path now emits an
  honest data-gap finding instead of silently skipping; GDPR DSR erasure now deletes the
  `PersonDataIndex` hash linkage so the data subject can no longer be re-identified.

### Deferred (require sequencing or the blocked test suite)

The RLS role flip (§1.1) and its dependent latent-session fixes (§1.3), the audit-tenant
threading (§1.3), the transaction-local GUC fix (§1.3), key rotation, the `pii_encryption`
prod guard, the workflow signal-loss / retry / sync-IO items (§3), the MLRO no-op (§4), the
risk-reassessment floor (§2), the Tier-0 reconciliation and ADR-0045 audit persistence (§2),
and the migration GUC defects (§6) are **not yet applied** — each needs careful sequencing
and/or the backend test suite (blocked, §8) to verify safely. Do not apply blind.

---

## 1. Multi-tenancy & data isolation (Critical)

The single most important finding is a **root-cause that disables tenant isolation
platform-wide**, plus a cluster of endpoint-level defects that become directly
exploitable because of it.

### 1.1 Root cause — RLS is inert as shipped
The application connects to PostgreSQL as the **bootstrap superuser** (`temporal`, from
`docker-compose.yml`; `app/config.py` `database_url` default). PostgreSQL superusers
**bypass row security even with `FORCE ROW LEVEL SECURITY`** (ADR-0023, migration `017`).
The non-superuser application role exists (`scripts/create_app_role.sql`) but is commented
out in `.env`. **Net effect today:** every `tenant_isolation` policy on 30+ tenant-scoped
tables is a no-op, and any endpoint that relies on RLS alone for scoping has *zero* tenant
isolation while multiple tenants (demo + digiteal, migration `052`) share the database.
*Files:* `backend/app/config.py:55`, `docker-compose.yml:9`. *Confirmed 3/3.*

This issue is **load-bearing**: it both masks the latent session bugs in §1.3 *and* makes
the IDORs in §1.2 cross-tenant rather than merely sloppy. It must be fixed — but only
**after** §1.3, or flipping to the non-superuser role will break the demo-tenant code paths.

### 1.2 Endpoint authorization / IDOR defects
Each of these lets an authenticated officer of tenant A reach tenant B's data by
supplying an identifier, because the endpoint relies on RLS (currently inert) instead of
an explicit ownership check:

| Endpoint | Defect | File | Sev | Status |
|---|---|---|---|---|
| `GET /api/monitoring/events`, `/summary` | Honored a client-supplied `tenant_id` query param with no `super_admin` gate; set the RLS GUC to the attacker's value | `api/monitoring.py` | Crit | ✅ Fixed |
| Continuous-monitoring activity | `fetch_active_customs_cases` opened an **admin (RLS-bypass) session** and selected approved customs cases with **no `tenant_id` filter**; results persisted under the *calling* tenant | `workflows/activities.py` | Crit | ✅ Fixed |
| Officer PEPPOL evidence | No tenant scoping on the evidence read | `api/case_evidence.py` | High | ✅ Fixed |
| Confidence endpoint | Read workflow state by `workflow_id` with no case-ownership check | `api/confidence.py` | High | ✅ Fixed |
| `clone_template` | Read any tenant's private template by raw UUID — missing the ownership check its sibling endpoints have | `api/workflow_templates.py` | High | ✅ Fixed |
| `POST /memory/reset` | Wiped **all** `signal_events` with no role gate and no tenant predicate | `api/memory.py` | High | ✅ Fixed |

### 1.3 Latent session/context bugs (masked by the superuser bypass)
These are silent today but will **break or mis-scope data the moment RLS is enforced** —
they must be fixed *before* §1.1:

- **Audit trail written under the demo tenant.** `persist_audit_event` /
  `persist_domain_events` call `AuditService.log_event()`, which opens a session pinned to
  `DEMO_TENANT_ID`; `AuditEvent.tenant_id` server-defaults to the demo UUID. Every workflow
  audit event for a non-demo tenant is invisible to its owner and readable by the demo
  tenant — an **EU AI Act Art. 12 / AML auditability** violation. *`workflows/activities.py:1519`, `db/database.py`. Crit.*
- **Transaction-local GUC.** The RLS tenant GUC is set with `set_config(..., is_local=true)`,
  but sessions span multiple transactions — the context is **silently lost after the first
  commit**. *`db/database.py:39`. High.*
- **Portal token lookup uses the demo-tenant session** — the entire customer portal will
  `404` for non-demo tenants once RLS is live. *`api/portal.py:138`. High.*
- **Diagnostics hard-codes the demo tenant** for all telemetry, officer feedback, and
  pattern alerts. *`services/diagnostic_service.py:99`. High.*
- **Background signal-ingestion workers** use a demo-scoped session instead of an explicit
  admin bypass — under RLS they would process only the demo tenant. *`services/signal_ingestion_worker.py:204`. High.*

---

## 2. Risk & sanctions integrity (Critical / High)

These violate the project's foundational invariant — **the system may *add* scrutiny but
must never silently *suppress* a risk signal.**

- **Fabricated discriminators can auto-dismiss true sanctions hits.** `build_director_queries`
  falls back to a director's **mandate-start date as date-of-birth** and the **company's
  registration country as the director's nationality**. The suppression engine auto-dismisses
  a hit on ≥2 discriminator mismatches — so a sanctioned foreign director of a Belgian company
  with a sparse registry record gets *two fabricated mismatches* and the true hit is dismissed.
  *`services/sanctions_screening_pipeline.py:311`. Crit.*
- **Circuit-open / rate-limit reads as "screened clean."** When the Tavily breaker is open,
  adverse-media, sanctions, and PEP screening return a *clean, verified* result instead of an
  honest data-gap. *`agents/adverse_media_agent.py:78`. Crit.*
- **✅ Fixed (2026-06-11) — Missing/malformed `tenant_id` silently skipped all sanctions
  screening** — the case looked clean. Now emits a high-severity `sanctions_screening_gap`
  finding (honest data gap) instead of returning silently. *`agents/osint_phases.py`. Medium (Critical in effect).*
- **Undocumented "Tier 0" pre-filter** auto-dismisses sanctions hits on a *single*
  discriminator, contradicting ADR-0045 (which mandates ≥2 and always-visible suppression),
  with no rationale persisted. *`services/sanctions_suppression_integration.py:240`. High.*
- **ADR-0045 audit events are built but never written** to `audit_events` — Tier-1 dismissals
  and Tier-2 rule fires leave no persisted trail. *`agents/osint_phases.py:189`. High.*
- **Risk reassessment discards EBA floor boosts.** Recomputation uses a plain weighted average,
  dropping the floor-boost and escalation-minimum logic of the EBA scorer — a single critical
  dimension is diluted, lowering the composite. *`services/risk_matrix_service.py:213`. High.*

---

## 3. Workflow correctness (High / Medium)

- **`documents_submitted` signal can be lost** by a loop-top state reset — the case can
  hit a timeout and `FAIL` even though the customer submitted. *`workflows/compliance_case.py:1109`. High.*
- **Best-effort activities use Temporal's default unlimited retries** — a persistently
  failing best-effort step strands the case despite the surrounding `try/except`. *`workflows/compliance_case.py:483`. High.*
- **Synchronous MinIO network I/O inside workflow code** (`task_responses.json` read) — a
  determinism hazard under replay; belongs in an activity. *`workflows/compliance_case.py:1313`. Medium.*

---

## 4. Frontend correctness (Critical / High)

- **✅ Fixed (2026-06-11) — Conditional hooks crash the case-detail page.** `AIAssessmentCard`
  early-returned before three `useMemo` calls; when the polled case status transitions (e.g.
  `GENERATING_TASKS → REVIEW_PENDING`) React threw *"rendered more hooks than during the
  previous render"* and, with no error boundary on the page, unmounted the whole case view.
  Fixed by moving all hooks above the early returns. *`components/dashboard/AIAssessmentCard.tsx`. Crit.*
- **✅ Fixed (2026-06-11) — Infinite refetch loop** on the portal page when returning from
  itsme (`?kyc=success`). Fixed by making the effect a one-shot mount read. *`app/portal/[token]/page.tsx`. High.*
- **✅ Fixed (2026-06-11) — Typing a comment erased the yes/no answer** on a follow-up task
  before submit. Fixed by spreading the prior response in `handleTextChange`. *`components/portal/FollowUpTaskCard.tsx`. High.*
- **MLRO "Confirm notification" button is a no-op** — fake success, no notification sent, no
  audit record. *`components/dashboard/DecisionActions.tsx:677`. High. (Open — needs a backend endpoint.)*

---

## 5. PII / cryptography (High / Medium)

- **✅ Fixed (2026-06-11) — DSR erasure left `PersonDataIndex` rows intact** — the HMAC hash
  linkage to the data subject survived "erasure," undermining the GDPR Art. 17 guarantee. Now
  the index row is deleted for every anonymized/deleted record (REFUSE entries keep their
  linkage with the lawfully-retained record). *`pii/dsr_service.py`. High.*
- **Key rotation is structurally impossible** — `key_id` is hardcoded `env0` and decrypt only
  ever loads the current key, so re-keying cannot decrypt historical ciphertext.
  *`pii/key_providers.py:55`. High.*
- **`pii_encryption_enabled` defaults to `False` with no production guard** — a misconfigured
  prod deploy silently stores PII as plaintext. *`pii/encryption.py:119`. Medium.*

---

## 6. Migrations (High / Medium)

- **Wrong RLS GUC name** in the `sanctions_suppression_rules` policy (migration `054`) — the
  policy compares against a setting that is never set, so all rows are invisible.
  *`alembic/versions/054_sanctions_suppression_rules.py:115`. High.*
- **Missing `missing_ok` flag** on the `person_data_index` (`049`) and `cost_pricing` (`046`)
  RLS policies — `current_setting('app.current_tenant')` **throws** on any session without
  tenant context instead of returning null. *High/Medium.*

---

## 7. Documentation drift corrected

The doc rebuild corrected **83 doc/code mismatches**. The dominant pattern was
**aspirational or planned capabilities documented as shipped**. The most material
corrections (now reflected in the pages):

- **Security / multi-tenancy docs** asserted "complete data isolation … enforced at the
  database layer." Corrected to state RLS is **inert as shipped** (see §1.1) and cross-links
  here. (`architecture/security.md`, `atlas/multi-tenancy.md`, `architecture/eu-ai-act-compliance.md`)
- **EBA risk matrix** was documented as "5 dimensions / 15 factors" with old weights; the
  code implements **7 dimensions / 20 factors** with different weights. (`architecture/risk-assessment.md`)
- **`workflow.patched()` version gates** — the page claimed 23 active gates; the code has
  **zero** (all removed; the KYC/KYB fork is a plain template check). (`architecture/temporal-workflows.md`)
- **Transaction & continuous monitoring** docs claimed structuring/round-tripping detection
  and a full re-screening suite; the code implements precious-metals ingestion + VoP and a
  **subset** of monitoring checks (EORI validity, VoP re-verification live; others stubbed).
  (`architecture/transaction-monitoring.md`, `architecture/continuous-monitoring.md`)
- **Auth / PoC mode** — docs described an `app_mode=poc` "bypasses auth" branch and
  default-`true` mock modes; the code has **no such setting**, `get_current_user()` always
  requires a Keycloak JWT, and all mock flags default to **`False`**. (`architecture/platform-foundation.md`, `architecture/deployment.md`)
- **Agent/prompt/registry inventories** were stale: 23 pipeline stages (not 11), 31 prompt
  templates (not 20), 11 registry providers (not 10), 21 regulatory instruments / 89 articles
  (not 16/67), and corrected MCP transports. (`architecture/ai-agents.md`, `architecture/agentic-os.md`, `architecture/prompt-management.md`, `architecture/multi-country-registries.md`, `architecture/regulatory-radar.md`)
- **Ontology/graph** — docs described an `Entity`/`IS_DIRECTOR_OF` schema and an
  `add_episode`-based Belgian lifecycle pipeline that **do not exist**; runtime ETL MERGEs
  `Company`/`HAS_DIRECTOR`. (`architecture/ontology-layer.md`, `architecture/knowledge-graph.md`)

### Tooling defects found
- **`architecture-index` plugin coverage bug.** The `undocumented` list is computed by
  matching module **basenames** against `component_map` keys that are **full paths**, so it
  never matches and reports *every* module as undocumented (242). The separately-computed
  `coverage_percent` (full-path match, **79%**) is the trustworthy number.
  *`docusaurus/trust-relay/plugins/architecture-index.js:359`.*
- **ADR collection was incomplete.** Docusaurus was missing ADRs **0037–0042** (shared-package
  extraction, shell-company detection, resilience rollout, observability metrics, pure-mailbox
  detection, CZ registries) and the sidebar stopped at 0036. **Fixed in this rebuild** — the six
  pages were authored from the canonical sources and the sidebar + index extended through 0049
  (0044 is intentionally withdrawn).

---

## 8. Test & build status (2026-06-11)

- **Frontend Jest: 859/859 green.** 11 suites were failing on entry; all were diagnosed as
  **stale tests** (component behavior correct, expectations outdated after legitimate
  evolution) and repaired test-side only — no production code changed. `tsc --noEmit` clean.
- **Frontend `tsc` / backend `ruff check --select F`: clean.**
- **Backend pytest: blocked.** The suite cannot load under the pyenv 3.12 interpreter because
  `py-key-value-aio` pulls **`beartype` 0.22.9**, whose `claw` import hook collides with
  Temporal's workflow-sandbox importer (`ImportError: cannot import name 'claw_state' … circular
  import` → `Failed validating workflow ComplianceCaseWorkflow`). Separately, the project
  `.venv` lacks the editable `trustrelay_*` packages. **Backend tests have not been run this
  session** — this is the top testing-infrastructure item to clear.

---

## 9. Next steps — prioritized remediation plan

**Sequencing matters.** Enforcing RLS (§1.1) before fixing the demo-tenant session paths
(§1.3) would break the portal, audit, diagnostics, and background workers. Do the order below.

### P0 — before any "tenant isolation" claim can be made
1. **Fix the latent session/context bugs (§1.3) first:** thread `tenant_id` through
   `persist_audit_event` / `persist_domain_events`; make the GUC session-scoped (not
   transaction-local); replace demo-tenant sessions in portal/diagnostics/workers with the
   correct tenant or an explicit admin bypass.
2. **Then enforce RLS (§1.1):** run `create_app_role.sql`, point the app + worker
   `DATABASE_URL` at the non-superuser `trustrelay_app` role (keep `temporal` for the Temporal
   server and Alembic only).
3. **Close the IDORs (§1.2):** derive `tenant_id` from the verified JWT (not query params);
   add explicit ownership checks to `case_evidence`, `confidence`, `clone_template`; role-gate
   `monitoring` and `POST /memory/reset`; add the tenant predicate to the customs-cases query.
4. **Fix the migration GUC defects (§6)** — they block correct RLS behavior.

### P0 — risk-signal integrity (never suppress a signal)
5. Remove fabricated DOB/nationality discriminators; make circuit-open and missing-`tenant_id`
   paths return an **honest data-gap**, not "clean"; reconcile the Tier-0 pre-filter with
   ADR-0045 and **persist** the ADR-0045 audit events; restore EBA floor boosts in reassessment.

### P1 — user-facing correctness
6. Add the missing-hooks guard / error boundary to `AIAssessmentCard`; fix the portal refetch
   loop; stop `FollowUpTaskCard` from erasing the yes/no answer; wire up (or disable) the MLRO
   confirm-notification button.
7. Recover `documents_submitted` signal handling; bound best-effort activity retries; move the
   synchronous MinIO read into an activity.

### P1 — data protection
8. Erase/repoint `PersonDataIndex` on DSR erasure; make key rotation possible (real `key_id`);
   add a production guard that refuses to start with `pii_encryption_enabled=False`.

### P2 — testing infrastructure
9. Unblock backend pytest (pin/patch around the `beartype`/Temporal-sandbox conflict; install
   the editable `trustrelay_*` packages into `.venv`); then run the suite and restore coverage
   gates.

:::note Provenance
Findings are from the 2026-06-11 adversarially-verified multi-agent review (35 confirmed of
97 raw) and the doc/code reconciliation (83 mismatches). Each line cites the file (and line)
where it was confirmed. This register reflects the state of the `master` working tree on
2026-06-11 and should be regenerated after the P0 fixes land.
:::
