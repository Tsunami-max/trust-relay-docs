---
sidebar_position: 16
title: "Appendix G: Architecture Decision Record (ADR) Standard"
description: "This appendix defines the format, lifecycle, and governance practices for Architecture Decision Records (ADRs) within the S4U development methodology."
---


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
- **Deciders**: Include AI agents when they contributed materially to the analysis. This supports EU AI Act traceability requirements (Article 12) and provides an honest record of how the decision was reached.
- **Context**: This section should be long enough to stand alone. A reader five years from now, with no access to the original Slack thread or meeting notes, should understand the forces that shaped this decision.
- **Consequences — Negative**: This is the most important subsection. Every decision has trade-offs. An ADR with no negative consequences is either dishonest or describing a decision that did not need an ADR. Be specific about the costs being accepted.
- **Alternatives Considered**: Minimum two alternatives. "Do nothing" counts as an alternative when the status quo is a viable option. Each rejection reason must be factual and specific.

---

## 2. File Location and Naming Convention

ADRs are stored in the project's `docs/adr/` directory:

```
project/
├── docs/
│   ├── adr/
│   │   ├── ADR-0001-use-postgresql.md
│   │   ├── ADR-0002-temporal-workflow-orchestration.md
│   │   ├── ADR-0003-agui-adapter-on-fastapi.md
│   │   └── ...
│   └── ...
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

Numbers are assigned sequentially. Never reuse a number, even if the ADR is deprecated or superseded. The number sequence is an append-only log.

---

## 3. Status Lifecycle

An ADR progresses through a defined set of states:

```
Proposed ──→ Accepted ──→ (terminal)
                │
                ├──→ Deprecated (terminal)
                │
                └──→ Superseded by ADR-YYYY (terminal)
```

### Status Definitions

| Status | Meaning | When to Use |
|--------|---------|-------------|
| **Proposed** | Under discussion, not yet binding | The decision is drafted but not yet validated or agreed upon by all deciders. |
| **Accepted** | Active and binding | The decision has been validated and is in effect. Implementation should follow this ADR. |
| **Deprecated** | No longer applicable | The decision was correct at the time but is no longer relevant due to changed circumstances (e.g., a feature was removed, a service was decommissioned). No replacement decision exists. |
| **Superseded by ADR-YYYY** | Replaced by a newer decision | A new ADR explicitly replaces this one. The old decision was not wrong — the context changed, and a new decision was made. The superseding ADR's number is part of the status. |

### Proposed vs. Accepted

In fast-moving PoC projects, an ADR may move from Proposed to Accepted within the same commit. This is acceptable. The distinction matters more in team environments where decisions require review from multiple stakeholders before becoming binding.

### Deprecated vs. Superseded

The distinction is precise:

- **Deprecated**: The decision no longer applies and nothing replaces it. Example: "ADR-0011: Authentication Deliberately Deferred for PoC" would be deprecated once authentication is implemented, because the deferral decision is simply no longer relevant.
- **Superseded**: A new decision explicitly replaces the old one. The new ADR references the old one, and the old one is updated to point to the new one. Example: ADR-0004 (pin CopilotKit v1) was superseded by ADR-0013 (migrate to CopilotKit v2) when the upstream bugs were resolved.

---

## 4. Supersession Tracking Pattern

When one ADR supersedes another, both documents are updated to maintain bidirectional traceability.

### Step 1: Update the Original ADR

Change the status line of the original ADR:

```markdown
**Status**: Superseded by ADR-0013
```

The body of the original ADR is left unchanged. It remains a historical record of the decision that was valid at the time. Do not edit the Context, Decision, Consequences, or Alternatives sections of a superseded ADR.

### Step 2: Add a Supersedes Field to the New ADR

The new ADR includes a `Supersedes` field in its header:

```markdown
# ADR-0013: CopilotKit v2 Migration

**Date**: 2026-02-28
**Status**: Accepted
**Supersedes**: ADR-0004
**Deciders**: Adrian (Trust Relay), Claude Code
```

### Step 3: Reference the Original in Context

The new ADR's Context section should explain what changed since the original decision:

```markdown
## Context

