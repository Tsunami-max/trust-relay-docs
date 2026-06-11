---
sidebar_position: 4
title: "Staleness Management"
description: "**What:** Memory files are point-in-time observations, not live state."
---


**What:** Memory files are point-in-time observations, not live state. A memory written on day 10 that says "the codebase has 33 ORM models" may be wrong by day 20 when the count has grown to 43. The methodology treats all memory as potentially stale and requires verification before acting on specific claims.

**Why:** Stale memory is worse than no memory. If Claude has no memory of how many ORM models exist, it will check the code and get the correct answer. If Claude has a memory that says "33 ORM models" and trusts it without checking, it will give a confidently wrong answer. The memory gave the AI false confidence that prevented it from doing the verification it would have done without the memory.

This failure mode is especially dangerous for claims about file locations, line numbers, and specific counts. The memory says "the audit trail is implemented in `app/services/audit_service.py` at line 142." By the time Claude reads this memory, the function may have moved to line 189, the file may have been renamed, or the implementation may have been refactored entirely.

**Staleness management rules:**

1. **Verify before acting.** When a memory makes a specific factual claim (a count, a file path, a line number), verify it against the current code before using it in a response or an implementation. The memory provides a starting point for investigation, not a conclusion.

2. **Update stale memories.** When verification reveals that a memory is outdated, update the memory as part of the current task. This is not extra work — it is maintenance that prevents the same stale information from misleading future sessions.

3. **Distinguish stable from volatile claims.** Some memory content is stable: "we chose Temporal for workflow orchestration" is unlikely to change. Other content is volatile: "the codebase has 33 ORM models." Treat stable claims with higher trust and volatile claims with lower trust.

4. **Timestamp awareness.** Claude Code displays a staleness warning on memory files older than a configurable threshold: "This memory is N days old. Memories are point-in-time observations, not live state — claims about code behavior or file:line citations may be outdated. Verify against current code before asserting as fact." This warning is a structural reminder, not a suggestion.

**The key mental model:** A memory file that says "X exists" means "X existed when this memory was written." It does not mean "X exists now." The difference matters when the AI is about to import a module, call a function, or reference a file path based on memory. Verify first.

**Evidence:** Trust Relay's memory files include claims that have become stale over time — ORM model counts that increased from 33 to 43, migration counts that grew from 25 to 31, pillar progress that advanced. The staleness warning system (automatically added by Claude Code for older memories) has prevented incorrect responses based on outdated counts. The verify-before-acting rule is encoded in the memory file headers and reinforced by the system-reminder annotations that Claude Code injects. See [appendix-d-memory.md](../appendix-d-memory) for the full staleness management specification.

---
