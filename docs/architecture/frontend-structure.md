---
sidebar_position: 10
title: "Frontend Structure"
last_verified: 2026-03-29
status: implemented
---

# Frontend Structure

The frontend is a Next.js 16 application with React 19, Tailwind CSS v4, and shadcn/ui components. It serves two distinct user experiences: the officer dashboard and the customer portal.

## Directory Layout

```
frontend/src/
  app/
    page.tsx                          # Root redirect (5 lines)
    dashboard/
      page.tsx                        # Case list + analytics
      [workflowId]/
        page.tsx                      # Case detail view (uses custom hooks)
      peppol/
        page.tsx                      # Standalone PEPPOL lookup
      inhoudingsplicht/
        page.tsx                      # Standalone inhoudingsplicht check
      memory/
        page.tsx                      # Memory Admin (blocks, signals, archival, confidence)
    portal/
      [token]/
        page.tsx                      # Customer document upload portal
    providers.tsx                     # Shared CopilotKit + QueryClient providers

  hooks/                              # Custom hooks (extracted from page components)
    useAsyncData.ts                   # Generic async fetch with loading/error/refetch
    useCaseDetail.ts                  # Case data fetching + polling
    usePipelineStatus.ts              # Agent pipeline status tracking
    useDecisionSubmit.ts              # Decision submission with optimistic updates
    usePeppolVerify.ts                # PEPPOL verification trigger + result

  components/
    dashboard/                        # 27+ officer dashboard components + entity-network
    portal/                           # 7 customer portal components
    ui/                               # 25 shadcn/ui primitives + custom components

  lib/
    api.ts                            # Typed Axios HTTP client
    types.ts                          # TypeScript interfaces (mirrors backend models)
    utils.ts                          # Utility functions
    colors.ts                         # Shared color constants (risk, status, severity)
```

## Component Inventory

### Dashboard Components (27)

| Component | Lines | Purpose |
|-----------|-------|---------|
| `PeppolResultCard` | 655 | PEPPOL verification results with 4 check types |
| `MCCCard` | 503 | MCC classification with alternatives and officer override |
| `FollowUpTasks` | 486 | AI-generated and officer-created follow-up tasks |
| `CreateCaseDialog` | 447 | Case creation form with country selection and templates |
| `FinancialHealthCard` | 429 | Financial metrics, ratios, trend sparklines |
| `DocumentViewer` | 422 | Document list with markdown/JSON preview |
| `InhoudingsplichtResultCard` | 393 | Social/tax debt verification display |
| `EvidencePanel` | 344 | Belgian evidence sources with SHA-256 hashes |
| `CaseListTable` | 310 | Sortable, filterable case list |
| `AnalyticsCharts` | 270 | Risk distribution and status charts |
| `FilterBar` | 231 | Compact filter controls for case list |
| `CompanyProfileCard` | 224 | Cross-source company facts and discrepancies |
| `RiskHeatmap` | 205 | Aggregated risk heatmap across cases |
| `DecisionActions` | 197 | Approve/reject/escalate/follow-up buttons |
| `AgentCard` | 172 | Individual agent status with model and findings |
| `AgentPipelineView` | 170 | Pipeline DAG visualization |
| `StatsHero` | 166 | Top-level case count stats |
| `InvestigationResults` | 161 | Investigation findings list |
| `PipelineDAG` | 146 | Agent dependency graph visualization |
| `ConfidenceChart` | 136 | Confidence score radial chart |
| `AiBriefCard` | 134 | AI-generated case summary |
| `AuditLog` | 128 | Timestamped audit event list |
| `CaseTimeline` | 117 | Visual iteration timeline |
| `DiscrepancyCard` | 106 | Cross-source data discrepancy display |
| `PipelineTimingBar` | 90 | Agent execution timing bar chart |
| `RiskScoreRing` | 86 | Risk score circular visualization |
| `StatusBadge` | 73 | Case status colored badge |

### Portal Components (7)

| Component | Purpose |
|-----------|---------|
| `DocumentUpload` | File upload with drag-and-drop per requirement |
| `QuestionForm` | Template-driven question form |
| `BrandedHeader` | Customizable header with brand logo/colors |
| `ProgressIndicator` | Upload progress and step tracking |
| `ProcessingStatus` | Post-submission processing status display |
| `StatusScreen` | Final status screen (approved/rejected/pending) |
| `FollowUpTaskCard` | Follow-up task display for customer |

### UI Primitives (25)

All from shadcn/ui plus three custom components:

**shadcn/ui (22):** badge, button, card, checkbox, collapsible, command, dialog, input, label, popover, progress, select, separator, sheet, skeleton, sonner, table, tabs, textarea, toggle, toggle-group, tooltip

