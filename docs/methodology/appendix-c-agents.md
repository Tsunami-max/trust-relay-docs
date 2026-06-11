---
sidebar_position: 12
title: "Appendix C: Agent Architecture"
description: "The S4U methodology uses a two-tier agent system: **global specialist agents** that are reusable across all projects, and **project-specific reviewer agents**"
---


## Overview

The S4U methodology uses a two-tier agent system: **global specialist agents** that are reusable across all projects, and **project-specific reviewer agents** scoped to a single codebase. Both tiers are defined as Markdown files with YAML frontmatter, placed in directories that Claude Code reads automatically.

Global agents live in `~/.claude/agents/` and are available in every project. Project agents live in `<project>/.claude/agents/` and are only available when working in that project. This separation ensures that general-purpose expertise (Python, security, debugging) is always at hand, while domain-specific review checklists (API contracts, migration safety, regulatory compliance) stay with the codebase they govern.

---

## 1. Global Specialist Agents

These 14 agents cover the core disciplines of software engineering. They are installed once in the developer's home directory and available across all projects.

| Agent | Purpose | Model | Key Capabilities |
|-------|---------|-------|-----------------|
| **AI Engineer** | LLM integration, ML pipelines, RAG, vector databases | Opus | Streaming, cost optimization, safety filters, inference profiling |
| **Code Architect** | System design, module boundaries, Clean Architecture, DDD | Opus | Directory structures, dependency flow, migration paths, ADRs |
| **Code Reviewer** | Post-change quality review: security, performance, maintainability | Sonnet | Git diff analysis, severity triage (Critical/Warning/Suggestion), auto-approval criteria |
| **Database Engineer** | Schema design, query optimization, zero-downtime migrations | Opus | EXPLAIN ANALYZE, indexing strategies, rollback scripts, multi-DB decision matrix |
| **Debugger** | Root cause analysis: stack traces, race conditions, memory leaks | Sonnet | 7-step diagnostic process, error triage table, regression test generation |
| **Deployment Engineer** | CI/CD, Docker, Kubernetes, GitOps, zero-downtime deployments | Sonnet | Multi-stage builds, deployment strategy matrix, rollback procedures, container scanning |
| **Frontend Developer** | React/Next.js components, accessibility, responsive design | Sonnet | WCAG compliance, Core Web Vitals, keyboard navigation, error boundaries |
| **MCP Expert** | Model Context Protocol servers and clients, transport layers | Sonnet | JSON-RPC 2.0, retry logic, error codes, SDK version management |
| **Python Expert** | Advanced Python: async/await, type safety, performance profiling | Sonnet | cProfile, mypy strict, pytest, asyncio patterns, no mutable defaults |
| **Research Agent** | Codebase analysis, documentation review, implementation options | Sonnet | Multi-phase methodology (discover/analyze/synthesize), complexity estimation, risk assessment |
| **Security Engineer** | Authentication, authorization, PII protection, threat modeling | Opus | STRIDE threat assessment, OWASP Top 10, RBAC, encryption, compliance mapping |
| **Test Writer & Fixer** | Test creation, failure analysis, coverage improvement | Sonnet | Deterministic data, state cleanup, flakiness detection, coverage targets |
| **UI Designer** | Interface design, design systems, Tailwind CSS, all component states | Sonnet | 4px/8px grid, dark mode, WCAG AA contrast, exact Tailwind classes |
| **UX Researcher** | User research, usability testing, journey mapping, behavioral analysis | Sonnet | 6-day research sprints, lean methods, impact/effort prioritization |

### Why Global Agents Exist

Global agents encode expertise that is technology-specific rather than project-specific. A Python expert's knowledge of asyncio patterns, type hints, and profiling tools applies identically whether the project is a compliance platform, a RAG pipeline, or a data processing service. Maintaining these agents globally avoids duplication across projects and ensures improvements (e.g., a better debugging process) propagate to all work immediately.

### Agent Definition Format

Every agent is a Markdown file with YAML frontmatter. The frontmatter declares metadata; the body contains the system prompt. Here is the structure, adapted from the Code Reviewer agent:

