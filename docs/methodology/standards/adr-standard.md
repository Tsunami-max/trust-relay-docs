---
sidebar_position: 3
title: "ADR Standard"
description: "Architecture Decision Record format, lifecycle, supersession tracking, and when to write (or not write) an ADR"
---

# Architecture Decision Record (ADR) Standard

This appendix defines the format, lifecycle, and governance practices for Architecture Decision Records (ADRs) within the S4U development methodology. ADRs capture the reasoning behind significant technical decisions so that future engineers — human or AI — can understand not just what was decided, but why, and what alternatives were rejected.

---

## 1. ADR Template

Every ADR follows this structure. The template is designed to force completeness: a decision without context is unjustified, a decision without consequences is unexamined, and a decision without alternatives is unconsidered.

````markdown
# ADR-NNNN: Descriptive Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-YYYY
**Deciders**: [Names of people and AI agents involved in the decision]

## Context

What is the issue that motivates this decision? What forces are at play?

Describe the technical situation, the constraints, and the tensions that make this
decision non-obvious. Include specific details: version numbers, library names,
measured performance characteristics, known bugs, or regulatory requirements.
A reader who was not present for the discussion should be able to understand why
a decision was needed at all.

## Decision

What change are we making? State the decision as a positive assertion.

Write this as an active statement: "Use X for Y" or "Migrate from A to B."
Include enough implementation detail that a developer can act on this decision
without further clarification. If the decision has a phased rollout, describe
the phases.

## Consequences

### Positive
- What improves as a result of this decision?
- What becomes simpler, faster, or more reliable?

### Negative
- What trade-offs are we accepting?
- What becomes harder, slower, or more complex?
- What technical debt does this decision introduce?

### Neutral
- What changes without clear positive or negative valence?
- What adjacent systems are affected but not improved or degraded?

## Alternatives Considered

### Alternative 1: [Name]
- Description of the alternative approach.
- Why rejected: [Specific, factual reason — not "it seemed worse."]

### Alternative 2: [Name]
- Description of the alternative approach.
- Why rejected: [Specific, factual reason.]
````

### Template Usage Notes

- **Title**: Use a descriptive phrase that captures the decision, not the problem. Write "Use PostgreSQL for persistence" rather than "Database selection."
- **Date**: The date the decision was made (status moved to Accepted), not the date the ADR document was created.
- **Deciders**: Include AI agents when they contributed materially to the analysis. This supports EU AI Act traceability requirements (Article 12).
- **Context**: This section should be long enough to stand alone. A reader five years from now should understand the forces that shaped this decision.
- **Consequences -- Negative**: This is the most important subsection. Every decision has trade-offs. An ADR with no negative consequences is either dishonest or describing a decision that did not need an ADR.
- **Alternatives Considered**: Minimum two alternatives. "Do nothing" counts as an alternative when the status quo is viable.

---

## 2. File Location and Naming Convention

ADRs are stored in the project's `docs/adr/` directory:

```
project/
  docs/
    adr/
      ADR-0001-use-postgresql.md
      ADR-0002-temporal-workflow-orchestration.md
      ADR-0003-agui-adapter-on-fastapi.md
      ...
```

### Naming Rules

| Element | Rule | Example |
|---------|------|---------|
| Prefix | `ADR-` (uppercase) | `ADR-` |
| Number | Zero-padded 4-digit sequence | `0001`, `0013`, `0017` |
| Separator | Hyphen between number and title | `0001-` |
| Title | Kebab-case, descriptive | `use-postgresql` |
| Extension | `.md` (Markdown) | `.md` |
| Full filename | `ADR-NNNN-descriptive-title.md` | `ADR-0013-copilotkit-v2-migration.md` |

Numbers are assigned sequentially. Never reuse a number, even if the ADR is deprecated or superseded.

---

## 3. Status Lifecycle

