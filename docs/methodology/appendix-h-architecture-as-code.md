---
sidebar_position: 17
title: "Appendix H: Architecture-as-Code Reference"
description: "Architecture-as-Code is an S4U methodology principle: documentation is machine-readable infrastructure consumed by both humans and AI agents."
---


## Overview

Architecture-as-Code is an S4U methodology principle: documentation is machine-readable infrastructure consumed by both humans and AI agents. A feature doesn't exist until its architecture page exists. Documentation drift is structurally impossible because the page is created before the code.

This appendix provides the complete reference for implementing Architecture-as-Code in any project using Docusaurus.

---

## Frontmatter Schema

Every architecture page uses structured YAML frontmatter:

```yaml
---
title: Component Name
sidebar_position: 12
description: One-line description for search and AI context
components:
  - app/services/example_service.py
  - app/models/example.py
tests:
  - tests/test_example_service.py
data_flow:
  - input -> processing -> output
depends_on:
  - architecture/other-component
owners:
  - app/agents/orchestrator.py
last_verified: 2026-03-29
status: implemented
---
```

### Field Definitions

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `components` | `list[str]` | Yes (for code pages) | Source files this page documents. Relative to repo root. |
| `tests` | `list[str]` | Recommended | Test files that verify these components. Used by Stop hook. |
| `data_flow` | `list[str]` | Optional | Arrow-notation data flows. Describes how data moves. |
| `depends_on` | `list[str]` | Optional | Other doc pages this component depends on (relative paths, no extension). |
| `owners` | `list[str]` | Optional | Files that consume/orchestrate this component. |
| `last_verified` | `date` | Yes | Last date someone confirmed page matches code. |
| `status` | `enum` | Yes | `implemented`, `in-progress`, or `planned`. |

### Status Values

| Status | Meaning | AI Agent Behavior |
|--------|---------|-------------------|
| `implemented` | Working code exists | Trust as architectural truth |
| `in-progress` | Actively being built | Check for partial implementation |
| `planned` | Vision, no code yet | Understand direction, don't search for code |

### Rules

- One page per architectural boundary — not per feature, not per tutorial.
- `components` MUST use relative paths from repo root.
- A file MAY appear in multiple pages' `components` lists.
- `status: planned` pages MUST NOT list `components` that don't exist.
- Pages without backend components (overviews, frontend, methodology) get only `last_verified` and `status`.

---

## Architecture Index

A build plugin scans all pages with structured frontmatter and generates an index JSON file:

```json
{
  "component_map": {
    "app/services/example.py": ["architecture/example-page"]
  },
  "data_flows": {},
  "dependency_graph": {},
  "status_summary": { "implemented": 30, "planned": 5 },
  "coverage": {
    "total_backend_files": 100,
    "documented_files": 40,
    "coverage_pct": 40.0
  },
  "stale_pages": [],
  "generated_at": "2026-03-29T12:00:00Z"
}
```

### Implementation

For Docusaurus projects, implement as a `postBuild` lifecycle plugin:

1. Scan all `.md`/`.mdx` files under `docs/`
2. Parse YAML frontmatter for architecture metadata
3. Build component map, data flows, dependency graph
4. Calculate coverage by scanning backend source directories
5. Identify stale pages (last_verified > 30 days)
6. Write index to project root as `docs/architecture-index.json`

The index is a development artifact (committed to repo), not a build output (not deployed).

### CLAUDE.md / AGENTS.md Integration

Add this protocol to the project's instruction file:

```markdown
### Architecture Documentation Protocol

Before modifying any backend file under `app/`:
1. Read `docs/architecture-index.json`
2. Look up the file in `component_map`
3. If found, read the listed Docusaurus page(s)
4. After implementation, verify documentation is still accurate

After completing changes:
- If doc is stale (>30 days), update and set `last_verified` to today
- If new file has no doc page, add it to the nearest page's `components:`
```

---

## Sync Enforcement

A script checks documentation freshness for modified files.

### Staleness Check (Blocking)

For each modified `.py` file in a commit:
1. Look up in `architecture-index.json` `component_map`
2. Read corresponding doc page's `last_verified`
3. If older than 30 days → **block** with actionable message

### Coverage Check (Warning)

New `.py` files without a `component_map` entry → **warn** (not block).

### The `--docs-verified` Flag

Updates `last_verified` on all relevant doc pages without requiring content changes — for when you reviewed and confirmed accuracy.

---

## Documentation-First Development

The brainstorming skill creates a Docusaurus placeholder page BEFORE code exists:

```
Brainstorm → Spec + Doc placeholder (status: planned)
  → Plan → Implement → Update page (status: implemented) + set last_verified
```

This means:
- The architecture index knows about the feature before code exists
- AI agents see `status: planned` and understand the direction
- The implementation plan includes "update doc to implemented" as final task
- Documentation drift is structurally impossible for new features

---

## Test Mapping

The `tests:` frontmatter field maps components to their test files:

```yaml
components:
  - app/services/evoi_engine.py
tests:
  - tests/test_evoi_engine.py
  - tests/test_pillar35_integration.py
```

The Stop verification hook uses this mapping: "For each modified file, did you run ALL mapped tests?"

---

## Rollout Guide

**Phase 1 (day 1):** Add frontmatter to 10 most critical pages. Build index plugin. Add CLAUDE.md protocol.

**Phase 2 (week 1):** Add frontmatter to all remaining pages. Enable sync enforcement.

**Phase 3 (ongoing):** Integrate with brainstorming/planning skills. Track coverage. Target 80%+.

---

## Evidence

Trust Relay implementation: 35 architecture pages with structured frontmatter, 56 components mapped, auto-generated index, sync check script, 25% initial coverage. Deployed to trust-relay.pages.dev.