```markdown
---
name: "Code Reviewer"
description: "Automated code quality guardian - security, performance, and maintainability analysis"
color: yellow
---

Use this agent immediately after code changes for comprehensive review.

System prompt:

<role>
You are a code review specialist focused on security vulnerabilities,
performance regressions, and maintainability.
</role>

<constraints>
- Focus review on the actual changes, not the entire codebase.
- Every issue must include a specific file:line reference and a concrete fix.
- Distinguish severity: CRITICAL (must fix), WARNING (should fix), SUGGESTION (consider).
- Do not flag style preferences unless they violate project conventions.
- Be direct. If the code is solid, say so in one line.
</constraints>

<output_format>
## Code Review Results

### CRITICAL (Must Fix)
- [ ] [Issue] in `file.py:45` — Fix: [specific change]

### WARNING (Should Fix)
- [ ] [Issue] in `file.py:78` — Fix: [suggestion]

### Summary
- Security: PASS/FAIL
- Ready to merge: Yes / No / Yes with fixes
</output_format>
```

Key structural elements:

- **`<role>`** -- one-paragraph identity statement that anchors the agent's perspective
- **`<expertise>`** -- enumerated skill areas (used for self-assessment of task suitability)
- **`<constraints>`** -- hard rules the agent must follow (the most important section)
- **`<output_format>`** -- structured output template ensuring consistent deliverables
- **`<checklist>`** -- completion criteria the agent verifies before finishing

### Completion Checklists

Every global agent includes a checklist that must be satisfied before the agent considers its task complete. These checklists encode quality standards that would otherwise depend on the developer remembering to check. Selected examples:

**AI Engineer checklist:**
- Inference latency profiled (p95)
- Fallback mechanism for service failures
- Cost per request estimated
- Safety filters active for model outputs
- API keys in environment variables or secret manager

**Code Architect checklist:**
- No circular dependencies
- Clear separation of concerns
- Framework-agnostic core
- Testable without infrastructure
- Maximum 4 folder levels
- Migration path defined from current state

**Database Engineer checklist:**
- All foreign keys have indexes
- No N+1 query patterns introduced
- Migration rollback tested
- EXPLAIN ANALYZE shows acceptable plan

These checklists function as embedded quality gates: the agent self-verifies before returning results, catching issues before they reach the developer.

---

## 2. Project Reviewer Agents

Project reviewer agents are scoped to a single codebase and encode domain-specific review standards. Unlike global agents that assist with implementation, project reviewers are dispatched after implementation to verify compliance with project conventions, regulatory requirements, and infrastructure patterns.

The Trust Relay project defines four reviewer agents. The following sections document each in full detail.

### 2.1 API Reviewer

**Purpose:** Reviews FastAPI endpoints for consistency, error handling, and OpenAPI contract quality.

**Model:** Sonnet

**Tools:** Read, Grep, Glob

**When to dispatch:**
- After adding or modifying any API route
- After creating a new router file
- Before merging any PR that touches `app/api/`

**Full review checklist:**

| Category | Check |
|----------|-------|
| **Endpoint Design** | Uses Pydantic BaseModel for request/response (not raw dicts) |
| | Response model declared in decorator (`response_model=`) |
| | HTTP status codes are correct (201 for create, 404 for not found, etc.) |
| | Endpoint docstring present (appears in OpenAPI docs) |
| **Error Handling** | Raises HTTPException with specific status codes (not generic 500) |
| | Does not expose internal errors to client (no stack traces) |
| | Validates input before processing (fail fast) |
| **Patterns** | Uses `Depends(get_current_user)` for authentication |
| | Uses `Depends(get_current_tenant)` for tenant context |
| | Uses `get_tenant_session(tenant_id)` for DB access (not `get_session()`) |
| | Tags match the router's purpose (e.g., `tags=["lex"]`) |
| | Route prefix follows `/api/v1/{domain}/` pattern |
| **Performance** | No N+1 queries (use JOINs or batch fetches) |
| | Large responses are paginated |
| | Background tasks for long-running operations |

