---
id: 0005-state-snapshot
sidebar_position: 6
title: "ADR-0005: STATE_SNAPSHOT"
---

# ADR-0005: STATE_SNAPSHOT over STATE_DELTA for AG-UI Events

| | |
|---|---|
| **Date** | 2026-02-20 |
| **Status** | `Accepted` |
| **Deciders** | Adrian (Trust Relay), Claude Code |

## Context

The AG-UI protocol defines two mechanisms for synchronizing agent state to the frontend:

| Mechanism | Payload | Client handling |
|---|---|---|
| `STATE_SNAPSHOT` | Full current state object | Replace entire client state |
| `STATE_DELTA` | RFC 6902 JSON Patch document | Apply incremental patch to existing state |

For the Trust Relay portal, agent state includes: the current case status, the active iteration number, the list of required documents and their upload status, and any follow-up questions from the officer. This state is relatively small (under 5KB) and changes infrequently (at human decision cadence, not sub-second).

## Decision

Emit `STATE_SNAPSHOT` AG-UI events (full state replacement) from the PydanticAI agent for all state synchronization in Tier 1 and Tier 2. Do not implement `STATE_DELTA` (RFC 6902 JSON Patch) unless state object size exceeds **50KB per update**, to be evaluated in Tier 3.

## Consequences

### Positive

- **Simple implementation**: Serialize the current state Pydantic model to JSON and emit it as a `STATE_SNAPSHOT` event. No patch generation logic required on the backend.
- **Trivial client handling**: Replace the entire state object on receipt. No RFC 6902 patch application library needed in the React frontend.
- **Desync impossible by design**: Every snapshot is authoritative and complete. There is no accumulated patch chain that can diverge if a delta event is missed or applied out of order.
- **Easy debugging**: Each `STATE_SNAPSHOT` event in the event stream is a complete, human-readable snapshot of agent state at that moment. No need to replay a sequence of patches to understand the current state.
- **Negligible bandwidth**: State objects in scope are typically under 5KB, making snapshot bandwidth negligible on any modern network connection.

### Negative

- Slightly more data transmitted per state update compared to a delta that describes only the changed fields. For the current state object size, this difference is negligible in practice.
- If state objects grow large in future tiers (e.g., embedding full document content or investigation reports in agent state), snapshot bandwidth could become a concern and trigger a migration to `STATE_DELTA`.

### Neutral

- The AG-UI protocol fully supports `STATE_SNAPSHOT` as a first-class event type; this is not a workaround or non-standard usage.
- Migration from `STATE_SNAPSHOT` to `STATE_DELTA` is a backend-only change (swap event emission logic). The client-side change is additive: add a JSON Patch application step.
- The `STATE_SNAPSHOT` approach is explicitly recommended by the AG-UI specification for implementations where state objects are small and simplicity is preferred over bandwidth optimization.

## Alternatives Considered

### STATE_DELTA (RFC 6902 JSON Patch)

Implementing `STATE_DELTA` requires a JSON Patch generation library on the backend, a JSON Patch application library on the React frontend, and careful sequencing to ensure patches are applied in order. If a delta event is missed (e.g., due to a dropped SSE connection and reconnect), the client state silently diverges from server state with no automatic recovery mechanism. For state objects under 5KB updated at human decision cadence, the bandwidth saving is immeasurable, making this complexity unjustifiable for Tier 1.
