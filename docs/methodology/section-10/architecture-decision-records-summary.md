---
sidebar_position: 0
title: "Architecture Decision Records (Summary)"
description: "Architecture Decision Records (ADRs) capture the reasoning behind significant technical decisions."
---


Architecture Decision Records (ADRs) capture the reasoning behind significant technical decisions. The decision itself matters less than the context, alternatives considered, and the consequences — these are what future developers (human and AI) need when evaluating whether a decision still applies.

**When to Write an ADR:**

| Change Type | ADR Required | Rationale |
|---|---|---|
| Technology choice (database, framework, library) | Yes | Affects entire codebase; alternatives have different tradeoffs |
| Architectural pattern (REST vs GraphQL, ORM vs raw SQL) | Yes | Shapes all subsequent implementation |
| Data model decisions (schema design, multi-tenancy approach) | Yes | Irreversible in production without migration effort |
| Integration approach (synchronous vs async, polling vs webhooks) | Yes | Affects performance, reliability, and operational complexity |
| Security decisions (auth mechanism, encryption, RLS policy) | Yes | High-stakes; wrong choices have regulatory consequences |
| Bug fixes, minor refactoring, configuration changes | No | Tactical changes that do not constrain future decisions |

**ADR Template:** Title, Date, Status (Proposed / Accepted / Deprecated / Superseded by ADR-YYYY), Context (what issue motivated this decision), Decision (what change is being made), Consequences (positive, negative, neutral), Alternatives Considered (with rejection rationale).

**Supersession Tracking:** When an ADR is superseded, the original ADR's status is updated to "Superseded by ADR-YYYY" and the new ADR references the old one. This creates a traceable decision chain — anyone reading ADR-0008 (raw SQL) can follow the link to the ORM Repository pattern that replaced it, including the reasoning for the change.

**Evidence:** Trust Relay has 17 ADRs with active supersession tracking. ADR-0008 (raw SQL via `text()`) was superseded by the Repository pattern adoption. ADR-0004 (CopilotKit v1) was superseded by ADR-0013 (CopilotKit v2 migration). Each supersession documents both what changed and why. See [appendix-f-evidence.md](../appendix-f-evidence) for the ADR inventory.

Full specification: [appendix-g-adr.md](../appendix-g-adr)

---
