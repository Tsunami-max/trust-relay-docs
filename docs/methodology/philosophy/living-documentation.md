---
sidebar_position: 5
title: "Living Documentation"
description: "Every architectural decision and system capability is documented at the time it is built, not retroactively — documentation is a deliverable, not an afterthought"
---

# Living Documentation

**What:** Every architectural decision, business analysis, and system capability is documented in a structured Docusaurus site at the time it is built, not retroactively. Documentation is a deliverable on the same tier as code and tests. A feature is not considered complete until its documentation exists.

**Why:** Documentation debt compounds faster than technical debt. Code without documentation can still be understood by reading it (slowly, imperfectly, but it is possible). But the *reasons* behind the code — why this approach was chosen over the alternatives, what regulatory requirement drove this design, what business constraint shaped this API — are invisible in the code itself. Once the context leaves the developer's working memory, it is gone unless it was written down.

In AI-assisted development, documentation serves an additional critical function: it is context for the AI collaborator. Claude Code reads CLAUDE.md, memory files, and linked documents at session start. A well-documented system provides the AI with narrative understanding of *why* the architecture is shaped the way it is, not just *what* the code does. This narrative understanding produces measurably better implementation proposals because the AI can align its output with the system's design philosophy rather than generating locally reasonable but globally incoherent solutions.

This creates a compounding knowledge flywheel:

1. The architect writes a design specification.
2. Claude reads the specification and produces aligned implementation.
3. The implementation is documented (API contracts, architectural diagrams, decision records).
4. Future Claude sessions read the accumulated documentation and produce even more aligned output.
5. Each cycle adds context that makes the next cycle faster and more accurate.

The flywheel's value is proportional to the documentation's quality and currency. Stale documentation is worse than no documentation because it misleads the AI into producing code aligned with a system state that no longer exists. This is why documentation currency is enforced structurally (through the documentation commit pattern) rather than through periodic "documentation sprints" that inevitably lag behind the code.

## The Five Audiences

| Audience | What they need | How the docs serve them |
|---|---|---|
| Prospects and partners | Credibility at first glance | Architecture depth, regulatory rigor, evidence-backed claims demonstrate engineering capability |
| AI agents (Claude) | Narrative context beyond code | Design specifications, ADRs, and business analysis provide the "why" that raw code cannot convey |
| Developers | Architecture truth | API references, data flow diagrams, and component registries serve as onboarding and navigation |
| Regulators | Compliance depth | EU AI Act traceability, GDPR data processing records, AML audit trail documentation |
| Team | Alignment as system grows | ADRs prevent re-litigating decisions; pillar documentation prevents scope ambiguity |

**Evidence:** Trust Relay maintains 72 Docusaurus documents: 30 architecture documents, 36 ADRs, 8 API reference documents, 6 strategy/business documents, and 2 feature showcases. The code-to-documentation commit ratio is approximately 1:1 — meaning that for every commit that changes code, there is roughly one commit that updates documentation. This ratio is not mandated by a metric; it is a natural outcome of the documentation commit pattern where documentation updates are included in the same branch as code changes.

The Docusaurus site (trust-relay.pages.dev) is the first artifact shown to external parties — investors, partners, regulators. It establishes engineering credibility before a single line of code is reviewed. The VLAIO development project pitch (2026-03-17) used the Docusaurus site as primary evidence of technical capability. See the [Evidence appendix](../evidence/trust-relay-metrics) for documentation metrics.

:::info Honesty note
The 1:1 ratio is approximate, not exact. Documentation lags behind code during intensive implementation sprints and catches up during consolidation phases. The methodology does not claim perfect synchronization — it claims structural incentives that keep documentation within a reasonable distance of the code's actual state.
:::

**How:** The documentation practice operates through four mechanisms:

1. **The documentation commit pattern.** Every feature branch that changes architecture includes: code changes, ADR (if a significant decision was made), Docusaurus page update, and build verification. This is enforced by the review stage, where reviewer agents check for documentation alongside code.

2. **Docusaurus infrastructure.** Docusaurus 3.x with Mermaid diagram support, deployed to Cloudflare Pages from the same repository as the application code (`docusaurus/` directory). Same-repo deployment ensures documentation and code are at the same commit, eliminating the drift that occurs when documentation lives in a separate repository with a separate deployment cycle.

3. **Structured content organization.** Documentation is organized by audience through Docusaurus navbar sections: Architecture (developers), ADRs (decision-makers), API Reference (integrators), Strategy (business stakeholders), Methodology (new team members). This structure prevents the common failure mode where all documentation is dumped into a flat wiki with no navigation hierarchy.

4. **The AI context loop.** Memory files reference Docusaurus documents. Design specifications reference ADRs. CLAUDE.md references architecture overviews. This cross-referencing creates a navigable knowledge graph that both humans and AI can traverse to find relevant context for any given task.

For the full living documentation practice, see [Living Documentation Practice](../practices/living-documentation).
