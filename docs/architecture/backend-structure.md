---
sidebar_position: 6
title: "Backend Structure"
---

# Backend Structure

The backend is a Python 3.11+ application using FastAPI for the HTTP layer and Temporal for workflow orchestration. It runs as two separate processes sharing the same codebase: the FastAPI web server and the Temporal worker.

## Directory Layout

```
backend/
  app/
    api/                    # FastAPI routers (HTTP endpoints)
      case_crud.py          # Case create, list, get, delete (5 endpoints)
      case_decisions.py     # Decision submission, MCC operations (4 endpoints)
      case_documents.py     # Document listing, download, markdown (4 endpoints)
      case_analysis.py      # Investigation, tasks, company profile, AI brief (6 endpoints)
      case_evidence.py      # Evidence panel, Belgian evidence, PEPPOL (4 endpoints)
      portal.py             # Customer portal endpoints (3 endpoints)
      agent.py              # CopilotKit AG-UI integration (2 endpoints)
      dashboard.py          # Dashboard analytics (1 endpoint)
      graph.py              # Knowledge graph query endpoints (4 endpoints)
      peppol.py             # PEPPOL verification API (2 endpoints)
      inhoudingsplicht.py   # Inhoudingsplicht standalone check
      scan.py               # Tiered entity scanning (Tier 0-3)
      confidence.py         # Confidence scoring endpoints
      reasoning.py          # Reasoning template endpoints
      intelligence.py       # Cross-case intelligence endpoints
      agents.py             # Agent registry and manifest endpoints
      automation.py         # Supervised autonomy and automation tier endpoints
      regulatory.py         # Regulatory radar and standards mapping endpoints
      config.py             # Feature configuration endpoints
      test.py               # Test/mock mode toggle endpoints
      health.py             # Health check endpoints
      deps/                 # Shared FastAPI dependencies
        auth.py             # JWT authentication (Keycloak 26 JWKS)
        services.py         # DI singleton factories via lru_cache + Depends()
        rate_limiter.py     # IP-based sliding window rate limiter
        api_key_auth.py     # PEPPOL API key validation

    agents/                 # 18+ PydanticAI agent definitions
      osint_agent.py        # OSINT orchestrator (pipeline coordinator)
      registry_agent.py     # NorthData corporate registry
      belgian_agent.py      # Belgian 4-source investigation
      belgian_scraping_agent.py  # Gazette scraping tools
      person_validation_agent.py # LinkedIn validation via BrightData
      adverse_media_agent.py     # Sanctions/PEP screening via Tavily
      synthesis_agent.py    # Risk assessment synthesis (no tools)
      document_validator.py # Document-to-requirement validation
      mcc_classifier.py     # MCC code classification
      task_generator.py     # Follow-up task suggestion
      dashboard_agent.py    # CopilotKit dashboard assistant
      dashboard_stats_agent.py   # Analytics agent
      models.py             # Shared output models

    models/                 # Pydantic data models
      case.py               # CaseStatus, CaseCreateRequest, CaseResponse, etc.
      investigation.py      # Finding, Discrepancy, Severity, CorroborationSummary
      mcc_classification.py # MCCClassificationInput/Output, RiskTier
      workflow_template.py  # WorkflowTemplate, DocumentRequirement, TEMPLATE_REGISTRY
      financial_health.py   # FinancialMetric, FinancialTrend, FinancialHealthReport
      company_profile.py    # CompanyProfile, SourcedFact, EvidenceReference
      peppol.py             # PEPPOL verification models
      countries.py          # 30 EEA country definitions
      document_validation.py # Document validation result models
      inhoudingsplicht.py   # Inhoudingsplicht check models
      task_generation.py    # Task generation models
      workflow_state.py     # Typed workflow state models
      confidence.py         # Confidence scoring models
      reasoning.py          # Reasoning template models
      intelligence.py       # Cross-case intelligence models
      agents.py             # Agent registry and manifest models
      automation.py         # Supervised autonomy models
      regulatory.py         # Regulatory radar models
      scan.py               # Tiered scanning models
      red_flag.py           # Red flag engine models
      evoi.py               # Expected Value of Investigation models
      governance.py         # Governance check models
      signal_event.py       # Signal event models
      tool_invocation.py    # Tool invocation audit models

    services/               # Business logic and external integrations
      graph_service.py      # Neo4j knowledge graph CRUD + queries
      graph_etl_service.py  # ETL: PostgreSQL/MinIO -> Neo4j graph sync
      minio_service.py      # MinIO S3 operations
      audit_service.py      # Audit event persistence
      osint_service.py      # OSINT investigation dispatcher
      belgian_data_service.py    # Wraps 4 Belgian data sources
      belgian_evidence_service.py # SHA-256 evidence hashing + persistence
      kbo_service.py        # KBO/BCE registry scraper
      nbb_service.py        # NBB CBSO REST API client
      crawl4ai_service.py   # Async web crawler wrapper
      northdata_scrape_service.py # NorthData JSON-LD free scraping
      brightdata_enrichment_service.py # Crunchbase MCP enrichment
      company_profile_service.py # CompanyProfile load/save/discrepancy detection
      vies_service.py       # EU VAT validation
      peppol_verification_service.py # PEPPOL orchestrator
      peppol_directory_service.py    # PEPPOL directory lookup
      peppol_persistence_service.py  # PEPPOL result storage
      evidence_service.py   # PEPPOL evidence hashing
      inhoudingsplicht_service.py    # Social/tax debt check
      cache_service.py      # Redis cache operations
      mcc_service.py        # MCC classification persistence
      docling_service.py    # IBM Docling document conversion
      report_service.py     # PDF report generation
      agent_progress_service.py # Agent pipeline tracking
      risk_engine.py        # Risk score computation
      name_matching_service.py   # Fuzzy name matching
      website_validation_service.py  # Website content analysis
      confidence_service.py      # Confidence scoring computation
      confidence_calibration_service.py  # Calibration record management
      reasoning_template_service.py  # Reasoning template CRUD
      red_flag_service.py        # Red flag engine (deterministic rules)
      intelligence_service.py    # Cross-case pattern detection
      alert_service.py           # Alert generation and management
      agent_registry_service.py  # Agent manifest registry
      evoi_service.py            # Expected Value of Investigation
      governance_service.py      # Pre/post-execution governance
      tool_audit_service.py      # Tool invocation auditing
      automation_service.py      # Supervised autonomy tier management
      express_queue_service.py   # Express queue processing
      learning_service.py        # Compliance learning system
      letta_service.py           # Letta memory integration
      signal_service.py          # Signal event processing
      scan_service.py            # Tiered entity scanning
      regulatory_service.py      # Regulatory standards mapping
      whois_service.py           # WHOIS domain lookup
      sanctions_service.py       # Sanctions screening
      opensanctions_service.py   # OpenSanctions integration
      financial_analysis_service.py  # Financial ratio analysis
      entity_360_service.py      # Entity 360 temporal intelligence
      standards_mapping_service.py   # Standards coverage mapping

    workflows/              # Temporal workflow and activity definitions
      compliance_case.py    # ComplianceCaseWorkflow (401 lines)
      activities.py         # 6 activity functions (470 lines)

    exceptions.py           # Custom exception hierarchy (TrustRelayError + subtypes)

    db/
      database.py           # SQLAlchemy async engine + session factory
      models.py             # SQLAlchemy ORM models (27 tables, DeclarativeBase)

    alembic/                # Database migration management
      env.py                # Async migration runner
      versions/
        001_initial_schema.py       # Initial schema migration
        002_add_token_expiry.py     # Portal token expiry column
        003_add_signal_events.py    # Signal events table
        004_add_agent_executions.py # Agent execution tracking
        005_core_tables.py          # Core table refinements
        006_calibration.py          # Confidence calibration table
        007_reasoning_templates.py  # Reasoning template tables
        008_alerts.py               # Cross-case alerts table
        009_tool_invocations.py     # Tool invocation audit table
        010_governance_checks.py    # Governance check table
        011_evoi_decisions.py       # EVOI decision table
        012_automation_tiers.py     # Automation tier tables
        013_signal_events_nullable_case_id.py  # Signal events schema update
        014_express_queue.py        # Express queue table

    data/                   # Static reference data
      nace_to_mcc.py        # NACE-to-MCC mapping table

    mcp_servers/            # MCP server scripts
      northdata.py          # NorthData MCP tool definitions

    templates/              # HTML templates
      compliance_report.html # PDF report template

    config.py               # pydantic-settings configuration (165 lines)
    main.py                 # FastAPI app + middleware + lifespan
    worker.py               # Temporal worker entry point
```