**Model rationale:** API review is primarily pattern matching and checklist verification. Sonnet handles this efficiently without the cost of Opus. The checks are mechanical: does the endpoint declare a response model? Does it use the correct dependency injection? These are binary yes/no verifications.

### 2.2 Security Reviewer

**Purpose:** Reviews code for authentication bypass, authorization flaws, injection vulnerabilities, and tenant isolation issues.

**Model:** Opus

**Tools:** Read, Grep, Glob

**When to dispatch:**
- After implementing or modifying authentication/authorization flows
- After adding API endpoints that access sensitive data
- After modifying data access patterns or database queries
- After any changes to portal (public-facing) endpoints
- Before merging any PR that touches auth, tenant isolation, or data access

**Full review checklist:**

| Category | Check |
|----------|-------|
| **Authentication** | All API endpoints use `Depends(get_current_user)` or are explicitly public (portal endpoints) |
| | Portal endpoints validate portal_token before returning data |
| | No hardcoded tokens, API keys, or secrets in code |
| | JWT validation uses JWKS (not hardcoded public key) |
| **Authorization** | Role-based access enforced: super_admin, tenant_admin, officer, auditor |
| | `require_role()` guard on admin-only endpoints |
| | Officers can only access their own tenant's data (RLS) |
| | Portal users can only access their own case (token validation) |
| **Injection Prevention** | SQL uses parameterized queries (`:param` not f-strings) |
| | No `eval()`, `exec()`, or `__import__()` with user input |
| | HTML output is sanitized (no XSS via `dangerouslySetInnerHTML` with user data) |
| | File paths are validated (no path traversal) |
| **Data Protection** | API responses do not leak other tenants' data |
| | Error messages do not expose internal details (stack traces, SQL, file paths) |
| | Sensitive fields (passwords, tokens) are never logged |
| | MinIO bucket access is scoped to case/tenant |

**Model rationale:** Security review requires judgment, not just pattern matching. Opus can reason about attack surfaces, identify subtle authorization bypasses (e.g., an endpoint that checks authentication but not tenant scope), and evaluate whether error messages leak exploitable information. A missed security vulnerability has consequences that justify the higher cost of Opus.

### 2.3 Compliance Reviewer

**Purpose:** Reviews code changes for EU AI Act, GDPR, and AML regulatory compliance.

**Model:** Opus

**Tools:** Read, Grep, Glob

**When to dispatch:**
- After implementing features that involve AI decisions or recommendations
- After modifying audit trails or logging systems
- After changes to data processing or storage patterns
- After implementing risk scoring or automated decision-making
- Before merging any PR that touches AI outputs, data retention, or audit logs

**Full review checklist:**

| Category | Check |
|----------|-------|
| **EU AI Act (Art. 11-15)** | Every AI output has input provenance (what data was the decision based on?) |
| | Model identification present (which model, version, prompt template?) |
| | Chain of thought captured (PydanticAI `all_messages()`, evidence bundles) |
| | Confidence scoring with methodology (4 dimensions, 0-25 each) |
| | `prompt_version_id` FK on AgentExecution for traceability |
| **GDPR (Art. 22, 25, 30)** | No PII in log files or error messages |
| | Data protection by design (minimize data collection) |
| | Records of processing activities maintained |
| | Right to human review of automated decisions preserved |
| **AML (AMLR Art. 12, AMLD6)** | Audit trail is append-only (never modified) |
| | System can ADD scrutiny but NEVER suppress risk signals |
| | Risk assessment methodology documented |
| | 5-year minimum retention for all KYB/KYC records |
| **Tenant Isolation** | All tenant-scoped tables have FORCE ROW LEVEL SECURITY |
| | Queries use `get_tenant_session(tenant_id)` not `get_session()` |
| | Shared tables (like lex_regulations) explicitly documented as shared |
| | No cross-tenant data leakage in API responses |

**Output format for each issue:**
- **Severity:** Critical / Important / Minor
- **File:Line:** exact location
- **Issue:** what is wrong
- **Regulation:** which regulation is violated
- **Fix:** specific recommendation

