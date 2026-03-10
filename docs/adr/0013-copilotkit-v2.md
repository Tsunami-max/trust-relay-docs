---
id: 0013-copilotkit-v2
sidebar_position: 14
title: "ADR-0013: CopilotKit v2 Migration"
---

# ADR-0013: CopilotKit v2 Migration

| | |
|---|---|
| **Date** | 2026-02-01 |
| **Status** | `Accepted (supersedes [ADR-0004](./0004-copilotkit-v1.md))` |
| **Deciders** | Adrian Birlogeanu |

## Context

CopilotKit v1 had serial event ordering bugs (#2622, #2684) causing race conditions in AG-UI state synchronization.

## Decision

Migrate to CopilotKit v2 APIs. Register agents server-side in `CopilotRuntime`. Use inline `CopilotChat` for case detail, `CopilotPopup` for dashboard and portal.

## Rationale

- v2 resolves serial event ordering bugs
- Server-side agent registration is cleaner
- Inline chat provides better UX in case detail
- Context passed via `useCopilotReadable` hooks

## Consequences

- Breaking API change from v1
- All agent registrations moved to `frontend/src/app/api/copilotkit/route.ts`
- v1 code fully removed
