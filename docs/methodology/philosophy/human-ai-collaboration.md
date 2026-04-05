---
sidebar_position: 2
title: "Human-AI Collaboration Model"
description: "The methodology treats AI-assisted development as a collaboration between an architect (human) and a senior engineer (AI)"
---

# Human-AI Collaboration Model

**What:** The methodology treats AI-assisted development as a collaboration between an architect (human) and a senior engineer (AI), not as automation of software development. The human decides *what* to build and *why*. The AI proposes *how* to build it. The human validates the proposal against business requirements, regulatory constraints, and architectural coherence. The AI implements. The human reviews.

**Why:** Two failure modes motivate this division of labor, and they are opposite extremes.

*Failure mode 1: AI without judgment.* When AI generates code without architectural supervision, it produces solutions that are locally correct but globally incoherent. Each component works in isolation but the system doesn't compose. The AI lacks business context, regulatory awareness, and long-term architectural vision. It optimizes for the immediate request and ignores cross-cutting concerns. The resulting codebase is a collection of individually reasonable decisions that do not add up to a coherent system.

*Failure mode 2: Human without velocity.* A single architect working without AI assistance on a system of Trust Relay's complexity — 233 endpoints, 43 ORM models, 102 service modules, Temporal workflow orchestration, multi-source OSINT integration, regulatory audit trails — would require months of implementation time after completing the design. The architecture would be sound but the time-to-market would be uncompetitive. Human judgment is irreplaceable but human typing speed is a bottleneck.

The collaboration model resolves both failure modes. The human provides what the AI lacks (judgment, context, regulatory knowledge, architectural vision) and the AI provides what the human lacks (implementation velocity, comprehensive test generation, consistent adherence to established patterns, willingness to write boilerplate without quality degradation).

## Specific Division of Labor

| Responsibility | Owner | Rationale |
|---|---|---|
| Problem definition | Human | Requires business context the AI does not have |
| Approach selection | Human (with AI proposals) | AI proposes 3+ approaches; human selects based on constraints AI cannot fully evaluate |
| API contract design | Human | Contracts affect other teams and external consumers; judgment-intensive |
| Implementation | AI (under human review) | Pattern-following work where AI excels |
| Test implementation | AI (under human review) | Comprehensive test generation is an AI strength; coverage gaps are a human blind spot |
| Code review | Both (two-stage) | AI reviews for spec compliance and patterns; human reviews for architectural coherence |
| Regulatory compliance | Human (with AI support) | Legal interpretation requires human accountability; AI assists with completeness checks |
| Documentation | AI (under human review) | Volume work where AI maintains quality; human ensures accuracy of claims |
| Refactoring | AI (under human direction) | Mechanical transformation where AI consistency prevents errors; human decides what to refactor |
| Architecture decisions | Human | ADRs require judgment about long-term tradeoffs |

**Evidence:** 95.8% of Trust Relay's 1,264 commits are co-authored (1,211 commits carry the `Co-Authored-By` trailer). The remaining 4.2% are human-only commits — typically configuration changes, environment setup, or deliberate manual interventions. This ratio reflects the model in practice: the human architects every session's work, the AI implements it, the human reviews and commits. The velocity outcome is 144,821 lines of production code across 25 active development days, which translates to approximately 5,793 lines per day or ~22 commits per day on active days. This velocity is not achievable by a solo human developer, and it is not achievable by unsupervised AI generation (which would produce volume without coherence). See the [Evidence appendix](../evidence/trust-relay-metrics) for the velocity metrics.

**How:** The collaboration model is encoded in infrastructure, not left to discipline:

- **CLAUDE.md** (project-level) provides the AI with architectural context, technical constraints, and established patterns. This is the primary mechanism by which the human architect's judgment persists across AI sessions. A well-written CLAUDE.md is worth more than any prompt engineering technique because it operates at the system level rather than the request level.

- **Memory files** (`memory/MEMORY.md` and linked files) provide the AI with accumulated knowledge about the project's history, preferences, known debt, and regulatory requirements. This prevents each new session from starting at zero.

- **Superpowers skills** enforce the lifecycle structure. The AI cannot skip the design phase or the verification phase because the skills define the workflow sequence.

- **Agent-based review** provides automated second opinions. The human architect is not the sole quality gate — specialized reviewer agents check for security issues, API consistency, and compliance gaps.

- **Subagent-driven development** ensures fresh context per task. Rather than one long session that accumulates context pollution, each implementation task dispatches a fresh subagent with only the relevant context. The orchestrating session reviews output between tasks.

For the full agent architecture, see [Agent Architecture](../infrastructure/agent-architecture). For memory system details, see [Memory System](../infrastructure/memory-system).