**Model rationale:** Compliance review is the highest-judgment task in the agent system. It requires understanding regulatory intent (not just text), evaluating whether an implementation satisfies legal requirements, and reasoning about subtle violations (e.g., an AI output that technically logs the model name but not the prompt version, violating Art. 11 traceability). This is exclusively an Opus task.

### 2.4 Migration Reviewer

**Purpose:** Reviews Alembic migrations for safety, RLS compliance, and asyncpg compatibility.

**Model:** Sonnet

**Tools:** Read, Grep, Glob, Bash

**When to dispatch:**
- Before committing any new Alembic migration
- After modifying existing migrations
- When adding new database tables or columns

**Full review checklist:**

| Category | Check |
|----------|-------|
| **Schema Safety** | `upgrade()` and `downgrade()` are symmetric (downgrade undoes upgrade completely) |
| | No data loss on column type changes (verify with existing data) |
| | NOT NULL columns on existing tables have `server_default` |
| | Foreign key CASCADE behavior is intentional and documented |
| **RLS Compliance** | New tenant-scoped tables have: `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` |
| | RLS policy uses `current_setting('app.current_tenant')::UUID` |
| | Shared reference tables explicitly documented as no-RLS |
| **asyncpg Compatibility** | Uses `CAST(:param AS jsonb)` not `:param::jsonb` |
| | Uses `CAST(:param AS uuid)` not `:param::uuid` |
| | Date columns receive `datetime.date` objects, not strings |
| | GENERATED columns are not written to from ORM |
| **Naming & Conventions** | Migration file follows `NNN_description.py` pattern |
| | `revision` and `down_revision` chain correctly |
| | Index names follow `idx_{table}_{column}` pattern |
| | Constraint names are explicit (not auto-generated) |

**Verification command:**
```bash
cd backend && alembic heads  # Must show single head
```

**Model rationale:** Migration review is primarily structural verification. Does the downgrade undo the upgrade? Are the RLS statements present? Is the cast syntax correct? These are deterministic checks that Sonnet handles reliably at lower cost. The Bash tool access allows the reviewer to verify the migration chain programmatically.

---

## 3. Model Selection Rationale

Model assignment is the single most impactful decision in agent design. The wrong model for a task either wastes money (Opus on mechanical checks) or misses critical issues (Sonnet on security review). The following table codifies the selection criteria.

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Security review, compliance review, architecture | **Opus** | Requires judgment, contextual reasoning, and regulatory knowledge. Must identify subtle attack surfaces, evaluate legal compliance, and reason about system-wide implications. False negatives are costly. |
| API review, migration review, mechanical tasks | **Sonnet** | Pattern matching against known checklists. Checks are binary (present/absent), not judgmental. Sonnet's speed and cost efficiency make it ideal for high-frequency dispatch. |
| Simple searches, file lookups, formatting | **Haiku** | Speed over depth. When the task is locating a file, counting occurrences, or reformatting text, the cheapest and fastest model is the right choice. |

### The Cost-Quality Tradeoff

The model selection is not about capability alone -- it is about the cost of being wrong.

**High cost of error (use Opus):**
- Security: a missed vulnerability can be exploited
- Compliance: a regulatory violation can trigger enforcement action
- Architecture: a wrong structural decision compounds across the codebase

**Low cost of error (use Sonnet):**
- API review: a missing response model declaration is caught in testing
- Migration review: a broken downgrade is caught in CI
- Code formatting: incorrect style is caught by linters

**Negligible cost of error (use Haiku):**
- File search: if the wrong file is found, the developer notices immediately
- Pattern counting: if the count is wrong, it is easily verified

---

## 4. The Two-Stage Review Pattern

Every significant code change undergoes a two-stage review process. This is not two passes by the same reviewer -- it is two distinct review concerns dispatched to the appropriate agents.

### Stage 1: Spec Compliance

**Question:** Does the implementation match the design specification?

This stage verifies that what was built matches what was planned. It checks:

- All acceptance criteria from the design document are addressed
- No spec requirements were skipped or partially implemented
- Edge cases identified in the spec are handled
- The implementation does not introduce scope beyond the spec (scope creep)

