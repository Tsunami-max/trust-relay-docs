---
sidebar_position: 5
title: "MCP Server Integration"
description: "Serena for semantic code analysis and Context7 for library documentation lookup — extending Claude's capabilities via MCP"
---

# MCP Server Integration

Model Context Protocol (MCP) servers extend Claude's capabilities beyond its built-in tools. The methodology integrates two MCP servers that address specific limitations of AI-assisted development: incomplete code understanding and stale library documentation.

---

## Serena — Semantic Code Analysis

**What:** Serena provides symbol-level code navigation — the ability to find, read, and modify code by semantic meaning (function names, class definitions, method signatures) rather than by file path and line number.

**Why:** Claude's built-in file tools (`Read`, `Grep`, `Glob`) operate at the text level. Reading a 500-line file to find a single method definition wastes context window capacity. Grepping for a function name returns every reference (calls, imports, comments) when only the definition is needed. Serena's `find_symbol` and `get_symbols_overview` provide token-efficient code exploration — read the symbol body, not the entire file.

**How it enhances development:**

- **`find_symbol`** — locates a symbol definition by name across the codebase. Returns the file path, line range, and symbol body. One call replaces the sequence: Grep for the name, Glob for likely files, Read each file until the definition is found.
- **`get_symbols_overview`** — returns all symbols in a file or directory as a structured tree (classes, methods, functions, variables). This provides a navigation map without reading file contents.
- **`find_referencing_symbols`** — finds all code that references a given symbol. Essential for safe refactoring — before renaming a method, find every call site.
- **`replace_symbol_body`** — replaces the implementation of a specific symbol without touching the rest of the file. Reduces the risk of accidental edits to adjacent code.

Serena is particularly valuable in large codebases. Trust Relay's 237 Python files and 304 TypeScript files contain thousands of symbols. Text-level navigation in a codebase of this scale is slow and error-prone. Symbol-level navigation is precise and token-efficient.

---

## Context7 — Library Documentation Lookup

**What:** Context7 provides real-time lookup of library documentation — API references, usage examples, and changelog information for the specific version of a library in use.

**Why:** Claude's training data has a knowledge cutoff. Libraries evolve after that cutoff: APIs change, new methods are added, deprecated methods are removed. Without current documentation, Claude generates code using APIs that no longer exist or miss new APIs that would be more appropriate. The result is code that looks correct (it matches Claude's training data) but fails at runtime because the installed library version has a different API.

Context7 resolves this by providing Claude with the actual documentation for the installed library version. When Claude needs to use a PydanticAI method, a Temporal SDK function, or a Next.js API, Context7 provides the current documentation rather than relying on potentially stale training data.

**How it enhances development:**

- Prevents hallucinated API calls — Claude looks up the actual method signature instead of guessing from training data
- Provides version-specific documentation — the docs match the library version in the project's dependency file
- Reduces debugging time for API usage errors — correct usage on the first attempt instead of trial-and-error

Both MCP servers are configured at the global level (`~/.claude/settings.json`) and are available in all projects.
