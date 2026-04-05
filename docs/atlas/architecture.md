---
sidebar_position: 2
title: "Atlas — System Architecture"
description: "Deep architecture documentation for the Atlas compliance platform. Covers layered design, domain organization, investigation lifecycle, deployment topology, and key architectural decisions."
last_verified: 2026-04-05
status: reference
---

# Atlas — System Architecture

Atlas follows a monolithic architecture with modular internal organization. The codebase is a single Python package (`src/`) with domain-specific sub-packages, fronted by a FastAPI API layer and backed by PostgreSQL, Neo4j, Redis, and Temporal. The frontend is a React SPA using Blueprint.js, built with Vite.

This page documents the system from the ground up: request flow, domain organization, investigation lifecycle, deployment topology, and architectural decisions.

## Architecture Overview

Atlas uses a layered architecture: API routers handle HTTP concerns, delegate to service modules for business logic, which in turn use repository classes for database access. Temporal workflows run in separate worker processes for investigation orchestration and dynamic compliance workflows.

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        Browser["React SPA<br/>Blueprint.js + Vite"]
    end

    subgraph API["API Layer — FastAPI"]
        Auth["Auth Middleware<br/>Keycloak JWT"]
        RateLimit["Rate Limiter"]
        Routers["25+ Domain Routers"]
    end

    subgraph Services["Service Layer"]
        InvSvc["Investigation<br/>Service"]
        ReportSvc["Report<br/>Generator"]
        MiniOSvc["MinIO<br/>Client"]
        GeoSvc["Geocoding<br/>Service"]
    end

    subgraph Pipelines["AI Pipeline Layer"]
        ModelFactory["Model Factory<br/>OpenRouter / Anthropic /<br/>Ollama / vLLM"]
        MCPClient["MCP Client<br/>Resilient with<br/>Circuit Breaker"]
        LangChain["LangChain<br/>Agent Executor"]
    end

    subgraph DomainModules["Domain Modules"]
        Ontology["Ontology<br/>Entity Resolution"]
        RiskMatrix["Risk Matrix<br/>EBA Scorer"]
        MutQueue["Mutation Queue<br/>Conflict Detection"]
        Graph["Graph Service<br/>Neo4j Sync"]
        RefData["Reference Data<br/>Registry"]
        Workflows["Workflow Engine<br/>Schema Compiler"]
    end

    subgraph Repositories["Repository Layer"]
        InvRepo["Investigation<br/>Repository"]
        CompRepo["Company<br/>Repository"]
        EntityRepo["Entity<br/>Repository"]
        EvidRepo["Evidence<br/>Repository"]
        RiskRepo["Risk<br/>Repository"]
        SchemaRepo["Schema<br/>Repository"]
        PromptRepo["Prompt<br/>Repository"]
    end

    subgraph Persistence["Persistence Layer"]
        PG["PostgreSQL 15"]
        Neo4j["Neo4j 5.18"]
        Redis["Redis 7"]
        MinIO["MinIO"]
    end

    subgraph Orchestration["Orchestration"]
        Temporal["Temporal Server"]
        InvWorker["Investigation<br/>Worker"]
        WfWorker["Workflow Engine<br/>Worker"]
    end

    subgraph Observability["Observability"]
        Langfuse["Langfuse<br/>LLM Tracing"]
        ClickHouse["ClickHouse<br/>Analytics"]
    end

    Browser --> Auth --> RateLimit --> Routers
    Routers --> Services
    Routers --> DomainModules
    Services --> Repositories
    DomainModules --> Repositories
    Repositories --> PG
    Pipelines --> Langfuse
    Langfuse --> ClickHouse
    Graph --> Neo4j
    MutQueue --> Repositories
    RefData --> Repositories
    InvSvc --> Temporal
    Temporal --> InvWorker
    Temporal --> WfWorker
    InvWorker --> Pipelines
    InvWorker --> DomainModules
    WfWorker --> DomainModules
    MiniOSvc --> MinIO
    Services --> Redis

    style Client fill:#1e3a5f,stroke:#38bdf8,color:#fff
    style API fill:#2d4a3e,stroke:#34d399,color:#fff
    style Services fill:#3b1a5f,stroke:#a78bfa,color:#fff
    style Pipelines fill:#5f3a1e,stroke:#f59e0b,color:#fff
    style DomainModules fill:#4a1a3b,stroke:#ec4899,color:#fff
    style Repositories fill:#1a3b4a,stroke:#06b6d4,color:#fff
    style Persistence fill:#3b3b1a,stroke:#eab308,color:#fff
    style Orchestration fill:#1a2a3b,stroke:#60a5fa,color:#fff
    style Observability fill:#2a1a3b,stroke:#c084fc,color:#fff
