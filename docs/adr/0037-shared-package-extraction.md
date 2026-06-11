---
id: 0037-shared-package-extraction
sidebar_position: 38
title: "ADR-0037: Shared Package Extraction"
---

# ADR-0037: Shared Python Packages for Atlas Integration

**Status:** Accepted
**Date:** 2026-04-11

## Context

Two independent TrustRelay implementations exist within the same organization:

- **Atlas** (Valentin) -- schema-driven workflow engine, entity resolution, risk matrix with SHA-256 audit. ~219 Python files, LangChain/LangGraph, BlueprintJS.
- **Workflow** (Adrian) -- 12-country registries, evidence bundles, PII encryption, GoAML export, CopilotKit. 150+ Python files, PydanticAI, Next.js/shadcn.

The UltraAtlas merge strategy identifies Atlas as the architectural base and Workflow as the feature donor. Sharing code between them requires a mechanism that lets Atlas consume Workflow features without coupling to its framework, preserves Workflow's ability to develop independently, and creates a compile-time contract between the codebases.

Three approaches were considered: copy-paste portability (zero setup, but divergence and no typed contract), git submodules (separate versioning, but submodule friction and multi-repo overhead), and a monorepo with local editable packages.

## Decision

Extract Workflow's portable code into six standalone Python packages under `packages/` that Atlas can `pip install -e` as dependencies. Packages live in the same repo for immediate development feedback, with a clean upgrade path to private PyPI later.

Six packages with a clean dependency DAG:

```
trustrelay-pii         → (nothing)
trustrelay-models      → (nothing)
trustrelay-protocols   → models
trustrelay-registries  → models
trustrelay-compliance  → models
trustrelay-engines     → models, protocols
```

**Key design choices:**

1. **Each package is independently installable** -- its own `pyproject.toml`, `src/` layout (PEP 517), `py.typed` marker (PEP 561), and standalone test suite requiring no backend.

2. **Backend shim layer** -- existing backend files become one-line re-exports (`from trustrelay_models.case import *`), preserving all `from app.models.case import X` imports while the real code lives in the package. 49 shims were created across `app/models/` and `app/protocols/`; all 98 backend tests pass through them with zero import breakage. Shims are temporary scaffolding removed when migration completes.

3. **Portability analysis** -- a dependency manifest analyzed 198 backend modules: 154 (77%) are portable (no framework coupling) and candidates for future extraction; 44 (22%) are coupled to SQLAlchemy/Temporal and remain in `backend/` indefinitely.

At time of extraction: 124 source files, ~23,662 lines, 47 tests across the six packages.

## Consequences

### Positive
- Atlas can `pip install` Workflow features immediately
- Typed contracts and protocol interfaces prevent API drift between codebases
- New features become automatically available to both codebases
- Clean upgrade path to private PyPI when ready

### Negative
- Temporary code duplication during migration (shims)
- Package maintenance overhead (six `pyproject.toml` files)
- Import transformation needed when moving files into packages

### Risks
- Wildcard `import *` does not export underscore-prefixed names -- mitigated by explicit imports in shims where needed
- Package dependency versions may diverge from the backend -- mitigated by editable installs pointing to the same source
