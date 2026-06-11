---
sidebar_position: 3
title: "The Four Project Reviewers"
description: "**What:** Four project-specific reviewer agents provide automated quality checks calibrated to the project's exact conventions, patterns, and regulatory"
---


**What:** Four project-specific reviewer agents provide automated quality checks calibrated to the project's exact conventions, patterns, and regulatory requirements. Each reviewer has a focused checklist, a defined scope, and a structured output format.

**API Reviewer** (model: Sonnet)

Checks FastAPI endpoints for consistency with established patterns. The checklist covers:

- Pydantic `BaseModel` for all request/response schemas (not raw dicts)
- `response_model` declared in route decorators
- Correct HTTP status codes (201 for creation, 404 for not found)
- Authentication via `Depends(get_current_user)`
- Tenant context via `Depends(get_current_tenant)`
- Tenant-scoped database access via `get_tenant_session(tenant_id)`
- Pagination for large responses
- No N+1 query patterns

**When to dispatch:** After adding or modifying API routes. The API reviewer catches convention violations that are invisible to general code review — using `get_session()` instead of `get_tenant_session()` produces code that works in testing but leaks data across tenants in production.

**Security Reviewer** (model: Opus)

Reviews code for authentication bypass, authorization flaws, injection vulnerabilities, and tenant isolation issues. The checklist covers:

- Authentication enforced on all protected endpoints (portal endpoints have token-based auth instead)
- Role-based access control: `require_role()` guards on admin-only endpoints
- Parameterized SQL queries (`:param` not f-strings)
- No `eval()`, `exec()`, or `__import__()` with user input
- PII never logged
- MinIO bucket access scoped to case and tenant
- Error messages do not expose internal details

**When to dispatch:** After implementing features that handle user input, access control, data queries, or file operations. Uses Opus because security review requires judgment about attack vectors and exploitation scenarios that pattern matching alone cannot assess.

**Compliance Reviewer** (model: Opus)

Reviews code for EU AI Act, GDPR, and AML regulatory compliance. The checklist covers:

- Every AI output has input provenance (what data was the decision based on?)
- Model identification present (which model, version, prompt template?)
- Chain of thought captured (PydanticAI `all_messages()`, evidence bundles)
- Confidence scoring with documented methodology
- `prompt_version_id` foreign key on AI execution records for traceability
- No PII in log files or error messages
- Audit trail is append-only (never modified)
- System can add scrutiny but never suppress risk signals

**When to dispatch:** After implementing features involving AI decisions, data processing, or audit trails. This is the highest-stakes reviewer — compliance gaps discovered post-deployment have legal and financial consequences. Uses Opus because regulatory interpretation requires contextual judgment.

**Migration Reviewer** (model: Sonnet)

Reviews Alembic database migrations for safety, RLS compliance, and asyncpg compatibility. The checklist covers:

- `upgrade()` and `downgrade()` are symmetric
- NOT NULL columns on existing tables have `server_default`
- New tenant-scoped tables have `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`
- RLS policy uses `current_setting('app.current_tenant')::UUID`
- `CAST(:param AS jsonb)` syntax for asyncpg compatibility (not `::jsonb`)
- Migration revision chain is correct (single head)

**When to dispatch:** Before committing any new Alembic migration. Uses Sonnet because migration review is checklist-based — the correct patterns are well-defined and the reviewer verifies their presence or absence.

**Evidence:** The four project reviewers are calibrated to patterns discovered through actual development. The migration reviewer's asyncpg cast syntax check exists because `::jsonb` cast syntax caused runtime failures that were only caught after deployment. The compliance reviewer's `prompt_version_id` check exists because AI traceability was initially implemented without prompt versioning, creating a compliance gap that required a retrofit. Each checklist item traces to a specific failure that the reviewer now prevents. See [appendix-c-agents.md](../appendix-c-agents) for the full reviewer definitions.

---
