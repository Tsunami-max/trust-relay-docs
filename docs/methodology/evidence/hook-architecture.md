---
sidebar_position: 2
title: "Hook Architecture"
description: "**What:** Claude Code hooks are automated actions triggered at specific points in the development flow."
---


**What:** Claude Code hooks are automated actions triggered at specific points in the development flow. They execute without developer intervention and provide the structural enforcement that makes quality gates automatic rather than voluntary.

**Why:** Without hooks, quality checks depend on the developer (or AI) remembering to run them. This is the discipline-based quality model that Section 2.4 identified as fragile. Hooks convert "remember to lint" into "linting happens automatically." The developer cannot forget because the hook does not depend on the developer's memory.

**Hook Types:**

Claude Code supports three hook trigger points:

**PreToolUse** — fires before a tool is invoked. Use for validation, permission checks, or context injection before an action occurs.

Example: A PreToolUse hook on the `Write` tool could verify that the target file is not a protected configuration file before allowing the write.

**PostToolUse** — fires after a tool completes. Use for validation, formatting, or quality checks after an action has occurred.

Example: A PostToolUse hook on file edit tools runs the linter on the edited file, providing immediate feedback on any issues introduced by the edit. This is how Layer 1 (post-edit linting) is implemented.

**Stop** — fires when the AI is about to conclude its response. Use for completion verification — ensuring that claims of completion are backed by evidence.

Trust Relay's Stop hook implementation:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Before completing: Have you verified with actual command output that (1) all relevant tests pass, (2) ruff check has zero errors on changed files, (3) pyright has zero errors on changed files, and (4) TypeScript compiles with zero errors if frontend was changed? If any of these were NOT verified, run them now before completing."
          }
        ]
      }
    ]
  }
}
```

This prompt fires every time Claude is about to finish a response. It asks four specific questions, each requiring verifiable evidence. If any check was skipped, the hook redirects Claude to perform the verification before concluding. The prompt is not a suggestion — it is a structural gate that makes unverified completion claims difficult to produce.

**Hook implementation patterns:**

Hooks can be implemented as:

- **Prompt hooks** (`"type": "prompt"`) — inject a prompt into the conversation at the trigger point. The AI processes the prompt and responds to it. This is the mechanism used by the Stop hook.
- **Command hooks** (`"type": "command"`) — execute a shell command at the trigger point. The command's output is injected into the conversation. This is the mechanism used by post-edit linting hooks.

Hooks are configured in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global-level). Project-level hooks take precedence when both exist for the same trigger point.

**Evidence:** Trust Relay's project `.claude/settings.json` contains one Stop hook with a 4-point verification prompt. This hook has been active throughout the development of the 144,821-line codebase and fires on every task completion. The prompt's specificity matters — it does not ask "did you verify?" (which the AI would answer "yes" without checking). It asks for four specific types of verification output, each independently verifiable. The global `settings.json` configures `defaultMode: dontAsk` with 33 explicit permission entries, which is a related but distinct mechanism — permission hooks that eliminate confirmation prompts for validated tools while maintaining security boundaries for unvalidated ones. See [appendix-e-hooks.md](../appendix-e-hooks) for the full hook specification and implementation templates.

---
