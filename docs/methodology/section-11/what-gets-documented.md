---
sidebar_position: 1
title: "What Gets Documented"
description: "Not everything warrants the same documentation treatment."
---


Not everything warrants the same documentation treatment. The following table maps content categories to their audience, format, and update triggers.

| Category | Audience | Content Type | Update Trigger |
|---|---|---|---|
| Architecture | Developers, AI agents | Data flow diagrams, component maps, service inventories | New service, new integration, structural refactoring |
| ADRs | Decision-makers, future developers | Context, decision, consequences, alternatives | Technology choice, pattern change, data model decision |
| API Reference | Integrators, frontend developers | Endpoint documentation, request/response schemas, auth requirements | New endpoint, schema change, behavior change |
| Strategy & Business | Partners, investors, regulators | Business context, market analysis, regulatory positioning | Funding rounds, partnership changes, regulatory developments |
| Compliance | Regulators, auditors, legal | EU AI Act mapping, GDPR processing records, AML methodology | New AI feature, new data processing activity, regulatory update |
| Features | Prospects, demo audiences | Feature showcases, capability descriptions, competitive positioning | New feature launch, significant enhancement |
| Project state | Fresh AI agents, returning developers | `STATE.md` — current milestone, last shipped, blockers, next-up | Per-shipped-artifact (task lands, ADR accepted, milestone closes); see Section 11.6 |

The table is deliberately conservative. Not every code change triggers a documentation update. Configuration changes, bug fixes, and minor refactoring do not need documentation. The triggers are structural changes that alter how the system works, not tactical changes that fix how it behaves.

---
