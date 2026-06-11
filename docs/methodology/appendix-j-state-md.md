---
sidebar_position: 19
title: "Appendix J: Project State Files (STATE.md)"
description: "This appendix specifies the canonical format and update cadence for the `STATE.md` file introduced in Section 11.6 of the main methodology document."
---


This appendix specifies the canonical format and update cadence for the `STATE.md` file introduced in Section 11.6 of the main methodology document. STATE.md is the orientation file a fresh AI agent reads to understand *what is happening right now* in a project — the operational counterpart to CLAUDE.md (architecture) and ROADMAP.md (direction).

## Why this is in its own appendix

A short specification covering the format, update cadence, and integration points for STATE.md was needed because the file is small enough that a separate appendix was the right level of weight: detailed enough to be the canonical reference, compact enough to be readable in five minutes. The main methodology document keeps the *why* (Section 11.6); this appendix keeps the *how*.

## Canonical Template

A STATE.md file has four required sections and one optional section. Every section has a strict purpose; sections are not added without amending this appendix.

```markdown
# {Project Name} — Current State

> {One-line tagline describing the project in operational terms.}
> Last updated: {YYYY-MM-DD} after {commit-sha or task-number}.

## Current Focus

{1-3 sentences describing what is in flight RIGHT NOW. Reference the
milestone (M3, Pillar 5, etc.), the active plan document, and the
specific artifact under construction. Avoid abstractions like "improving
quality" — use concrete artifacts: "Ratiba M3 tenant-registry plan,
Tasks 1-8 landed, Task 9 (tenant resolver dependency) in flight."}

## Last Shipped

| What | When | Where |
|---|---|---|
| {artifact 1, e.g. "Task 8 — tenant lifecycle ops"} | {YYYY-MM-DD} | `{commit-sha}` |
| {artifact 2} | {YYYY-MM-DD} | `{commit-sha or PR ref}` |
| {artifact 3} | {YYYY-MM-DD} | `{commit-sha}` |

(Up to 5 most recent shipped artifacts. Older history lives in `git log`,
ROADMAP.md, or memory files — do not duplicate it here.)

## Blockers

{Empty when none. Otherwise: numbered list, each blocker including:
what is blocked, what it is blocked on, and who/what unblocks it.}

- [ ] {Blocker 1: e.g., "Task 9 acceptance criteria need user
       confirmation on JWT claim shape — ping when M4 channel-resolver
       design is ready"}
- [ ] {Blocker 2}

## Next Up

{1-3 bullet points describing the next dispatch — what would a fresh
agent pick up if they sat down right now?}

- {Next-up 1: specific task, file, or ADR}
- {Next-up 2}
- {Next-up 3}

## Pointers

- **Architecture:** `CLAUDE.md`
- **Direction:** `ROADMAP.md` (or equivalent)
- **Active plan:** `{path/to/current/plan.md}`
- **Memory:** `~/.claude/projects/{project-path}/memory/MEMORY.md`
- **Docs:** `{docusaurus-url-or-path}`
```

The optional section, if present, goes between **Next Up** and **Pointers**:

```markdown
## Recent Decisions

{Used only when meaningful decisions have been made since the last
ADR/memory entry. Each decision is a one-liner with a date. Do not
duplicate ADRs — link to them.}

- {YYYY-MM-DD}: {decision, with link to ADR/memory if applicable}
```

## Update Cadence

**Trigger:** Per-shipped-artifact. The trigger fires when:

1. A task in the active plan completes and merges (`feat:`, `fix:` commits).
2. An ADR is accepted.
3. A milestone closes.
4. A new blocker is discovered (the file should reflect the blocker the moment it is known, not at the next commit).
5. A new top-level focus begins (e.g., transitioning from M3 to M4).

**Anti-trigger:** STATE.md is **not** updated for:

- Bug fixes that don't change the operational frame.
- Documentation-only commits (unless the doc itself is the shipped artifact).
- Configuration tweaks, lint passes, dependency bumps.
- Conversational drafts or untracked work.

**Cadence floor:** A project where STATE.md has not been touched in 30 days is either dormant or the file has rotted. Either is a problem worth surfacing — a stale STATE.md is worse than a missing one because it actively misleads.

## Integration with the Lifecycle

The `/finish` skill (Section 3.1) includes STATE.md update as a step:

1. Verify tests pass.
2. Update relevant Docusaurus pages.
3. **Update STATE.md** — revise "Last Shipped", revise "Current Focus", clear or update "Blockers", update "Next Up".
4. Commit (the STATE.md update is in the same commit as the feature, not a separate commit).
5. Merge.

