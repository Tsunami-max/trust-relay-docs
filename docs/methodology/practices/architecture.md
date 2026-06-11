---
sidebar_position: 1
title: "Architecture"
description: "**What:** The agent system is organized into two tiers."
---


**What:** The agent system is organized into two tiers. Global specialist agents (14 types) live in `~/.claude/agents/` and provide broad domain expertise — security engineering, database design, AI/ML implementation, frontend development, testing. Project-specific reviewer agents (4 types) live in `PROJECT/.claude/agents/` and provide targeted review checklists calibrated to the project's specific patterns, conventions, and regulatory requirements.

**Why:** The two-tier structure exists for the same reason as the instruction hierarchy (Section 4): different scopes require different levels of specificity.

A global security engineer agent knows about OWASP Top 10, JWT validation, SQL injection prevention, and PII protection. This knowledge applies to any project. But it does not know that Trust Relay uses `Depends(get_current_user)` for authentication, `get_tenant_session(tenant_id)` for database access, or that 33 tables have `FORCE ROW LEVEL SECURITY`. A project-specific security reviewer knows these conventions and checks for them explicitly.

Global agents are generalists that apply broad expertise. Project reviewers are specialists that enforce specific contracts. Both are needed: the global agent catches categories of issues (missing authentication), and the project reviewer catches convention violations (using `get_session()` instead of `get_tenant_session()`).

**Global Specialist Agents (14):**

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

**Project-Specific Reviewer Agents (4):**

These are detailed in Section 5.3.

**Evidence:** Trust Relay uses 18 agent definitions: 14 global specialists and 4 project reviewers. Each agent definition includes a frontmatter header (name, description, model, tools), a role description, a domain-specific checklist, and an output format specification. The project reviewers are calibrated to Trust Relay's specific patterns — the API reviewer checks for `Depends(get_current_tenant)`, the migration reviewer checks for `FORCE ROW LEVEL SECURITY`, the compliance reviewer checks for EU AI Act Article 11-15 requirements. See [appendix-f-evidence.md](../appendix-f-evidence) for the agent count metrics.

**How:** Agent definitions are markdown files with YAML frontmatter placed in `~/.claude/agents/` (global) or `PROJECT/.claude/agents/` (project). Claude Code discovers them automatically. For the full agent architecture specification, see [appendix-c-agents.md](../appendix-c-agents).

---
