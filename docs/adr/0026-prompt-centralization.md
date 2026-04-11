---
id: 0026-prompt-centralization
sidebar_position: 27
title: "ADR-0026: Prompt Centralization"
---

# ADR-0026: Prompt Centralization with DB-First Registry and Filesystem Fallback

**Date:** 2026-03-17 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Trust Relay runs 13+ PydanticAI agents, each with complex system prompts that define investigation behavior, risk assessment criteria, and output formatting rules. These prompts were originally scattered across agent source files as inline Python strings -- `osint_agent.py`, `synthesis_agent.py`, `task_generation_agent.py`, and others each contained their own prompt text.

This scattered approach created several problems. First, there was no version tracking separate from code: changing a prompt required a code commit and redeployment, making iterative prompt tuning expensive. Second, A/B testing different prompt variants was impossible without branching the codebase. Third, and most critically for regulatory compliance, there was no audit trail linking a specific agent output to the exact prompt text that produced it. EU AI Act Article 12 requires automatic logging of all AI operations, including the configuration (prompt) used for each execution.

The prompt text itself is often the most impactful lever for investigation quality. A single word change in the synthesis agent's prompt can shift risk assessments across hundreds of cases. This level of impact demands the same version control rigor applied to database schemas -- explicit versioning, rollback capability, and traceability.

## Decision

We implement a `PromptRegistry` singleton with a DB-first loading strategy and filesystem fallback:

### Loading Strategy
1. At startup, load all `.jinja2` template files from `app/prompts/` directory. Each file includes YAML frontmatter with metadata (agent name, version, description, required variables).
2. Query the `prompt_versions` database table and overlay any matching records. Database versions take precedence over filesystem versions, enabling runtime overrides without redeployment.
3. Cache all loaded prompts with a 60-second TTL. Cache invalidation occurs on explicit refresh or TTL expiry.

### Render-Time Traceability
Every call to `PromptRegistry.render()` sets a Python `contextvar` (`_current_prompt_version_id`) with the UUID of the prompt version being used. This contextvar is read by the agent execution framework and stored alongside the agent's output in the audit trail, creating an FK link between every AI-generated result and the exact prompt text that produced it.

### Template Engine
Jinja2 with `StrictUndefined` environment. This causes a render-time exception if any template variable is missing, catching misconfiguration at render time rather than producing a prompt with `{undefined}` placeholders that would silently degrade agent behavior.

### Template Inventory
34 Jinja2 templates with YAML frontmatter validation, covering all 13 pipeline agents plus specialized prompts for task generation, document validation, MCC classification, and chatbot actions.

## Consequences

### Positive
- Every agent output is traceable to a specific prompt version via the contextvar FK link, satisfying EU AI Act Article 12 logging requirements
- Runtime prompt overrides via database enable A/B testing and emergency prompt fixes without code deployment
- Jinja2 StrictUndefined catches missing variables at render time, preventing silent prompt degradation
- Centralized prompt directory (`app/prompts/`) makes it easy to review, diff, and audit all prompt text in one location
- YAML frontmatter enforces structured metadata (required variables, agent mapping) that prevents orphaned or misconfigured prompts

### Negative
- The 60-second cache TTL means prompt changes take up to 60 seconds to propagate, which can cause inconsistent behavior during the propagation window
- DB-first loading adds a database query to application startup, creating a hard dependency on database availability for prompt loading (mitigated by filesystem fallback)
- Jinja2 template syntax is less familiar to non-developers who might want to edit prompts, increasing the barrier to prompt tuning by domain experts

### Neutral
- Phase 2 (admin UI for prompt management) is deferred -- currently prompts are managed via direct database insertion or filesystem edits
- The `PromptVersion` ORM model exists but the admin API endpoints are not yet implemented
- Filesystem templates serve as the "golden source" for version control; database overrides are ephemeral and environment-specific

## Alternatives Considered

### Alternative 1: Inline Prompts in Agent Code
- Why rejected: No version control separate from code deployment. Prompt changes require a full CI/CD cycle. No A/B testing capability. Most critically, no mechanism to link agent outputs to the exact prompt version used, breaking EU AI Act Article 12 traceability requirements.

### Alternative 2: Pure Filesystem (No Database Layer)
- Why rejected: Filesystem-only storage provides version control via git but no runtime override capability. Emergency prompt fixes require code deployment. A/B testing requires branching the codebase. The database layer adds the ability to override prompts per environment (staging vs production) without maintaining separate template directories.

### Alternative 3: No Contextvar Tracking
- Why rejected: Without render-time contextvar tracking, there is no programmatic link between an agent's output and the prompt that generated it. Reconstructing this link after the fact requires matching timestamps and hoping no prompt change occurred between render and output -- an unreliable approach that would not satisfy regulatory audit requirements.
