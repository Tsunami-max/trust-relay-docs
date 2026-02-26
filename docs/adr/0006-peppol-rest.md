---
id: 0006-peppol-rest
sidebar_position: 7
title: "ADR-0006: PEPPOL REST API"
---

# ADR-0006: PEPPOL Verify as Synchronous REST API

| | |
|---|---|
| **Date** | 2026-02-20 |
| **Status** | `Accepted` |
| **Deciders** | Adrian Birlogeanu |

## Context

The PEPPOL OSINT Verification Service needs to verify Belgian enterprise identity data against KBO/BCE, EU VIES, and the PEPPOL Directory. The existing Trust Relay architecture uses Temporal for long-running compliance workflows with human-in-the-loop decision making.

Three deployment patterns were considered:

1. A Temporal workflow (like the existing KYB compliance flow)
2. A synchronous REST API endpoint within the existing FastAPI app
3. A standalone microservice

## Decision

Implement PEPPOL Verify as a **synchronous REST API** mounted on the existing FastAPI application under the `/v1/peppol/` namespace, with its own authentication layer (API key via `X-API-Key` header) and rate limiting.

### Why not Temporal?

PEPPOL Verify is stateless and idempotent -- no multi-step workflow, no human-in-the-loop, no waiting for external signals. All external calls (KBO, VIES, PEPPOL Directory) complete in under 2 seconds total. Temporal's value (durable execution, retry policies, signal/query) adds overhead without benefit here.

### Why not a separate microservice?

For PoC, a separate service adds deployment complexity without architectural benefit. The service shares infrastructure (PostgreSQL, MinIO, configuration patterns). The `/v1/peppol/` prefix provides clean namespace isolation. Extraction to a standalone service is straightforward if needed at scale.

### Why synchronous?

Target response time is under 2 seconds -- all three external calls run concurrently via `asyncio.gather()`. The async webhook (`callback_url`) mode returns 202 and delivers results later, providing flexibility for fire-and-forget clients.

### No LLM involvement

The entire pipeline is deterministic: API lookups, string matching (Jaro-Winkler), rule evaluation, and structured output. Zero inference cost, zero hallucination risk -- every data point is cited from an authoritative source.

## Consequences

### Positive

- Sub-2-second response times through concurrent upstream calls.
- Deterministic, auditable results with no AI inference variability.
- Shared infrastructure reduces operational overhead for PoC.
- Clean namespace isolation (`/v1/peppol/`) makes future extraction trivial.

### Negative

- PEPPOL Verify shares the FastAPI process and its resource limits (acceptable for PoC volumes).
- Rate limiting is in-memory (lost on restart) -- production would use Redis or an API gateway.

### Neutral

- API key authentication is separate from the existing case management auth (no portal tokens).
- If PEPPOL verification volumes grow independently, the router can be extracted into a standalone FastAPI service with minimal code changes.

## Alternatives Considered

### Temporal workflow

Rejected because the verification pipeline is stateless and completes in under 2 seconds. Temporal's durable execution primitives add latency and operational cost without providing value for a linear, idempotent pipeline.

### Standalone microservice

Rejected for PoC phase due to deployment complexity. The namespace isolation of `/v1/peppol/` provides equivalent API boundary separation without the infrastructure overhead.