```

## C4 Context Diagram

The following diagram shows Atlas in its broader ecosystem -- the external systems it depends on and the actors that interact with it.

```mermaid
flowchart TD
    subgraph Actors["Actors"]
        Officer["Compliance Officer"]
        Admin["Admin / Config"]
    end

    subgraph Atlas["Atlas Platform"]
        FE["Frontend<br/>React + Blueprint.js"]
        BE["Backend<br/>FastAPI + Python"]
    end

    subgraph DataStores["Data Stores"]
        PG["PostgreSQL 15<br/>Primary datastore<br/>Investigations, entities,<br/>risk, workflows, config"]
        Neo4j["Neo4j 5.18<br/>Knowledge graph<br/>Entity relationships,<br/>ownership chains"]
        Redis["Redis 7<br/>Cache + rate limiting"]
        AtlasMinio["Atlas MinIO<br/>Document storage"]
    end

    subgraph Orchestration["Orchestration"]
        Temporal["Temporal Server<br/>Workflow execution<br/>Investigation + compliance"]
        TemporalUI["Temporal UI<br/>Workflow monitoring"]
    end

    subgraph Auth["Authentication"]
        Keycloak["Keycloak 26<br/>JWT / OIDC<br/>Role-based access"]
    end

    subgraph AI["AI / LLM"]
        OpenRouter["OpenRouter<br/>LLM gateway<br/>Multi-provider routing"]
        Anthropic["Anthropic API<br/>Direct access"]
        Ollama["Ollama<br/>Local models"]
    end

    subgraph Observability["Observability"]
        Langfuse["Langfuse 3<br/>LLM tracing, cost<br/>tracking, quality scoring"]
        LfMinio["Langfuse MinIO<br/>Event + export storage"]
        ClickHouse["ClickHouse 24<br/>Analytics backend"]
    end

    subgraph Tools["External Tools"]
        MCP["MCP Servers<br/>Web search, registries,<br/>sanctions, VAT"]
        NorthData["NorthData<br/>Company enrichment"]
        VIES["EU VIES<br/>VAT validation"]
    end

    Officer --> FE
    Admin --> FE
    FE --> BE
    BE --> PG
    BE --> Neo4j
    BE --> Redis
    BE --> AtlasMinio
    BE --> Temporal
    BE --> Keycloak
    BE --> OpenRouter
    BE --> Anthropic
    BE --> Ollama
    BE --> MCP
    BE --> NorthData
    BE --> VIES
    Temporal --> TemporalUI
    Langfuse --> PG
    Langfuse --> ClickHouse
    Langfuse --> LfMinio

    style Actors fill:#1e3a5f,stroke:#38bdf8,color:#fff
    style Atlas fill:#3b1a5f,stroke:#a78bfa,color:#fff
    style DataStores fill:#2d4a3e,stroke:#34d399,color:#fff
    style Orchestration fill:#1a2a3b,stroke:#60a5fa,color:#fff
    style Auth fill:#3b3b1a,stroke:#eab308,color:#fff
    style AI fill:#5f3a1e,stroke:#f59e0b,color:#fff
    style Observability fill:#2a1a3b,stroke:#c084fc,color:#fff
    style Tools fill:#4a1a3b,stroke:#ec4899,color:#fff
