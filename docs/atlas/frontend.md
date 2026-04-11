---
sidebar_position: 9
title: "Atlas — Frontend Architecture"
last_verified: 2026-04-08
status: reference
---

# Atlas — Frontend Architecture

Atlas ships a **React 18 + Blueprint.js** single-page application built with Vite, permanently styled in dark mode. The frontend covers investigation management, company portfolio, risk assessment, knowledge graph exploration, compliance workflow execution, and a visual workflow builder — roughly 30+ routes across 7 product areas.

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | React | 18.2 | Component library |
| **Design System** | Blueprint.js (Palantir) | 5.10+ | Enterprise UI components |
| **Build Tool** | Vite | 7.3.1 | Fast HMR + production bundling |
| **Language** | TypeScript | 5.4.2 | Type system (`strict: false`) |
| **Client State** | Zustand | 4.5 | 5 domain-specific stores |
| **Server State** | TanStack React Query | v5.28 | Caching with localStorage persistence |
| **Routing** | react-router-dom | 7.14 | Client-side routing (30+ routes) |
| **Auth** | Keycloak.js | 26 | OIDC PKCE with silent SSO |
| **Graph Visualization** | Cytoscape.js | 3.28 | Entity network graphs |
| **Graph Layouts** | dagre, cose-bilkent, fcose | - | 3 layout algorithms |
| **Charts** | Recharts | 2.12 | Risk charts and dashboards |
| **PDF Generation** | @react-pdf/renderer | 4.3 | Client-side investigation reports |
| **Forms** | react-hook-form + Zod | 7.72 / 3.24 | Validated form handling |
| **Drag-and-Drop** | @dnd-kit | 6.3 | Workflow builder phase ordering |
| **Code Editors** | CodeMirror 6 | - | YAML + JSON editing in Studio |
| **Geo Visualization** | d3-geo + world-atlas | 3.1 / 2.0 | Geographic risk maps |
| **CSV Import** | PapaParse | 5.5 | Bulk data import/export |
| **API Docs** | swagger-ui-react | 5.32 | Embedded Swagger UI |
| **HTTP Client** | Axios | 1.13 | API communication |
| **Fonts** | NotoSans | - | PDF Unicode support |

### Development Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.1 | Unit testing |
| @testing-library/react | 16.3 | Component testing |
| ESLint | 8.57 | Linting |
| Sass | 1.72 | SCSS compilation |

## Visual Identity

Atlas uses a permanent **dark theme** via the `bp5-dark` Blueprint.js class. The primary background color is `#1e2732`. All components use Blueprint's Intent system for semantic coloring:

| Intent | Usage |
|--------|-------|
| `PRIMARY` (blue) | Active states, primary actions |
| `SUCCESS` (green) | Approved, clear risk |
| `WARNING` (orange) | Medium risk, pending review |
| `DANGER` (red) | High/critical risk, sanctions matches |

Blueprint's `Colors` constants (`BLUE3/4`, `DARK_GRAY4`, `RED4`, etc.) provide consistent theming throughout the application.

## Authentication

Authentication uses **Keycloak 26** with PKCE (Proof Key for Code Exchange):

- `AuthProvider` wraps the app with auth context (`isAuthenticated`, `user`, `login`, `logout`, `refresh`)
- `RequireAuth` guard redirects unauthenticated users to Keycloak login
- Axios request interceptor attaches Bearer tokens from Keycloak
- Response interceptor catches 401s, attempts token refresh, and redirects to login if refresh fails
- Silent SSO check on app load for seamless session restoration
- User roles from Keycloak: `admin`, `editor`, `viewer`

## State Management

### Zustand Stores (5)

| Store | Location | Purpose |
|-------|----------|---------|
| `useBuilderStore` | `components/builder/` | Workflow builder: YAML Document as single source of truth, phase selection, dirty state tracking |
| `useGraphStore` | `components/graph/cytoscape/` | Graph explorer: elements, filters, history (20-entry undo/redo), 6 data loading functions |
| `evaluationStore` | `stores/` | Matrix evaluation: selected matrix, entity subset, batch ID, tier filter, comparison state |
| `mappingStore` | `stores/` | Schema designer: normalized field/matrix mappings, dirty state, serialize/deserialize |
| `previewStore` | `stores/` | Live preview: active state, entity ID, activation timestamp for wire pulse animation |

### TanStack React Query v5

- **Stale time**: 5 minutes
- **Garbage collection**: 24 hours
- **Retry**: 1 attempt
- **Persistence**: LocalStorage via `createSyncStoragePersister` (key: `osint-query-cache`)
- **Window focus refetch**: disabled

