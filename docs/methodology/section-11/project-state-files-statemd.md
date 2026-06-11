---
sidebar_position: 6
title: "Project State Files (STATE.md)"
description: "CLAUDE.md tells a fresh agent *how* this project works. ROADMAP.md tells the agent *where* the project is going."
---


CLAUDE.md tells a fresh agent *how* this project works. ROADMAP.md tells the agent *where* the project is going. Memory files tell the agent *what was learned*. None of these answer the most operational question a fresh session needs answered first: *what is happening right now?*

`STATE.md` fills that gap. It is a short, project-root file (~30-50 lines) that captures the current state of work in a form a fresh agent can read in 30 seconds and immediately know:

- Which milestone is in flight, and how far through it.
- What the last shipped artifact was (commit SHA, task number, ADR).
- What is currently blocked, and on what.
- What the next dispatch will work on.
- Pointers to the canonical documents (CLAUDE.md, ROADMAP.md, current plan, memory MEMORY.md).

**Why STATE.md is a peer artifact, not a memory file.**

Memory files live in `~/.claude/projects/<path>/memory/` — outside the repository, untracked by git, invisible to a fresh `ls`. They serve a different purpose: durable observations that should travel across machines and survive `git clone`. STATE.md belongs in the project root because it answers "what's the current frame of work?" — a question the answer to which changes weekly, must travel with the code, and must be visible in the project tree without spelunking.

Updating STATE.md is part of finishing a development branch. The `/finish` skill in Section 3.1 includes a STATE.md update step: when a feature lands, the "Last shipped" line, the "Current focus" line, and the "Blockers" list are revised. A repository where STATE.md says "M3 Task 4 in flight" but the most recent commit shipped Task 8 is broken state — the same way a Docusaurus page that contradicts the code is broken state.

**What STATE.md is not.**

- Not a daily journal. The cadence is per-shipped-artifact, not per-day. A project where seven tasks land in one day generates one STATE.md update, not seven.
- Not a substitute for ROADMAP.md. ROADMAP.md describes the *shape* of the work (milestones, phases, decision history). STATE.md describes the *position* within that shape.
- Not a substitute for the plan document. A plan describes the tasks and their dependencies. STATE.md says which task in that plan is in flight.
- Not a substitute for memory files. Memory captures durable lessons; STATE captures ephemeral position.

**The orientation budget.**

A fresh agent's first 30 seconds of a session set the trajectory of the whole conversation. CLAUDE.md gives architectural context. STATE.md gives operational context. Together, they answer "what does this project do, and what is happening in it right now?" without the agent having to run `git log`, scan the file tree, or guess from PR descriptions. The orientation budget is finite — every minute spent inferring context is a minute not spent producing useful work.

The canonical STATE.md template, with examples from each of the active S4U projects, is in [Appendix J](../appendix-j-state-md).

---
