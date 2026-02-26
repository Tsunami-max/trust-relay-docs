---
id: 0003-agui-on-fastapi
sidebar_position: 4
title: "ADR-0003: AG-UI on FastAPI"
---

# ADR-0003: AGUIAdapter on FastAPI (Not Standalone AGUIApp)

| | |
|---|---|
| **Date** | 2026-02-20 |
| **Status** | `Accepted` |
| **Deciders** | Adrian (Trust Relay), Claude Code |

## Context

PydanticAI's AG-UI integration offers two deployment patterns for serving an AI agent over HTTP:

1. **`AGUIApp`** -- a standalone ASGI application that serves only the AG-UI SSE endpoint on its own port and process.
2. **`AGUIAdapter`** -- wraps the agent and exposes a `dispatch_request()` method that can be called from within any ASGI framework route handler.

The Trust Relay backend must serve both conventional REST API endpoints (case management, portal document upload) and the AG-UI SSE endpoint for the CopilotKit chat widget -- all from the same backend service. The choice of deployment pattern determines how these concerns are co-located.

## Decision

Mount PydanticAI's `AGUIAdapter.dispatch_request()` as a single FastAPI route (`POST /api/agent`) alongside the existing REST API routers. The AG-UI SSE endpoint shares the same FastAPI process, port (8002), middleware stack, and `app.state` as all other endpoints.

## Consequences

### Positive

- Single deployment artifact and single port (8002) for the entire backend, simplifying container configuration, reverse proxy rules, and CORS policy.
- The AG-UI endpoint inherits all FastAPI middleware automatically: CORS headers, authentication dependencies, request logging, and error handling apply uniformly.
- The Temporal client stored in `app.state` is directly accessible inside the AG-UI route handler, enabling the agent to signal workflows without inter-process communication.
- Simpler operational profile: one process to monitor, one health check endpoint, one log stream.

### Negative

- The AG-UI SSE endpoint shares FastAPI worker resources (thread pool, event loop) with REST API endpoints. A surge in concurrent AI chat sessions could affect REST API latency.
- Long-lived SSE connections occupy FastAPI worker slots for the duration of the AI response stream, which must be accounted for in server capacity planning.

### Neutral

- SSE streaming inside FastAPI requires returning a `StreamingResponse` with the correct `text/event-stream` content type. The `AGUIAdapter.dispatch_request()` method handles this, but the FastAPI route must be written as an async function and must not buffer the response.
- If the AG-UI endpoint requires independent scaling in a future tier, extraction to a standalone `AGUIApp` process is straightforward since the agent logic is fully encapsulated in the adapter.

## Alternatives Considered

### Standalone AGUIApp (separate process and port)

Running `AGUIApp` as a separate process on a separate port means the AI agent cannot directly access the Temporal client or any other state held in `app.state` of the main FastAPI process. Cross-process communication (shared Redis, HTTP calls between services, or duplicated Temporal client setup) would be required to bridge the two processes. This adds operational complexity, a second port to expose, and additional CORS configuration for an MVP where the scale does not justify service separation.

### Direct AG-UI server without PydanticAI

Implementing the AG-UI SSE protocol directly (without `AGUIAdapter`) requires manually constructing and serializing all AG-UI event types (`RUN_STARTED`, `TEXT_MESSAGE_START`, `TOOL_CALL_START`, `STATE_SNAPSHOT`, `RUN_FINISHED`, etc.), managing event ordering constraints, and implementing tool call dispatch. This duplicates the functionality PydanticAI already provides and would need to be maintained as the AG-UI spec evolves.
