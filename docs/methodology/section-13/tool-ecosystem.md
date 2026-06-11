---
sidebar_position: 0
title: "Tool Ecosystem"
description: "The methodology integrates plugins, MCP servers, and skills into a unified tool stack."
---


The methodology integrates plugins, MCP servers, and skills into a unified tool stack. Tool selection is capability-based (see [appendix-i-tool-selection.md](../appendix-i-tool-selection)).

### Essential Plugins

| Plugin | Purpose | Install |
|--------|---------|---------|
| Superpowers | Lifecycle skills (brainstorm, plan, execute, review) | `/plugin superpowers` |
| code-review | Multi-agent PR review (5 parallel Sonnet agents) | `/plugin code-review` |
| code-simplifier | Code bloat detection (3 review agents) | `/plugin code-simplifier` |

### Recommended Plugins (stack-dependent)

| Plugin | Purpose | When |
|--------|---------|------|
| typescript-lsp | Real-time TypeScript diagnostics | Frontend projects |
| pyright-lsp | Real-time Python type diagnostics | Python projects |
| Serena | Symbol-level code navigation | Medium/small context models, complex refactoring |

### MCP Servers

| Server | Purpose | When |
|--------|---------|------|
| Context7 | Up-to-date library documentation | All projects |
| Temporal MCP | Natural-language workflow management | Temporal-based projects |
| Neo4j MCP | Graph database queries via natural language | Neo4j-based projects |
| Sequential Thinking | Structured reasoning capture | Low-reasoning models, audit trail requirements |

### Cross-Tool Compatibility

AGENTS.md (symlinked to CLAUDE.md) provides cross-tool compatibility with Cursor, Copilot, Codex, Gemini CLI, and 60K+ projects under the Linux Foundation's Agentic AI Foundation standard.

```bash
ln -sf CLAUDE.md AGENTS.md
```

---