Used extensively across 17+ custom hooks: `useInvestigations`, `useRiskCenter`, `useOntologyExplorer`, `usePortfolioEvaluation`, `useWorkflowTasks`, etc.

### React Context

- `AuthContext` — Auth state and Keycloak integration
- `SidebarContext` — Sidebar collapsed state (persisted)

## Routes

### Public Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | `Login` | Keycloak login |
| `/forgot-password` | `ForgotPassword` | Password reset request |
| `/reset-password` | `ResetPassword` | Password reset form |
| `/accept-invite` | `InviteSignUp` | Organization invitation |

### Protected Routes (inside `AppShell` with sidebar navigation)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Dashboard` | Command Center — stats, risk overview, recent investigations |
| `/investigations` | `InvestigationList` | Paginated/searchable investigation table |
| `/investigations/new` | `NewInvestigation` | Create investigation (full/focused mode) |
| `/investigations/:id` | `InvestigationDetail` | Investigation status + workflow activity |
| `/investigations/:id/report` | `ReportView` | Multi-tab investigation report |
| `/companies` | `Companies` | Company directory with risk tags |
| `/companies/:companyId` | `CompanyDetail` | Company 360 with enriched data tabs |
| `/risk` | `RiskCenter` | 4-view risk center |
| `/ontology` | `OntologyExplorer` | Knowledge graph entity browser |
| `/graph` | `GraphExplorer` | Full-page Cytoscape graph |
| `/tasks` | `TaskInbox` | SLA-sorted compliance task queue |
| `/workflows/:id/execute` | `WorkflowExecution` | Phase timeline + adaptive interaction |
| `/builder/:schemaId` | `WorkflowBuilder` | Three-panel visual workflow editor |
| `/studio/sources` | `StudioSources` | Data source management |
| `/studio/mappings` | `StudioMappings` | Schema designer with wire mapping |
| `/studio/matrices` | `RiskMatrices` | EBA risk matrix management |
| `/studio/risk-categories` | `RiskCategories` | Risk category editor |
| `/studio/evaluations` | `StudioEvaluations` | Matrix evaluation workflow |
| `/studio/workflows` | `StudioWorkflows` | Workflow schema management |
| `/evaluations/:id` | `EvaluationDetail` | Single evaluation detail |
| `/evaluations/company/:id` | `CompanyRiskDashboard` | Per-company risk dashboard |
| `/wizard` | `SchemaWizard` | Schema creation wizard |
| `/settings` | `Settings` | MCP servers, agents, ontology, segments |
| `/api-docs` | `ApiDocs` | Embedded Swagger UI |
| `/profile` | `Profile` | User profile |

## Key Screens

### Dashboard

"Command Center" with 4 stat cards (Total / In Progress / Completed / High Risk investigations), risk indicator overview with 5 severity cards, investigation risk distribution tags, 3 quick-action cards (Company Directory, Risk Center, Settings), and a recent investigations table (top 5).

### Investigation List

Paginated (25/page) sortable table with status filter dropdown, search bar with 250ms debounce, column sorting, and row actions (delete, stop, rerun). Skeleton loaders display during data fetch.

### Report View

Multi-tab investigation report:
- **Risk Gauge** — Semi-circle risk score visualization
- **Executive Summary** — AI-generated investigation summary
- **Module Findings** — Per-module cards for CIR, ROA, DFWO, MEBO, FRLS, AMLRR, SPEPWS
- **Entity Graph** — Cytoscape entity relationship visualization
- **Ontology Overview** — Schema-aligned entity view
- **Evidence Bundle** — Evidence artifacts with provenance
- **Lineage** — Data lineage graph and property lineage
- **Workflow View** — Workflow execution visualization

### Risk Center

Four switchable views via ButtonGroup:
1. **Portfolio** — Pie chart, spider chart, timeline, jurisdiction breakdown
2. **Dashboard** — Category bar chart, severity donut, timeline, indicators preview
3. **Table** — Full paginated risk indicator table with filters
4. **Network** — Entity-risk graph via Cytoscape

### Graph Explorer

Full-page Cytoscape graph with toolbar offering 6 view modes:
1. Entity Network — All connections for selected entity
2. Ownership Chain — Trace ownership hierarchy
3. UBO Analysis — Ultimate beneficial owners (≥25%)
4. Risk Network — PEPs, sanctions within 3 hops
5. Shared Directors — Directors at multiple companies
6. Shared Addresses — Entities at same location

Interactive features: click, double-click (expand), right-click (context menu), selection highlighting, hidden connection counting, 20-entry undo/redo, PNG/JSON export.

### Workflow Builder