**Dispatch to:** The global Code Reviewer agent, or a project-specific reviewer if the spec is domain-specific (e.g., the Compliance Reviewer for regulatory features).

### Stage 2: Code Quality

**Question:** Is the implementation well-built?

This stage evaluates the engineering quality independent of the spec. It checks:

- Security: no vulnerabilities introduced (dispatch Security Reviewer)
- Patterns: project conventions followed (dispatch API Reviewer for endpoints, Migration Reviewer for schema changes)
- Tests: adequate coverage for the changed code
- Performance: no N+1 queries, no unnecessary recomputation
- Edge cases: error handling, null checks, boundary conditions

**Dispatch to:** Multiple project reviewers in parallel, based on what files were changed.

### Mapping to Agent Dispatch

```
PR or Feature Branch
  │
  ├── Stage 1: Spec Compliance
  │     └── Code Reviewer (global) — "Does it match the design?"
  │
  └── Stage 2: Code Quality (parallel dispatch based on changed files)
        ├── app/api/ changed?     → API Reviewer
        ├── auth/security changed? → Security Reviewer
        ├── AI outputs changed?    → Compliance Reviewer
        └── migrations changed?    → Migration Reviewer
```

### When to Skip Stage 1

Stage 1 (spec compliance) requires a spec to check against. It is skipped when:

- The change is a bug fix (no design spec; the failing test is the spec)
- The change is a minor refactoring (no behavioral change)
- The change is a dependency update

Stage 2 (code quality) is never skipped.

---

## 5. Subagent Dispatch Patterns

Subagent-driven development is the default working mode in this methodology. Instead of a single long-running conversation that accumulates context (and confusion), work is decomposed into discrete tasks, each handled by a fresh agent instance.

### The Three Roles

| Role | Responsibility | Context |
|------|---------------|---------|
| **Orchestrator** | Decomposes work into tasks, sequences them, reviews results between tasks | Maintains the full session context; sees the big picture |
| **Implementer** | Executes a single, well-defined task (write code, create migration, build component) | Receives only the context needed for its task; starts fresh |
| **Reviewer** | Validates an implementer's output against standards | Receives the diff and the relevant checklist; no implementation context |

The orchestrator is the developer's primary Claude session. Implementers and reviewers are subagents dispatched for specific tasks, then dismissed.

### Why Fresh Context Per Task

A Claude session accumulates context over time: previous code attempts, debugging tangents, abandoned approaches. This accumulated context creates three problems:

1. **Context pollution** -- the agent's responses are influenced by previous (possibly wrong) approaches
2. **Token budget exhaustion** -- long conversations consume the context window, crowding out the actual task
3. **Confirmation bias** -- an agent that wrote code is predisposed to defend it rather than find its flaws

Fresh subagents eliminate all three problems. Each task starts with a clean slate, receiving only the information needed to complete it.

### Crafting Effective Subagent Prompts

A subagent prompt must be self-contained. The subagent has no access to the orchestrator's conversation history. The prompt must include:

1. **Task definition** -- what to do, stated precisely
2. **Context** -- relevant file paths, design decisions, constraints
3. **Standards** -- which project conventions apply
4. **Acceptance criteria** -- what "done" looks like
5. **Output format** -- how to structure the response

Example of a well-crafted subagent prompt:

```
Implement the document validation activity for the Temporal workflow.

Context:
- Workflow file: backend/app/workflows/compliance_case.py
- Activities file: backend/app/workflows/activities.py
- Design spec: docs/plans/document-validation-design.md (Section 3.2)
- Uses IBM Docling for PDF → Markdown conversion
- Must handle: PDF, DOCX, PNG, JPG formats
- Converted Markdown stored in MinIO at {case_id}/iteration-{n}/converted/{filename}.md

Constraints:
- No mocking (testcontainers for MinIO)
- asyncpg: use CAST(:param AS jsonb), never ::jsonb
- Follow existing activity patterns in activities.py

Acceptance criteria:
- Activity accepts document metadata, returns conversion result
- Unsupported formats raise DocumentValidationError
- Conversion failures are logged with full error context
- Tests cover happy path + 3 error cases
- Coverage >= 90% for this activity

Report status as: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, or BLOCKED
```

