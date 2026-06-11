---
sidebar_position: 10
title: "Frontend Structure"
last_verified: 2026-06-11
status: implemented
---

# Frontend Structure

The frontend is a Next.js 16 application with React 19, Tailwind CSS v4, and shadcn/ui components. It serves two distinct user experiences: the officer dashboard and the customer portal.

## Directory Layout

```
frontend/src/
  app/
    page.tsx                          # Root redirect
    login/
      page.tsx                        # Keycloak login entry
      callback/page.tsx               # OIDC PKCE callback handler
    dashboard/
      page.tsx                        # Case list + analytics
      [workflowId]/page.tsx           # Case detail view (uses custom hooks)
      network/page.tsx                # Network Intelligence Hub (graph / ownership / flow)
      graph/page.tsx                  # Knowledge graph explorer
      memory/page.tsx                 # Memory Admin (blocks, signals, archival, confidence)
      intelligence/page.tsx           # Cross-case intelligence
      regulatory/page.tsx             # Regulatory radar
      standards/page.tsx              # Standards coverage mapping
      ontology/page.tsx               # Graph ontology browser
      onboarding/page.tsx             # Tenant setup wizard
      settings/page.tsx               # Tenant settings
      settings/risk-matrix/page.tsx   # Risk matrix configuration
      peppol/page.tsx                 # Standalone PEPPOL lookup
      inhoudingsplicht/page.tsx       # Standalone inhoudingsplicht check
      admin/lex/page.tsx              # Lex corpus admin
    admin/
      page.tsx                        # Super-admin tenant/platform management
      prompts/page.tsx                # Prompt version management
      reference-data/page.tsx         # Reference data browser
      risk-configuration/page.tsx     # Risk configuration editor
      workflows/page.tsx              # Workflow schema editor
      costs/page.tsx                  # Cost tracking dashboard
    portal/
      [token]/page.tsx                # Customer document upload portal
    api/copilotkit/route.ts           # CopilotRuntime agent registration
    providers.tsx                     # Shared CopilotKit + QueryClient providers

  hooks/                              # Custom hooks (extracted from page components)
    useCaseDetail.ts                  # Case data fetching
    useCasePolling.ts                 # Case status polling
    usePipelineStatus.ts              # Agent pipeline status tracking
    useDecisionSubmit.ts              # Decision submission with optimistic updates
    usePeppolVerify.ts                # PEPPOL verification trigger + result
    useLocale.ts                      # Locale / i18n context
    useTheme.ts                       # Theme (dark/light) context

  components/
    dashboard/                        # 138 officer dashboard components (incl. network/, entity-network)
    portal/                           # 8 customer portal components
    ui/                               # 29 shadcn/ui primitives + custom components

  lib/
    api.ts                            # Typed Axios HTTP client
    types.ts                          # TypeScript interfaces (mirrors backend models)
    utils.ts                          # Utility functions
    colors.ts                         # Shared color constants (risk, status, severity)
```

In total the frontend ships **248 `.tsx` components** under `src/components/`. The component tables below cover the most prominent dashboard and portal components; the dashboard tree also includes the Network Intelligence Hub (`network/`), entity-network visualizations, and per-feature subdirectories.

## Component Inventory

### Dashboard Components (138 total — most prominent listed)

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

### Portal Components (8)

| Component | Purpose |
|-----------|---------|
| `DocumentUpload` | File upload with drag-and-drop per requirement |
| `QuestionForm` | Template-driven question form |
| `BrandedHeader` | Customizable header with brand logo/colors |
| `ProgressIndicator` | Upload progress and step tracking |
| `ProcessingStatus` | Post-submission processing status display |
| `StatusScreen` | Final status screen (approved/rejected/pending) |
| `FollowUpTaskCard` | Follow-up task display for customer |

### UI Primitives (29)

29 components live in `src/components/ui/` — shadcn/ui primitives plus custom components:

**shadcn/ui:** badge, button, card, checkbox, collapsible, command, dialog, dropdown-menu, input, label, popover, progress, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip

**Custom:**
- `collapsible-panel.tsx` -- Reusable collapsible content panel
- `json-viewer.tsx` -- Wrapper around `@uiw/react-json-view` with custom dark theme
- `particle-background.tsx` -- Animated particle effect for the portal landing
- `surface.tsx` -- Themed surface/card container primitive
- `theme-toggle.tsx` -- Dark/light theme switcher

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

The shadcn/ui primitives provide a consistent component API across the application. Components are added via the CLI (`npx shadcn@latest add <component>`) and customized through Tailwind, not through props or CSS overrides.

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

Data fetching and state logic has been extracted from page components into reusable custom hooks in `src/hooks/`:

| Hook | Purpose |
|------|---------|
| `useCaseDetail(workflowId)` | Case data fetching |
| `useCasePolling(workflowId)` | Case status polling with auto-refresh |
| `usePipelineStatus(workflowId)` | Agent pipeline status tracking with auto-refresh |
| `useDecisionSubmit(workflowId)` | Decision submission with loading/error state |
| `usePeppolVerify(workflowId)` | PEPPOL verification trigger and result management |
| `useLocale()` | Locale / i18n context access |
| `useTheme()` | Theme (dark/light) context access |

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

Most dashboard components have dedicated test files. Page-level components (`page.tsx` files) are thin orchestrators after hook extraction, and may benefit from integration tests that verify the full hook + component composition.

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
