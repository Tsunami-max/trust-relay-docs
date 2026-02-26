---
id: 0001-pydanticai-agui
sidebar_position: 2
title: "ADR-0001: PydanticAI + AG-UI"
---

# ADR-0001: PydanticAI + AG-UI + CopilotKit as AI Layer

| | |
|---|---|
| **Date** | 2026-02-20 |
| **Status** | `Accepted` |
| **Deciders** | Adrian (Trust Relay), Claude Code |

## Context

The Trust Relay compliance portal requires an AI layer to power the customer-facing chat widget in the document upload portal. Customers need guided assistance when uploading KYB/KYC documents, and the system must support real-time streaming responses to avoid blocking the user while the AI processes their queries.

The frontend is built on React with CopilotKit, which implements the AG-UI protocol for AI event streaming. The AI layer must therefore speak AG-UI natively, integrate cleanly with Pydantic v2 models already used throughout the backend, and remain type-safe enough for a compliance context where data integrity matters.

## Decision

Use **PydanticAI (v1.60+)** with its native AG-UI protocol support as the backend AI framework. Mount the agent via `AGUIAdapter` on the existing FastAPI backend. Consume the AG-UI SSE stream from the CopilotKit React components (`CopilotSidebar`, `useCoAgent`) in the customer portal frontend.

## Consequences

### Positive

- Native AG-UI protocol support via `AGUIAdapter` removes the need for custom event serialization code.
- Type-safe tool definitions via `RunContext` and `StateDeps` enforce correct data shapes at the Python type level.
- Single dependency for the entire AI layer; no separate orchestration library needed alongside the AI SDK.
- Deep Pydantic v2 integration means agent input/output models reuse the same Pydantic schemas as the rest of the API.
- Backed by the Pydantic team, ensuring long-term alignment with Pydantic v2 and FastAPI ecosystems.

### Negative

- PydanticAI is a newer library with a smaller community and fewer Stack Overflow answers compared to LangChain.
- Fewer third-party integrations and plugins available at this stage of the library's maturity.
- Any breaking changes in pre-1.0 releases (if applicable) may require migration effort.

### Neutral

- Requires PydanticAI v1.60 or later specifically for AG-UI protocol support; earlier versions lack `AGUIAdapter`.
- Team must learn PydanticAI's `RunContext` and `StateDeps` patterns, which differ from LangChain's chain abstractions.

## Alternatives Considered

### LangChain

Heavier dependency tree with many transitive packages. Agent definitions are less type-safe by default (heavy use of untyped dicts in chains). AG-UI protocol is not natively supported and would require a custom adapter layer, adding maintenance burden.

### Direct OpenAI SDK

The raw OpenAI SDK provides no AG-UI protocol support. Building event streaming, tool call handling, and state synchronization on top of the raw SDK would require significant custom infrastructure, duplicating what PydanticAI already provides.

### LangGraph

LangGraph adds another graph-based workflow orchestration layer on top of LangChain. The project already uses Temporal for durable workflow orchestration; introducing LangGraph would create two competing workflow engines with overlapping concerns, increasing operational complexity without a clear benefit.
