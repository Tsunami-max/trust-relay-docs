---
sidebar_position: 13
title: "Appendix D: Memory System"
description: "This appendix specifies the persistent memory system that gives Claude Code continuity across conversation sessions."
---


This appendix specifies the persistent memory system that gives Claude Code continuity across conversation sessions. Without memory, every new session starts from zero context: the agent knows the code but not the project's history, the user's preferences, or the decisions made yesterday. Memory bridges that gap.

This document covers the hub-and-spoke architecture, four memory types with frontmatter format, what to save and what not to save, staleness management, and cross-project memory composition.

---

## 1. Hub-and-Spoke Architecture

### The Problem

Claude Code loads project instructions (CLAUDE.md) automatically, but CLAUDE.md is for build commands, architecture, and testing rules -- not for remembering that the user prefers Alembic over manual ALTER TABLE, or that a blanket MinIO delete once nuked the branding logos, or that the VLAIO pitch went well on March 17.

A single flat file grows unwieldy. A directory of loose files has no index. The solution is a hub-and-spoke model.

### The Structure

```
.claude/projects/{project-scope}/memory/
  MEMORY.md              # Hub index -- always loaded, 200-line limit
  mission.md             # Spoke -- loaded on demand
  pillar-progress.md     # Spoke -- loaded on demand
  technical-patterns.md  # Spoke -- loaded on demand
  feedback_minio_cleanup.md
  methodology-export-context.md
  ...
```

**MEMORY.md** is the hub. It is always loaded into context at session start. It contains:

- Summaries of the most important context (mission, preferences, architecture quick reference)
- Pointers to individual spoke files with one-line descriptions
- Current state of ongoing work (what is done, what is next)

**Individual memory files** are the spokes. They contain the full detail. Claude reads them on demand when the topic is relevant.

### Why Hub-and-Spoke

The hub is always loaded, so it consumes context window on every session. Therefore it must be concise -- the 200-line limit is a hard constraint. Individual spoke files are loaded only when relevant, so they can be as detailed as needed without wasting context on unrelated sessions.

This architecture means Claude always knows *what* the project's memories contain (via the hub index) and can selectively load *the details* when a task touches that area.

### MEMORY.md Format

The hub index follows this structure:

```markdown
# Project Name

## Mission & Quality Standards
[2-3 sentence summary of project purpose and quality bar]

## User Preferences
- **Preference name** -- brief description
- **Preference name** -- brief description

## Architecture Quick Reference
[Key facts that every session needs: tech stack summary, important patterns,
 port assignments. Reference CLAUDE.md for full details.]

## Known Technical Debt
- **Item** -- one-line description
- **Item** -- one-line description

## Upcoming Tasks
- **Task** -- brief scope description
- **Task** -- brief scope description

## Detailed References
- Full mission & principles: `memory/mission.md`
- Feature inventory: `memory/feature-inventory.md`
- Component registry: `memory/component-registry.md` -- living map of what
  renders where (prevents feature loss during refactoring)
- Technical patterns: `memory/technical-patterns.md`
```

### File Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| User preferences | `feedback_*.md` or descriptive name | `feedback_autonomous_operation.md`, `mission.md` |
| Feedback (corrections) | `feedback_*.md` | `feedback_minio_cleanup.md`, `feedback_docusaurus_first_class.md` |
| Project context | descriptive name or dated | `pillar-progress.md`, `goaml-export-feature.md`, `session-2026-03-19-summary.md` |
| Reference | descriptive name | `technical-patterns.md`, `component-registry.md`, `research-process.md` |

Use lowercase with hyphens. Include dates in ISO format when the memory is time-bound (e.g., `advisor-feedback-2026-03-18.md`). Avoid generic names like `notes.md` or `misc.md`.

---

## 2. Four Memory Types

Every memory file begins with YAML frontmatter that declares its type. The frontmatter serves two purposes: it tells Claude what kind of memory this is (so it can assess relevance), and the `description` field enables relevance matching when deciding which spoke files to load.

