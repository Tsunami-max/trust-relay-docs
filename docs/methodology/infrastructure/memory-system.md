---
sidebar_position: 3
title: "Memory System"
description: "Persistent context that survives across Claude Code sessions: hub-and-spoke architecture with four memory types"
---

# The Memory System

The memory system provides persistent context that survives across Claude Code sessions. Without it, every session starts at zero — the AI has no knowledge of decisions made yesterday, feedback received last week, or architectural patterns established over months of development. Memory transforms Claude from a stateless tool into a collaborator with institutional knowledge.

## Purpose

**What:** Memory files are markdown documents stored in Claude Code's project memory directory (`~/.claude/projects/{project-path}/memory/`). A hub file (`MEMORY.md`) serves as an index linking to specialized memory files organized by topic. Claude reads MEMORY.md at session start, gaining immediate access to accumulated project knowledge.

**Why:** The AI collaborator's context window is large but not infinite, and it resets between sessions. Every architectural decision, every team preference, every hard-won debugging insight, every regulatory constraint — if it is not written down in a place the AI reads at session start, it does not exist for the new session.

The alternative to persistent memory is repeating instructions. Every session opens with: "Remember, we use Alembic for all migrations, never manual ALTER TABLE. The asyncpg driver requires CAST syntax, not :: syntax. The security reviewer uses Opus." This is tedious, error-prone (the developer will forget something), and wastes context window on repetitive instructions that should be loaded automatically.

### Hub-and-Spoke Architecture

MEMORY.md is kept under 200 lines. It contains:

- Mission and quality standards (the project's purpose and non-negotiable principles)
- Architecture quick reference (enough to orient the AI, with links to detailed files)
- User preferences (working style decisions that should be followed without asking)
- Known technical debt (prevents the AI from assuming everything works as designed)
- Upcoming tasks (provides session planning context)
- Links to detailed memory files (the "spokes")

Each linked memory file covers a single topic in depth: pillar progress, regulatory compliance, technical patterns, component registry, feature inventory. This structure keeps MEMORY.md concise (fast to read at session start) while providing depth on demand (Claude can read specific memory files when working on a related task).

**Evidence:** Trust Relay maintains 27 memory files covering mission, regulatory compliance, pillar progress, technical patterns, component registry, feature inventory, session summaries, feedback, and more. This memory corpus gives Claude immediate context about a 144,821-line codebase's architecture, history, constraints, and planned direction. See the [Evidence appendix](../evidence/trust-relay-metrics) for the memory system metrics.

---

## Four Memory Types

Memory files are classified into four types, each serving a different purpose and following a different update pattern. The type is declared in the file's YAML frontmatter.

### User Memories

Encode the developer's preferences, working style, and non-negotiable rules.

```yaml
---
name: feedback_autonomous_operation
description: Preference for autonomous operation — never ask, just proceed
type: feedback
---
```

Content: decisions about how to work. "Always use subagent-driven development." "Never use this specific test number as an example." "Design before code." These are not technical constraints — they are working style preferences that the AI should follow without asking for confirmation each time.

Update pattern: rarely updated. Created when a preference is established, modified only when the preference changes.

### Feedback Memories

Capture corrections, insights, and process improvements that emerged from actual development experience.

```yaml
---
name: feedback_minio_cleanup
description: Never blanket-delete MinIO objects — branding logos share the bucket
type: feedback
---
```

Content: hard-won knowledge from mistakes. Each feedback memory traces to a specific incident where the wrong approach was taken and the correction should be permanent.

Update pattern: append-only in spirit. New feedback memories are created when new lessons are learned.

### Project Memories

Describe the current state of the project: what has been built, what is planned, what is blocked.

```yaml
---
name: pillar-progress
description: Status of all architectural pillars — what is complete, what is next
type: project
---
```

Content: point-in-time observations about the project. Pillar status, feature inventory, session summaries, technical debt tracking, upcoming tasks. These are the most frequently updated files.

### Reference Memories

Document stable technical patterns and conventions that change rarely.

```yaml
---
name: technical-patterns
description: Key technical patterns used across the codebase — reference for implementation
type: reference
---
```

Content: established patterns that should be followed. Temporal signal patterns, mock mode flag conventions, OSINT caching strategy, country routing logic, database access patterns.

---

## What NOT to Save

Not everything belongs in memory. Saving too much creates noise that dilutes the signal of genuinely important persistent knowledge.

| Category | Why Not | Where It Lives Instead |
|---|---|---|
| Code patterns | Readable from the source code directly. Memory about code drifts as code changes. | The code itself |
| Git history | Accessible via `git log`. Duplicating commit history wastes context. | Git |
| Debugging session details | Ephemeral. The specific port conflict from Tuesday has no lasting value. | Nowhere — let it go |
| Test commands | Documented in CLAUDE.md (project instructions). | CLAUDE.md's testing section |
| File-level documentation | Belongs in code comments, docstrings, or README files. | The source files themselves |
| Current task status | Changes too rapidly. By next session, the status is stale. | Conversation context |

:::tip The Filtering Principle
Before writing a memory, ask: "If Claude starts a fresh session tomorrow and does NOT have this information, what will go wrong?" If the answer is "nothing — it can figure this out from the code or CLAUDE.md," do not create a memory file. If the answer is "it will repeat a mistake we already corrected" or "it will propose an approach we already rejected," create the memory.
:::

---

## Staleness Management

Memory files are point-in-time observations, not live state. A memory written on day 10 that says "the codebase has 33 ORM models" may be wrong by day 20 when the count has grown to 43.

:::warning Stale Memory Is Worse Than No Memory
If Claude has no memory of how many ORM models exist, it will check the code and get the correct answer. If Claude has a memory that says "33 ORM models" and trusts it without checking, it will give a confidently wrong answer. The memory gave the AI false confidence that prevented verification.
:::

**Staleness management rules:**

1. **Verify before acting.** When a memory makes a specific factual claim (a count, a file path, a line number), verify it against the current code before using it. The memory provides a starting point for investigation, not a conclusion.

2. **Update stale memories.** When verification reveals that a memory is outdated, update the memory as part of the current task.

3. **Distinguish stable from volatile claims.** Some memory content is stable: "we chose Temporal for workflow orchestration" is unlikely to change. Other content is volatile: "the codebase has 33 ORM models." Treat stable claims with higher trust and volatile claims with lower trust.

4. **Timestamp awareness.** Claude Code displays a staleness warning on memory files older than a configurable threshold. This warning is a structural reminder, not a suggestion.

**The key mental model:** A memory file that says "X exists" means "X existed when this memory was written." It does not mean "X exists now." Verify first.