```

## Domain-Driven Organization

The Atlas backend is organized into 8 domain packages under `src/`, each owning its models, repositories, and business logic.

### 1. Investigations (`src/temporal/`, `src/pipelines/`)

The core domain. Temporal workflows orchestrate 7 parallel investigation modules. Each module is driven by a `ModuleConfig` dataclass that parameterizes its prompts, result model, and template variables. The `execute_module` activity uses LangChain agents with MCP tools to perform research, then validates output against the active ontology schema.

Key components:
- `workflows.py` -- `InvestigationWorkflow` Temporal workflow definition
- `activities.py` -- generic `execute_module` activity (~900 lines)
- `module_config.py` -- 7 module configurations (CIR, ROA, MEBO, SPEPWS, AMLRR, DFWO, FRLS)
- `enrichment_activities.py` -- pre-investigation data provider enrichment
- `sync_activities.py` -- Neo4j sync as detached child workflow

### 2. Ontology (`src/ontology/`)

A versioned entity schema system that defines what entity types exist (Company, Person, Address), their attributes, and relationships. The ontology drives entity validation, population from LLM output, and reconciliation of duplicates across modules.

Key components:
- `entity_resolution.py` -- blocking-based entity matching and deduplication
- `survivorship.py` -- trust-weighted field resolution when sources conflict
- `reconciliation.py` -- post-investigation entity merge
- `schema_loader.py` -- loads and caches the active ontology version
- `populator.py` -- maps LLM structured output to ontology entities

### 3. Risk (`src/risk_matrix/`)

An EBA-aligned risk scoring engine with 5 dimensions, per-factor evaluation, configurable weights, and SHA-256 audit hashes for deterministic reproducibility. Risk matrices are stored in the database and resolved per-tenant.

Key components:
- `scorer.py` -- `RiskMatrixScorer` with `FactorResult`, `DimensionResult`, and `MatrixEvaluationResult`
- `eba_matrix.py` -- EBA dimension definitions and factor mappings
- `activities.py` -- risk scoring as a Temporal activity

### 4. Graph (`src/graph/`)

Neo4j integration for knowledge graph operations. Investigation entities are synced to Neo4j as a detached child workflow (so investigation completion is not blocked by graph sync). The graph layer supports entity traversal, ownership chain analysis, and Cypher-powered exploration.

Key components:
- `neo4j_client.py` -- connection pool and query execution
- `neo4j_sync.py` -- entity and relationship sync from PostgreSQL to Neo4j
- `cypher_queries.py` -- parameterized Cypher query library
- `projections.py` -- pre-built graph projections for analysis
- `parity_service.py` -- consistency checks between PostgreSQL and Neo4j

### 5. Mutation Queue (`src/mutation_queue/`)

A sophisticated data pipeline for entity field updates. When new data arrives (from investigations or external providers), mutations flow through evidence mapping, merge strategy resolution, conflict detection, and provenance tracking before being applied. Conflicts can trigger review tasks or freeze investigations.

Key components:
- `processor.py` -- `MutationProcessor` orchestrating the full pipeline
- `evidence_mapper.py` -- maps provider data to mutation records
- `merge_executor.py` -- applies merge strategies (latest_wins, highest_trust, manual_review)
- `conflict_detector.py` -- detects value conflicts between sources
- `conflict_handler.py` -- applies conflict response policies (accept_trusted, flag_review, freeze_investigate)

### 6. Workflows (`src/workflows/`)

A generic workflow engine separate from the investigation workflow. Compliance workflows are defined as YAML schemas, compiled into execution plans, and interpreted by a `DynamicComplianceWorkflow` Temporal workflow. Supports investigation phases, review gates with SLA timers, rule evaluation, conditional routing, and portal phases for customer data collection.

Key components:
- `schema/compiler.py` -- compiles YAML to parallel execution groups
- `engine/dynamic_workflow.py` -- generic Temporal workflow interpreter
- `engine/gate_evaluator.py` -- evaluates review gate conditions
- `builder/` -- visual workflow builder backend (schema generation, semantic validation)
- `rules/eba_matrix.py` -- rule engine integration with risk matrix

### 7. Integrations (`src/integrations/`)

External data provider connectors. Each integration implements a base provider interface and maps external data to the ontology schema. Includes stale data detection and provider health monitoring.

Key components:
- `base.py` -- `ProviderResponse` base class
- `northdata/` -- NorthData company enrichment
- `kvk/` -- Dutch KVK registry
- `keycloak_client.py` -- Keycloak administration
- `stale_check.py` -- data freshness detection

### 8. Reference Data (`src/reference_data/`)

A tenant-aware registry for compliance reference datasets (FATF country risk, industry risk classifications, sanctions list configurations). Supports versioning, system defaults vs. tenant overrides, and layered resolution.

Key components:
- `resolver.py` -- `ReferenceDataResolver` with tenant-aware layered lookup
- `repository.py` -- CRUD for reference datasets
- `seed.py` -- initial dataset seeding
- `validator.py` -- schema validation for dataset entries

## Investigation Lifecycle

The following diagram shows the complete lifecycle of an Atlas investigation, from API request through Temporal execution to final output.

```mermaid
flowchart TD
    A["POST /investigations"] --> B["Create DB Record<br/>status: pending"]
    B --> C["Start Temporal Workflow<br/>InvestigationWorkflow"]

    C --> D{"Has Registration<br/>Number?"}
    D -->|Yes| E["Fetch Enrichment Data<br/>NorthData / providers"]
    D -->|No| F["Skip Enrichment"]
    E --> G["Build Module Inputs<br/>with enrichment context"]
    F --> G

    G --> H["Start 7 Parallel Activities"]

    subgraph Parallel["Parallel Module Execution"]
        direction LR
        M1["CIR"]
        M2["ROA"]
        M3["MEBO"]
        M4["SPEPWS"]
        M5["AMLRR"]
        M6["DFWO"]
        M7["FRLS"]
    end

    H --> Parallel

    subgraph ModuleExecution["Per-Module Activity"]
        direction TB
        P1["Load Agent Config<br/>+ Prompts from DB"]
        P2["Create LLM<br/>via Model Factory"]
        P3["Load MCP Tools<br/>+ HTTP Tools"]
        P4["Execute LangChain Agent<br/>System + User Prompt"]
        P5["Validate Against<br/>Ontology Schema"]
        P6{"Schema<br/>Valid?"}
        P7["Extract Risk Indicators<br/>Apply Risk Rules"]
        P8["Persist to Ontology<br/>EntityPopulator"]
        P9["Persist Evidence<br/>EvidenceRepository"]
        P10["Return ModuleOutput"]
        P11["Retry with<br/>Validation Feedback"]

        P1 --> P2 --> P3 --> P4 --> P5 --> P6
        P6 -->|Yes| P7 --> P8 --> P9 --> P10
        P6 -->|No| P11 --> P4
    end

    Parallel --> ModuleExecution

    ModuleExecution --> I["Reconcile Entities<br/>Merge duplicates<br/>across modules"]
    I --> J["Calculate Overall Risk<br/>Aggregate module scores"]
    J --> K["Persist Investigation<br/>Result to DB"]
    K --> L["Start Neo4j Sync<br/>Child Workflow<br/>ParentClosePolicy.ABANDON"]
    L --> M["Return<br/>InvestigationOutput"]

    style Parallel fill:#3b1a5f,stroke:#a78bfa,color:#fff
    style ModuleExecution fill:#1e3a5f,stroke:#38bdf8,color:#fff