## Layer Responsibilities

### API Layer (`app/api/`)

FastAPI routers that handle HTTP requests, validate input, and delegate to Temporal or services. The API is organized into 28 focused routers:

| Router | Endpoints | Responsibility |
|--------|-----------|---------------|
| `case_crud.py` | 5 | Create, list, get, delete cases |
| `case_decisions.py` | 4 | Decision submission, MCC classification operations |
| `case_documents.py` | 4 | Document listing, download, markdown retrieval |
| `case_analysis.py` | 6 | Investigation results, tasks, company profile, AI brief |
| `case_evidence.py` | 4 | Evidence panel, Belgian evidence, PEPPOL results |
| `graph.py` | 4 | Knowledge graph queries (co-directorships, entity networks, fraud patterns) |
| `portal.py` | 3 | Customer portal document upload and submission |
| `agent.py` | 2 | CopilotKit AG-UI integration |
| `dashboard.py` | 1 | Dashboard analytics |
| `peppol.py` | 2 | PEPPOL verification API |
| `inhoudingsplicht.py` | 1 | Inhoudingsplicht standalone check |
| `scan.py` | 4 | Tiered entity scanning (Tier 0-3) |
| `confidence.py` | 3 | Confidence scoring and calibration |
| `reasoning.py` | 4 | Reasoning template CRUD |
| `intelligence.py` | 3 | Cross-case pattern detection and alerts |
| `agents.py` | 3 | Agent registry and manifests |
| `automation.py` | 5 | Supervised autonomy tier management |
| `regulatory.py` | 3 | Regulatory radar and standards mapping |
| `config.py` | 1 | Feature configuration |
| `test.py` | 2 | Mock mode toggles (development only) |
| `health.py` | 1 | Health check |