The pattern: STATE.md travels in the feature commit. The reviewer's documentation-update check (Section 11.4) includes STATE.md alongside Docusaurus pages and ADRs.

## Examples (live as of methodology v-of-this-appendix)

The following examples show how STATE.md looks in three different project profiles. Each example is intentionally complete so it can be used as a copy-and-modify starting point.

### Example 1: Just-shipped milestone, transitioning to next (Ratiba post-M3)

```markdown
# Ratiba — Current State

> Conversational-first business management for East African SMBs.
> Last updated: 2026-04-26 after `47616dc`.

## Current Focus

M3 (Tenant Registry Foundation) — **COMPLETE.** All 10 tasks landed
across 10 commits; full backend test suite at 167/167 green under
`.venv/python3.13`. Immediate next move: M3 close-out memo, then M4
(channel-boundary IdentityResolver) brainstorm.

## Last Shipped

| What | When | Where |
|---|---|---|
| Task 10 — smoke + admin endpoints + worker — M3 COMPLETE | 2026-04-26 | `47616dc` |
| Task 9 — JWT tenant resolver dependency | 2026-04-26 | `401a83b` |
| Task 8 — tenant lifecycle ops + nullable schema_name fix | 2026-04-25 | `4950bc6` |
| Task 7 — onboarding orchestrator (8-step atomic) | 2026-04-25 | `843822e` |
| Task 6 — ORM models + Pydantic schemas + handoff_defaults | 2026-04-25 | `2ce0cdc` |

## Blockers

(none — M3 closed clean; M4 brainstorm is the next gating step)

## Next Up

- File M3 close-out memo in memory: surprises, deviations, doc-sync TODOs.
- Update `tenants-schema-evolution.md` after Task 8's nullable schema_name change.
- M4 brainstorm: channel-boundary IdentityResolver (separate plan, separate dispatch).

## Pointers

- **Architecture:** `CLAUDE.md` § Architecture (7 ADRs)
- **Direction:** `docs/ROADMAP.md`
- **Just-closed plan:** `docs/superpowers/plans/2026-04-25-tenant-registry-foundation.md` (v3)
- **Memory:** `~/.claude/projects/-Users-soft4u-Development-Ratiba/memory/MEMORY.md`
- **Docs:** `docusaurus/ratiba/`
```

This shape is illustrative for the *milestone-transition* moment: the just-completed work is in "Last Shipped"; the next milestone is in "Next Up"; the close-out artifacts that bridge them are explicit. A fresh agent reading this knows exactly which milestone is settled, which is starting, and what work bridges them.

### Example 2: Mature feature-stable project (Trust Relay)

```markdown
# Trust Relay Compliance Workflow — Current State

> KYB/KYC compliance platform — investigation-first 12-step loop with
> EU AI Act / GDPR / 6AMLD compliance baked in.
> Last updated: 2026-04-25 after `de1757cd`.

## Current Focus

Pillar 5 complete; 49 ADRs accepted. No active feature pillar — the
project is in methodology-compounding mode (Atlas codebase comparisons,
business-context updates, sales-strategy documents, occasional
infrastructure fixes). Czech bank demo prep retrospective in flight;
goAML BE submission ready for FIU evaluation.

## Last Shipped

| What | When | Where |
|---|---|---|
| Canonical 9-plugin stack pinned at project level | 2026-04-25 | `de1757cd` |
| docker-compose decode error + Langfuse drift fix | 2026-04-25 | `1a30dda5` |
| TrustRelay Atlas business context refresh | 2026-04-25 | `473eebd7` |
| Atlas business-context document | 2026-04-25 | `7a2ea84c` |
| Business-context: customer-facing only (Outcome 17 removed) | 2026-04-25 | `e6212d18` |

## Blockers

(none active — see roadmap-acquiring-gaps.md for medium-term gaps)

## Next Up

- Sales: Czech bank demo follow-up (April 2026).
- Methodology: continue compounding via the s4u-methodology project.
- Compliance: monitor goAML BE FIU response, ready Phase 2 export
  refinements when feedback lands.
- Optional: backfill ~11 missing ADRs identified in `project_adr_backfill.md`.

## Pointers

- **Architecture:** `CLAUDE.md` § Architecture
- **Active ADRs:** `docs/adr/` (49 numbered files)
- **Memory:** `~/.claude/projects/-Users-soft4u-Development-trust-relay-workflow/memory/MEMORY.md`
- **Docs:** [trust-relay.pages.dev](https://trust-relay.pages.dev)
```

