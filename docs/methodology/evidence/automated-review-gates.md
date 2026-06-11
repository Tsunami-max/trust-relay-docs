---
sidebar_position: 3
title: "Automated Review Gates"
description: "**What:** Review gates determine when to dispatch reviewer agents and which reviewer to use."
---


**What:** Review gates determine when to dispatch reviewer agents and which reviewer to use. The decision is based on what changed, not on the developer's judgment about whether a review is needed.

**Why:** Voluntary review ("I should probably run the security reviewer on this") is unreliable. The developer may not realize that a code change has security implications, or may decide that a "simple" change does not need review. Automated review gates remove this judgment call by defining trigger conditions that match changes to the appropriate reviewer.

**Review Gate Rules:**

| What Changed | Reviewer to Dispatch | Rationale |
|---|---|---|
| API route files (`app/api/*.py`) | API Reviewer | Convention violations in routes affect external API consumers |
| Authentication or authorization code | Security Reviewer | Auth changes have outsized impact — a single bypass affects all protected resources |
| Database models or migrations | Migration Reviewer | Schema changes are irreversible in production and affect all downstream queries |
| AI decision logic, audit trail, or evidence collection | Compliance Reviewer | Regulatory requirements are non-negotiable and gaps are costly to retrofit |
| Files with `FORCE ROW LEVEL SECURITY` patterns | Security Reviewer + Migration Reviewer | Tenant isolation failures are data breaches |
| New service modules | API Reviewer + Security Reviewer | New services often introduce new data access patterns that need both convention and security checks |

**Dispatch timing:**

Reviews are most effective after implementation is complete but before merge. This timing ensures the reviewer sees the final state of the code (not an intermediate state that will change) while still being early enough to catch issues before they reach the shared codebase.

In the subagent-driven development model (Section 5.4), reviews happen after each task — not at the end of all tasks. This early feedback prevents a single architectural mistake in task 2 from propagating through tasks 3-8 before being caught.

**Review output format:**

All project reviewers produce structured output with:

- **Severity** — Critical (must fix before merge), Important (should fix, may defer with tracking), Minor (optional improvement)
- **Location** — File path and line number
- **Issue** — What is wrong, stated specifically
- **Fix** — What to do about it, stated specifically
- **Regulation** (compliance reviewer only) — Which regulation is violated

This structured format ensures review findings are actionable, not vague. "Consider improving error handling" is not actionable. "File `app/api/case_crud.py` line 47: HTTPException returns raw database error message. Fix: catch `IntegrityError` specifically and return a user-facing message without internal details. Regulation: GDPR Art. 25 (data protection by design)." That is actionable.

**Evidence:** Trust Relay's 4 project reviewers follow these dispatch rules. The compliance reviewer (Opus) has caught EU AI Act traceability gaps — AI outputs missing `prompt_version_id` foreign keys — that would have been invisible to general code review. The migration reviewer (Sonnet) has caught asyncpg compatibility issues — `::jsonb` cast syntax that passes unit tests but fails with the async PostgreSQL driver — that would have caused production failures. Each reviewer exists because its category of defect was encountered in actual development and was expensive enough to justify automated prevention. See [appendix-c-agents.md](../appendix-c-agents) for the full reviewer definitions and [appendix-e-hooks.md](../appendix-e-hooks) for the hook-based enforcement.

---
