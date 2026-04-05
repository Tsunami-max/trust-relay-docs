---
sidebar_position: 2
title: "Agent Architecture"
description: "18 specialized AI agents organized in two tiers: 14 global specialists and 4 project-specific reviewers"
---

# The Agent System

Agents are specialized AI personas configured with domain-specific expertise, constrained tool access, and targeted review checklists. They provide automated second opinions that do not suffer from reviewer fatigue, context pollution, or the tendency to approve code because "it looks right." The agent system operates at two levels: global specialists available across all projects, and project-specific reviewers tailored to a single codebase's conventions and requirements.

## Architecture

**What:** The agent system is organized into two tiers. Global specialist agents (14 types) live in `~/.claude/agents/` and provide broad domain expertise — security engineering, database design, AI/ML implementation, frontend development, testing. Project-specific reviewer agents (4 types) live in `PROJECT/.claude/agents/` and provide targeted review checklists calibrated to the project's specific patterns, conventions, and regulatory requirements.

**Why:** A global security engineer agent knows about OWASP Top 10, JWT validation, SQL injection prevention, and PII protection. This knowledge applies to any project. But it does not know that Trust Relay uses `Depends(get_current_user)` for authentication, `get_tenant_session(tenant_id)` for database access, or that 33 tables have `FORCE ROW LEVEL SECURITY`. A project-specific security reviewer knows these conventions and checks for them explicitly.

Global agents are generalists that apply broad expertise. Project reviewers are specialists that enforce specific contracts. Both are needed.

## Global Specialist Agents (14)

| Agent | Domain | When to Dispatch |
|---|---|---|
| Code Architect | System architecture, DDD, module boundaries | New feature design, refactoring strategy |
| AI Engineer | LLM integration, ML pipelines, RAG, vector databases | AI feature implementation |
| Security Engineer | Auth, authorization, injection prevention, PII | Security-sensitive changes |
| Database Engineer | Schema design, query optimization, migrations | Database changes |
| Frontend Developer | React, Next.js, component architecture | Frontend implementation |
| UI Designer | Visual design, layout, design system application | UI component creation |
| UX Researcher | User flows, interaction patterns, accessibility | UX design decisions |
| Python Expert | Python idioms, async patterns, performance | Complex Python implementation |
| Test Writer & Fixer | Test coverage, failure analysis, test repair | Test creation and debugging |
| Code Reviewer | General code quality, patterns, maintainability | Code review |
| Debugger | Root cause analysis, systematic investigation | Complex bugs |
| Deployment Engineer | CI/CD, containerization, infrastructure | Deployment and ops |
| MCP Expert | MCP server integration, tool configuration | MCP setup and troubleshooting |
| Research Agent | Information gathering, technology evaluation | Research tasks |

## Model Selection

Different agent tasks require different model capabilities. The methodology uses a tiered model selection approach that matches model capability to task requirements.

| Task Type | Model | Rationale |
|---|---|---|
| Security review, compliance review, architecture design | Opus | Requires judgment, nuanced context evaluation, regulatory knowledge. False negatives (missed vulnerabilities, compliance gaps) are costly. The quality premium justifies the cost. |
| API review, migration review, mechanical implementation | Sonnet | Pattern matching against checklists, structural verification. The task is well-defined and the correct answer is deterministic. Speed matters more than depth. |
| Simple searches, file lookups, formatting tasks | Haiku | Speed over depth. The task has a clear correct answer that does not require reasoning. |

Each agent definition includes a `model` field in its frontmatter that specifies the default model:

```yaml
---
name: security-reviewer
model: opus
tools: Read, Grep, Glob
---
```

```yaml
---
name: api-reviewer
model: sonnet
tools: Read, Grep, Glob
---
```

The model selection is a default, not a constraint. If a nominally mechanical task turns out to require more reasoning, the orchestrator can re-dispatch with a more capable model.

## The Four Project Reviewers

Four project-specific reviewer agents provide automated quality checks calibrated to the project's exact conventions, patterns, and regulatory requirements.

### API Reviewer (model: Sonnet)

Checks FastAPI endpoints for consistency with established patterns:

- Pydantic `BaseModel` for all request/response schemas (not raw dicts)
- `response_model` declared in route decorators
- Correct HTTP status codes (201 for creation, 404 for not found)
- Authentication via `Depends(get_current_user)`
- Tenant context via `Depends(get_current_tenant)`
- Tenant-scoped database access via `get_tenant_session(tenant_id)`
- Pagination for large responses
- No N+1 query patterns

**When to dispatch:** After adding or modifying API routes.

### Security Reviewer (model: Opus)

Reviews code for authentication bypass, authorization flaws, injection vulnerabilities, and tenant isolation issues:

- Authentication enforced on all protected endpoints
- Role-based access control: `require_role()` guards on admin-only endpoints
- Parameterized SQL queries (`:param` not f-strings)
- No `eval()`, `exec()`, or `__import__()` with user input
- PII never logged
- MinIO bucket access scoped to case and tenant
- Error messages do not expose internal details

**When to dispatch:** After implementing features that handle user input, access control, data queries, or file operations. Uses Opus because security review requires judgment about attack vectors.

### Compliance Reviewer (model: Opus)

Reviews code for EU AI Act, GDPR, and AML regulatory compliance:

- Every AI output has input provenance
- Model identification present
- Chain of thought captured (PydanticAI `all_messages()`, evidence bundles)
- Confidence scoring with documented methodology
- `prompt_version_id` foreign key on AI execution records
- No PII in log files or error messages
- Audit trail is append-only (never modified)
- System can add scrutiny but never suppress risk signals

**When to dispatch:** After implementing features involving AI decisions, data processing, or audit trails. This is the highest-stakes reviewer — compliance gaps discovered post-deployment have legal and financial consequences.

### Migration Reviewer (model: Sonnet)

Reviews Alembic database migrations for safety, RLS compliance, and asyncpg compatibility:

- `upgrade()` and `downgrade()` are symmetric
- NOT NULL columns on existing tables have `server_default`
- New tenant-scoped tables have `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`
- RLS policy uses `current_setting('app.current_tenant')::UUID`
- `CAST(:param AS jsonb)` syntax for asyncpg compatibility (not `::jsonb`)
- Migration revision chain is correct (single head)

**When to dispatch:** Before committing any new Alembic migration.

**Evidence:** The four project reviewers are calibrated to patterns discovered through actual development. The migration reviewer's asyncpg cast syntax check exists because `::jsonb` cast syntax caused runtime failures. The compliance reviewer's `prompt_version_id` check exists because AI traceability was initially implemented without prompt versioning, creating a compliance gap. Each checklist item traces to a specific failure that the reviewer now prevents. See the [Evidence appendix](../evidence/trust-relay-metrics) for the agent count metrics.
