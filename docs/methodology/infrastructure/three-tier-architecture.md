---
sidebar_position: 1
title: "Three-Tier Architecture"
description: "graph"
---


```mermaid
graph TD
    A["<b>Tier 1: Global Instructions</b><br/>~/.claude/CLAUDE.md<br/>~/.claude/settings.json<br/>~/.claude/agents/"] --> B["<b>Tier 2: Project Instructions</b><br/>PROJECT/CLAUDE.md<br/>PROJECT/.claude/settings.json<br/>PROJECT/.claude/agents/"]
    B --> C["<b>Tier 3: Skills</b><br/>Superpowers Plugin<br/>14 lifecycle skills<br/>Invoked per-task"]

    A -.- D["Scope: All projects<br/>Content: Cross-project rules, ports,<br/>shared quality standards"]
    B -.- E["Scope: Single project<br/>Content: Tech stack, architecture,<br/>testing rules, coverage targets"]
    C -.- F["Scope: Single task<br/>Content: Process enforcement,<br/>phase-specific workflow"]

    style A fill:#f0f4ff,stroke:#4a6fa5,color:#1a1a1a
    style B fill:#e8f5e9,stroke:#388e3c,color:#1a1a1a
    style C fill:#fff3e0,stroke:#f57c00,color:#1a1a1a
    style D fill:#f0f4ff,stroke:#4a6fa5,color:#1a1a1a
    style E fill:#e8f5e9,stroke:#388e3c,color:#1a1a1a
    style F fill:#fff3e0,stroke:#f57c00,color:#1a1a1a
```

**How the tiers interact:**

Claude Code reads all three tiers at session start, but they serve fundamentally different purposes. Tier 1 (global) provides rules that apply regardless of which project is open — port assignments that prevent collisions between projects, quality standards that should be uniform across all work, and behavioral preferences that reflect the developer's working style. Tier 2 (project) provides the technical context that makes the AI useful for a specific codebase — the tech stack, the architecture, the testing conventions, the data flow. Tier 3 (skills) provides process enforcement at the task level — the brainstorm → design → plan → implement → verify → review lifecycle.

Instructions do not conflict across tiers because they address different concerns. Tier 1 says "always use Alembic for database migrations" (a cross-project rule). Tier 2 says "this project uses 31 Alembic migrations with RLS on 33 tables" (project-specific context). Tier 3 says "before marking this migration task complete, verify the migration applies and rolls back cleanly" (task-level process). Each tier adds precision without contradicting the others.

---