All officer-facing routers use the `get_current_user` authentication dependency and the IP-based rate limiter middleware.

### Agent Layer (`app/agents/`)

18+ PydanticAI agents, each following a consistent pattern:

```python
agent = Agent(
    model=get_agent_model("agent_name_model"),
    output_type=StructuredOutputModel,
    instructions=prompt_string,
    toolsets=[mcp_server],  # optional
)
async with agent:
    result = await agent.run(user_message, usage_limits=UsageLimits(...))
return result.output
```

See [AI Agents](/docs/architecture/ai-agents) for the complete inventory.

### Service Layer (`app/services/`)

63 service modules encapsulating external integrations and business logic. Services are injected via FastAPI's `Depends()` pattern.

#### Dependency Injection

Service singletons are managed by `app/api/deps/services.py` using `lru_cache` factories:

```python
from app.api.deps.services import get_minio_service

@router.get("/example")
async def example(minio: MinIOService = Depends(get_minio_service)):
    minio.list_objects(prefix="...")
```

Each service is created once per process via `lru_cache(maxsize=1)`. This provides singleton behavior without a full DI container. Services can be overridden in tests via FastAPI's `app.dependency_overrides`.

:::note
Temporal activities run in a separate worker process and must instantiate services inline -- they do not use FastAPI dependency injection. This is by design: Temporal activities should not depend on the HTTP framework.
:::

### Workflow Layer (`app/workflows/`)

Two files define the entire Temporal integration:

- **`compliance_case.py`** (401 lines) -- The `ComplianceCaseWorkflow` class with signals, queries, the main run loop, and audit logging
- **`activities.py`** -- Seven activity functions that bridge Temporal and the service/agent layers

See [Temporal Workflows](/docs/architecture/temporal-workflows) for details.

### Data Layer (`app/db/`)

The database layer uses SQLAlchemy with async support:

```python
engine = create_async_engine(settings.database_url)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession)

@asynccontextmanager
async def get_session():
    async with async_session_factory() as session:
        yield session
```

#### ORM Models (`app/db/models.py`)

All 27 database tables have SQLAlchemy ORM models defined using `DeclarativeBase`. Key models include:

| Model | Table | Key Fields |
|-------|-------|-----------|
| `Case` | `cases` | case_id, workflow_id, company_name, status, portal_token, expires_at |
| `AuditEvent` | `audit_events` | case_id (FK), event_type, details (JSONB) |
| `MCCClassification` | `mcc_classifications` | case_id (FK), mcc_code, confidence |
| `PeppolVerification` | `peppol_verifications` | case_id (FK), enterprise_number, registered |
| `PeppolApiKey` | `peppol_api_keys` | key_hash, rate_limit_per_minute, active |
| `BelgianEvidence` | `belgian_evidence` | case_id (FK), source, data_hash, raw_data (JSONB) |
| `AgentExecution` | `agent_executions` | case_id (FK), agent_name, status, duration_ms |
| `SignalEvent` | `signal_events` | case_id (FK, nullable), signal_type, details (JSONB) |
| `ConfidenceCalibration` | `confidence_calibrations` | case_id (FK), dimension scores, methodology |
| `ReasoningTemplate` | `reasoning_templates` | template name, conditions, caps |
| `Alert` | `alerts` | alert_type, severity, entity references |
| `ToolInvocation` | `tool_invocations` | agent_name, tool_name, input/output hashes |
| `GovernanceCheck` | `governance_checks` | check_type, result, case_id (FK) |
| `EVOIDecision` | `evoi_decisions` | belief_state, recommended_action |
| `AutomationTier` | `automation_tiers` | officer_id, template, country, tier level |
| `AutomationTierOverride` | `automation_tier_overrides` | manager override records |
| `AutomationTierHistory` | `automation_tier_history` | tier change audit trail |
| `ExpressQueueItem` | `express_queue_items` | case_id, queue status, one-click approval |

