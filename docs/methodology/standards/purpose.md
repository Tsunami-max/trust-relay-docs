---
sidebar_position: 1
title: "Purpose"
description: "**What:** Memory files are markdown documents stored in Claude Code's project memory directory (`~/.claude/projects/{project-path}/memory/`)."
---


**What:** Memory files are markdown documents stored in Claude Code's project memory directory (`~/.claude/projects/{project-path}/memory/`). A hub file (`MEMORY.md`) serves as an index linking to specialized memory files organized by topic. Claude reads MEMORY.md at session start, gaining immediate access to accumulated project knowledge.

**Why:** The AI collaborator's context window is large but not infinite, and it resets between sessions. Every architectural decision, every team preference, every hard-won debugging insight, every regulatory constraint — if it is not written down in a place the AI reads at session start, it does not exist for the new session.

The alternative to persistent memory is repeating instructions. Every session opens with: "Remember, we use Alembic for all migrations, never manual ALTER TABLE. The asyncpg driver requires CAST syntax, not :: syntax. The security reviewer uses Opus. Port 3001 is for frontend, port 8002 is for backend." This is tedious, error-prone (the developer will forget something), and wastes context window on repetitive instructions that should be loaded automatically.

Memory solves this by making accumulated knowledge a structural input rather than a per-session conversation overhead.

**Hub-and-Spoke Architecture:**

MEMORY.md is kept under 200 lines. It contains:

- Mission and quality standards (the project's purpose and non-negotiable principles)
- Architecture quick reference (enough to orient the AI, with links to detailed files)
- User preferences (working style decisions that should be followed without asking)
- Known technical debt (prevents the AI from assuming everything works as designed)
- Upcoming tasks (provides session planning context)
- Links to detailed memory files (the "spokes")

Each linked memory file covers a single topic in depth: pillar progress, regulatory compliance, technical patterns, component registry, feature inventory. This structure keeps MEMORY.md concise (fast to read at session start) while providing depth on demand (Claude can read specific memory files when working on a related task).

**Evidence:** Trust Relay maintains 27 memory files covering mission, regulatory compliance, pillar progress, technical patterns, component registry, feature inventory, session summaries, feedback, and more. The MEMORY.md hub links to all of them with one-line descriptions. This memory corpus gives Claude immediate context about a 144,821-line codebase's architecture, history, constraints, and planned direction — context that would otherwise require extensive code exploration or repeated human explanation at every session start. See [appendix-f-evidence.md](../appendix-f-evidence) for the memory system metrics.

**How:** Memory files are created and updated as part of the development workflow. The `/finishing-a-development-branch` skill includes a memory update step. Memory is also updated when the developer provides feedback, makes a decision, or corrects a misunderstanding. For the full memory system specification, see [appendix-d-memory.md](../appendix-d-memory).

---
