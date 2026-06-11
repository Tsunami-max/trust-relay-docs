---
sidebar_position: 3
title: "What NOT to Save"
description: "**What:** Not everything belongs in memory. Saving too much creates noise that dilutes the signal of genuinely important persistent knowledge."
---


**What:** Not everything belongs in memory. Saving too much creates noise that dilutes the signal of genuinely important persistent knowledge. Memory should contain judgment calls and context — things the AI cannot derive from the code itself.

**Do not save:**

| Category | Why Not | Where It Lives Instead |
|---|---|---|
| Code patterns | Readable from the source code directly. Memory about code drifts as code changes. | The code itself. Reference memory can document *why* a pattern exists but should not duplicate the implementation. |
| Git history | Accessible via `git log`. Duplicating commit history in memory wastes context. | Git. |
| Debugging session details | Ephemeral. The specific port conflict or import error from Tuesday's debugging session has no lasting value. | Nowhere — let it go. |
| Test commands | Documented in CLAUDE.md (project instructions). | CLAUDE.md's testing section. |
| File-level documentation | Belongs in code comments, docstrings, or README files co-located with the code. | The source files themselves. |
| Current task status | Changes too rapidly. By the time memory is read in the next session, the status is stale. | Conversation context within the current session. |

**The filtering principle:** Before writing a memory, ask: "If Claude starts a fresh session tomorrow and does NOT have this information, what will go wrong?" If the answer is "nothing — it can figure this out from the code or CLAUDE.md," do not create a memory file. If the answer is "it will repeat a mistake we already corrected" or "it will propose an approach we already rejected," create the memory.

**Evidence:** Trust Relay's memory system has 27 files, not 270. The memory system is selective. It captures decisions (why we chose Temporal over Celery), preferences (always use Alembic), corrections (never blanket-delete MinIO), and state (which pillars are complete). It does not capture code snippets, debugging logs, or test output. The result is a memory corpus that Claude can read in full at session start without consuming excessive context window — the hub file (MEMORY.md) stays under 200 lines because it links to topic files rather than inlining everything.

---
