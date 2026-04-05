---
sidebar_position: 1
title: "Design Before Code"
description: "Every non-trivial change follows a mandatory pipeline: brainstorm, design specification, implementation plan, then execution"
---

# Design Before Code

**What:** Every non-trivial change follows a mandatory pipeline: brainstorm (explore the problem space) → design specification (commit to an approach with rationale) → implementation plan (decompose into ordered tasks) → execution (write code against the plan). No code is written until a design exists.

**Why:** AI code generation is fast. This is both its strength and its primary risk. Without a design phase, AI-assisted development degenerates into a pattern where plausible-looking code is produced quickly, reviewed superficially, and committed — only to require rework when integration reveals that the approach was wrong, the scope was misunderstood, or the edge cases were not considered.

The failure mode is not that the code doesn't work in isolation. It typically does. The failure mode is that it solves the wrong problem, or solves the right problem in a way that creates downstream incompatibilities. A 200-line design document that forces the architect to articulate the problem, evaluate alternatives, and commit to a specific approach before any code exists eliminates this class of error. The cost is 30-60 minutes of design time. The savings are measured in days of rework avoided.

There is a second, subtler benefit. Design documents become context for the AI collaborator. When Claude receives a design specification before writing code, the implementation is architecturally aligned on the first attempt rather than the third. The design document is not just a communication artifact for humans — it is a prompt engineering artifact that dramatically improves AI output quality.

**Evidence:** Trust Relay has 17 Architecture Decision Records with supersession tracking. One ADR (ADR-0008, raw SQL via `text()`) was superseded by ADR adoption of the ORM Repository pattern — an intentional, documented evolution, not a failure. Zero major architectural rewrites occurred after the design-before-code practice was adopted. Before this practice was established (early commits), the codebase went through two significant refactoring cycles that would have been avoided by a 30-minute design session. See the [Evidence appendix](../evidence/trust-relay-metrics) for the full ADR inventory.

**How:** The Superpowers plugin provides three skills that govern this pipeline:

1. **`brainstorming`** — Structured problem exploration. Produces a problem statement, constraint analysis, and 3+ candidate approaches with tradeoffs. Output is a conversation, not a document. Its purpose is to prevent premature commitment to the first approach that seems reasonable.

2. **`designing`** — Converts brainstorm output into a formal specification. Uses the project's design doc template (audience, problem statement, design decisions table, data flow, API contracts, error handling, testing strategy). The specification is committed to `docs/` before any implementation begins.

3. **`planning`** — Decomposes the design specification into an ordered list of implementation tasks. Each task specifies inputs, outputs, acceptance criteria, and estimated complexity. Tasks are sized to be completable in a single agent session (typically 15-60 minutes of implementation).

:::info When to skip the pipeline
The pipeline is not mandatory for trivial changes (typo fixes, configuration updates, single-line bug fixes). The threshold is judgment-based: if you can fully hold the change and all its implications in your head, skip the pipeline. If you cannot, the pipeline is cheaper than the rework.
:::

For deeper treatment of ADR practices, see the [ADR Standard](../standards/adr-standard).
