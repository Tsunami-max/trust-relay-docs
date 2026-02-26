---
id: 0014-react-query-caching
sidebar_position: 15
title: "ADR-0014: React Query Caching"
---

# ADR-0014: React Query for Frontend Caching

| | |
|---|---|
| **Date** | 2026-02-25 |
| **Status** | `Implemented` |
| **Deciders** | Adrian Birlogeanu |

## Context

The Trust Relay frontend had no caching layer. Every navigation between tabs, every page return, and every poll cycle triggered fresh API calls. This created several problems:

1. **Redundant requests**: Switching tabs on the case detail page re-fetched all data, even though nothing had changed
2. **No stale-while-revalidate**: Users saw loading skeletons on every navigation instead of cached data with background refresh
3. **No cache invalidation**: After submitting a decision, the user had to manually refresh to see the updated status
4. **Polling inefficiency**: Multiple `setInterval`/`useEffect` patterns for status polling, each with its own error handling

Additionally, the frontend had no custom hooks -- all data fetching logic was inline in page components, making it difficult to share patterns and test in isolation.

## Decision

Adopt **@tanstack/react-query (v5)** as the frontend caching and server state management layer, combined with custom hooks for data fetching:

### React Query Setup

- `QueryClientProvider` wraps the application in the shared `providers.tsx` component
- Configurable stale times per query type (e.g., case list: 30s, case detail: 10s)
- Automatic background refetching when the window regains focus
- Cache invalidation on mutations (e.g., invalidate case detail after decision submission)

### Custom Hooks

Five custom hooks encapsulate data fetching patterns:

| Hook | Purpose |
|------|---------|
| `useAsyncData<T>` | Generic async fetch with loading/error/refetch (shared pattern) |
| `useCaseDetail` | Case data + status polling with stale-while-revalidate |
| `usePipelineStatus` | Agent pipeline status with automatic refresh |
| `useDecisionSubmit` | Decision submission with cache invalidation |
| `usePeppolVerify` | PEPPOL verification trigger and result |

### Shared `useAsyncData` Hook

A generic hook that encapsulates the `useState` + `useEffect` + cleanup pattern:

```tsx
const { data, loading, error, refetch } = useAsyncData(
  () => api.getCaseDetail(workflowId),
  [workflowId]
);
```

Handles stale request prevention (cleanup flag on unmount or dependency change), error state management, and imperative refetch.

## Consequences

### Positive

- **Faster perceived navigation**: Cached data shown immediately, background refresh brings it up to date
- **Reduced API load**: Stale-while-revalidate eliminates redundant requests on tab switches
- **Testable data fetching**: Custom hooks can be tested in isolation with mocked API clients
- **Consistent patterns**: All data fetching follows the same hook pattern instead of ad-hoc `useEffect` chains
- **Automatic cache invalidation**: Decision submissions invalidate relevant cache entries

### Negative

- **Added dependency**: @tanstack/react-query is a runtime dependency (~12KB gzipped)
- **Learning curve**: Developers need to understand cache keys, stale times, and invalidation patterns
- **Dual patterns**: Some older code still uses direct `useEffect` + `useState`; not all components have been migrated to hooks

### Neutral

- React Query's devtools are useful during development but not included in production builds
- The `useAsyncData` hook provides a simpler alternative for one-off fetches that do not need caching

## Alternatives Considered

1. **SWR (Vercel)**: Similar stale-while-revalidate library, slightly smaller API surface. Rejected because React Query has better mutation support and devtools.
2. **Custom caching layer**: Build our own cache with `Map` + `useState`. Rejected because it would replicate React Query's functionality with more bugs.
3. **No caching, optimize polling**: Keep the current approach but reduce poll intervals. Rejected because the fundamental UX problem (loading skeletons on every navigation) would persist.
4. **Server-side rendering with RSC**: Use React Server Components to eliminate client-side fetching. Rejected for now because the dashboard is inherently interactive and the CopilotKit integration requires `"use client"`.