### 2.1 Type: `user`

User memories capture the human's role, goals, expertise, and persistent preferences. These rarely change and apply across many sessions.

**Frontmatter format:**

```markdown
---
name: descriptive-name
description: one-line description used for relevance matching
type: user
---
```

**Content guidelines:**

- Role and expertise level of the user
- Persistent preferences that affect how Claude should work
- Goals and quality standards
- Knowledge the user has that Claude should not re-explain

**Example -- User mission and principles:**

```markdown
---
name: mission
description: Project mission, quality principles, and the human-AI collaboration model
type: user
---

# Mission: Pioneers of Human-AI Collaboration

This project is pioneer work in human-AI collaboration -- a showcase
demonstrating what an AI coding agent and a skilled architect can achieve
together in designing and developing production applications.

## Principles

- **World-class quality, always.** The bar is not "good enough" -- it is
  "best in class."
- **Regulatory compliance is non-negotiable.** Every AI output must be
  traceable, retrievable, and auditable.
- **Gradual discovery in UX.** Don't overwhelm users. Progressive
  disclosure over feature dumping.
- **Design before code.** Brainstorm -> design doc -> implementation plan
  -> subagent execution. Never skip the thinking phase.
```

**Example -- User preferences:**

```markdown
---
name: feedback_autonomous_operation
description: User wants fully autonomous operation -- no confirmation prompts for routine steps
type: user
---

Operate autonomously without asking for confirmation on routine steps
(file reads, edits, running tests, git operations within the branch).

**Why:** The user finds it disruptive when Claude asks for confirmation
at every small step. Full permissions were granted specifically to avoid
this friction.

**How to apply:** Just proceed with the work. Only pause for truly
irreversible or ambiguous decisions (e.g., force-pushing to shared
branches, deleting production data, or when requirements are genuinely
unclear). For everything else -- read, write, edit, test, commit -- do it.
```

### 2.2 Type: `feedback`

Feedback memories record corrections AND confirmations from the user. They are the most valuable memory type because they encode hard-won lessons -- things that went wrong and must not go wrong again, or things that went right and must be preserved.

**Frontmatter format:**

```markdown
---
name: descriptive-name
description: one-line description used for relevance matching
type: feedback
---
```

**Mandatory fields in content:**

Every feedback memory must include:

- **Why:** -- What problem this prevents or what value this preserves
- **How to apply:** -- Concrete, actionable instructions for future sessions

**Record from both failure and success.** A correction ("never do X") and a confirmation ("always do Y") are equally valuable.

**Example -- Correction (from a failure):**