Three-panel IDE-like interface:
- **Left** (260px, resizable): Phase list with drag-to-reorder via dnd-kit
- **Center**: Tabbed editor — Visual (per-type form editors) and YAML (CodeMirror with syntax highlighting)
- **Right** (400px, resizable): Live preview with save/publish buttons

Uses the `yaml` npm package's `Document` class for comment-preserving round-trip editing. Zustand store holds the YAML Document as single source of truth.

## Component Architecture

| Category | Components | Purpose |
|----------|-----------|---------|
| **Layout** | 3 | AppShell (220px sidebar), PageHeader, SidebarContext |
| **Builder** | 10 | Three-panel layout, phase list, editors (Visual + YAML), preview, save/publish |
| **Companies** | 3 | CompanyTimeline, EnrichedDataTabs (Structure/Financials/Events), useEnrichedData |
| **Evaluation** | 14 | Matrix evaluation page, selectors, progress, histograms, migration matrix, comparison |
| **Export/PDF** | 5 | ReportPDF (5-page), CompanyPDF, ExportDialog, font registration |
| **Graph** | 7 | CytoscapeGraph, GraphToolbar, NodeDetailPanel, useGraphState (648 lines), styles |
| **Investigation** | 7 | InvestigationTable, InvestigationForm, ModuleProgressBar, StatusTag, RiskLevelTag, activity panels |
| **Matrix** | 12 | DimensionEditor, FactorEditor, AggregationConfig, RiskLevelEditor, ScoringMethodConfigurator |
| **Report** | 17 | FindingCards (7 modules), EntityGraph, DetailedFindings, ConflictsPanel, SourcesPanel, Lineage |
| **Risk** | 12 | RiskOverview, charts (category, severity, jurisdiction, timeline), PortfolioSpider, Heatmap |
| **Settings** | 10 | AgentConfigPage, CrewAgentTree, DataProvidersTab, PromptsPanel, SchemaTreeView |
| **Shared** | 10 | StatCard/Grid, RiskBadge, EmptyState/ErrorState/LoadingState, Skeleton loaders, FilterBar |
| **Studio** | 20 | OntologyColumn, SourceColumn, MatrixColumn, ConnectionLines (SVG wires), FieldConfigPanel |
| **Workflow** | 17 | PhaseTimeline, PhaseInteraction, PortalForm, DocumentUploader, ReviewPanel, SlaCountdown |

**Total: ~200+ TypeScript components**

## PDF Generation

Client-side PDF generation via `@react-pdf/renderer`:

**Investigation Report PDF (5 pages):**
1. Executive Summary + Risk Assessment (score, level, color-coded)
2. Corporate Structure (Directors, UBOs, Shareholders tables)
3. Critical Findings + Risk Factors + Deal Breakers
4. Compliance Status (AML/KYC, EDD requirements, monitoring gaps)
5. Legal Disclaimer with generation date

NotoSans fonts (Regular, Bold, Italic) registered for full Unicode support including Romanian diacritics.

## API Client

Axios instance with:
- Base URL from `VITE_API_URL` or `/api` (nginx proxy)
- 30-second timeout
- Bearer token injection from Keycloak
- Token refresh on 401 with login redirect on refresh failure
- Content-Type cleared for FormData uploads

**22 API modules** organized by domain:

| Module | Endpoints |
|--------|-----------|
| `investigations.ts` | CRUD, cancel, rerun, report, evidence, module progress |
| `companies.ts` | List, detail, stats, add, ownership chain, ontology |
| `risk.ts` | Overview, indicators, by-category, by-jurisdiction, timeline, portfolio, network |
| `riskMatrix.ts` | Schema CRUD, publish, archive, validate, evaluate batch |
| `graph.ts` | Entity network, ownership chain, risk network, shared addresses/directors, sync |
| `ontology.ts` | Entity listing, detail, stats, graph |
| `settings.ts` | MCP servers, LangChain config, segments, ontology schemas |
| `workflows.ts` | Workflow execution, status, phase submission |
| `builder.ts` | Schema CRUD, save, publish |
| `documents.ts` | Upload/download |
| `studioEvaluations.ts` | Evaluation batch management |
| `studioSchemas.ts` | Schema version management |
| `studioSources.ts` | Source definitions, tenant adapters |
| `referenceData.ts` | Reference data API |
| `dataProviders.ts` | Provider listing |
| `entityPreview.ts` | Live entity data preview |
| `auth.ts` | Authentication helpers |
| `wizard.ts` | Schema creation wizard |

## Testing

- **Framework**: Vitest 4.1 + jsdom + React Testing Library
- **Test files**: 36 test files
- **Setup**: `src/test/setup.ts` with global configuration
- **Pattern**: Component rendering + user interaction testing
