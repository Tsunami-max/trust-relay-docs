---
id: 0004-copilotkit-v1
sidebar_position: 5
title: "ADR-0004: CopilotKit v1"
---

# ADR-0004: CopilotKit v1 API with v2 Migration Plan

| | |
|---|---|
| **Date** | 2026-02-20 |
| **Status** | `Accepted` |
| **Deciders** | Adrian (Trust Relay), Claude Code |

## Context

CopilotKit provides the React component layer for the AI chat widget embedded in the customer-facing document upload portal. Two API generations are available:

- **v1 API**: hooks (`useCoAgent`), components (`CopilotSidebar`, `CopilotChat`) -- battle-tested across production deployments.
- **v2 API**: hooks (`useAgent`) -- redesigned hook model with active, confirmed bugs at the time of this decision.

The v2 API has two open issues that directly affect the AG-UI event stream:

- **GitHub issue #2622**: Overlapping tool call events causing duplicate renders.
- **GitHub issue #2684**: Strict serial event ordering enforcement that rejects valid AG-UI event sequences emitted by PydanticAI's `AGUIAdapter`.

## Decision

Use the **CopilotKit v1 API** (`useCoAgent`, `CopilotSidebar`, `CopilotChat`) for the Tier 1 investor demo. Pin the CopilotKit npm package to a known-good v1 minor version in `package.json`. Plan migration to the v2 `useAgent` API in Tier 2 once issues #2622 and #2684 are resolved upstream. Re-evaluate migration readiness quarterly.

## Consequences

### Positive

- The v1 API is stable and has been validated against AG-UI event sequences in production. No backend workarounds are needed to satisfy CopilotKit's event ordering requirements.
- `CopilotSidebar` and `CopilotChat` provide complete, polished UI components out of the box, reducing frontend development time for the Tier 1 demo.
- The v2 API is designed as a superset of v1 concepts, so the migration path is clean: `useCoAgent` maps directly to `useAgent` with a props rename, and component APIs remain largely compatible.
- Pinning the version prevents accidental upgrades during `npm install` from introducing the known bugs.

### Negative

- The v1 API may be officially deprecated once v2 stabilizes, creating eventual mandatory migration pressure.
- Pinning a minor version means security patches and performance improvements in newer v1 patch releases require a deliberate, tested upgrade rather than automatic resolution.
- New CopilotKit features released only in v2 (e.g., improved state co-pilot patterns) will not be available in Tier 1.

### Neutral

- The CopilotKit version pin must be documented in `package.json` with an inline comment referencing this ADR and the upstream GitHub issues, so future engineers understand why the version is locked.
- A quarterly review cadence is added to the project backlog to check the status of issues #2622 and #2684 and determine if v2 migration can be advanced.

## Alternatives Considered

### CopilotKit v2 API immediately

Issues #2622 and #2684 are reproducible and unresolved at the time of this decision. Adopting v2 now would require backend workarounds -- specifically, artificially sequentializing all AG-UI events -- that add latency and complexity to the agent implementation and may need to be reverted once the bugs are fixed upstream.

### Direct AG-UI client (no CopilotKit)

CopilotKit provides a complete suite of chat UI components with accessibility, keyboard navigation, and mobile responsiveness built in. Replacing these with a custom AG-UI SSE client and custom chat UI components would consume significant frontend development time that is better spent on the compliance case dashboard for the Tier 1 demo.

### No AI chat widget

The AI chat widget is a key differentiator for the investor demo. Removing it reduces the perceived intelligence of the portal and eliminates the PydanticAI + CopilotKit integration story that is central to the product's positioning. The Tier 1 PRD explicitly includes the chat widget as an MVP feature.