```
Proposed --> Accepted --> (terminal)
                |
                |--> Deprecated (terminal)
                |
                '--> Superseded by ADR-YYYY (terminal)
```

| Status | Meaning | When to Use |
|--------|---------|-------------|
| **Proposed** | Under discussion, not yet binding | The decision is drafted but not yet validated |
| **Accepted** | Active and binding | The decision has been validated and is in effect |
| **Deprecated** | No longer applicable | The decision was correct at the time but is no longer relevant. No replacement exists. |
| **Superseded by ADR-YYYY** | Replaced by a newer decision | A new ADR explicitly replaces this one. The old decision was not wrong — the context changed. |

---

## 4. Supersession Tracking Pattern

When one ADR supersedes another, both documents are updated to maintain bidirectional traceability.

### Step 1: Update the Original ADR

Change the status line:

```markdown
**Status**: Superseded by ADR-0013
```

The body of the original ADR is left unchanged. It remains a historical record.

### Step 2: Add a Supersedes Field to the New ADR

```markdown
# ADR-0013: CopilotKit v2 Migration

**Date**: 2026-02-28
**Status**: Accepted
**Supersedes**: ADR-0004
**Deciders**: Adrian (Trust Relay), Claude Code
```

### Step 3: Reference the Original in Context

The new ADR's Context section explains what changed since the original decision.

### Worked Example: ADR-0004 to ADR-0013

