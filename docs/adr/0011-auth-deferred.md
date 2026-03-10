---
id: 0011-auth-deferred
sidebar_position: 12
title: "ADR-0011: Authentication Deferred"
---

# ADR-0011: Authentication Deliberately Deferred

| | |
|---|---|
| **Date** | 2025-12-15 |
| **Status** | `Accepted (superseded by Pillar 0 implementation)` |
| **Deciders** | Adrian Birlogeanu |

## Context

PoC needs to demonstrate core compliance workflow without authentication overhead.

## Decision

Defer authentication implementation. Use `DEMO_USER` constant for all officer operations. `get_current_user()` returns demo user in PoC mode, Keycloak JWT in production mode.

## Rationale

- Authentication is orthogonal to compliance workflow PoC
- Enables rapid development without auth infrastructure
- `get_current_user()` abstraction allows transparent migration
- Pillar 0 design includes full Keycloak + RBAC implementation

## Consequences

- No multi-user support in PoC
- No tenant isolation until Pillar 0
- `get_current_user()` function signature already supports JWT path