**Custom (3):**
- `glass-card.tsx` -- Frosted glass card effect for the dashboard
- `json-viewer.tsx` -- Wrapper around `@uiw/react-json-view` with custom dark theme
- `particle-background.tsx` -- Animated particle effect for the portal landing

## Strengths

### Typed API Client

The API client (`lib/api.ts`) is well-typed with full TypeScript coverage:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002",
});

export async function createCase(data: CaseCreateRequest): Promise<CaseCreateResponse> {
  const res = await api.post("/api/cases", data);
  return res.data;
}

export async function listCases(status?: string): Promise<CaseListResponse> {
  const params = status ? { status } : {};
  const res = await api.get("/api/cases", { params });
  return res.data;
}
```

All 28 type imports from `types.ts` mirror the backend Pydantic models, providing end-to-end type safety.

### shadcn/ui Consistency

The 22 shadcn/ui primitives provide a consistent component API across the application. Components are added via the CLI (`npx shadcn@latest add <component>`) and customized through Tailwind, not through props or CSS overrides.

### Skeleton Loaders

Content loading states use skeleton loaders (not spinners) throughout the dashboard, following the Golden Standard UI rules:

```tsx
{loading ? (
  <Skeleton className="h-8 w-32" />
) : (
  <span>{data.company_name}</span>
)}
```

## Custom Hooks

Data fetching and state logic has been extracted from page components into reusable custom hooks:

### `useAsyncData<T>(fetcher, deps)` -- Generic Async Data Hook

A shared hook that encapsulates the common `useState` + `useEffect` + loading + error pattern:

```tsx
const { data, loading, error, refetch } = useAsyncData(
  () => getAuditLog(workflowId).then(d => d.events),
  [workflowId]
);
```

Returns `{ data, loading, error, refetch }` with cleanup on unmount and stale-request prevention.

### Domain-Specific Hooks

| Hook | Purpose |
|------|---------|
| `useCaseDetail(workflowId)` | Case data fetching + status polling |
| `usePipelineStatus(workflowId)` | Agent pipeline status tracking with auto-refresh |
| `useDecisionSubmit(workflowId)` | Decision submission with loading/error state |
| `usePeppolVerify(workflowId)` | PEPPOL verification trigger and result management |

### React Query Caching Layer

The application uses `@tanstack/react-query` for server state management via `QueryClientProvider` in the shared providers component:

- Reduces redundant API calls on tab switches (stale-while-revalidate)
- Provides automatic background refetching
- Enables cache invalidation on mutations (used by `useDecisionSubmit` and `usePeppolVerify`)
- Configurable stale times per query type (e.g., 5-minute staleTime for PEPPOL results)

## Addressed Frontend Debt

| Item | Was | Now |
|------|-----|-----|
| Case detail god component | 776 lines with inline state management | Custom hooks extracted, tab content in separate components |
| No custom hooks | Zero hooks, all logic inline | 5 hooks in `src/hooks/` |
| No caching | Fresh API calls on every navigation | React Query with stale-while-revalidate |
| CopilotKit duplication | Three separate configurations | Shared `CopilotKitProvider` in `providers.tsx` |
| No component tests | 131 tests (utility + some components) | 547+ tests across 47 test suites covering all dashboard, portal, memory, and entity-network components |
| No accessibility | No ARIA labels, no focus management | ARIA attributes, keyboard navigation, focus management |

## Future Enhancements

### Server-Side Rendering

All page components use the `"use client"` directive. The dashboard is inherently interactive (real-time pipeline visualization, CopilotKit AI chat, form workflows), making client-side rendering the natural fit. Server components may be adopted for initial data loading in future iterations.

### Page-Level Integration Tests

All 27 dashboard components have dedicated test files. Page-level components (`page.tsx` files) are thin orchestrators after hook extraction, and may benefit from integration tests that verify the full hook + component composition.

## CopilotKit + AG-UI Integration

The AI assistant uses CopilotKit v2 APIs (ADR-0013) with the AG-UI protocol:

```
Frontend (CopilotKit) <-> Next.js API route (CopilotRuntime) <-> FastAPI backend <-> PydanticAI agent
```

Key integration details:

- Agents registered server-side in `CopilotRuntime` (`frontend/src/app/api/copilotkit/route.ts`): `dashboard_assistant`, `dashboard_stats`, `portal_assistant`
- Case detail page uses inline `CopilotChat` in a 2-column layout (380px sticky right panel, hidden on mobile)
- Portal and dashboard list use `CopilotPopup` (floating bottom-right)
- Context passed via `useCopilotReadable` -- injects workflow_id/portal_token as JSON
- Error boundary class component wraps CopilotKit to prevent page crashes
- Suggestion chips generated from `lib/chatSuggestions.ts` and passed as static suggestions

See [ADR-0003](/docs/adr/) and [ADR-0013](/docs/adr/) for the full rationale.
