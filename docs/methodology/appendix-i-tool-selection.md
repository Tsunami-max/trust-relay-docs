---
sidebar_position: 18
title: "Appendix I: Plugin & Tool Selection Guide"
description: "The S4U methodology prescribes tools by **capability threshold**, not by model name. Model names change quarterly."
---


## Overview

The S4U methodology prescribes tools by **capability threshold**, not by model name. Model names change quarterly. Capability thresholds are durable.

This appendix provides the decision framework for selecting plugins, MCP servers, and skills based on the AI model's capabilities and the development phase.

---

## Capability Assessment

Before selecting tools, assess the AI model's capabilities:

| Capability | How to Assess | Threshold |
|-----------|---------------|-----------|
| **Context window** | Check model documentation | Large (>200K), Medium (50-200K), Small (&lt;50K) |
| **Internal reasoning** | Does the model have thinking/reasoning blocks? | Yes / No |
| **Tool reliability** | Can the model use tools (Read, Edit, Bash) without errors? | Reliable / Unreliable |
| **Multi-step planning** | Can the model decompose and execute 5+ step plans? | Yes / Needs guidance |
| **Code understanding** | Can the model read a 500-line file and modify precisely? | Full context / Needs navigation |

---

## Tool Recommendations by Capability

### Code Navigation

| Capability | Recommendation |
|-----------|---------------|
| Large context (>200K) | Read files directly. Serena optional for complex refactoring. |
| Medium context (50-200K) | Serena recommended for `find_symbol` and `get_symbols_overview`. |
| Small context (&lt;50K) | Serena required. Use `codebase-memory-mcp` for persistent code graph. |

### Reasoning Support

| Capability | Recommendation |
|-----------|---------------|
| Internal reasoning (thinking blocks) | No external reasoning tool needed. |
| No internal reasoning | Sequential Thinking MCP for structured multi-step reasoning. |
| Audit trail required | Store reasoning chains in database fields, not external tools. |

### Code Quality

| Layer | Tool | When |
|-------|------|------|
| Real-time | TypeScript LSP, Pyright LSP | During implementation |
| Pre-commit | ruff (lint), pyright (types), tsc (TypeScript) | Every commit |
| Security | Aikido plugin (SAST, secrets) | During development |
| PR review | code-review plugin (5 Sonnet agents) | Before merging |
| PR security | `claude-code-security-review` GitHub Action | On every PR |
| Post-merge | code-simplifier (bloat detection) | After major features |

---

## Tool Recommendations by Development Phase

### Brainstorm Phase

| Tool | Purpose | Capability Requirement |
|------|---------|----------------------|
| Visual companion (browser) | Mockups, diagrams | Any |
| Terminal discussion | Conceptual choices | Any |
| Architecture index lookup | Understand existing code | Any |

No code navigation tools needed — problem exploration doesn't need code access.

### Design Phase

| Tool | Purpose | Capability Requirement |
|------|---------|----------------------|
| Architecture index | Find relevant doc pages | Any |
| Serena `get_symbols_overview` | Understand existing interfaces | Medium/small context |
| Read tool | Read existing files directly | Large context |

### Plan Phase

| Tool | Purpose | Capability Requirement |
|------|---------|----------------------|
| Architecture index `tests:` field | Identify test files | Any |
| Architecture index `component_map` | Map files to tasks | Any |

### Implement Phase

| Tool | Purpose | Capability Requirement |
|------|---------|----------------------|
| Read / Edit / Bash | Direct file manipulation | Large context, reliable tools |
| Serena `find_symbol` / `replace_symbol_body` | Precise symbol editing | Medium/small context |
| TypeScript LSP | Frontend type checking | Any (if available) |
| Context7 | Library documentation lookup | Any (prevents hallucinated APIs) |
| Temporal MCP | Workflow debugging | Projects using Temporal |
| Neo4j MCP | Graph queries | Projects using Neo4j |

### Review Phase

| Tool | Purpose | Capability Requirement |
|------|---------|----------------------|
| code-review plugin | Multi-agent PR review | Any (uses Sonnet agents) |
| Domain-specific review agents | Compliance, security, API, migration | Project-specific |
| CodeRabbit | External AI review perspective | Optional (free tier) |

### Verify Phase

| Tool | Purpose | Capability Requirement |
|------|---------|----------------------|
| Stop hook | Verify quality checks ran | Any |
| Architecture index `tests:` | Verify RIGHT tests ran | Any |
| ruff / pyright / tsc | Lint + type check | Any |
| Aikido | Security scan | Any (if configured) |

---

## Plugin Stack Reference

### Essential (install for every project)

| Plugin | Install Command | Purpose |
|--------|----------------|---------|
| Superpowers | `/plugin superpowers` | Lifecycle skills |
| code-review | `/plugin code-review` | Multi-agent PR review |
| code-simplifier | `/plugin code-simplifier` | Code bloat detection |

### Recommended (install based on stack)

| Plugin | Install Command | When |
|--------|----------------|------|
| typescript-lsp | `/plugin typescript-lsp` | Frontend projects |
| pyright-lsp | `/plugin pyright-lsp` | Python projects |
| Serena | `/plugin serena` | Large codebases, medium/small context models |

### MCP Servers (configure based on stack)

| Server | Package | When |
|--------|---------|------|
| Context7 | Built-in | All projects (library docs) |
| Temporal MCP | `temporal-mcp` | Projects using Temporal |
| Neo4j MCP | `@johnymontana/neo4j-mcp` | Projects using Neo4j |
| codebase-memory-mcp | `codebase-memory-mcp` | Large codebases, token optimization |

---

## Cross-Tool Compatibility

### AGENTS.md

The Linux Foundation's Agentic AI Foundation standard. A symlink to CLAUDE.md provides cross-tool compatibility:

```bash
ln -sf CLAUDE.md AGENTS.md
```

Read by: Cursor, Copilot, Codex, Gemini CLI, Jules, VS Code, and 60K+ projects.

### Adoption Tier Impact

| Tier | Plugins | MCP Servers |
|------|---------|-------------|
| **Core** | Superpowers, code-review | Context7 |
| **Recommended** | + code-simplifier, LSP plugins | + stack-specific (Temporal, Neo4j) |
| **Full** | + Serena, Aikido | + codebase-memory-mcp |

---

## Competitive Landscape (March 2026)

| Methodology/Framework | Strengths | S4U Advantage |
|-----------------------|-----------|---------------|
| **EY.ai PDLC** | Enterprise scale, 80x speed claims | More developer-focused, regulatory integration |
| **Xebia ACE** | Fully agentic, persona-driven | Memory system, quality gates, compliance |
| **Microsoft AI-Native** | Good planning, 6 AI agents | Architecture-as-Code, documentation-first |
| **Addy Osmani Workflow** | Practical, AI-on-AI reviews | Formalized methodology, not individual tips |
| **AGENTS.md Standard** | Cross-tool, 60K+ projects | S4U is compatible via symlink |

S4U is the only published methodology combining: memory systems + subagent patterns + quality gates + regulatory compliance + Architecture-as-Code + capability-based tool prescription.