**ADR-0004** (February 2026): "Pin CopilotKit v1 API." The v2 API had confirmed bugs (#2622, #2684). Decision: use the stable v1 API.

**ADR-0013** (February 2026, 8 days later): "CopilotKit v2 Migration." The upstream bugs were resolved. Decision: migrate to v2, eliminating 5 workarounds.

The original ADR-0004 was updated to show `Status: Superseded by ADR-0013`. ADR-0013 includes `Supersedes: ADR-0004` and explains in its Context section exactly what changed.

---

## 5. When to Write an ADR

Write an ADR when the decision is significant enough that a future engineer would ask "why did we do it this way?" and the answer is not obvious from the code alone.

### ADR-Worthy Decisions

| Category | Examples |
|----------|----------|
| **Technology choices** | Database engine, framework, library, language version |
| **Architectural patterns** | Data access strategy, state management, API style |
| **Data model decisions** | Schema design, migration strategy, multi-tenancy approach |
| **Integration approaches** | Communication protocols, API gateway patterns |
| **Security decisions** | Authentication mechanism, authorization model, encryption |
| **AI/ML decisions** | Model selection, prompt engineering strategy, confidence scoring |
| **Testing strategy** | Why mocking is forbidden, test framework choices |
| **Deferral decisions** | Deliberately choosing NOT to implement something now |

### The "Future Engineer" Test

If you are unsure whether a decision warrants an ADR, apply this test: imagine a new engineer joins the project in six months. Would they:

1. Understand why this approach was chosen just by reading the code? If yes, no ADR needed.
2. Wonder "why didn't they use X instead?" If yes, write an ADR.
3. Be tempted to refactor it without understanding the constraints? If yes, write an ADR.

---

## 6. When NOT to Write an ADR

| Category | Why No ADR |
|----------|-----------|
| **Bug fixes** | A bug fix restores intended behavior. No decision to record. |
| **Minor refactoring** | Mechanical improvements within an established pattern. |
| **Implementation details within an established pattern** | Once the pattern is decided, individual uses do not need ADRs. |
| **Configuration changes** | Operational tuning, not architectural decisions. |
| **Dependency version bumps** | Routine maintenance (exception: breaking changes). |
| **Adding a new endpoint or component** | Following existing patterns is implementation, not architecture. |

---

## 7. ADR Quality Checklist

Before committing an ADR:

- [ ] **Context is self-contained**: A reader with no prior knowledge can understand why a decision was needed.
- [ ] **Decision is actionable**: A developer can implement the decision based on what is written.
- [ ] **Negative consequences are documented**: At least one trade-off is acknowledged.
- [ ] **Alternatives include rejection reasons**: Each rejected alternative has a specific, factual reason.
- [ ] **No marketing language**: Write "reduces query latency by 40ms" not "dramatically improves performance."
- [ ] **Specifics over generalities**: Include version numbers, library names, measured values.
- [ ] **Status is correct**: Proposed if under discussion, Accepted if binding.
- [ ] **Supersession links are bidirectional**: If this ADR supersedes another, both documents are updated.

---

## 8. ADR Maintenance

### Living Documents, Immutable History

An ADR's Context, Decision, Consequences, and Alternatives sections are immutable once the status is Accepted. If the decision needs to change, write a new ADR that supersedes the original. Do not edit the body of an accepted ADR.

The only field that changes is the **Status** line — from Accepted to Deprecated or Superseded.

### Periodic Review

During major milestones, scan the ADR directory for:

- **Stale Proposed ADRs**: Either accept or discard them.
- **Outdated Accepted ADRs**: Deprecate or supersede them.
- **Missing ADRs**: Write retroactive ADRs with a note: "This decision was made on [date] and documented retroactively."

### ADR Index in CLAUDE.md

Maintain a summary table of all ADRs in the project's `CLAUDE.md`:

```markdown
| ADR | Decision | Status |
|-----|----------|--------|
| 0001 | PydanticAI v1.60+ with AG-UI protocol for AI layer | Accepted |
| 0004 | ~~Pin CopilotKit v1 API~~ | Superseded by ADR-0013 |
| 0013 | CopilotKit v2 migration (inline chat, suggestions) | Accepted |
```

---

## 9. Trust Relay ADR Inventory

17 ADRs produced over 29 days of development:

| ADR | Title | Status |
|-----|-------|--------|
| 0001 | PydanticAI v1.60+ with AG-UI protocol for AI layer | Accepted |
| 0002 | Temporal Python SDK for workflow orchestration | Accepted |
| 0003 | Mount AGUIAdapter on FastAPI (not standalone) | Accepted |
| 0004 | ~~Pin CopilotKit v1 API~~ | Superseded by ADR-0013 |
| 0005 | STATE_SNAPSHOT over STATE_DELTA for AG-UI events | Accepted |
| 0006 | PEPPOL Verify as REST API (not MCP) | Accepted |
| 0007 | Belgian data layer, country routing & PEPPOL UI | Accepted |
| 0008 | Raw SQL via SQLAlchemy text() for database access | Accepted (PoC) |
| 0009 | Minimal error handling with silent recovery for PoC | Accepted |
| 0010 | React useState/useEffect for frontend state management | Accepted |
| 0011 | Authentication deliberately deferred for PoC | Accepted |
| 0012 | Hybrid scraping tool selection per data source | Accepted |
| 0013 | CopilotKit v2 migration (inline chat, suggestions) | Accepted |
| 0014 | Native bitemporal graph, drop Graphiti | Accepted |
| 0015 | Session diagnostics | Accepted |
| 0016 | Shared regulatory corpus | Accepted |
| 0017 | Trust Capsule cryptographic architecture | Accepted |

---

## 10. Anti-Patterns

### The Retroactive Justification

Writing an ADR after the fact to justify a decision that was made without analysis. The tell: strawman alternatives that were never seriously evaluated.

**Remedy**: Write the ADR before or during the decision.

### The Empty Consequences

An ADR where every consequence is positive. This indicates either a trivial decision or dishonest analysis.

**Remedy**: Every Negative section must contain at least one entry.

### The Novel ADR

An ADR written for a decision that follows an established pattern.

**Remedy**: Apply the "future engineer" test from Section 5.

### The Abandoned Proposal

An ADR stuck in Proposed status indefinitely.

**Remedy**: During periodic reviews, resolve all Proposed ADRs.
