---
sidebar_position: 1
title: "Living Documentation Practice"
description: "Documentation as a primary deliverable: what gets documented, the five principles, infrastructure, and the AI context loop"
---

# Living Documentation Practice

Living documentation is a methodology differentiator. Most engineering teams treat documentation as a secondary artifact — something written after the code, maintained sporadically, and abandoned when it drifts too far from reality. This methodology treats documentation as a primary deliverable with the same structural enforcement as code and tests.

The practice is not "write docs when you have time." It is: a feature is not complete until its documentation exists.

---

## What Gets Documented

Not everything warrants the same documentation treatment. The following table maps content categories to their audience, format, and update triggers.

| Category | Audience | Content Type | Update Trigger |
|---|---|---|---|
| Architecture | Developers, AI agents | Data flow diagrams, component maps, service inventories | New service, new integration, structural refactoring |
| ADRs | Decision-makers, future developers | Context, decision, consequences, alternatives | Technology choice, pattern change, data model decision |
| API Reference | Integrators, frontend developers | Endpoint documentation, request/response schemas, auth requirements | New endpoint, schema change, behavior change |
| Strategy & Business | Partners, investors, regulators | Business context, market analysis, regulatory positioning | Funding rounds, partnership changes, regulatory developments |
| Compliance | Regulators, auditors, legal | EU AI Act mapping, GDPR processing records, AML methodology | New AI feature, new data processing activity, regulatory update |
| Features | Prospects, demo audiences | Feature showcases, capability descriptions, competitive positioning | New feature launch, significant enhancement |

The table is deliberately conservative. Not every code change triggers a documentation update. Configuration changes, bug fixes, and minor refactoring do not need documentation. The triggers are structural changes that alter how the system works, not tactical changes that fix how it behaves.

---

## Documentation Principles

Five principles govern how documentation is written. Each addresses a specific failure mode observed in engineering documentation practices.

### Principle 1: Concurrent, Not Retroactive

Documentation is written at the same time as the code it describes, in the same branch, by the same developer (human or AI). A feature branch that includes code changes but not the corresponding documentation update is incomplete.

The failure mode this prevents: documentation sprints. Teams that defer documentation accumulate documentation debt, then schedule "doc days" to catch up. These sprints are painful because the context has left the developer's working memory. The resulting documentation is vague, often inaccurate, and quickly becomes stale.

Concurrent documentation avoids this because the developer writes the documentation while the context is fresh. The cost is 10-15 minutes per feature. The benefit is documentation that accurately reflects the code.

### Principle 2: Honest, Not Aspirational

Documentation describes the system as it is, not as the team wishes it were. Maturity ratings acknowledge gaps. Competitive analysis credits competitors where they are stronger. Planned features are clearly labeled as planned, not described in the present tense. A skeptic who reads the documentation and then reads the code should find the documentation understated, not overstated.

:::warning Credibility is fragile
Aspirational documentation erodes trust the moment a technical reader discovers the gap between claims and reality. For a compliance platform, where trust is the product, this is fatal.
:::

This principle extends to metrics. The [Evidence appendix](../evidence/trust-relay-metrics) includes the exact commands used to collect every metric. A reader can run the same commands and verify the numbers independently.

### Principle 3: Multi-Audience by Structure

Documentation is organized so that different audiences find relevant content through navigation, not by reading everything and filtering. The Docusaurus navbar sections serve different readers:

| Section | Primary Audience | Content Focus |
|---|---|---|
| Architecture | Developers, AI agents | How the system works, data flow, component interaction |
| ADRs | Decision-makers, new team members | Why the system is built this way, what alternatives were considered |
| API Reference | Integrators, frontend developers | How to interact with the system programmatically |
| Strategy | Business stakeholders, partners | Why this system exists, market positioning, business model |
| Methodology | New team members, partners | How the team works, development lifecycle, quality standards |
| Compliance | Regulators, auditors | How the system meets regulatory requirements |

### Principle 4: AI-Augmented Context

Docusaurus pages give Claude narrative understanding that raw code cannot provide. Code shows *what* the system does. Documentation explains *why* it does it that way — the business reasoning behind a pillar, the regulatory constraint that shaped an API design, the integration requirements that motivated an architectural pattern.

This narrative context produces measurably better AI output. When Claude reads an ADR that explains why the system uses the Repository pattern instead of raw SQL, it generates new database code using the Repository pattern without being explicitly told.

The mechanism is simple: CLAUDE.md references memory files, memory files reference design documents, design documents reference Docusaurus pages. This cross-referencing creates a navigable knowledge graph that gives Claude context depth proportional to the documentation's comprehensiveness. More documentation, better context, better code. The loop compounds.

### Principle 5: Evidence-Grade Claims

Every factual assertion in the documentation is backed by data — a metric, a test result, a commit reference, or a verifiable command. Claims without evidence are opinions, and opinions do not belong in engineering documentation.

---

## Infrastructure

The documentation infrastructure is deliberately simple.

**Docusaurus 3.x** — React-based documentation framework. Chosen for: Mermaid diagram support (via `@docusaurus/theme-mermaid`), MDX support for interactive components, and a mature ecosystem with versioning, search, and internationalization.

**Cloudflare Pages** — Deployment target. Push to the repository triggers a build and deploy. No CI/CD pipeline to maintain.

**Same-repo deployment** — The Docusaurus source lives in a `docusaurus/` directory within the application repository. This ensures documentation and code are always at the same commit. This eliminates the drift that occurs when documentation lives in a separate repository.

**Mermaid diagrams** — Architecture diagrams, data flow diagrams, and lifecycle diagrams are authored as Mermaid code blocks within Markdown files. This keeps diagrams in version control, makes them editable by AI, and renders them automatically in Docusaurus.

---

## The Documentation Commit Pattern

Every feature branch that changes architecture includes four artifacts:

1. **Code changes** — the implementation itself
2. **ADR** (if applicable) — if a significant decision was made during implementation
3. **Docusaurus page update** — the relevant documentation page reflecting the new state
4. **Build verification** — `npm run build` in the Docusaurus directory confirms the documentation compiles without errors

This pattern is enforced during the [review stage](../lifecycle/code-review-cycle). Code changes without corresponding documentation updates are treated as incomplete.

---

## The AI Context Loop

The most significant benefit of living documentation is the compounding knowledge flywheel that accelerates AI-assisted development over time.

1. **Documentation provides context.** Claude reads CLAUDE.md, memory files, and linked documents at session start. A well-documented system gives Claude a comprehensive mental model of the architecture, the business constraints, the regulatory requirements, and the design philosophy.

2. **Context produces alignment.** With narrative understanding of *why* the system is designed the way it is, Claude produces implementations that align with existing patterns on the first attempt rather than requiring multiple rounds of correction.

3. **Implementation generates documentation.** The documentation commit pattern ensures that every significant implementation produces updated documentation.

4. **Documentation enriches context.** The new documentation is available to future Claude sessions. The next feature implementation benefits from the accumulated context of all previous implementations.

Each cycle through this loop adds context depth. After 1,264 commits with this pattern active, the system's documentation corpus provides Claude with a level of understanding that would take a new human developer weeks to acquire through code reading alone.

The practical implication is that documentation quality directly affects development velocity. An hour spent writing a clear Docusaurus page is not documentation overhead — it is an investment in every future AI session that will read that page and produce better-aligned code as a result.