```

### Key Design Decisions in the Lifecycle

1. **All modules run in parallel** -- no inter-module dependencies. Each module discovers entities independently, and reconciliation happens after all complete.
2. **Enrichment is optional** -- if the company has a registration number, Atlas pre-fetches data from providers to give modules more context. If not, modules discover independently.
3. **Ontology validation with feedback loops** -- LLM output is validated against the active schema. If validation fails, the agent receives feedback and retries.
4. **Neo4j sync is non-blocking** -- graph sync runs as a detached child workflow with `ParentClosePolicy.ABANDON`, so the investigation completes immediately regardless of graph sync status.

## Deployment Architecture

Atlas runs as a Docker Compose stack with 15+ containers organized into 5 categories.

```mermaid
flowchart TD
    subgraph Application["Application Services"]
        API["osint-api<br/>FastAPI<br/>:8000"]
        UI["osint-ui<br/>React SPA<br/>:3000 → nginx :80"]
        InvWorker["temporal-worker<br/>Investigation modules"]
        WfWorker["workflow-engine-worker<br/>Dynamic workflows"]
    end

    subgraph Databases["Databases"]
        PG["postgres<br/>PostgreSQL 15<br/>:5432"]
        Neo4j["neo4j<br/>Neo4j 5.18 Community<br/>:7474 / :7687"]
        Redis["redis<br/>Redis 7 Alpine<br/>:6379"]
    end

    subgraph Orchestration["Orchestration"]
        Temporal["temporal<br/>Temporal auto-setup<br/>:7233"]
        TemporalUI["temporal-ui<br/>Temporal Web UI<br/>:8080"]
    end

    subgraph AuthLayer["Authentication"]
        Keycloak["keycloak<br/>Keycloak 26<br/>:8180"]
        KCInit["keycloak-db-init<br/>DB setup"]
        Flyway["flyway<br/>Flyway 10<br/>Schema migration"]
    end

    subgraph ObsStack["Observability Stack"]
        LfWeb["langfuse-web<br/>Langfuse 3<br/>:3002"]
        LfWorker["langfuse-worker<br/>Background processing"]
        CH["langfuse-clickhouse<br/>ClickHouse 24"]
        LfMinio["langfuse-minio<br/>MinIO for events"]
        LfMinioInit["langfuse-minio-init<br/>Bucket setup"]
        LfDbInit["langfuse-db-init<br/>DB setup"]
    end

    subgraph Storage["Document Storage"]
        AtlasMinio["atlas-minio<br/>MinIO<br/>:9002 / :9092"]
        AtlasMinioInit["atlas-minio-init<br/>Bucket setup"]
    end

    API --> PG
    API --> Redis
    API --> Temporal
    API --> Keycloak
    API --> Neo4j
    API --> AtlasMinio
    InvWorker --> PG
    InvWorker --> Temporal
    InvWorker --> Neo4j
    WfWorker --> PG
    WfWorker --> Temporal
    UI --> API
    TemporalUI --> Temporal
    Temporal --> PG
    Keycloak --> PG
    KCInit --> PG
    Flyway --> PG
    LfWeb --> PG
    LfWeb --> CH
    LfWeb --> LfMinio
    LfWeb --> Redis
    LfWorker --> LfWeb
    LfDbInit --> PG
    LfMinioInit --> LfMinio
    AtlasMinioInit --> AtlasMinio

    style Application fill:#3b1a5f,stroke:#a78bfa,color:#fff
    style Databases fill:#2d4a3e,stroke:#34d399,color:#fff
    style Orchestration fill:#1a2a3b,stroke:#60a5fa,color:#fff
    style AuthLayer fill:#3b3b1a,stroke:#eab308,color:#fff
    style ObsStack fill:#2a1a3b,stroke:#c084fc,color:#fff
    style Storage fill:#5f3a1e,stroke:#f59e0b,color:#fff
