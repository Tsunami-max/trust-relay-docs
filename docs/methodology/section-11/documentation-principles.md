---
sidebar_position: 2
title: "Documentation Principles"
description: "Five principles govern how documentation is written."
---


Five principles govern how documentation is written. Each addresses a specific failure mode observed in engineering documentation practices.

**Principle 1: Concurrent, not retroactive.**

Documentation is written at the same time as the code it describes, in the same branch, by the same developer (human or AI). A feature branch that includes code changes but not the corresponding documentation update is incomplete.

The failure mode this prevents: documentation sprints. Teams that defer documentation accumulate documentation debt, then schedule "doc days" to catch up. These sprints are painful because the context has left the developer's working memory. The resulting documentation is vague, often inaccurate, and quickly becomes stale because the practice that produced it — writing docs from memory weeks after the code — is inherently unreliable.

Concurrent documentation avoids this because the developer writes the documentation while the context is fresh. The cost is 10-15 minutes per feature to update the relevant Docusaurus page. The benefit is documentation that accurately reflects the code because it was written by someone who just finished writing (or reviewing) the code.

**Principle 2: Honest, not aspirational.**

Documentation describes the system as it is, not as the team wishes it were. Maturity ratings acknowledge gaps. Competitive analysis credits competitors where they are stronger. Planned features are clearly labeled as planned, not described in the present tense. A skeptic who reads the documentation and then reads the code should find the documentation understated, not overstated.

The failure mode this prevents: credibility loss. Aspirational documentation erodes trust the moment a technical reader discovers the gap between claims and reality. For a compliance platform, where trust is the product, this is fatal. A document that says "Pillar 6: Collaborative Intelligence Network — not yet started, requires Pillar 0 multi-tenancy foundation" is more credible than a document that describes Pillar 6 as if it exists.

This principle extends to metrics. The evidence appendix ([appendix-f-evidence.md](../appendix-f-evidence)) includes the exact commands used to collect every metric. A reader can run the same commands and verify the numbers independently. If a metric has a caveat (e.g., the 1:1 code-to-documentation commit ratio is approximate, not exact), the caveat is stated.

**Principle 3: Multi-audience by structure.**

Documentation is organized so that different audiences find relevant content through navigation, not by reading everything and filtering. The Docusaurus navbar sections serve different readers:

| Section | Primary Audience | Content Focus |
|---|---|---|
| Architecture | Developers, AI agents | How the system works, data flow, component interaction |
| ADRs | Decision-makers, new team members | Why the system is built this way, what alternatives were considered |
| API Reference | Integrators, frontend developers | How to interact with the system programmatically |
| Strategy | Business stakeholders, partners | Why this system exists, market positioning, business model |
| Methodology | New team members, partners | How the team works, development lifecycle, quality standards |
| Compliance | Regulators, auditors | How the system meets regulatory requirements |

A partner evaluating the system reads Strategy and Architecture. A developer joining the team reads Architecture and Methodology. A regulator reads Compliance and ADRs. None of them need to read the entire documentation corpus to find what they need.

**Principle 4: AI-augmented context.**

Docusaurus pages give Claude narrative understanding that raw code cannot provide. Code shows *what* the system does. Documentation explains *why* it does it that way — the business reasoning behind a pillar, the regulatory constraint that shaped an API design, the integration requirements that motivated an architectural pattern.

This narrative context produces measurably better AI output. When Claude reads an ADR that explains why the system uses the Repository pattern instead of raw SQL, it generates new database code using the Repository pattern without being explicitly told. When Claude reads a Docusaurus page explaining the 9-step compliance workflow, it produces implementations that align with the workflow's state machine rather than inventing a different flow.

The mechanism is simple: CLAUDE.md references memory files, memory files reference design documents, design documents reference Docusaurus pages. This cross-referencing creates a navigable knowledge graph that gives Claude context depth proportional to the documentation's comprehensiveness. More documentation, better context, better code. The loop compounds.

**Principle 5: Evidence-grade claims.**

Every factual assertion in the documentation is backed by data — a metric, a test result, a commit reference, or a verifiable command. Claims without evidence are opinions, and opinions do not belong in engineering documentation.

This principle applies to the methodology documentation itself. The evidence appendix ([appendix-f-evidence.md](../appendix-f-evidence)) does not contain analysis or interpretation. It contains tables of numbers, each annotated with the exact shell command used to collect it. A reader who distrusts a claim can reproduce the measurement independently.

The practical effect is that every Docusaurus page that claims a capability must point to the code, test, or metric that proves the capability exists. "Trust Relay supports 8 EU company registries" links to the registry agent implementations. "33 tables have Row Level Security" links to the migration files that enable it. Documentation without evidence anchors is aspirational, and aspirational documentation violates Principle 2.

---
