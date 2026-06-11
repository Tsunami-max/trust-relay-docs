---
sidebar_position: 2
title: "Four Memory Types"
description: "**What:** Memory files are classified into four types, each serving a different purpose and following a different update pattern."
---


**What:** Memory files are classified into four types, each serving a different purpose and following a different update pattern. The type is declared in the file's YAML frontmatter.

**User Memories** — encode the developer's preferences, working style, and non-negotiable rules.

```yaml
---
name: feedback_autonomous_operation
description: Preference for autonomous operation — never ask, just proceed
type: feedback
---
```

Content: decisions about how to work. "Always use subagent-driven development." "Never use this specific test number as an example." "Design before code." These are not technical constraints — they are working style preferences that the AI should follow without asking for confirmation each time.

Update pattern: rarely updated. Created when a preference is established, modified only when the preference changes.

**Feedback Memories** — capture corrections, insights, and process improvements that emerged from actual development experience.

```yaml
---
name: feedback_minio_cleanup
description: Never blanket-delete MinIO objects — branding logos share the bucket
type: feedback
---
```

Content: hard-won knowledge from mistakes. "Never blanket-delete MinIO objects because branding logos share the bucket with case documents." "Docusaurus is a core methodology principle, not just a tooling choice." Each feedback memory traces to a specific incident where the wrong approach was taken and the correction should be permanent.

Update pattern: append-only in spirit. New feedback memories are created when new lessons are learned. Existing ones are updated only to add clarification, not to change the lesson.

**Project Memories** — describe the current state of the project: what has been built, what is planned, what is blocked.

```yaml
---
name: pillar-progress
description: Status of all architectural pillars — what is complete, what is next
type: project
---
```

Content: point-in-time observations about the project. Pillar status, feature inventory, session summaries, technical debt tracking, upcoming tasks. These files are the most frequently updated because the project state changes with every development session.

Update pattern: updated regularly. After completing a feature, update pillar progress. After a session, update the session summary. After discovering debt, update the debt tracking file.

**Reference Memories** — document stable technical patterns and conventions that change rarely.

```yaml
---
name: technical-patterns
description: Key technical patterns used across the codebase — reference for implementation
type: reference
---
```

Content: established patterns that should be followed. Temporal signal patterns, mock mode flag conventions, OSINT caching strategy, country routing logic, database access patterns. These are the "how we do things here" knowledge that a new team member would need to learn.

Update pattern: updated when patterns change (e.g., migrating from raw SQL to ORM Repository pattern), but otherwise stable.

**Evidence:** Trust Relay's 27 memory files span all four types: user preferences (working style), feedback (process corrections from incidents), project state (pillar progress, feature inventory, session summaries), and reference (technical patterns, regulatory requirements). The frontmatter classification enables Claude to treat different memory types appropriately — feedback memories carry warnings ("never do X"), reference memories provide implementation guidance ("always do X this way"), and project memories provide current state that may be stale and should be verified. See [appendix-d-memory.md](../appendix-d-memory) for the complete memory type specification.

---
