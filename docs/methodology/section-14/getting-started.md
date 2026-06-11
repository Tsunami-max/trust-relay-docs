---
sidebar_position: 0
title: "Getting Started"
description: "This section provides the entry point for adopting the methodology."
---


This section provides the entry point for adopting the methodology. The full onboarding process is documented in the setup guide; this section provides orientation.

**Setup Guide:** `setup/SETUP-GUIDE.md` in the [s4u-methodology repository](https://github.com/Tsunami-max/s4u-methodology) (link omitted from synced docs since the file lives outside the consuming repo's tree).

The setup guide is a 10-step interactive onboarding process. Each step reads the developer's existing configuration before proposing changes, shows a diff of what would change, and waits for approval before applying. Nothing is overwritten — all changes are additive, and the process can be reversed by restoring from the recommended backup.

**Quick Start (2 Steps):**

For developers who want to evaluate the methodology before committing to the full setup:

1. Install the Superpowers plugin: `claude plugins install superpowers@superpowers-marketplace`
2. Add the Stop verification hook to `.claude/settings.json`

These two steps provide immediate value — lifecycle enforcement through skills and completion verification through the Stop hook — and can be expanded to the full 10-step setup after validation.

**Adoption Tiers:**

| Tier | Components | Value Provided |
|---|---|---|
| **Core** (non-negotiable for integration) | Testing standard (no-mocking, coverage targets), commit conventions, ADR format, RLS patterns, regulatory compliance requirements, living documentation (Docusaurus) | Integration compatibility — code produced under these standards integrates cleanly with the shared codebase |
| **Recommended** (strongly advised) | Agent definitions, memory file organization, hook scripts, MCP server integration | Development velocity and quality — proven valuable but divergence does not break integration |
| **Optional** (adopt if useful) | Permission mode (`dontAsk` vs default), effort level configuration, output style preferences | Team preference — customize to individual working style |

The tier classification allows incremental adoption. Start with Core for immediate integration compatibility, add Recommended as the value becomes apparent through use, and customize Optional to personal preference. The setup guide (Step 3) assesses the developer's existing configuration and recommends which components to add based on what already exists.

---