```markdown
---
name: feedback_minio_cleanup
description: Never delete all MinIO files -- branding logos are in the same bucket as case data
type: feedback
---

When clearing MinIO data, NEVER do a blanket recursive delete of all files.

**Why:** MinIO stores both ephemeral case data (`{case_id}/...`) and
persistent tenant data (`{tenant_id}/branding/logo.png`) in the same
bucket. A blanket delete removed the branding logo, causing a recurring
404 bug on the branding endpoint.

**How to apply:** When cleaning up case data from MinIO, only delete
case-scoped prefixes (`{case_id}/`). Never touch `*/branding/*` paths.
If you must clear everything, re-upload the logo afterward.
```

**Example -- Confirmation (from a success):**

```markdown
---
name: feedback_docusaurus_first_class
description: Docusaurus is a core methodology principle -- the first thing shown externally for credibility
type: feedback
---

Docusaurus documentation reflecting architecture and business analysis is
an integral part of the methodology, not an optional add-on.

**Why:** It serves five audiences simultaneously: prospects (credibility
at first glance), AI agents (narrative context beyond code), developers
(architecture truth), regulators (compliance depth), and the team
(alignment across contributors). It creates a compounding knowledge
flywheel: docs give Claude narrative understanding -> better code ->
better docs -> richer context next time.

**How to apply:**
- A feature is NOT complete until its Docusaurus page is updated
- Treat documentation commits as equal to code commits
- When changing architecture, always update the corresponding page
- Honest maturity ratings that acknowledge gaps -- never overstate
- Every assertion backed by data (evidence-grade claims)
```

**Example -- Multi-point feedback from a stakeholder session:**

```markdown
---
name: advisor-feedback-2026-03-18
description: Critical feedback from advisor on prototype demo -- positioning, demo strategy, UI simplification
type: feedback
---

## Key Feedback Points (March 18, 2026)

### 1. Presentation must be business-outcome driven, NOT technical
Lead with: "Give me a company you have doubts about" -> run live -> show
what they missed.
**Why:** After a few minutes of technical explanation, the audience is
lost. Show value first, explain architecture later.
**How to apply:** Rework all demos to start with prospect's own data.

### 2. Integration point is POST-capture, not PRE-capture
Prospects already have onboarding processes. Don't replace them. Plug in
AFTER initial document capture.
**Why:** Replacing existing processes is a non-starter for enterprise
sales. Value is in the investigation, not the capture.
**How to apply:** Position the product as "what happens after you have
the documents" -- the investigation engine, not the onboarding portal.

### 3. UI is too crowded
**Why:** First-time users feel overwhelmed.
**How to apply:** Linear guided flow, not everything-at-once.
Recommendation + risk score as the FIRST thing visible.
```

### 2.3 Type: `project`

Project memories capture ongoing work, decisions, deadlines, and feature status. They are inherently time-bound and require the most active staleness management.

**Frontmatter format:**

```markdown
---
name: descriptive-name
description: one-line description used for relevance matching
type: project
---
```

**Mandatory fields in content:**

- **Why:** and **How to apply:** (same as feedback)

**Date handling:** Convert relative dates to absolute dates. "Next week" becomes "2026-03-28". "Yesterday" becomes "2026-03-20". Relative dates become meaningless once the memory outlives its creation session.

**Example -- Feature tracking:**

```markdown
---
name: goaml-export-feature
description: goAML XML export feature -- STR/SAR filing for Belgium + Luxembourg, merged 2026-03-21
type: project
---

goAML XML export (Phase 1) merged to master on 2026-03-21 via PR #10.

**Why:** Transforms the product from investigation tool to end-to-end
compliance platform. Belgium CTIF-CFI requires goAML exclusively since
Sep 2024. AMLA mandating standardised STR formats from Jul 2027.

**How to apply:**
- Backend: `app/goaml/` package (profile_loader, models, mapper,
  xml_builder, validator, export_service)
- API: 9 endpoints at `/api/goaml/*` and `/api/cases/{id}/goaml/*`
- Frontend: `components/dashboard/regulatory/` (8 components, 4-step wizard)
- DB: Migration 031 -- 7 tables
- Canonical entities (persons, accounts, transactions) are shared
  foundation for future products
- 114 unit tests in `tests/test_goaml/`

**Phase 2 scope:** Additional report types, Germany/Malta/Netherlands/
Switzerland profiles, multi-party transactions, batch export.
```

**Example -- Task with deadline:**

```markdown
---
name: prompt-centralization-task
description: Prompt centralization -- ALL 3 PHASES COMPLETE (merged to master)
type: project
---

## Phase 1: COMPLETE (merged 2026-03-17)

All 20 agent prompts centralized into Jinja2 template files served by
PromptRegistry singleton. 38 tests.

## Phase 2a: COMPLETE (merged 2026-03-17)

DB-backed prompt versioning with admin API. 73 backend tests total.

## Phase 2b: COMPLETE (merged 2026-03-18)

Super admin prompt management UI. 6 components + 22 frontend tests.
```

**Example -- Component registry (prevents regression):**

```markdown
---
name: component-registry
description: Living registry of all frontend visual components and their locations -- prevents feature loss during refactoring
type: project
---

# Frontend Component Registry (2026-03-16)

**Why:** During a sprint, refactoring accidentally dropped a chart
component from the Overview tab. This registry tracks what renders where
so future refactoring doesn't lose features.

**How to apply:** Before removing or moving any component, check this
registry. After any layout change, update it.

## Case Detail -- Overview Tab

| # | Component | Unique Value | Condition |
|---|-----------|-------------|-----------|
| 1 | RelatedIntelligenceCard | Cross-case pattern alerts | Always |
| 2 | Entity360View | Identity + regulatory + risk + ownership | Post-investigation |
| 3 | ConfidenceChart | Score evolution across iterations | Has results |
| 4 | FinancialHealthCard | Dual-axis chart, 5-metric grid | Post-investigation |
...

## Orphaned Components (Intentionally Not Rendered)

- DocumentsSummary -- superseded by DocumentViewer
- EvidenceSheet -- superseded by evidence cards in Compliance tab
```

### 2.4 Type: `reference`

Reference memories point to information that lives outside the codebase -- external systems, research locations, process rules, and technical patterns that span multiple files.

**Frontmatter format:**

```markdown
---
name: descriptive-name
description: one-line description used for relevance matching
type: reference
---
```

**Example -- Technical patterns:**

```markdown
---
name: technical-patterns
description: Key technical patterns used across the codebase -- reference for implementation decisions
type: reference
---

# Key Technical Patterns

## Workflow & Orchestration
- **Temporal signals:** `documents_submitted` (portal) + `officer_decision`
  (dashboard)
- **Mock mode flags:** all 14 `*_mock_mode` flags default to `False`.
  Set to `true` in .env or CI for offline testing
- **OSINT cache:** iteration > 1 reuses cached agent outputs from MinIO

## Data & Storage
- **Evidence bundles:** per-agent capture, chain of thought, MinIO storage
- **Neo4j:** guarded by `neo4j_enabled` flag, MERGE-based upserts
- **asyncpg gotcha:** `CAST(:param AS jsonb)` not `:param::jsonb`

## Testing
- `asyncio_mode=auto` in pytest.ini -- no @pytest.mark.asyncio needed
- Temporal tests: `WorkflowEnvironment.start_time_skipping()`
- Before running tests, check servers are running. Don't start new ones.
```

**Example -- Research process:**

```markdown
---
name: research-process
description: Always persist research results to docs/research/ -- prevents re-doing expensive work across sessions
type: reference
---

# Research Process Rule

## Always Persist Research
When doing competitive/UX/architecture research:
1. **Always check `docs/research/` first** for existing research
2. **Always publish results** to `docs/research/YYYY-MM-DD-<topic>.md`
3. **Never let research exist only in conversation context** -- it gets
   lost on compaction
4. This avoids re-doing expensive research across sessions

## Research Topics Completed
- `docs/research/ag-ui-protocol.md`
- `docs/research/temporal-python-patterns.md`
- `docs/research/copilotkit.md`
- `docs/research/2026-03-03-entity-360-competitor-analysis.md`
```

---

## 3. What NOT to Save

The most common mistake with memory systems is saving too much. Redundant memories waste context window, create staleness risk, and introduce contradictions when the code evolves but the memory does not.

### Do Not Save

| Category | Why Not | Authoritative Source |
|----------|---------|---------------------|
| Code patterns and conventions | Derivable from reading the code | The code itself |
| File paths and directory structure | Changes frequently; derivable from `ls`/`find` | Filesystem |
| Git history and recent changes | `git log` and `git blame` are always current | Git |
| Debugging solutions | The fix is in the code; the test prevents regression | Code + tests |
| Architecture details already in CLAUDE.md | Duplication creates conflict risk | CLAUDE.md |
| API signatures and function parameters | Derivable from reading the function | Code |
| Dependency versions | `package.json` and `requirements.txt` are authoritative | Lock files |
| Ephemeral task details | "Run the linter" is a task, not a memory | Conversation context |
| Configuration values | `.env`, `config.py`, and `docker-compose.yml` are authoritative | Config files |

### The Derivability Test

Before creating a memory, ask: **Can Claude derive this information from the code, configuration, or git history in under 30 seconds?** If yes, do not create a memory. The information is already persisted in a source that cannot become stale.

### The Duplication Test

Before creating a memory, ask: **Is this information already in CLAUDE.md or another memory file?** If yes, either update the existing location or do not create a new memory. Two sources for the same fact will eventually disagree.

---

## 4. Staleness Management

Memories are point-in-time observations, not live state. This is the single most important principle of the memory system.

### The Staleness Problem

A memory created on March 8 says "33 ORM models in `app/db/models.py`." By March 21, a migration added 7 more tables. If Claude trusts the memory without verification, it will state an incorrect count.

A memory says "CopilotKit v2 inline chat -- still uses floating popup." A later session may have implemented the 2-column layout. The memory is now wrong.

### Rules

1. **"The memory says X exists" does not mean "X exists now."** Always verify against current code before asserting facts from memory as current truth.

2. **Verify before acting.** When a memory claims a file exists at a path, a table has N columns, or a feature works a certain way -- check first. Use `ls`, `grep`, or `Read` to confirm.

3. **Update or remove memories that conflict with current state.** If you discover a memory is wrong during a session, update it immediately. A wrong memory is worse than no memory because it actively misleads.

4. **Date your observations.** Include dates in memory content so future sessions can gauge freshness. "Component Registry (2026-03-16)" tells the reader this is 5 days old and may need updating.

5. **Completed tasks stay but get marked.** When a project memory's task is done, update the memory to say "COMPLETE (merged 2026-03-17)" rather than deleting it. The completion record has value -- it tells future sessions what was done and when.

### Staleness Indicators

Claude Code automatically adds a system reminder to memories older than a few days:

```
This memory is 13 days old. Memories are point-in-time observations,
not live state -- claims about code behavior or file:line citations
may be outdated. Verify against current code before asserting as fact.
```

Treat this warning seriously. The older the memory, the higher the probability that code-level claims are outdated.

### Memory vs. Tasks vs. Plans

There are three persistence mechanisms for different purposes:

| Mechanism | Purpose | Lifetime | Location |
|-----------|---------|----------|----------|
| **Memory** | Context that spans sessions | Until explicitly updated/removed | `memory/*.md` |
| **Task list** | Work items within a session | Single session | Conversation context |
| **Design document** | Specification for a feature | Until feature ships | `docs/plans/*.md` or `docs/specs/*.md` |

Do not use memory files as task lists. A memory file that says "TODO: implement admin UI" will sit there for weeks, becoming noise. Instead, track tasks in design documents with dates and completion status. Memory files should record *what was decided* and *what was learned*, not *what remains to be done* -- with the exception of the MEMORY.md hub, which may include a brief "Upcoming Tasks" section for orientation.

---

## 5. Cross-Project Memory Patterns

Claude Code supports memory at two scopes: global (across all projects) and project-specific.

### Directory Structure

```
~/.claude/
  CLAUDE.md                    # Global instructions (all projects)
  projects/
    {project-scope}/
      memory/
        MEMORY.md              # Project-specific hub
        *.md                   # Project-specific spokes
```

The `{project-scope}` is derived from the project's absolute path (with path separators replaced by hyphens).

### Memory Composition

When Claude starts a session, it loads:

1. **Global CLAUDE.md** (`~/.claude/CLAUDE.md`) -- always loaded
2. **Project CLAUDE.md** (in the repository root) -- always loaded
3. **Project MEMORY.md** (`~/.claude/projects/{scope}/memory/MEMORY.md`) -- always loaded
4. **Individual memory files** -- loaded on demand based on relevance

This layered composition means:

- Global instructions (port assignments, shared preferences, pre-flight checks) apply to every project
- Project instructions (tech stack, build commands, testing rules) apply to one project
- Project memories (decisions, feedback, feature status) provide session continuity for one project

### Global vs. Project-Scoped

| Content | Scope | Rationale |
|---------|-------|-----------|
| Port assignments | Global | Prevents port conflicts across projects |
| "Always use Alembic" | Global (if all projects use it) or Project | Depends on whether it is a universal preference |
| "Never blanket-delete MinIO" | Project | Specific to this project's bucket layout |
| Pillar progress tracker | Project | Specific to this project's roadmap |
| Technical patterns | Project | Specific to this project's architecture |
| Research process rule | Project (could be global) | The convention could apply broadly |

### When to Promote to Global

If a feedback or preference memory keeps being recreated across multiple projects, promote it to global scope. Add it to `~/.claude/CLAUDE.md` or create a global memory file. A preference that applies everywhere should be stated once, not repeated per project.

---

## 6. Setting Up a Memory System

### Initial Setup

For a new project, create the memory directory and hub file:

```
mkdir -p .claude/projects/{project-scope}/memory
```

Start with a minimal MEMORY.md:

```markdown
# Project Name

## Mission
[1-2 sentences about the project's purpose]

## User Preferences
[Will accumulate as the user provides feedback]

## Detailed References
[Will accumulate as memory files are created]
```

Do NOT pre-populate memory files. Memories should accumulate naturally through collaboration. Pre-written memories are speculation -- they encode assumptions, not observations.

### When Memories Emerge

Memories are created in response to events:

| Event | Memory Type | Example |
|-------|-------------|---------|
| User corrects Claude's behavior | `feedback` | "Never ask for confirmation on routine steps" |
| User expresses a preference | `user` | "Always use subagent-driven development" |
| A mistake causes a bug | `feedback` | "Never blanket-delete MinIO files" |
| A feature ships | `project` | "goAML Phase 1 merged 2026-03-21" |
| A design decision is made | `project` | "Prompt centralization: DB-first with FS fallback" |
| A pattern is established across files | `reference` | "asyncpg: CAST not :: for jsonb" |
| External research is completed | `reference` | "Research on AG-UI protocol saved to docs/research/" |

### Maintaining the Hub

As spoke files accumulate, the hub must be maintained:

1. **Add new references** -- every new spoke file gets a one-line entry in the "Detailed References" section
2. **Update summaries** -- when a project memory's status changes (e.g., task completes), update the hub summary
3. **Prune completed items** -- move completed tasks from "Upcoming" to completed sections or remove them
4. **Respect the 200-line limit** -- if the hub grows too large, move details to spoke files and keep only summaries in the hub

### Memory File Template

```markdown
---
name: descriptive-kebab-case-name
description: one-line description used for relevance matching
type: user | feedback | project | reference
---

[Content describing the memory]

**Why:** [What problem this prevents or what value this preserves]

**How to apply:** [Concrete, actionable instructions for future sessions]
```

The `Why` and `How to apply` fields are mandatory for `feedback` and `project` types. They are optional but recommended for `user` and `reference` types.

---

## 7. Memory System Metrics

In the Trust Relay project (29 days of development, 1,264 commits), the memory system accumulated:

| Metric | Count |
|--------|-------|
| Total memory files | 27 |
| Hub file (MEMORY.md) | 1 (98 lines) |
| Feedback memories | 6 |
| Project memories | 12 |
| Reference memories | 5 |
| User memories | 4 |

The ratio of ~1 memory file per day of active development reflects disciplined use: memories are created when something important happens, not as routine documentation.

---

## 8. Summary

The memory system exists to solve one problem: Claude Code has no memory between sessions. The hub-and-spoke architecture balances always-available context (the hub) against on-demand depth (the spokes). Four memory types with frontmatter enable relevance matching. The `Why` and `How to apply` fields ensure memories are actionable, not just informational.

The most important discipline is knowing what NOT to save. Code, git history, configuration, and architecture derivable from the codebase should never be duplicated in memory. Every memory creates a staleness liability. Save only what cannot be derived: user preferences, hard-won lessons, project decisions, and pointers to external knowledge.

Treat memories as point-in-time observations. Verify before acting. Update when stale. Delete when wrong. The memory system is a tool for continuity, not a source of truth -- the code is always the source of truth.