CopilotKit v1.50+ exposes v2 APIs via `/v2` import subpaths while maintaining
full backward compatibility. The bugs cited in ADR-0004 (#2622 overlapping tool
call events, #2684 strict serial event ordering) have been resolved in the v2
architecture which removed GraphQL entirely and uses a simpler direct
architecture. [...]
```

This creates a clear narrative: the original decision was sound given the constraints at the time, the constraints changed, and a new decision was made.

### Worked Example: ADR-0004 to ADR-0013

This real example from the Trust Relay project illustrates the full supersession pattern:

**ADR-0004** (February 2026): "Pin CopilotKit v1 API." The v2 API had confirmed bugs (#2622, #2684) that would require backend workarounds. Decision: use the stable v1 API and plan migration to v2 once bugs are fixed.

**ADR-0013** (February 2026, 8 days later): "CopilotKit v2 Migration." The upstream bugs were resolved. Decision: migrate to v2, which eliminated 5 workarounds from the codebase and enabled inline chat panels with suggestion chips.

The original ADR-0004 was updated to show `Status: Superseded by ADR-0013`. ADR-0013 includes `Supersedes: ADR-0004` and explains in its Context section exactly what changed (the bugs were fixed) to motivate the new decision.

---

## 5. When to Write an ADR

Write an ADR when the decision is significant enough that a future engineer would ask "why did we do it this way?" and the answer is not obvious from the code alone.

### ADR-Worthy Decisions

| Category | Examples |
|----------|----------|
| **Technology choices** | Database engine, framework, library, language version, cloud service |
| **Architectural patterns** | Data access strategy (ORM vs. raw SQL), state management approach, API style (REST vs. GraphQL), event-driven vs. request-response |
| **Data model decisions** | Schema design philosophy, migration strategy, multi-tenancy approach, temporal data handling |
| **Integration approaches** | How systems communicate (HTTP, gRPC, message queue), protocol choices, API gateway patterns |
| **Security decisions** | Authentication mechanism, authorization model, encryption strategy, secret management |
| **AI/ML decisions** | Model selection, prompt engineering strategy, confidence scoring methodology, human oversight patterns |
| **Testing strategy** | Why mocking is forbidden, why a specific test framework was chosen, coverage target rationale |
| **Deferral decisions** | Deliberately choosing NOT to implement something now, with documented rationale (e.g., deferring authentication during PoC) |

### The "Future Engineer" Test

If you are unsure whether a decision warrants an ADR, apply this test: imagine a new engineer joins the project in six months and encounters this part of the codebase. Would they:

1. Understand why this approach was chosen just by reading the code? If yes, no ADR needed.
2. Wonder "why didn't they use X instead?" If yes, write an ADR.
3. Be tempted to refactor it to a "better" approach without understanding the constraints? If yes, write an ADR.

---

## 6. When NOT to Write an ADR

Not every code change requires an ADR. Writing unnecessary ADRs dilutes the value of the ones that matter.

| Category | Why No ADR |
|----------|-----------|
| **Bug fixes** | A bug fix restores intended behavior. There is no decision to record — the code was wrong, now it is correct. |
| **Minor refactoring** | Renaming variables, extracting functions, improving readability. These are mechanical improvements within an established pattern, not decisions. |
| **Implementation details within an established pattern** | Once ADR-0008 establishes "raw SQL via `text()`" as the data access pattern, each new query does not need its own ADR. |
| **Configuration changes** | Adjusting timeouts, pool sizes, log levels. These are operational tuning, not architectural decisions. |
| **Dependency version bumps** | Upgrading `fastapi` from 0.109 to 0.110 is routine maintenance. Exception: if the upgrade involves breaking changes that require code modifications, that is ADR-worthy. |
| **Adding a new endpoint or component** | Following existing patterns to add functionality is implementation, not architecture. |

---

## 7. ADR Quality Checklist

Before committing an ADR, verify it meets these criteria:

- [ ] **Context is self-contained**: A reader with no prior knowledge can understand why a decision was needed.
- [ ] **Decision is actionable**: A developer can implement the decision based on what is written.
- [ ] **Negative consequences are documented**: At least one trade-off or cost is acknowledged.
- [ ] **Alternatives include rejection reasons**: Each rejected alternative has a specific, factual reason.
- [ ] **No marketing language**: ADRs are engineering records, not sales documents. Write "reduces query latency by 40ms" not "dramatically improves performance."
- [ ] **Specifics over generalities**: Include version numbers, library names, measured values, and bug tracker references where relevant.
- [ ] **Status is correct**: Proposed if still under discussion, Accepted if binding.
- [ ] **Supersession links are bidirectional**: If this ADR supersedes another, both documents are updated.

---

## 8. ADR Maintenance

### Living Documents, Immutable History

An ADR's Context, Decision, Consequences, and Alternatives sections are immutable once the status is Accepted. If the decision needs to change, write a new ADR that supersedes the original. Do not edit the body of an accepted ADR.

The only field that changes on an existing ADR is the **Status** line — from Accepted to Deprecated or Superseded.

This immutability is deliberate. ADRs are a historical record. Editing them after the fact destroys the narrative of how the project's architecture evolved. The git history of the ADR file should show exactly two commits: the initial creation and (optionally) the status update when it is deprecated or superseded.

### Periodic Review

During major project milestones or quarterly reviews, scan the ADR directory for:

- **Stale Proposed ADRs**: Decisions that were drafted but never accepted. Either accept or discard them.
- **Outdated Accepted ADRs**: Decisions that are still marked Accepted but no longer reflect reality. These should be deprecated or superseded.
- **Missing ADRs**: Significant decisions that were made informally and never documented. Write retroactive ADRs with a note in the Context section: "This decision was made on [date] and documented retroactively on [date]."

### ADR Index in CLAUDE.md

Maintain a summary table of all ADRs in the project's `CLAUDE.md` file. This serves two purposes: it gives AI agents immediate awareness of all architectural decisions without reading individual files, and it provides a quick-reference index for human engineers.

Example format:

```markdown
| ADR | Decision | Status |
|-----|----------|--------|
| 0001 | PydanticAI v1.60+ with AG-UI protocol for AI layer | Accepted |
| 0004 | ~~Pin CopilotKit v1 API~~ | Superseded by ADR-0013 |
| 0013 | CopilotKit v2 migration (inline chat, suggestions) | Accepted |
```

Superseded ADRs use strikethrough on the title to provide immediate visual indication of their status.

---

## 9. Trust Relay ADR Inventory

The following 17 ADRs were produced over 29 days of development on the Trust Relay compliance platform. This inventory demonstrates that the ADR practice scales: from foundational technology choices (ADR-0001, ADR-0002) through PoC-phase pragmatic shortcuts (ADR-0008, ADR-0011) to architectural evolution as the system matured (ADR-0013 superseding ADR-0004, ADR-0014 replacing an external dependency with a native implementation).

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

### Patterns Visible in the Inventory

- **Supersession tracking works**: ADR-0004 to ADR-0013 shows that decisions can be revisited cleanly when circumstances change, without pretending the original decision was wrong.
- **PoC-phase decisions are documented honestly**: ADR-0008 and ADR-0011 are tagged with "(PoC)" status, acknowledging that these are pragmatic shortcuts with documented migration paths, not permanent architectural choices.
- **Decision scope varies appropriately**: The inventory includes high-level platform choices (ADR-0002: Temporal for workflow orchestration), integration details (ADR-0003: mount adapter on FastAPI vs. standalone), UI framework decisions (ADR-0010: useState over Redux), and security architecture (ADR-0017: cryptographic architecture). All are significant enough to warrant documentation; none are trivial.
- **17 ADRs in 29 days is sustainable**: Roughly one ADR every two days. This pace indicates that ADRs are being written for genuine decision points, not bureaucratically for every code change.

---

## 10. Worked Example: A Complete ADR

The following is ADR-0008 from Trust Relay, reproduced in full as a reference for ADR quality. Note the specificity of the Context (exact counts of `text()` calls, file counts), the honesty of the Negative consequences (SQL injection surface area, no compile-time validation), and the concrete Migration Path section.

````markdown
# ADR-0008: Raw SQL via SQLAlchemy text() for Database Access

**Date:** 2026-02-24
**Status:** Accepted (PoC)
**Deciders:** Adrian Birlogeanu, Claude Code

## Context

The Trust Relay compliance system uses PostgreSQL 16 as its primary relational
database for cases, audit events, MCC classifications, PEPPOL verifications,
Belgian evidence, and agent execution tracking. The schema is defined in
`scripts/init_db.sql` (6 tables, 10 indexes) and applied via Docker
`entrypoint-initdb.d` on first container start.

The backend uses SQLAlchemy's async engine (`create_async_engine` with `asyncpg`)
for connection management, but all queries are written as raw SQL strings via
`text()`. There are 78 `text()` calls across 20 files. No SQLAlchemy ORM models
(declarative base classes) exist. No Alembic migration framework is configured.

## Decision

Use raw SQL via SQLAlchemy `text()` for all database access during the PoC
phase. Define the schema in a single `init_db.sql` file with append-only
migration blocks. Use SQLAlchemy only for connection pooling and async session
management, not for ORM mapping.

## Consequences

### Positive
- Zero ORM overhead: no model definition files, no migration configuration,
  no relationship mapping.
- SQL queries are visible and auditable in the source code without abstraction
  layers.
- Connection pooling and async session management are production-grade via
  SQLAlchemy + asyncpg.

### Negative
- No compile-time or startup-time validation of SQL queries against the schema.
  Typos in column names or table names are only caught at runtime.
- Schema changes require manual coordination between `init_db.sql` and every
  `text()` query that references the changed column.
- No migration history or rollback capability. Destructive schema changes
  (column renames, drops) cannot be reversed.
- 78 `text()` calls across 20 files create a large surface area for SQL
  injection if parameterization is ever skipped.

### Neutral
- The `get_session()` context manager pattern is compatible with both raw SQL
  and future ORM usage, so no session management refactoring is needed during
  migration.

## Migration Path

When the project moves beyond PoC:

1. Define SQLAlchemy ORM models in `app/models/db/` mirroring the 6 existing
   tables.
2. Install and configure Alembic with `alembic init` and generate an initial
   migration from the ORM models.
3. Incrementally replace `text()` queries with ORM operations, starting with
   the highest-churn files.
4. Remove `init_db.sql` once Alembic manages the full schema lifecycle.

## Alternatives Considered

### Alternative 1: SQLAlchemy ORM from Day 1
- Why deferred: ORM model definition, relationship configuration, and Alembic
  setup would have consumed approximately 1 day of the 3-day sprint without
  delivering user-visible functionality.

### Alternative 2: Tortoise ORM
- Why rejected: Tortoise ORM is async-native but has a smaller ecosystem than
  SQLAlchemy. Choosing Tortoise would make the eventual migration to SQLAlchemy
  ORM harder, not easier.

### Alternative 3: Raw asyncpg (no SQLAlchemy)
- Why rejected: Losing SQLAlchemy's connection pooling, session management, and
  `text()` parameterization would require reimplementing these features manually.
  The migration path to ORM would also require introducing SQLAlchemy later.
````

This ADR demonstrates several best practices:

- The Context section includes exact metrics (78 `text()` calls, 20 files, 6 tables) that make the scale of the decision concrete.
- The Negative consequences are specific and honest — including the SQL injection surface area risk.
- The Migration Path section acknowledges that this is a PoC decision and provides a concrete plan for evolving beyond it.
- The Alternatives Considered section explains rejection reasons in terms of time-cost tradeoffs, not vague preferences.

---

## 11. Anti-Patterns

### The Retroactive Justification

Writing an ADR after the fact to justify a decision that was made without analysis. The tell: the Alternatives Considered section contains strawman alternatives that were never seriously evaluated.

**Remedy**: Write the ADR before or during the decision, not after implementation. If a retroactive ADR is necessary, note it explicitly: "This decision was made on [date] and documented retroactively."

### The Empty Consequences

An ADR where every consequence is positive and no trade-offs are acknowledged. This indicates either a trivial decision (no ADR needed) or dishonest analysis.

**Remedy**: Every Negative section must contain at least one entry. If you genuinely cannot identify a downside, the decision is probably too obvious to need an ADR.

### The Novel ADR

An ADR written for a decision that follows an established pattern. If ADR-0008 establishes raw SQL as the data access pattern, writing ADR-0008a for each new table's queries is unnecessary.

**Remedy**: Apply the "future engineer" test from Section 5. If the decision follows an existing pattern without deviation, no ADR is needed.

### The Abandoned Proposal

An ADR stuck in Proposed status indefinitely. This indicates either analysis paralysis or a decision that was made informally without updating the record.

**Remedy**: During periodic reviews, resolve all Proposed ADRs. Either accept them (the decision was made, just not recorded) or discard them (the decision was not needed).

---

## 12. Automated ADR Enforcement

ADR discipline degrades under velocity pressure. When a team ships features daily, architectural documentation is the first casualty — "I'll write the ADR later" turns into "I forgot." The solution is automated enforcement that makes it impossible to forget.

### The ADR Gate Hook

A Stop hook checks whether architectural files were modified without a corresponding ADR. It runs automatically when Claude Code completes a session, surfacing missing ADRs before the developer walks away.

**Implementation** (`scripts/check-adr.sh`):

```bash
#!/usr/bin/env bash
# ADR Enforcement Gate — checks if architectural files were modified without an ADR

ARCH_DIRS=(
    "backend/app/workflows/"
    "backend/app/services/"
    "backend/app/models/"
    "backend/app/api/"
    "backend/app/agents/"
)

changed_arch_files=()
for dir in "${ARCH_DIRS[@]}"; do
    while IFS= read -r file; do
        [[ -n "$file" ]] && changed_arch_files+=("$file")
    done < <(git diff --name-only HEAD 2>/dev/null | grep "^${dir}" || true)
done

unique_files=($(printf '%s\n' "${changed_arch_files[@]}" 2>/dev/null | sort -u || true))

if [[ ${#unique_files[@]} -gt 0 ]]; then
    adr_changed=$(git diff --name-only HEAD 2>/dev/null | grep "^docs/adr/" || true)
    if [[ -z "$adr_changed" ]]; then
        echo "⚠️  ADR GATE: ${#unique_files[@]} architectural file(s) modified without an ADR."
        echo "If this is a new feature or significant change, create an ADR in docs/adr/"
    fi
fi
```

**Hook configuration** (`.claude/settings.json`):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/check-adr.sh 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### Key Design Decisions

1. **Stop hook, not pre-commit hook.** A pre-commit hook that blocks every commit touching architectural files would be too aggressive — many commits are incremental (test first, then implementation). The Stop hook fires at session end, when the complete change is visible.

2. **Warning, not blocking.** The hook warns rather than prevents completion. Bug fixes and minor refactors legitimately touch architectural files without requiring ADRs. The developer (human or AI) exercises judgment about whether an ADR is needed. The hook ensures the question is asked.

3. **Architecture directory list is project-specific.** Each project defines which directories contain architectural code. The example above uses Trust Relay's backend structure. Frontend-heavy projects might include `src/store/`, `src/router/`, or `src/api/`.

### What This Catches

| Scenario | Without Hook | With Hook |
|----------|-------------|-----------|
| New service added to `app/services/` | ADR often forgotten | Warning: "1 architectural file modified without ADR" |
| Workflow restructured in `app/workflows/` | ADR sometimes written | Warning surfaces even when developer forgot |
| Bug fix in `app/api/` | No ADR needed | Warning shown; developer correctly ignores it |
| New model + service + API endpoint | ADR usually forgotten | Warning: "3 architectural files modified" — hard to ignore |

### Complementary Practice: ADR Index in CLAUDE.md

The ADR table in CLAUDE.md (see Section 8) serves as a secondary enforcement mechanism. When an AI agent reads CLAUDE.md at session start, it sees the full decision history and is more likely to recognize when a new decision diverges from or extends an existing one. The combination of runtime enforcement (hook) and context-time awareness (CLAUDE.md table) creates a two-layer ADR discipline system.

---

**End of Appendix G**
