---
id: 0010-react-usestate
sidebar_position: 11
title: "ADR-0010: React useState/useEffect"
---

# ADR-0010: React useState/useEffect for State Management

| | |
|---|---|
| **Date** | 2025-12-15 |
| **Status** | `Accepted (PoC)` |
| **Deciders** | Adrian Birlogeanu |

## Context

Need state management for Next.js frontend. Options: Redux, Zustand, React Query, or native React hooks.

## Decision

Use React `useState` and `useEffect` for all frontend state management. No external state management library.

## Rationale

- Simplest approach for PoC
- No additional dependencies
- Sufficient for current complexity level
- React 19 improvements make hooks more capable

## Consequences

- May need refactoring to React Query or Zustand as complexity grows
- No built-in caching or optimistic updates
- Prop drilling possible in deep component trees
