---
sidebar_position: 4
title: "The Superpowers Skills System"
description: "**What:** Superpowers is an open-source Claude Code plugin that provides 14 development lifecycle skills."
---


**What:** Superpowers is an open-source Claude Code plugin that provides 14 development lifecycle skills. Each skill governs a specific phase of the development process — brainstorming, designing, planning, implementing, debugging, verifying, reviewing, and finishing. Skills are invoked per-task using slash commands (e.g., `/brainstorming`, `/test-driven-development`) and enforce the process structure described in Section 3.

**Why:** Process enforcement through documentation (wikis, runbooks, README files) does not work because it depends on the developer or AI reading and following the documentation for every task. Process enforcement through skills works because the skills are the process — invoking `/test-driven-development` does not just remind you to write tests first, it structures the session around the red-green-refactor cycle with an anti-rationalization table that prevents skipping failing tests.

The 14 skills collectively encode the complete development lifecycle as executable structure. Without them, the methodology exists only as written principles that must be manually applied. With them, the methodology is the default workflow and deviating from it requires actively choosing a different path.

**The 14 Skills:**

| Skill | Purpose | Lifecycle Phase |
|---|---|---|
| `/brainstorming` | Structured problem exploration with constraint analysis | Design |
| `/designing` | Formal specification from brainstorm output | Design |
| `/writing-plans` | Decompose design into ordered implementation tasks | Planning |
| `/executing-plans` | Execute plan tasks sequentially in current session | Implementation |
| `/subagent-driven-development` | Execute plan via fresh subagent per task with two-stage review | Implementation |
| `/dispatching-parallel-agents` | Run independent tasks concurrently across subagents | Implementation |
| `/test-driven-development` | Red-green-refactor cycle with anti-rationalization table | Implementation |
| `/systematic-debugging` | Four-phase investigation: root cause, pattern, hypothesis, fix | Bug Fix |
| `/verification-before-completion` | Evidence-based completion gate (tests, coverage, linting) | Verification |
| `/requesting-code-review` | Two-stage review: spec compliance then code quality | Review |
| `/receiving-code-review` | Process review findings: evaluate, respond, track dispositions | Review |
| `/using-git-worktrees` | Filesystem-isolated feature branches | Git |
| `/finishing-a-development-branch` | Merge, clean up worktree, update memory | Git |
| `/using-superpowers` | Meta-skill: when and how to invoke other skills | Meta |

**Installation:**

```bash
claude plugins install superpowers@superpowers-marketplace
```

The plugin installs globally and is available in all projects. Skills are invoked by name and provide their own instruction context to Claude — each skill's `SKILL.md` file contains the process definition, decision trees, prompt templates, and output format specifications.

**How skills integrate with agents, hooks, and memory:**

Skills do not operate in isolation. They integrate with the other methodology components:

- **Skills + Agents:** The `/subagent-driven-development` skill dispatches fresh subagent sessions. Reviewer agents (Section 5) can be invoked during the review phases of skills like `/requesting-code-review`. The skill's prompt templates include guidance on which agent model to select based on task complexity.

- **Skills + Hooks:** The `/verification-before-completion` skill and the Stop hook (Section 7) serve the same purpose at different levels. The skill provides the structured verification process; the hook provides the fallback check if the skill was not explicitly invoked. Together, they ensure that no task is marked complete without evidence.

- **Skills + Memory:** The `/finishing-a-development-branch` skill includes a memory update step. After merging a feature branch, the skill prompts the AI to update memory files that should reflect the new state of the system — pillar progress, architecture changes, new patterns established. This keeps memory current with the codebase.

**Evidence:** The Superpowers plugin is one of 3 enabled plugins in the Trust Relay environment (alongside Pyright LSP and Frontend Design). The 14 skills govern every phase of the development lifecycle that produced 1,264 commits across 25 active development days. The skill system's value is not in any individual skill but in the collective guarantee that process phases are not skipped — design happens before implementation, verification happens before completion, review happens before merge. See [appendix-f-evidence.md](../appendix-f-evidence) for the methodology infrastructure metrics.

**How:** Install the plugin with the command above. Skills become available immediately as slash commands. No additional configuration is required. For the full skill integration architecture, see the lifecycle diagrams in Section 3.

---
