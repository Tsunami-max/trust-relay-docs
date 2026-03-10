---
id: 0009-silent-recovery
sidebar_position: 10
title: "ADR-0009: Minimal Error Handling"
---

# ADR-0009: Minimal Error Handling with Silent Recovery

| | |
|---|---|
| **Date** | 2025-12-15 |
| **Status** | `Accepted` |
| **Deciders** | Adrian Birlogeanu |

## Context

PoC needs a consistent error handling strategy that doesn't over-engineer edge cases but keeps the system running.

## Decision

Adopt "guard-and-swallow" pattern: features gated by config flags return empty/default results when disabled. Exceptions in non-critical paths are logged at DEBUG level and swallowed.

## Rationale

- New pillar features should never break existing functionality
- Config flags enable gradual rollout
- DEBUG-level logging preserves diagnostics without noise
- Appropriate for PoC -- production would add structured error reporting

## Consequences

- Silent failures possible if logging is not monitored
- Must upgrade to structured error handling before production
