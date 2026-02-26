---
id: 0002-temporal-sdk
sidebar_position: 3
title: "ADR-0002: Temporal Python SDK"
---

# ADR-0002: Temporal for Workflow Orchestration

| | |
|---|---|
| **Date** | 2026-02-20 |
| **Status** | `Accepted` |
| **Deciders** | Adrian (Trust Relay), Claude Code |

## Context

The Trust Relay compliance workflow is inherently stateful and iterative. A single compliance case may loop through document collection, OSINT investigation, and officer decision multiple times (up to 5 iterations over a 60-day window) before reaching a terminal state (APPROVED, REJECTED, or ESCALATED).

The workflow must:

- Survive process restarts without losing state
- Enforce timeouts on customer document submission
- Maintain a complete audit trail of every state transition
- Pause indefinitely for human-in-the-loop decisions from compliance officers

These requirements go well beyond what a simple task queue can provide.

## Decision

Use the **Temporal Python SDK** for all compliance case workflow orchestration. Each case is represented as a single long-running Temporal workflow (`ComplianceCaseWorkflow`).

- Human decisions are delivered via Temporal **signals** (`officer_decision`, `documents_submitted`)
- Workflow state is exposed to the REST API via Temporal **queries** (`get_status`)
- Document submission timeouts are implemented as Temporal **timers** inside the workflow -- no external cron jobs required

## Consequences

### Positive

- **Durable execution**: Temporal persists workflow state to its database. Process crashes, deployments, and infrastructure interruptions do not lose in-flight workflows.
- **Signal and query primitives** are a natural fit for human-in-the-loop: the workflow simply waits on a signal channel with an optional timer, requiring no polling or external state storage for pending decisions.
- **Time-skipping test environment** (`WorkflowEnvironment.start_time_skipping()`) allows 60-day timer workflows to be tested in milliseconds without `time.sleep()` or fake clock libraries.
- **Automatic retry policies** on activities handle transient failures in Docling document conversion and OSINT API calls without custom retry logic.
- **Built-in timers** replace the need for a separate cron job or scheduled task system.

### Negative

- Requires a running Temporal server as additional infrastructure (Docker container in development, managed cluster or self-hosted in production).
- Temporal concepts (workflows, activities, signals, queries, task queues) have a learning curve for engineers unfamiliar with durable execution models.
- Local development environment is more complex: both the FastAPI process and a separate Temporal worker process must run simultaneously.

### Neutral

- The Temporal Python SDK is mature and production-ready, but the Python SDK lags behind the Go SDK in some advanced features.
- Workflow versioning (`workflow.patched()`) must be applied carefully when modifying long-running workflow code to avoid breaking in-flight workflows.

## Alternatives Considered

### Celery

Celery is a task queue, not a durable workflow engine. It has no built-in concept of durable state, signals, or queries. Implementing a multi-iteration human-in-the-loop loop with Celery would require external state storage (Redis or PostgreSQL), custom signaling logic, and manual retry management -- effectively rebuilding Temporal's core features at higher cost and lower reliability.

### Custom State Machine (pure Python + PostgreSQL)

A hand-rolled state machine persisted in PostgreSQL provides no fault tolerance for in-progress transitions. Crashes during a state transition leave the database in an inconsistent state. There is no built-in timer primitive, no retry mechanism, and no audit log -- all of which must be built from scratch, significantly expanding scope and risk.

### AWS Step Functions

Step Functions introduces hard vendor lock-in to AWS, conflicting with the project's MinIO-based (S3-compatible) portability goal. The Python developer experience for Step Functions (state machine definitions in JSON/YAML, Lambda packaging per step) is significantly worse than writing native Python workflows. Local development and testing require AWS credentials or LocalStack, adding complexity.