### Example 3: Active-development R&D project (zol-rag)

```markdown
# ZOL RAG — Current State

> Retrieval-augmented voice + chat assistant for Belgian legal queries.
> Last updated: 2026-04-25 after `69a7378`.

## Current Focus

Voice channel Phase A — strategic transformation work. Voice dialogue
manager Pydantic schemas just landed (Option 1 of the design spec).
FAQ-followup context-carry recently merged. Demo page redesigned to
2-column always-visible layout.

## Last Shipped

| What | When | Where |
|---|---|---|
| Pydantic schemas for voice dialogue manager | 2026-04-25 | `69a7378` |
| Voice dialogue manager design spec | 2026-04-25 | `b2a33e2` |
| Demo page 2-column always-visible redesign | 2026-04-25 | `ddf21e2` |
| FAQ Q&A persistence to conversation history | 2026-04-25 | `afa1874` |
| FAQ-followup context-carry — short-clarifications augment | 2026-04-25 | `0b4044e` |

## Blockers

- [ ] Voice channel Phase A plan needs walkthrough refinement before
       next dispatch — the plan has uncommitted edits in
       `docs/superpowers/plans/2026-04-23-voice-channel-phase-a-plan.md`.

## Next Up

- Walkthrough the voice-channel Phase A plan and commit refinements.
- Wire dialogue manager into the live LiveKit voice agent (post-schemas).
- Evaluate FAQ-followup behavior on the demo page after the layout change.

## Pointers

- **Architecture:** `CLAUDE.md` § Architecture
- **Active plan:** `docs/superpowers/plans/2026-04-23-voice-channel-phase-a-plan.md`
- **Memory:** `~/.claude/projects/-Users-soft4u-Development-zol-rag/memory/MEMORY.md`
- **Docs:** `docusaurus/zol-documentation/`
```

## Anti-patterns

The following STATE.md shapes are **broken** even if technically present.

**Anti-pattern 1: Conversational free-text.** A STATE.md that reads "We're working on improving the platform's user experience and getting closer to launch" is a tagline, not state. It does not name an artifact, a commit, or a next-up task.

**Anti-pattern 2: Last-shipped table that mirrors `git log`.** STATE.md's "Last Shipped" is the *meaningful* shipped artifacts — usually 3-5 entries — not every commit since the last update. If the table is more than 7 rows long, it is being maintained as a journal, which is the wrong model.

**Anti-pattern 3: Blockers that never resolve.** A blocker that has been on the list for more than two weeks is either: (a) actually a roadmap item misclassified as a blocker, (b) a scope problem that needs an ADR, or (c) abandoned work that should be closed out. STATE.md is for active blockers, not a wishlist of things that aren't happening.

**Anti-pattern 4: Stale "Last updated" date.** If the most recent commit on `master` is two weeks newer than STATE.md's "Last updated" line, the file is actively misleading. Either the project is dormant (in which case STATE.md should say so) or the update cadence has slipped.

**Anti-pattern 5: STATE.md as a substitute for the plan.** Detail belongs in the plan document. STATE.md says "Task 9 in flight"; the plan says what Task 9 *is*. A STATE.md that includes task descriptions, acceptance criteria, and file paths is doing the plan's job and creating a duplication tax.

## Bootstrap

When a new project is bootstrapped, STATE.md is created at the same time as CLAUDE.md and ROADMAP.md, even if the "Last Shipped" table is empty. The initial state is:

```markdown
# {Project} — Current State

> {Tagline}.
> Last updated: {YYYY-MM-DD} (project bootstrap, no shipped code yet).

## Current Focus

Bootstrap phase. Methodology harness in place. {Next milestone} is gated
on {ADR/decision/dependency}.

## Last Shipped

| What | When | Where |
|---|---|---|
| Methodology harness (hooks, agents, settings) | {date} | `{commit-sha}` |
| CLAUDE.md + ROADMAP.md + ADR-0001 (tech stack) | {date} | `{commit-sha}` |

## Blockers

- [ ] {Gating ADR or decision required to start implementation}

## Next Up

- Write {gating ADR}.
- Pin dependency versions in `pyproject.toml` / `package.json`.
- Brainstorm the first implementation plan.

## Pointers

- **Architecture:** `CLAUDE.md`
- **Direction:** `docs/ROADMAP.md`
- **Memory:** `~/.claude/projects/{project-path}/memory/MEMORY.md`
```

This bootstrap shape is itself useful — a fresh agent reading it knows the project is real but not yet productive, and understands which gates need to clear before implementation begins.
