---
sidebar_position: 4
title: "Subagent-Driven Development"
description: "**What:** Subagent-driven development is the default execution model for implementation tasks."
---


**What:** Subagent-driven development is the default execution model for implementation tasks. Rather than executing all tasks in a single long-running session, the methodology dispatches a fresh subagent for each task in the implementation plan. The orchestrating session reviews output between tasks using a two-stage review process (spec compliance, then code quality).

**Why:** Long-running AI sessions degrade in quality. This is not speculation — it is a structural property of context window management. A session that has implemented 5 tasks carries the context of all 5 implementations: file contents read, error messages encountered, debugging outputs, intermediate states. By the sixth task, the AI is making decisions influenced by irrelevant context from earlier tasks — a variable name from task 2 leaks into task 6, an error handling pattern from task 3 is applied where it does not belong, a debugging workaround from task 4 is treated as the correct approach.

Fresh subagents solve this by starting each task with only the relevant context: the design specification, the implementation plan, the specific task description, and the project's CLAUDE.md and memory files. The orchestrating session retains the big picture (which tasks are complete, what issues were found, how the overall implementation is progressing) while the implementing subagents focus on the immediate task without distraction.

**The Controller Pattern:**

The orchestrating session serves as a controller that:

1. Reads the implementation plan and extracts all tasks with their full text
2. For each task, dispatches an implementer subagent with the task description, relevant context (file paths, design spec section), and any constraints from earlier tasks
3. Receives the implementer's result and status
4. Dispatches a spec reviewer subagent to verify the implementation matches the design
5. Dispatches a code quality reviewer subagent to verify engineering standards
6. Tracks task completion and proceeds to the next task

The controller does not implement. It directs, reviews, and decides.

**Wave Dispatch:**

When the plan annotates tasks with `‖ parallelisable` markers (Section 3.1), the controller dispatches independent tasks concurrently rather than sequentially. The unit of dispatch is a *wave* — a set of tasks that can execute in parallel because they share no implementation dependencies, file collisions, or sequential ordering constraints.

The dispatch shape:

```
Wave 1: [Task 1]                                  ← single task, no parallelism
Wave 2: [Task 2 ‖ Task 3 ‖ Task 4]                ← three tasks dispatched in parallel
Wave 3: [Task 5]                                  ← waits for all of Wave 2 to complete
Wave 4: [Task 6 ‖ Task 7]                         ← two tasks in parallel
Wave 5: [Task 8]                                  ← waits for Wave 4
```

Each subagent in a wave receives the same context preparation (full task text, scene-setting context, constraints) but executes in its own isolated context window. The controller awaits the wave's completion before reviewing — review is the synchronization point, not dispatch.

**Why waves matter beyond speedup:** the sequential-only dispatch model bottlenecks on the critical path of the longest task in each cohort. For plans where 60-70% of tasks are independent, sequential execution wastes the majority of available parallel capacity. Wave dispatch preserves the discipline of the controller pattern (fresh subagent per task, review between tasks) while reclaiming that capacity. The orchestrating session's context budget is unchanged because each subagent has its own context — the controller only carries plan state and review verdicts.

**Honest annotation rule.** A task is `‖ parallelisable` only when it is *genuinely* independent of every other task in the same wave. Two tasks that touch the same file are not parallelisable even if they touch different functions in that file — git merge conflicts during the post-task commit phase will derail the wave. Two tasks that depend on a shared upstream task complete *cannot* dispatch in the same wave as that upstream task. The plan walkthrough phase (Section 3.1) is the right time to verify every `‖` annotation honestly.

**Wave failures.** When any subagent in a wave returns `BLOCKED` or `NEEDS_CONTEXT`, the wave does not abort — sibling subagents continue. The controller addresses the blocked task (re-dispatch with more context, escalate, or decompose) and re-sequences the remaining waves accordingly. The two-stage review for the wave's successful tasks proceeds normally; the blocked task is reviewed only after it completes via the resolution path.

**Two-Stage Review:**

After each task, the implementation undergoes two independent reviews:

- **Stage 1 (Spec Compliance):** A reviewer subagent reads the design specification and the implementation, checking whether the implementation delivers what was specified. This catches missing features, scope creep, and silent divergences.

- **Stage 2 (Code Quality):** A reviewer subagent checks the implementation for engineering quality — correct patterns, sufficient tests, proper error handling, security considerations.

The stages are ordered deliberately. Spec compliance first ensures the right thing was built before evaluating how well it was built. Reversing this order risks polishing code that solves the wrong problem.

**Implementer Status Handling:**

Implementer subagents report one of four statuses:

| Status | Meaning | Controller Response |
|---|---|---|
| `DONE` | Task completed, ready for review | Proceed to spec compliance review |
| `DONE_WITH_CONCERNS` | Completed but flagged doubts | Read concerns, address if correctness-related, then review |
| `NEEDS_CONTEXT` | Missing information | Provide context and re-dispatch |
| `BLOCKED` | Cannot complete the task | Assess: provide more context, use a more capable model, split the task, or escalate to human |

The `BLOCKED` status deserves emphasis. When a subagent reports `BLOCKED`, retrying with the same context and the same model is almost never the correct response. Something about the task needs to change — more context, a more capable model, a different decomposition, or human judgment.

**Evidence:** Subagent-driven development is the default execution model specified in the Trust Relay memory files ("always use subagent-driven development — never ask, never offer choices, just proceed with it"). The model's effectiveness is demonstrated by the 22 commits/day velocity on active days — a rate that would not be sustainable in long-running sessions where each subsequent task degrades in quality as context accumulates. The two-stage review pattern catches different categories of defects: spec compliance catches "built the wrong thing" while code quality catches "built it wrong." Both categories are common in AI-assisted development and require separate checks. See [appendix-c-agents.md](../appendix-c-agents) for the subagent dispatch patterns and prompt templates.

---
