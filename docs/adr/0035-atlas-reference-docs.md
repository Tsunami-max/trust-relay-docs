---
id: 0035-atlas-reference-docs
sidebar_position: 36
title: "ADR-0035: Atlas Reference Documentation"
---

# ADR-0035: Atlas Reference Documentation within Trust Relay Docusaurus

**Status:** Accepted
**Date:** 2026-04-06

## Context

Trust Relay and Atlas are two compliance platforms developed in parallel within the same organization. Atlas was built by co-founder Valentin using a different tech stack (LangChain/LangGraph, Blueprint.js, Flyway, OpenRouter), while Trust Relay was built by Adrian with Claude Code (PydanticAI, Next.js, Alembic, direct LLM APIs). Both systems address KYB/KYC/AML compliance but take different architectural paths to the same goals.

The team needed to understand Atlas's capabilities, architecture, and design decisions for three reasons: (1) to identify patterns worth adopting in Trust Relay (which led to the Atlas Adoption Waves -- quality scorer, EBA risk matrix, model tiers, entity matching, survivorship, and others), (2) to avoid duplicating effort on features Atlas already handles well, and (3) to prepare for potential system integration or consolidation decisions.

The question was where to document Atlas. Options included a separate Docusaurus site, a shared wiki, or embedding Atlas documentation within Trust Relay's existing Docusaurus site. The documentation needed to be objective, detailed enough for architectural comparison, and accessible to the development team without switching contexts.

## Decision

Document Atlas comprehensively within Trust Relay's Docusaurus site under a dedicated `atlas/` section. The documentation covers:

- **Overview** -- what Atlas does, who built it, the 8 investigation modules
- **Architecture** -- system design, LangChain/LangGraph orchestration, Temporal integration
- **Tech stack** -- framework choices and how they compare to Trust Relay's stack
- **Investigation pipeline** -- the 7 parallel modules + summary synthesis
- **Risk scoring** -- configurable EBA-aligned risk matrix
- **Graph database** -- Neo4j knowledge graph with ontology-driven entity management
- **Ontology system** -- entity types, field-level provenance, mutation queues
- **Workflow studio** -- visual drag-and-drop workflow builder
- **Frontend** -- Blueprint.js UI, investigation flow, entity management
- **API reference** -- backend endpoints and data contracts
- **Import candidates** -- features from Atlas evaluated for adoption into Trust Relay

The documentation is written from Trust Relay's perspective but aims to be objective and educational. It explicitly notes where Atlas does something better, where the approaches converge, and where they diverge. Each page has a `last_verified` date and `status: reference` frontmatter to track freshness.

## Consequences

### Positive
- Single Docusaurus site means the team has one place for all architectural knowledge -- no context-switching between documentation systems
- Explicit comparison sections enabled the Atlas Adoption Waves, which brought 12 patterns into Trust Relay (quality scorer, EBA risk matrix, model tiers, entity matching, survivorship, and others)
- Documenting Atlas forced a deep analysis of its architecture, revealing both good patterns to adopt and anti-patterns to avoid
- The `import candidates` page provides a living checklist of potential future adoptions with clear rationale for each

### Negative
- Atlas documentation may become stale if the Atlas codebase evolves independently without corresponding doc updates
- Documenting a co-founder's system requires diplomatic framing -- the docs must be technically honest without being dismissive
- Adds 10+ pages to the Docusaurus site that are reference material rather than actionable architecture guides

### Risks
- If the systems eventually merge, the Atlas documentation section becomes partially obsolete and needs significant rework
- If Atlas development stops, the documentation becomes a historical artifact rather than a living reference -- the `last_verified` dates will signal this naturally
