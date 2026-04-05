---
sidebar_position: 1
title: "S4U Development Methodology"
description: "AI-assisted software engineering at production quality — a systematic approach developed through 1,264 commits on the Trust Relay compliance platform"
---

# S4U Development Methodology

## AI-Assisted Software Engineering at Production Quality

This document specifies the S4U Development Methodology — a systematic approach to AI-assisted software engineering that treats the AI collaborator as a senior engineer operating under architectural supervision, not as an autocomplete tool or a replacement for engineering judgment.

The methodology was developed through 1,264 commits across 29 calendar days (25 active development days) of AI-assisted development on the Trust Relay compliance platform — a KYB/KYC system targeting EU AI Act, GDPR, and 6AMLD regulatory compliance. The resulting system spans 144,821 lines of production code (69,985 Python, 74,836 TypeScript), 233 API endpoints, 3,769 test functions, 17 Architecture Decision Records, and 31 database migrations. All metrics are independently verifiable; the exact commands to reproduce each number are documented in the [Evidence appendix](evidence/trust-relay-metrics).

The audience is a technically advanced engineer evaluating whether this methodology produces results that justify its overhead. The document is structured so that every claim links to verifiable evidence and every practice includes a rationale.

This specification was itself designed using the development lifecycle it describes: brainstormed, specified, planned, implemented, verified, and reviewed — a practical validation of the process.

---

## Documentation Guide

This methodology documentation is organized into six sections, each serving a different purpose:

| Section | What You Will Find | Start Here If... |
|---|---|---|
| [Philosophy](philosophy/design-before-code) | The five foundational principles and the reasoning behind each | You want to understand the "why" before the "how" |
| [Development Lifecycle](lifecycle/lifecycle-overview) | The three lifecycle patterns (full cycle, bug fix, code review) with Mermaid diagrams | You want to understand the development workflow |
| [Infrastructure](infrastructure/instruction-hierarchy) | The instruction hierarchy, agent system, memory system, quality gates, and MCP integration | You want to set up or configure the methodology tooling |
| [Practices](practices/living-documentation) | Living documentation and regulatory compliance as development practices | You want to understand how documentation and compliance are integrated |
| [Standards](standards/testing-standard) | Testing, UI/UX, and ADR standards — the full specifications | You need the detailed rules and checklists |
| [Evidence](evidence/trust-relay-metrics) | Trust Relay proof points — hard metrics with collection commands | You want to verify the methodology's results independently |

---

## Adoption Tiers

| Tier | Components | Value Provided |
|---|---|---|
| **Core** (non-negotiable for integration) | Testing standard (no-mocking, coverage targets), commit conventions, ADR format, RLS patterns, regulatory compliance requirements, living documentation (Docusaurus) | Integration compatibility — code produced under these standards integrates cleanly with the shared codebase |
| **Recommended** (strongly advised) | Agent definitions, memory file organization, hook scripts, MCP server integration | Development velocity and quality — proven valuable but divergence does not break integration |
| **Optional** (adopt if useful) | Permission mode (`dontAsk` vs default), effort level configuration, output style preferences | Team preference — customize to individual working style |

The tier classification allows incremental adoption. Start with Core for immediate integration compatibility, add Recommended as the value becomes apparent through use, and customize Optional to personal preference.

:::tip Quick Start (2 Steps)
For developers who want to evaluate the methodology before committing to the full setup:

1. Install the Superpowers plugin: `claude plugins install superpowers@superpowers-marketplace`
2. Add the Stop verification hook to `.claude/settings.json`

These two steps provide immediate value — lifecycle enforcement through skills and completion verification through the Stop hook — and can be expanded to the full 10-step setup after validation.
:::
