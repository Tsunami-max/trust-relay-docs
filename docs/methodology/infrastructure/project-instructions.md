---
sidebar_position: 3
title: "Project Instructions"
description: "**What:** Project instructions live in `PROJECT/CLAUDE.md` and `PROJECT/.claude/settings.json`."
---


**What:** Project instructions live in `PROJECT/CLAUDE.md` and `PROJECT/.claude/settings.json`. They provide the AI with everything it needs to work effectively in a specific codebase: the technology stack, architecture, build commands, testing conventions, data flow, coverage targets, and known constraints.

**Why:** The AI collaborator has no prior knowledge of any specific project. Without project instructions, every session begins with the AI guessing at conventions, proposing approaches that conflict with established patterns, and generating code that uses the wrong database access pattern, the wrong test framework configuration, or the wrong directory structure. Project instructions eliminate this cold-start problem by giving the AI the same context that a human developer would acquire during their first month on the project.

The value of project instructions compounds over time. As the project grows, the instructions grow to reflect new patterns, new constraints, and new architectural decisions. A project CLAUDE.md that accurately describes a 144,821-line codebase with 233 endpoints saves significant time per session because the AI does not need to discover the architecture through exploration — it starts with the map.

**What belongs here:**

| Category | Example | Rationale |
|---|---|---|
| Tech stack | Python 3.11+, FastAPI, Pydantic v2, Next.js 16, React 19 | AI needs to know which libraries and versions to use |
| Architecture overview | 9-step data flow, case status state machine | Structural context that shapes every implementation decision |
| Build & run commands | `cd backend && uvicorn app.main:app --port 8002 --reload` | AI must be able to start, test, and verify the system |
| Testing rules | `asyncio_mode=auto`, no `@pytest.mark.asyncio` needed | Framework-specific conventions that prevent common errors |
| Coverage targets | 90% for workflow layer, 70% for all other layers | Quality thresholds enforced by tooling |
| Directory structure | `app/api/`, `app/services/`, `app/models/`, `app/workflows/` | Navigation context — where to put new code and where to find existing code |
| Known constraints | `CAST(:param AS jsonb)` not `::jsonb` for asyncpg | Hard-won knowledge that prevents recurring bugs |
| Not-yet-implemented | List of features planned but not built | Prevents AI from assuming a feature exists when it does not |
| Hook definitions | Stop hook with verification prompt | Quality gates specific to this project's risk profile |

**What does NOT belong here:**

- Generic coding style rules (indentation, naming conventions) — these are handled by linters and formatters configured in the project.
- Rules that apply to all projects — these belong in global CLAUDE.md.
- Ephemeral information (current sprint tasks, today's debugging context) — these belong in memory files, not in project instructions.

**Evidence:** Trust Relay's CLAUDE.md describes 40 API router files, 102 service modules, 43 ORM models, and the complete 9-step compliance workflow data flow. This level of detail means that when Claude is asked to add a new API endpoint, it immediately knows to follow the split-router pattern (`case_crud.py`, `case_decisions.py`, etc.), use `Depends(get_current_user)` for authentication, and place business logic in a service module rather than in the router. Without this context, each of these decisions would need to be specified per-request or discovered through code exploration. See [appendix-f-evidence.md](../appendix-f-evidence) for the full codebase scale metrics.

**How:** See `templates/project-claude.md` for a parameterized template with `{{PLACEHOLDER}}` syntax. The setup guide (Step 5) walks through filling in the template for a new project. For existing projects with a CLAUDE.md, the setup guide proposes a merged version that preserves existing content.

---