### Status Handling

Every subagent reports its completion status using one of four values:

| Status | Meaning | Orchestrator Action |
|--------|---------|-------------------|
| **DONE** | Task completed successfully, all acceptance criteria met | Proceed to next task |
| **DONE_WITH_CONCERNS** | Task completed but issues were found that deserve attention | Review concerns, decide whether to address now or defer |
| **NEEDS_CONTEXT** | Task cannot be completed without additional information | Provide missing context, re-dispatch |
| **BLOCKED** | Task cannot proceed due to external dependency or design ambiguity | Resolve blocker, then re-dispatch |

The orchestrator reviews the subagent's output between every task. This review checkpoint is where the human exercises judgment: is the output good enough? Should the approach change? Is the next task still the right one?

### Subagent Dispatch Sequence for a Feature

A typical feature implementation follows this sequence:

```
Orchestrator (developer's session)
  │
  ├─ 1. Research Agent → analyze codebase, identify affected files
  │     Status: DONE → findings inform task decomposition
  │
  ├─ 2. Code Architect → design the solution (if complex)
  │     Status: DONE → design spec written
  │
  ├─ 3. Implementer (Python Expert) → implement backend
  │     Status: DONE_WITH_CONCERNS → "asyncpg cast pattern not used in line 45"
  │     → Orchestrator fixes concern before proceeding
  │
  ├─ 4. Implementer (Frontend Developer) → implement UI
  │     Status: DONE → component created
  │
  ├─ 5. Test Writer → write tests
  │     Status: DONE → tests passing
  │
  ├─ 6. API Reviewer → review endpoint changes
  │     Status: DONE → "PASS, no issues found"
  │
  ├─ 7. Security Reviewer → review auth and data access
  │     Status: DONE_WITH_CONCERNS → "portal endpoint missing token validation"
  │     → Orchestrator dispatches fix, then re-reviews
  │
  └─ 8. Compliance Reviewer → review AI output traceability
        Status: DONE → all regulatory checks pass
```

---

## 6. When to Use Which Agent

This decision matrix maps common development scenarios to the appropriate agent.

| Scenario | Agent(s) | Model | Why |
|----------|----------|-------|-----|
| Design a new feature's architecture | Code Architect | Opus | Requires reasoning about module boundaries, dependencies, migration paths |
| Implement a Python backend service | Python Expert | Sonnet | Type-safe async code following established patterns |
| Implement a React component | Frontend Developer | Sonnet | Accessible, responsive implementation with all states |
| Add a new API endpoint | Python Expert (implement) + API Reviewer (review) | Sonnet + Sonnet | Implementation then checklist verification |
| Write a database migration | Database Engineer (implement) + Migration Reviewer (review) | Opus + Sonnet | Schema design requires judgment; review is mechanical |
| Debug a failing test | Debugger | Sonnet | Systematic root cause analysis, not guesswork |
| Fix a production error | Debugger | Sonnet | Evidence-first diagnosis, minimal fix, regression test |
| Integrate an LLM or AI feature | AI Engineer (implement) + Compliance Reviewer (review) | Opus + Opus | AI integration needs cost awareness; compliance review is mandatory |
| Improve test coverage | Test Writer & Fixer | Sonnet | Behavior-focused tests, deterministic data, proper cleanup |
| Set up CI/CD pipeline | Deployment Engineer | Sonnet | Docker, GitHub Actions, health checks, rollback procedures |
| Build an MCP server | MCP Expert | Sonnet | Protocol-specific patterns, error handling, transport layers |
| Review a PR before merge | Code Reviewer + domain-specific reviewers | Sonnet + varies | Two-stage review: spec compliance then code quality |
| Investigate a codebase before starting work | Research Agent | Sonnet | Broad discovery, deep analysis, structured synthesis |
| Evaluate security of auth changes | Security Reviewer | Opus | Judgment-intensive threat assessment |
| Verify regulatory compliance | Compliance Reviewer | Opus | Cross-referencing implementation against legal requirements |
| Design a UI layout | UI Designer | Sonnet | Exact Tailwind classes, all states, dark mode, accessibility |
| Validate UX decisions | UX Researcher | Sonnet | Lean research methods, impact prioritization |