#### Migrations (Alembic)

Database migrations are managed by Alembic with async support. The migration environment (`alembic/env.py`) uses `run_async` for async engine compatibility.

21 migrations covering the full schema evolution (001-014 core + pillars, 015-021 multi-tenancy and refinements):
- `001_initial_schema.py` -- Creates initial tables with indexes and constraints
- `002_add_token_expiry.py` -- Adds `expires_at` column to the `cases` table
- `003`-`005` -- Signal events, agent executions, core table refinements
- `006_calibration.py` -- Confidence calibration records
- `007_reasoning_templates.py` -- Reasoning template and condition tables
- `008_alerts.py` -- Cross-case pattern detection alerts
- `009_tool_invocations.py` -- Tool invocation audit records
- `010_governance_checks.py` -- Governance check results
- `011_evoi_decisions.py` -- Expected Value of Investigation decisions
- `012_automation_tiers.py` -- Supervised autonomy tier tables
- `013_signal_events_nullable_case_id.py` -- Signal events schema update
- `014_express_queue.py` -- Express queue for automated approval

:::note
ORM models are in place for all 27 tables. Key modules (`admin.py`, `auth.py`) have been migrated to the ORM Repository pattern (`BaseRepository[T]`), with incremental migration of remaining modules underway. See [ADR-0008](/docs/adr/0008-raw-sql) for details.
:::

### Exception Hierarchy (`app/exceptions.py`)

A structured exception hierarchy replaces the previous pattern of bare `except: pass` blocks:

```
TrustRelayError (base)
  CaseNotFoundError
  WorkflowError
  DocumentProcessingError
  ExternalServiceError
    ScrapingError
    LLMError
  AuthenticationError
  ValidationError
```

All exceptions carry a `message` and optional `details` dict for structured logging. FastAPI exception handlers translate these into appropriate HTTP responses.

### Configuration (`app/config.py`)

All configuration is managed through pydantic-settings, reading from environment variables and `.env` files:

- Service connections (Temporal, PostgreSQL, MinIO, Redis)
- External API keys (OpenAI, BrightData, Tavily, NorthData)
- Per-agent LLM model overrides (11 configurable model strings)
- Mock mode flags (8 boolean toggles for development)
- Feature flags (`peppol_enabled`, `northdata_scrape_enabled`)
- Workflow defaults (`max_iterations`, `max_timeline_days`)

## Two-Process Architecture

The backend runs as two separate processes:

```
Process 1: FastAPI (uvicorn)
  - Handles HTTP requests
  - Starts workflows via Temporal client
  - Sends signals to running workflows
  - Queries workflow state

Process 2: Temporal Worker
  - Executes workflow logic (state machine)
  - Runs activities (document processing, OSINT, task generation)
  - Both processes share the same codebase but run independently
```

This separation is a Temporal requirement: workflow code runs in a deterministic sandbox that cannot make network calls directly. All side effects (database writes, API calls, file I/O) must happen in activities, which run in the worker process but outside the sandbox.

## Production Readiness

| Area | Current State | Status |
|------|--------------|--------|
| API routing | Split into 28 focused routers | **Complete** |
| Service layer | FastAPI `Depends()` injection via `lru_cache` singletons | **Complete** |
| Database | ORM models (27 tables), Alembic (21 migrations), Repository pattern (incremental migration) | **Complete** |
| Error handling | Custom exception hierarchy + structured logging | **Complete** |
| Authentication | Keycloak 26 JWT with JWKS validation, 4 RBAC roles, multi-tenant RLS | **Complete** |
| Rate limiting | IP-based sliding window (600/min auth, 200/min unauth, configurable) | **Complete** |
| Configuration | pydantic-settings with env-specific validation and per-agent model overrides | **Complete** |
| Logging | Python logging to stdout | Production: structured JSON with correlation IDs |
| Distributed rate limiting | In-memory sliding window | Production: Redis-backed for multi-instance |
