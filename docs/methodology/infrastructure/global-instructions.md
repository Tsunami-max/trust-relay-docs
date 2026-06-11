---
sidebar_position: 2
title: "Global Instructions"
description: "**What:** Global instructions live in `~/.claude/CLAUDE.md` and `~/.claude/settings.json`."
---


**What:** Global instructions live in `~/.claude/CLAUDE.md` and `~/.claude/settings.json`. They configure behavior that should be consistent across every project the developer works on.

**Why:** Without global instructions, every project's CLAUDE.md must independently specify the same cross-cutting rules — port assignments, database migration tooling preferences, UI patterns, testing philosophy. This leads to drift: one project says "use port 3000 for frontend" while another uses 3001, causing port collisions during parallel development. Global instructions establish the baseline once and every project inherits it.

The second purpose is encoding the developer's working style and preferences into infrastructure. Rules like "always use subagent-driven development," "design before code," and "no native dialogs" reflect judgment calls that the developer made once and does not want to re-make for every session. Encoding them as global instructions ensures the AI collaborator follows these preferences without being reminded.

**What belongs here:**

| Category | Example | Rationale |
|---|---|---|
| Port assignments | Frontend :3001, Backend :8002, PostgreSQL :5432 | Prevents collisions between projects running simultaneously |
| Cross-project rules | "Always use Alembic for DB migrations" | Consistency across all projects using the same database tooling |
| Shared quality standards | "Design before code: brainstorm, spec, plan, execute" | Methodology rules that apply regardless of tech stack |
| Behavioral preferences | "Use subagent-driven development," "No native dialogs" | Working style encoded as structure, not discipline |
| Permission configuration | `defaultMode: dontAsk` with explicit allowlist | Trust calibration — tools the developer has validated as safe to run without confirmation |
| Plugin enablement | Superpowers, Pyright LSP, Frontend Design | Plugin availability across all projects |

**What does NOT belong here:**

- Technology-specific rules (asyncpg cast syntax, Temporal testing patterns) — these belong in project CLAUDE.md because they only apply to projects using those technologies.
- Architecture descriptions (data flow diagrams, service module inventories) — these are project-specific context.
- File path references (unless they point to cross-project resources like shared architecture documents).

**Evidence:** The Trust Relay global CLAUDE.md maintains a port assignment table covering 7 services across 2 projects (ZOL RAG and Trust Relay), preventing the port collision issues that occurred before this table existed. The settings.json configures `defaultMode: dontAsk` with 33 explicit permission entries, eliminating confirmation prompts for validated tools while maintaining security boundaries. See [appendix-f-evidence.md](../appendix-f-evidence) for the methodology infrastructure metrics.

**How:** See `templates/global-claude.md` for a parameterized template. The setup guide (Step 4) walks through merging the template with existing global instructions, preserving any project-specific content the developer already has.

---