```

### Service Inventory

| Service | Image | Port(s) | Purpose |
|---------|-------|---------|---------|
| `osint-api` | Custom Dockerfile | 8000 | FastAPI backend, 25+ routers |
| `osint-ui` | Custom Dockerfile | 3000 | React SPA served via nginx |
| `temporal-worker` | Custom Dockerfile | -- | Investigation module execution |
| `workflow-engine-worker` | Custom Dockerfile | -- | Dynamic compliance workflow execution |
| `postgres` | postgres:15-alpine | 5432 | Primary datastore for all services |
| `neo4j` | neo4j:5.18-community | 7474, 7687 | Knowledge graph (APOC plugin enabled) |
| `redis` | redis:7-alpine | 6379 | Caching and rate limiting |
| `temporal` | temporalio/auto-setup:1.24 | 7233 | Workflow orchestration server |
| `temporal-ui` | temporalio/ui:2.26.2 | 8080 | Temporal monitoring dashboard |
| `keycloak` | keycloak:26.0 | 8180 | Authentication and authorization |
| `flyway` | flyway/flyway:10-alpine | -- | Database schema migrations (run-once) |
| `langfuse-web` | langfuse/langfuse:3 | 3002 | LLM observability dashboard |
| `langfuse-worker` | langfuse/langfuse-worker:3 | -- | Background trace processing |
| `langfuse-clickhouse` | clickhouse/clickhouse-server:24.3 | -- | Analytics backend for Langfuse |
| `langfuse-minio` | minio/minio:latest | -- | Event and export storage for Langfuse |
| `atlas-minio` | minio/minio:latest | 9002, 9092 | Document storage for Atlas |

### Initialization Chain

Several services have initialization dependencies enforced by Docker Compose health checks:

1. **PostgreSQL** starts first (health check: `pg_isready`)
2. **Flyway** runs migrations after PostgreSQL is healthy (run-once, `service_completed_successfully`)
3. **Keycloak DB init** creates the Keycloak database after PostgreSQL is healthy
4. **Keycloak** starts after its DB init completes
5. **Temporal** starts after PostgreSQL is healthy (uses PostgreSQL as its backing store)
6. **API** starts after Flyway completes and Temporal is healthy
7. **Workers** start after Temporal is healthy and Flyway completes
8. **UI** starts after API is healthy
9. **Langfuse** starts after its DB init, ClickHouse, Redis, and MinIO are ready

## Key Architectural Decisions

### 1. Parallel Module Execution

All 7 investigation modules execute simultaneously with no inter-module dependencies. Each module discovers entities independently, and reconciliation merges duplicates after all modules complete. This maximizes throughput -- a full investigation completes in the time of its slowest module rather than the sum of all modules.

### 2. Temporal for Durable Execution

Both the investigation workflow and the dynamic compliance workflow engine use Temporal. Investigations use a single workflow with parallel activities. The workflow engine uses a generic interpreter (`DynamicComplianceWorkflow`) that can execute any compiled YAML schema. Temporal provides automatic retry, cancellation propagation, and persistent state across failures.

### 3. PostgreSQL + Neo4j Hybrid Storage

PostgreSQL is the system of record for all structured data (investigations, entities, risk scores, configurations). Neo4j is a derived view -- investigation entities are synced to the graph as a detached child workflow. This hybrid approach gives transactional consistency (PostgreSQL) plus relationship traversal performance (Neo4j) without requiring dual-write coordination.

### 4. OpenRouter as LLM Gateway

Atlas uses OpenRouter as its primary LLM gateway, allowing model selection per agent without managing multiple API keys. The `ModelFactory` supports fallback to direct Anthropic/OpenAI APIs and local providers (Ollama, vLLM, LM Studio). Agent-specific model overrides are stored in `agent_configurations` table and loaded per-module.

### 5. MCP Extensibility

Investigation tools are loaded dynamically from the `mcp_servers` table. MCP servers connect via SSE or stdio, with a resilient client layer that includes per-server circuit breakers, exponential backoff with jitter, and tool availability tracking for partial results. HTTP tools (non-MCP REST APIs) are loaded separately and merged into the agent's tool set.

### 6. Mutation Queue for Entity Updates

Field-level entity updates do not write directly to entities. Instead, they flow through a mutation pipeline: evidence mapping, merge strategy resolution (latest_wins, highest_trust, manual_review), conflict detection, and provenance tracking. When conflicts are detected, the per-field `conflict_response` configuration determines whether to accept the trusted source, flag for review, or freeze the investigation.

### 7. Reference Data Registry

Compliance reference datasets (FATF country risk lists, industry risk classifications, sanctions configurations) are stored as versioned JSON in a `reference_data` table with tenant-aware layered resolution. The resolver checks tenant-specific overrides first, then falls back to system defaults. This allows per-tenant customization of risk parameters without forking the data.

### 8. Keycloak Authentication

Atlas has Keycloak integrated with JWT validation middleware on every API request. The `PlatformAuthMiddleware` extracts tenant and user context from JWTs, enabling multi-tenant isolation. Role-based access control is enforced at the router level.

### 9. WeasyPrint PDF Generation

Investigation reports are generated as HTML from Jinja2 templates and converted to PDF using WeasyPrint. The report generator uses a two-stage process: Stage 1 extracts structured findings with a fast/cheap model (Haiku), Stage 2 synthesizes narrative prose with a quality model (Gemini Flash).

### 10. Ontology-Driven Risk Scoring

Risk scoring is not hardcoded. The ontology schema defines entity types and their risk-relevant attributes. Risk factors are evaluated per-dimension using the EBA 5-dimension framework, with per-factor weights stored in the database. The scorer produces 4 SHA-256 hashes (input, override, evaluation fingerprint, output) for full audit reproducibility.

## Differences from Trust Relay Architecture

At a high level, the main architectural differences are:

| Aspect | Atlas | Trust Relay |
|--------|-------|-------------|
| **AI orchestration** | LangChain agents with tool-calling | PydanticAI agents with structured output |
| **Investigation model** | 7 modules, all parallel, no customer interaction | 13 agents, pre-investigation before customer, iterative document loop |
| **Workflow scope** | Generic workflow engine (YAML schemas, visual builder) | Single compliance workflow (state machine in Temporal) |
| **Entity model** | Ontology-driven with versioned schemas and mutation queue | Simpler entity model, graph ETL with 20-step pipeline |
| **Frontend framework** | Blueprint.js (Java-inspired component library) | shadcn/ui (Tailwind-based, modern React) |
| **Database access** | Raw asyncpg with repository pattern | SQLAlchemy ORM with Alembic migrations |
| **LLM observability** | Langfuse (self-hosted, always-on, ClickHouse + MinIO) | Langfuse + OpenTelemetry (profile flag) + 5 audit tables + diagnostics API + monitoring API |
| **Auth status** | Keycloak fully integrated with JWT middleware | Keycloak fully integrated (JWT/JWKS, RBAC with 4 roles, JIT user provisioning, PKCE flow) |
| **Customer portal** | Workflow Studio portal phases (dynamic) | Dedicated branded portal with token auth |
| **Document processing** | None (investigation-only) | IBM Docling for document conversion + MinIO storage |

For a detailed comparison of specific patterns adopted from Atlas into Trust Relay, see [Atlas Adoption](/docs/architecture/atlas-adoption).
