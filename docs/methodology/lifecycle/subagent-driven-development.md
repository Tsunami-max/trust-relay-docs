---
sidebar_position: 4
title: "Subagent-Driven Development"
description: "The default execution model: fresh subagent per task with two-stage review, preventing context pollution and quality degradation"
---

# Subagent-Driven Development

**What:** Subagent-driven development is the default execution model for implementation tasks. Rather than executing all tasks in a single long-running session, the methodology dispatches a fresh subagent for each task in the implementation plan. The orchestrating session reviews output between tasks using a two-stage review process (spec compliance, then code quality).

**Why:** Long-running AI sessions degrade in quality. This is not speculation — it is a structural property of context window management. A session that has implemented 5 tasks carries the context of all 5 implementations: file contents read, error messages encountered, debugging outputs, intermediate states. By the sixth task, the AI is making decisions influenced by irrelevant context from earlier tasks — a variable name from task 2 leaks into task 6, an error handling pattern from task 3 is applied where it does not belong, a debugging workaround from task 4 is treated as the correct approach.

Fresh subagents solve this by starting each task with only the relevant context: the design specification, the implementation plan, the specific task description, and the project's CLAUDE.md and memory files. The orchestrating session retains the big picture (which tasks are complete, what issues were found, how the overall implementation is progressing) while the implementing subagents focus on the immediate task without distraction.

## The Controller Pattern

The orchestrating session serves as a controller that:

1. Reads the implementation plan and extracts all tasks with their full text
2. For each task, dispatches an implementer subagent with the task description, relevant context (file paths, design spec section), and any constraints from earlier tasks
3. Receives the implementer's result and status
4. Dispatches a spec reviewer subagent to verify the implementation matches the design
5. Dispatches a code quality reviewer subagent to verify engineering standards
6. Tracks task completion and proceeds to the next task

The controller does not implement. It directs, reviews, and decides.

## Two-Stage Review

After each task, the implementation undergoes two independent reviews:

- **Stage 1 (Spec Compliance):** A reviewer subagent reads the design specification and the implementation, checking whether the implementation delivers what was specified. This catches missing features, scope creep, and silent divergences.

- **Stage 2 (Code Quality):** A reviewer subagent checks the implementation for engineering quality — correct patterns, sufficient tests, proper error handling, security considerations.

The stages are ordered deliberately. Spec compliance first ensures the right thing was built before evaluating how well it was built. Reversing this order risks polishing code that solves the wrong problem.

## Implementer Status Handling

Implementer subagents report one of four statuses:

| Status | Meaning | Controller Response |
|---|---|---|
| `DONE` | Task completed, ready for review | Proceed to spec compliance review |
| `DONE_WITH_CONCERNS` | Completed but flagged doubts | Read concerns, address if correctness-related, then review |
| `NEEDS_CONTEXT` | Missing information | Provide context and re-dispatch |
| `BLOCKED` | Cannot complete the task | Assess: provide more context, use a more capable model, split the task, or escalate to human |

:::warning The BLOCKED Status
When a subagent reports `BLOCKED`, retrying with the same context and the same model is almost never the correct response. Something about the task needs to change — more context, a more capable model, a different decomposition, or human judgment.
:::

## When to Use `/executing-plans` Instead

The `/executing-plans` skill is an alternative to subagent-driven development for situations where subagent dispatch is impractical:

- **Parallel development sessions.** When the architect is running multiple sessions simultaneously, subagent dispatch from each session creates management overhead. `/executing-plans` allows a single session to work through a plan sequentially with explicit phase gates.
- **Small plans.** When the plan has 3 or fewer tasks with low complexity, the overhead of subagent dispatch exceeds the benefit. A single session can execute the plan directly.
- **Tightly coupled tasks.** When tasks share significant context (e.g., task 2 modifies the exact code that task 1 created, and task 3 modifies it again), subagent dispatch creates unnecessary context reconstruction overhead.

The choice between subagent-driven development and `/executing-plans` is a pragmatic judgment call, not a quality decision. Both paths converge at verification and review — the quality gates are the same regardless of execution model.

**Evidence:** Subagent-driven development is the default execution model specified in the Trust Relay memory files. The model's effectiveness is demonstrated by the 22 commits/day velocity on active days — a rate that would not be sustainable in long-running sessions where each subsequent task degrades in quality as context accumulates. The two-stage review pattern catches different categories of defects: spec compliance catches "built the wrong thing" while code quality catches "built it wrong." Both categories are common in AI-assisted development and require separate checks. See [Agent Architecture](../infrastructure/agent-architecture) for the subagent dispatch patterns and prompt templates.
