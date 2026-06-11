---
sidebar_position: 4
title: "Lifecycle Integration"
description: "The three lifecycle patterns (full cycle, bug fix, code review) integrate through two mechanisms: the Superpowers skill system and the subagent-driven"
---


The three lifecycle patterns (full cycle, bug fix, code review) integrate through two mechanisms: the Superpowers skill system and the subagent-driven development model.

**Skill Chaining**

Each Superpowers skill produces output that serves as input for the next skill in the lifecycle:

| Skill | Output | Consumed By |
|---|---|---|
| `/brainstorming` | Problem analysis, candidate approaches | `/designing` |
| `/designing` | Design specification document | `/planning` |
| `/planning` | Ordered task list with acceptance criteria | `/test-driven-development` or `/executing-plans` |
| `/test-driven-development` | Implemented code with passing tests | `/verification-before-completion` |
| `/systematic-debugging` | Root cause analysis, reproduction steps | `/test-driven-development` (for the fix) |
| `/verification-before-completion` | Verified completion evidence | `/code-review` |
| `/code-review` | Review findings and dispositions | `/finish` or back to implementation |
| `/finish` | Merged branch, updated documentation | Next task or session end |

The skills do not share state directly. Each skill operates on files (source code, design documents, plan files, test output) that persist in the repository. This file-based integration means that skill transitions are auditable — the design document, the plan, the test output, and the review findings are all committed artifacts that can be inspected after the fact.

**Subagent-Driven Development**

Subagent-driven development is the default execution model for implementation tasks. Rather than executing all tasks in a single long-running Claude session, the methodology dispatches a fresh subagent for each task in the implementation plan.

The rationale is context management. A long-running session accumulates context from every task it has executed: file contents, error messages, intermediate states, debugging outputs. By the tenth task, the session's context window contains substantial noise from the first nine tasks, reducing the quality of the AI's output on the current task. A fresh subagent starts with only the context relevant to the current task: the design specification, the plan, the specific task description, and the project's CLAUDE.md and memory files.

The subagent-driven model has three roles:

1. **Orchestrator (human or primary session).** Reads the implementation plan, dispatches subagents for each task, reviews subagent output between tasks, and decides whether to proceed to the next task or send the current task back for revision. The orchestrator does not implement — it directs and reviews.

2. **Implementer (subagent).** Receives a single task with its context, implements it following the TDD or code-first workflow, runs verification, and reports results. The implementer does not decide what to build — it builds what it is directed to build.

3. **Reviewer (agent).** After implementation, a reviewer agent (or the orchestrator) checks the output for spec compliance and code quality. The reviewer does not implement — it validates.

This separation of concerns prevents the common failure mode where a single session accumulates bias toward its own implementation and loses the ability to critically evaluate its own output.

**When to use `/executing-plans` instead:**

The `/executing-plans` skill is an alternative to subagent-driven development for situations where subagent dispatch is impractical:

- **Parallel development sessions.** When the architect is running multiple sessions simultaneously, subagent dispatch from each session creates management overhead. `/executing-plans` allows a single session to work through a plan sequentially with explicit phase gates.
- **Small plans.** When the plan has 3 or fewer tasks with low complexity, the overhead of subagent dispatch exceeds the benefit. A single session can execute the plan directly.
- **Tightly coupled tasks.** When tasks share significant context (e.g., task 2 modifies the exact code that task 1 created, and task 3 modifies it again), subagent dispatch creates unnecessary context reconstruction overhead.

The choice between subagent-driven development and `/executing-plans` is a pragmatic judgment call, not a quality decision. Both paths converge at verification and review — the quality gates are the same regardless of execution model.

**Lifecycle Transition Triggers:**

| Trigger | Lifecycle | Entry Point |
|---|---|---|
| New feature request or architectural change | Full Cycle | `/brainstorming` |
| Bug report or test failure | Bug Fix Cycle | `/systematic-debugging` |
| Pull request from another developer | Code Review Cycle | Stage 1: Spec Compliance |
| Refactoring initiative | Full Cycle (abbreviated) | `/designing` (skip brainstorm if scope is clear) |
| Dependency update or migration | Full Cycle | `/brainstorming` (if breaking changes) or `/planning` (if straightforward) |
| Documentation update | Direct implementation | No lifecycle required for content-only changes |

---