### Agent Composition Patterns

Some tasks require multiple agents in sequence. Common compositions:

**Implement + Review (most common):**
```
Implementer Agent → produces code → Reviewer Agent → validates quality
```

**Research + Design + Implement:**
```
Research Agent → context → Code Architect → design → Implementer → code
```

**Implement + Multi-Review (for sensitive changes):**
```
Implementer → code
  ├── API Reviewer → endpoint quality
  ├── Security Reviewer → auth & data protection
  └── Compliance Reviewer → regulatory adherence
```

---

## 7. Creating Your Own Project Reviewers

To define a project-specific reviewer agent, create a Markdown file in `<project>/.claude/agents/` with this structure:

```markdown
---
name: <agent-name>
description: <one-line description of when to use this agent>
model: <opus|sonnet|haiku>
tools: <comma-separated list: Read, Grep, Glob, Bash>
---

You are reviewing [what] for [project name].

## Review Checklist

### [Category 1]
- [ ] [Check item with specific, verifiable criteria]
- [ ] [Another check item]

### [Category 2]
- [ ] [Check item]

## Output Format

For each issue found:
- **Severity:** Critical / Important / Minor
- **File:Line:** exact location
- **Issue:** what is wrong
- **Fix:** specific recommendation
```

### Design Guidelines for Reviewer Agents

1. **Checklist items must be verifiable** -- "code is clean" is not verifiable; "no function exceeds 50 lines" is verifiable.
2. **Include the project name** -- the agent needs to know which codebase conventions apply.
3. **Specify tools** -- reviewers typically need Read, Grep, and Glob. Include Bash only if the reviewer needs to run verification commands (like `alembic heads`).
4. **Model selection follows the cost-of-error principle** -- if a missed issue has regulatory or security consequences, use Opus. If a missed issue is caught by tests or CI, use Sonnet.
5. **Keep checklists focused** -- each reviewer covers one domain. Do not create a "general reviewer" that checks everything. Multiple focused reviewers dispatched in parallel outperform a single monolithic reviewer.

---

## 8. Agent System Maintenance

### Adding a New Global Agent

1. Create `~/.claude/agents/<agent-name>.md` following the format in Section 1
2. Include: `<role>`, `<constraints>`, `<output_format>`, and `<checklist>` sections
3. Test by invoking the agent on a representative task
4. The agent is immediately available in all projects

### Adding a New Project Reviewer

1. Create `<project>/.claude/agents/<reviewer-name>.md` following the format in Section 7
2. Commit the agent definition to the project repository
3. Update the project's CLAUDE.md to document when to dispatch the reviewer
4. All developers working on the project automatically receive the reviewer

### Evolving Agent Definitions

Agent definitions are code -- they should be versioned, reviewed, and improved based on experience. Common improvements:

- **Adding checklist items** after discovering a class of bugs that the reviewer missed
- **Removing checklist items** that consistently produce false positives
- **Adjusting model assignment** based on observed quality of reviews
- **Refining constraints** to reduce unhelpful output (e.g., "do not suggest changes outside the scope of the current diff")

---

## Summary

The agent system encodes institutional knowledge into reusable, versionable definitions that enforce quality standards automatically. Global specialist agents provide domain expertise across projects. Project reviewer agents codify project-specific conventions and regulatory requirements. The two-stage review pattern ensures both spec compliance and code quality. Subagent-driven development with fresh context per task prevents context pollution and confirmation bias. Model selection follows the cost-of-error principle: Opus for judgment, Sonnet for checklists, Haiku for speed.

The system's value compounds over time. Every bug caught by a reviewer becomes a new checklist item. Every pattern enforced by a constraint becomes a project convention. The agents do not replace human judgment -- they ensure that judgment is applied consistently, even when the developer is tired, rushed, or unfamiliar with a particular domain.
