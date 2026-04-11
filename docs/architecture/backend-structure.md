---
sidebar_position: 6
title: "Backend Structure"
components:
  - app/main.py
  - app/config.py
  - app/db/database.py
  - app/db/models.py
last_verified: 2026-03-31
status: implemented
---

# Backend Structure

The backend is a Python 3.11+ application using FastAPI for the HTTP layer and Temporal for workflow orchestration. It runs as two separate processes sharing the same codebase: the FastAPI web server and the Temporal worker.

## Directory Layout

```
backend/
  app/
    api/                    # FastAPI routers (HTTP endpoints) — 41 files, 238 endpoints
      case_crud.py          # Case create, list, get, delete (8 endpoints)
      case_decisions.py     # Decision submission, MCC operations (5 endpoints)
      case_documents.py     # Document listing, download, markdown (6 endpoints)
      case_analysis.py      # Investigation, tasks, company profile, AI brief (9 endpoints)
      case_evidence.py      # Evidence panel, Belgian evidence, PEPPOL (9 endpoints)
      case_intelligence.py  # Decision Support Panel (1 endpoint)
      cases.py              # Backward-compatible shim re-exporting case routers
      portal.py             # Customer portal endpoints (6 endpoints)
      agent.py              # CopilotKit AG-UI integration (2 endpoints)
      dashboard.py          # Dashboard analytics (2 endpoints)
      graph.py              # Knowledge graph query endpoints (32 endpoints)
      peppol.py             # PEPPOL verification API (3 endpoints)
      inhoudingsplicht.py   # Inhoudingsplicht standalone check (3 endpoints)
      scan.py               # Tiered entity scanning (6 endpoints)
      confidence.py         # Confidence scoring endpoints (1 endpoint)
      reasoning.py          # Reasoning template endpoints (3 endpoints)
      intelligence.py       # Cross-case intelligence endpoints (6 endpoints)
      agents.py             # Agent registry and manifest endpoints (3 endpoints)
      automation.py         # Supervised autonomy and automation tier endpoints (5 endpoints)
      regulatory.py         # Regulatory radar and standards mapping (13 endpoints)
      config.py             # Feature configuration endpoints (0 — metadata only)
      test.py               # Test/mock mode toggle endpoints
      health.py             # Health check endpoints
      admin.py              # Super admin: tenant/platform management, user CRUD (6 endpoints)
      admin_prompts.py      # Super admin: prompt version management, CRUD + diff (8 endpoints)
      branding.py           # Logo upload, color extraction, palette management (4 endpoints)
      capsule.py            # Trust Capsule API (3 endpoints)
      diagnostics.py        # Session diagnostics: investigation reconstruction, feedback (6 endpoints)
      eori.py               # EORI validation against EU SOAP service (1 endpoint)
      finding_analyses.py   # Per-finding deep analysis: list and trigger (2 endpoints)
      goaml.py              # goAML export: drafts, exports, enum mappings (9 endpoints)
      identity.py           # Identity verification (eID Easy) (4 endpoints)
      lex.py                # Lex regulatory knowledge layer (9 endpoints)
      memory.py             # Episodic memory system management (17 endpoints)
      monitoring.py         # Continuous monitoring schedules and events (8 endpoints)
      onboarding.py         # Tenant setup wizard onboarding state (3 endpoints)
      sanctions.py          # Sanctions screening API (2 endpoints)
      shipments.py          # Per-shipment customs compliance (4 endpoints)
      signal_capture.py     # Officer action signal capture (1 endpoint)
      templates.py          # Workflow template CRUD (5 endpoints)
      tenants.py            # Tenant management — Pillar 0 multi-tenancy (9 endpoints)
      transactions.py       # Precious metals transaction API (6 endpoints)
      vop.py                # Verification of Payee: single + batch (2 endpoints)
      workflow_templates.py # Workflow template CRUD — Pillar 0 (6 endpoints)
      risk_config.py        # Versioned risk configuration CRUD + activation (9 endpoints)
      deps/                 # Shared FastAPI dependencies
        auth.py             # JWT authentication (Keycloak 26 JWKS)
        keycloak_admin.py   # Keycloak admin client for user management
        services.py         # DI singleton factories via lru_cache + Depends()
        rate_limiter.py     # IP-based sliding window rate limiter
        api_key_auth.py     # PEPPOL API key validation
        tenant.py           # Tenant context extraction from JWT

    agents/                 # 21 PydanticAI agent definitions
      osint_agent.py        # OSINT orchestrator (pipeline coordinator)
      registry_agent.py     # NorthData corporate registry
      belgian_agent.py      # Belgian 4-source investigation
      belgian_scraping_agent.py  # Gazette scraping tools
      person_validation_agent.py # LinkedIn validation via BrightData
      adverse_media_agent.py     # Sanctions/PEP screening via Tavily
      synthesis_agent.py    # Risk assessment synthesis (no tools)
      document_validator.py # Document-to-requirement validation
      document_extractor.py # Document data extraction (structured output)
      mcc_classifier.py     # MCC code classification
      task_generator.py     # Follow-up task suggestion
      dashboard_agent.py    # CopilotKit dashboard assistant
      dashboard_stats_agent.py   # Analytics agent
      case_intelligence_agent.py # Decision support analysis
      country_registry.py   # Country-specific registry lookup
      finding_debugger.py   # Finding deep-dive debugger
      memory_admin_agent.py # Episodic memory administration
      sanctions_resolver_agent.py # Sanctions match resolution
      scan_agent.py         # Entity scan orchestrator
      scan_synthesis_agent.py    # Scan result synthesis
      models.py             # Shared output models

    models/                 # 35 Pydantic data model files
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
      reasoning_template.py # Reasoning template models
      pattern_alert.py      # Cross-case pattern alert models
      agent_manifest.py     # Agent registry and manifest models
      automation_tier.py    # Supervised autonomy models
      regulatory.py         # Regulatory radar models
      scan.py               # Tiered scanning models
      evoi.py               # Expected Value of Investigation models
      governance.py         # Governance check models
      evidence_bundle.py    # Evidence bundle models
      canonical_entities.py # goAML canonical entity models (shared foundation)
      eid_easy.py           # eID Easy identity verification models
      fiscal_rep.py         # Fiscal representative models
      investigation_episode.py # Investigation episode models
      kyc_models.py         # KYC natural person models
      memory_timeline.py    # Episodic memory timeline models
      monitoring.py         # Continuous monitoring models
      person_identity.py    # Person identity models
      precious_metals.py    # Precious metals models
      report.py             # Report generation models
      service_catalog.py    # Service catalog models
      shipment.py           # Shipment and customs models
      tax_engine.py         # Tax engine models

    services/               # 116 service modules (organized by subdirectory)

      # --- Core services (root level, 88 modules) ---
      audit_service.py              # Audit event persistence
      minio_service.py              # MinIO S3 operations
      osint_service.py              # OSINT investigation dispatcher
      osint_mock_data.py            # Realistic hardcoded OSINT data for demo
      docling_service.py            # IBM Docling document conversion
      cache_service.py              # Redis cache operations
      risk_engine.py                # Risk score computation
      risk_config_service.py        # Versioned risk configuration management (load, activate, audit)
      report_service.py             # PDF report generation
      report_data_builder.py        # Report data aggregation
      name_matching_service.py      # Fuzzy name matching
      company_profile_service.py    # CompanyProfile load/save/discrepancy detection
      agent_progress_service.py     # Agent pipeline tracking
      agent_manifests.py            # Agent manifest definitions
      agent_registry.py             # Agent manifest registry

      # Belgian data sources
      belgian_data_service.py       # Wraps 4 Belgian data sources
      belgian_evidence_service.py   # SHA-256 evidence hashing + persistence
      kbo_service.py                # KBO/BCE registry scraper
      nbb_service.py                # NBB CBSO REST API client

      # External integrations
      crawl4ai_service.py           # Async web crawler wrapper
      northdata_scrape_service.py   # NorthData JSON-LD free scraping
      northdata_service.py          # NorthData API service
      brightdata_enrichment_service.py # Crunchbase MCP enrichment
      vies_service.py               # EU VAT validation
      whois_service.py              # WHOIS domain lookup
      gleif_service.py              # GLEIF LEI lookup
      eori_service.py               # EORI number validation (EU SOAP)
      eid_easy_service.py           # eID Easy identity verification

      # PEPPOL
      peppol_verification_service.py   # PEPPOL orchestrator
      peppol_directory_service.py      # PEPPOL directory lookup
      peppol_persistence_service.py    # PEPPOL result storage

      # Evidence and verification
      evidence_service.py           # PEPPOL evidence hashing
      evidence_bundle_service.py    # Evidence bundle management
      identity_verification.py      # Identity verification orchestration
      website_validation_service.py # Website content analysis
      field_validation.py           # Field-level validation rules

      # Confidence and reasoning
      confidence_engine.py          # Confidence scoring computation
      calibration_service.py        # Calibration record management
      reasoning_template_registry.py # Reasoning template CRUD

      # Intelligence and alerts
      red_flag_engine.py            # Red flag engine (deterministic rules)
      pattern_engine.py             # Cross-case pattern detection
      alert_service.py              # Alert generation and management
      intelligence_service.py       # Cross-case intelligence (deprecated in favor of pattern_engine)
      signal_ingestion.py           # Signal event ingestion
      signal_ingestion_worker.py    # Background signal processing
      signal_capture_service.py     # Officer action signal capture
      recursive_discovery_service.py # Recursive entity discovery

      # Governance and automation
      governance_engine.py          # Pre/post-execution governance
      evoi_engine.py                # Expected Value of Investigation
      tool_audit_service.py         # Tool invocation auditing
      automation_tier_service.py    # Supervised autonomy tier management
      rule_evaluation_service.py    # Rule evaluation engine

      # Domain services
      mcc_service.py                # MCC classification persistence
      inhoudingsplicht_service.py   # Social/tax debt check
      branding_service.py           # Tenant branding + WCAG AA validation
      portfolio_service.py          # Portfolio analytics
      diagnostic_service.py         # Session diagnostics
      kyc_screening.py              # KYC natural person screening
      person_screening_service.py   # Person screening orchestration
      learning_service.py           # Compliance learning system
      episodic_memory_service.py    # Episodic memory management
      counter_account_service.py    # Counter-account analysis
      financial_cross_reference.py  # Financial cross-referencing

      # Sanctions
      sanctions_constants.py        # Sanctions list constants
      sanctions_feed_service.py     # Sanctions feed ingestion
      sanctions_matcher_service.py  # Sanctions matching engine
      adverse_media_service.py      # Adverse media screening
      poa_classifier.py             # Power of Attorney classification

      # Regulatory
      regulatory_impact_service.py  # Regulatory impact assessment
      regulatory_knowledge_service.py # Regulatory knowledge base
      standards_mapping_service.py  # Standards coverage mapping

      # Customs and trade
      shipment_classifier.py        # Shipment risk classification
      shipment_cross_reference.py   # Shipment cross-referencing
      shipment_extractor.py         # Shipment document extraction
      trade_profile_builder.py      # Trade profile construction
      guarantee_validator.py        # Customs guarantee validation
      vop_service.py                # Verification of Payee orchestrator

      # Precious metals and tax
      precious_metals_risk_engine.py # Precious metals risk assessment
      tax_engine.py                 # Tax computation engine
      tax_engine_mock_data.py       # Tax engine mock data
      transaction_ingestion_service.py # Transaction ingestion

      # Monitoring and observability
      monitoring_check_service.py   # Monitoring check execution
      monitoring_schedule_service.py # Monitoring schedule management
      langfuse_service.py           # Langfuse observability integration
      failure_classifier.py         # Failure classification
      scan_service.py               # Tiered entity scanning

      # Memory and capsules
      letta_policy_service.py       # Letta policy memory integration
      letta_tools.py                # Letta tool definitions
      trust_capsule_service.py      # Trust Capsule generation

      # Graph
      graph_service.py              # Neo4j knowledge graph CRUD + queries
      graph_etl.py                  # ETL: PostgreSQL/MinIO -> Neo4j graph sync
      graph_ontology_data.py        # Graph ontology seed data

      # --- lex/ — Regulatory Knowledge Layer (18 modules) ---
      lex/chunker.py                # Article text chunking
      lex/citation_verifier.py      # Citation accuracy verification
      lex/copilot_tool.py           # CopilotKit regulatory search tool
      lex/corpus_config.py          # Corpus definitions (EU + national AML laws)
      lex/embedder.py               # Text embedding via OpenAI
      lex/errors.py                 # Lex-specific error types
      lex/ingest.py                 # Corpus ingestion pipeline
      lex/pg_vector_store.py        # pgvector storage and similarity search
      lex/query_service.py          # Regulatory query execution
      lex/types.py                  # Shared Lex type definitions
      lex/fetchers/                 # Source-specific legal text fetchers
        bwb_fetcher.py              #   Dutch BWB (wetten.overheid.nl)
        eurlex_fetcher.py           #   EUR-Lex (EU regulations)
        finlex_fetcher.py           #   Finnish Finlex
        html_fetcher.py             #   Generic HTML fetcher (German GwG, etc.)
        pdf_fetcher.py              #   PDF document fetcher
        retsinformation_fetcher.py  #   Danish Retsinformation
        riigi_teataja_fetcher.py    #   Estonian Riigi Teataja
      lex/parsers/
        regulation_parser.py        # Regulation text parser (article extraction)

      # --- registries/ — European Corporate Registry Clients (8 modules) ---
      registries/ch_zefix_service.py    # Switzerland (Zefix)
      registries/cz_ares_service.py     # Czech Republic (ARES)
      registries/dk_cvr_service.py      # Denmark (CVR)
      registries/ee_ariregister_service.py # Estonia (Ariregister)
      registries/fi_ytj_service.py      # Finland (YTJ)
      registries/fr_insee_service.py    # France (INSEE/Sirene)
      registries/nl_kvk_service.py      # Netherlands (KVK)
      registries/no_brreg_service.py    # Norway (Brreg)

      # --- document_validators/ (1 module) ---
      document_validators/belgian_eid.py # Belgian eID document validation

      # --- vop_providers/ (1 module) ---
      vop_providers/mock.py         # Mock VoP provider for development

    goaml/                  # goAML STR/SAR export module
      models.py             # goAML domain models
      mapper.py             # Case data → goAML XML mapping
      xml_builder.py        # XML document construction
      validator.py          # XSD schema validation
      readiness.py          # Export readiness checks
      export_service.py     # Export orchestration
      indicator_service.py  # Suspicious activity indicators
      profile_loader.py     # Country profile loading
      indicators/           # Country-specific indicator definitions
        be_indicators.toml  #   Belgium indicators
        lu_indicators.toml  #   Luxembourg indicators
      profiles/             # Country-specific goAML profiles
        _base.toml          #   Base profile template
        be.toml             #   Belgium profile
        lu.toml             #   Luxembourg profile
      xsd/                  # goAML XML schema definitions

    prompts/                # Centralized prompt management
      registry.py           # PromptRegistry singleton (DB-backed with FS fallback)
      schemas.py            # Prompt version schemas
      seed.py               # Default prompt seeding
      templates/            # 29 Jinja2 prompt templates
        osint_legacy.jinja2
        synthesis.jinja2
        task_generator.jinja2
        document_validator.jinja2
        mcc_classifier.jinja2
        dashboard.jinja2
        ... (29 templates total)

    workflows/              # Temporal workflow and activity definitions
      compliance_case.py    # ComplianceCaseWorkflow (1,036 lines)
      activities.py         # 14 activity functions (2,459 lines)

    db/
      database.py           # SQLAlchemy async engine + session factory
      models.py             # SQLAlchemy ORM models (50 models, DeclarativeBase)
      repositories/         # Repository pattern (generic CRUD)
        base.py             # BaseRepository[T] — generic async CRUD operations
        user_repo.py        # UserRepository — user-specific queries

    alembic/                # Database migration management
      env.py                # Async migration runner
      versions/             # 50 migration files (001–050 covering full schema evolution)

    exceptions.py           # Custom exception hierarchy (TrustRelayError + subtypes)

    data/                   # Static reference data
      nace_to_mcc.py        # NACE-to-MCC mapping table

    mcp_servers/            # MCP server scripts
      northdata.py          # NorthData MCP tool definitions

    templates/              # HTML templates
      compliance_report.html # PDF report template
      audit_ledger_v2.html  # Audit ledger report
      belgian_evidence.html # Belgian evidence report
      peppol_evidence.html  # PEPPOL evidence report
      trust_capsule.html    # Trust Capsule report
      tax_capsule.html      # Tax capsule report
      report_base.css       # Shared report CSS

    config.py               # pydantic-settings configuration (344 lines)
    main.py                 # FastAPI app + middleware + lifespan (173 lines)
    worker.py               # Temporal worker entry point
```

## Layer Responsibilities

### API Layer (`app/api/`)

FastAPI routers that handle HTTP requests, validate input, and delegate to Temporal or services. The API is organized into 41 focused routers with 238 endpoints:

| Router | Endpoints | Responsibility |
|--------|-----------|---------------|
| `case_crud.py` | 8 | Create, list, get, delete cases |
| `case_decisions.py` | 7 | Decision submission, MCC classification operations, discrepancy resolution |
| `case_documents.py` | 6 | Document listing, download, markdown retrieval |
| `case_analysis.py` | 9 | Investigation results, tasks, company profile, AI brief |
| `case_evidence.py` | 9 | Evidence panel, Belgian evidence, PEPPOL results |
| `case_intelligence.py` | 1 | Decision Support Panel |
| `graph.py` | 32 | Knowledge graph queries (co-directorships, entity networks, fraud patterns, ontology, coverage) |
| `portal.py` | 6 | Customer portal document upload and submission |
| `agent.py` | 2 | CopilotKit AG-UI integration |
| `dashboard.py` | 2 | Dashboard analytics |
| `peppol.py` | 3 | PEPPOL verification API |
| `inhoudingsplicht.py` | 3 | Inhoudingsplicht standalone check |
| `scan.py` | 6 | Tiered entity scanning (Tier 0-3) |
| `confidence.py` | 1 | Confidence scoring |
| `reasoning.py` | 3 | Reasoning template CRUD |
| `intelligence.py` | 6 | Cross-case pattern detection and alerts |
| `agents.py` | 3 | Agent registry and manifests |
| `automation.py` | 5 | Supervised autonomy tier management |
| `regulatory.py` | 13 | Regulatory radar, standards mapping, impact assessment |
| `lex.py` | 9 | Regulatory knowledge layer: ingest, query, corpus status |
| `goaml.py` | 9 | goAML STR/SAR export: drafts, exports, enum mappings |
| `admin.py` | 6 | Super admin: tenant management, user CRUD |
| `admin_prompts.py` | 8 | Super admin: prompt version management, CRUD, diff |
| `branding.py` | 4 | Logo upload, color extraction, palette management |
| `capsule.py` | 3 | Trust Capsule generation and retrieval |
| `diagnostics.py` | 6 | Session diagnostics: investigation reconstruction, feedback |
| `eori.py` | 1 | EORI number validation (EU SOAP service) |
| `finding_analyses.py` | 2 | Per-finding deep analysis: list and trigger |
| `identity.py` | 4 | Identity verification (eID Easy integration) |
| `memory.py` | 17 | Episodic memory system management |
| `monitoring.py` | 8 | Continuous monitoring schedules and events |
| `onboarding.py` | 3 | Tenant setup wizard onboarding state |
| `sanctions.py` | 2 | Sanctions screening |
| `shipments.py` | 4 | Per-shipment customs compliance (Module B) |
| `signal_capture.py` | 1 | Officer action signal capture |
| `templates.py` | 5 | Workflow template CRUD |
| `tenants.py` | 9 | Tenant management (Pillar 0 multi-tenancy) |
| `transactions.py` | 6 | Precious metals transaction API |
| `vop.py` | 2 | Verification of Payee: single + batch check |
| `workflow_templates.py` | 6 | Workflow template CRUD (Pillar 0) |
| `risk_config.py` | 9 | Versioned risk configuration CRUD, activation, and audit log |
| `health.py` | 1 | Health check |

All officer-facing routers use the `get_current_user` authentication dependency and the IP-based rate limiter middleware.

### Agent Layer (`app/agents/`)

21 PydanticAI agents, each following a consistent pattern:

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

116 service modules encapsulating external integrations and business logic, organized into subdirectories by domain. Services are injected via FastAPI's `Depends()` pattern.

| Subdirectory | Modules | Purpose |
|-------------|---------|---------|
| *(root)* | 88 | Core business logic, integrations, and domain services |
| `lex/` | 18 | Regulatory Knowledge Layer: ingestion, chunking, embedding, querying |
| `lex/fetchers/` | 7 | Source-specific legal text fetchers (EUR-Lex, BWB, Finlex, etc.) |
| `lex/parsers/` | 1 | Regulation text parsing and article extraction |
| `registries/` | 8 | European corporate registry clients (CH, CZ, DK, EE, FI, FR, NL, NO) |
| `document_validators/` | 1 | Document type validators (Belgian eID) |
| `vop_providers/` | 1 | Verification of Payee provider implementations |

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

### goAML Module (`app/goaml/`)

A self-contained module for generating goAML-compliant STR (Suspicious Transaction Report) and SAR (Suspicious Activity Report) XML exports. The module supports country-specific profiles and indicator definitions.

| File | Purpose |
|------|---------|
| `models.py` | goAML domain models |
| `mapper.py` | Case data to goAML XML mapping |
| `xml_builder.py` | XML document construction |
| `validator.py` | XSD schema validation |
| `readiness.py` | Export readiness checks (completeness validation) |
| `export_service.py` | Export orchestration |
| `indicator_service.py` | Suspicious activity indicator matching |
| `profile_loader.py` | Country profile loading (TOML-based) |

Country profiles (`profiles/be.toml`, `profiles/lu.toml`) and indicator definitions (`indicators/be_indicators.toml`, `indicators/lu_indicators.toml`) are maintained as TOML configuration files. The canonical entity models (`app/models/canonical_entities.py`) serve as the shared foundation between goAML and other modules.

### Prompt Management (`app/prompts/`)

Centralized prompt management with DB-backed versioning and filesystem fallback:

| File | Purpose |
|------|---------|
| `registry.py` | `PromptRegistry` singleton — loads prompts from DB, falls back to filesystem |
| `schemas.py` | Prompt version Pydantic schemas |
| `seed.py` | Seeds default prompts into DB on startup |
| `templates/` | 29 Jinja2 templates (one per agent) |

The admin API (`admin_prompts.py` router) provides CRUD operations for prompt version management, including diff comparison between versions.

### Workflow Layer (`app/workflows/`)

Two files define the entire Temporal integration:

- **`compliance_case.py`** (1,036 lines) -- The `ComplianceCaseWorkflow` class with signals, queries, the main run loop, and audit logging
- **`activities.py`** (2,459 lines) -- 14 activity functions that bridge Temporal and the service/agent layers

Activities include: `process_documents`, `validate_documents`, `extract_document_data`, `run_osint_investigation`, `generate_follow_up_tasks`, `classify_mcc`, `persist_audit_event`, `scrape_company_website`, `populate_knowledge_graph`, `consolidate_investigation_memory`, `compute_confidence_score`, `assign_automation_tier`, `run_peppol_verification`, and `verify_identity`.

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

#### Repository Pattern (`app/db/repositories/`)

A generic repository layer provides type-safe async CRUD operations:

| File | Purpose |
|------|---------|
| `base.py` | `BaseRepository[T]` — generic create, get, list, update, delete |
| `user_repo.py` | `UserRepository` — user-specific queries (by email, by tenant) |

Key modules (`admin.py`, `auth.py`) have been migrated to the Repository pattern. Remaining modules are being migrated incrementally.

#### ORM Models (`app/db/models.py`)

All 50 database tables have SQLAlchemy ORM models defined using `DeclarativeBase`. Key models include:

| Model | Table | Key Fields |
|-------|-------|-----------|
| `Tenant` | `tenants` | tenant_id, name, settings (JSONB), branding (JSONB) |
| `User` | `users` | user_id, tenant_id (FK), email, roles |
| `Case` | `cases` | case_id, workflow_id, company_name, status, portal_token, expires_at |
| `AuditEvent` | `audit_events` | case_id (FK), event_type, details (JSONB) |
| `MCCClassification` | `mcc_classifications` | case_id (FK), mcc_code, confidence |
| `PeppolVerification` | `peppol_verifications` | case_id (FK), enterprise_number, registered |
| `PeppolApiKey` | `peppol_api_keys` | key_hash, rate_limit_per_minute, active |
| `BelgianEvidence` | `belgian_evidence` | case_id (FK), source, data_hash, raw_data (JSONB) |
| `AgentExecution` | `agent_executions` | case_id (FK), agent_name, status, duration_ms |
| `SignalEvent` | `signal_events` | case_id (FK, nullable), signal_type, details (JSONB) |
| `CalibrationDataPoint` | `confidence_calibrations` | case_id (FK), dimension scores, methodology |
| `ReasoningTemplate` | `reasoning_templates` | template name, conditions, caps |
| `PatternAlert` | `pattern_alerts` | alert_type, severity, entity references |
| `ToolInvocation` | `tool_invocations` | agent_name, tool_name, input/output hashes |
| `GovernanceEvent` | `governance_events` | check_type, result, case_id (FK) |
| `EvOIDecision` | `evoi_decisions` | belief_state, recommended_action |
| `AutomationTier` | `automation_tiers` | officer_id, template, country, tier level |
| `WorkflowTemplateDB` | `workflow_templates` | name, description, requirements |
| `Regulation` | `regulations` | regulation_id, jurisdiction, status |
| `RegulatoryArticle` | `regulatory_articles` | regulation_id (FK), article_number, text |
| `RegulatoryObligation` | `regulatory_obligations` | article_id (FK), obligation text |
| `ScopeRule` | `scope_rules` | regulation_id (FK), rule definition |
| `RegulatoryChange` | `regulatory_changes` | regulation_id (FK), change description |
| `PersonVerification` | `person_verifications` | case_id (FK), person data, verification status |
| `PipelineStage` | `pipeline_stages` | case_id (FK), stage_name, status |
| `InvestigationFeedback` | `investigation_feedback` | case_id (FK), feedback data |
| `FindingAnalysis` | `finding_analyses` | case_id (FK), finding_id, analysis |
| `LexRegulation` | `lex_regulations` | corpus_key, title, jurisdiction |
| `LexArticle` | `lex_articles` | regulation_id (FK), article_number, text |
| `LexArticleReference` | `lex_article_references` | source/target article cross-references |
| `LexChunk` | `lex_chunks` | article_id (FK), chunk text, embedding vector |
| `LexRadarLink` | `lex_radar_links` | links between lex and regulatory radar |
| `LexIngestionLog` | `lex_ingestion_logs` | corpus_key, ingestion status, stats |
| `PromptVersion` | `prompt_versions` | prompt_key, version, template text, active flag |
| `TrustCapsule` | `trust_capsules` | case_id (FK), capsule data |
| `Shipment` | `shipments` | shipment_id, case_id (FK), customs data |
| `MonitoringEventModel` | `monitoring_events` | entity_id, event_type, details |
| `MetalTransactionModel` | `metal_transactions` | transaction data, metal type |
| `FIFOLotModel` | `fifo_lots` | lot tracking for precious metals |
| `TaxCapsulePMModel` | `tax_capsules_pm` | precious metals tax capsule |
| `SnapshotValueModel` | `snapshot_values` | point-in-time value snapshots |
| `InvestigationPerson` | `investigation_persons` | goAML canonical person entity |
| `InvestigationAccount` | `investigation_accounts` | goAML canonical account entity |
| `InvestigationAccountSignatory` | `investigation_account_signatories` | account signatory links |
| `InvestigationTransaction` | `investigation_transactions` | goAML canonical transaction entity |
| `GoAMLReportDraft` | `goaml_report_drafts` | goAML report draft state |
| `GoAMLExport` | `goaml_exports` | goAML XML export records |
| `GoAMLEnumMapping` | `goaml_enum_mappings` | goAML enum value mappings |
| `RuleEvaluation` | `rule_evaluations` | rule evaluation results |

#### Migrations (Alembic)

Database migrations are managed by Alembic with async support. The migration environment (`alembic/env.py`) uses `run_async` for async engine compatibility.

50 Alembic migrations covering the full schema evolution:

| Range | Migrations | Scope |
|-------|-----------|-------|
| 001–005 | Initial schema, token expiry, signals, agent progress, FK refinements | Core tables |
| 006–014 | Calibration, reasoning, alerts, tool invocations, governance, EVOI, automation, signals update, regulatory KB | Pillar features |
| 015–018 | Tenants/users, tenant_id columns, RLS policies, editable templates | Multi-tenancy (Pillar 0) |
| 019–021 | Diagnostics, tenant_id defaults, confidence score on cases | Refinements |
| 022–024 | Evidence tenant_id backfill, finding analyses, intelligence cache | Finding intelligence |
| 025–026 | Lex regulatory knowledge layer, prompt versions | Lex + prompt management |
| 027–028 | Service catalog, fiscal rep data | Shield features |
| 029–031 | Shipments/monitoring, precious metals, goAML canonical entities | Customs + goAML |
| seed | KYC natural person template | Template seed data |

:::note
ORM models are in place for all 50 tables. Key modules (`admin.py`, `auth.py`) have been migrated to the ORM Repository pattern (`BaseRepository[T]`), with incremental migration of remaining modules underway. See [ADR-0008](/docs/adr/0008-raw-sql) for details.
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

All configuration is managed through pydantic-settings (344 lines), reading from environment variables and `.env` files:

- Service connections (Temporal, PostgreSQL, MinIO, Redis, Neo4j)
- External API keys (OpenAI, BrightData, Tavily, NorthData, Langfuse)
- Per-agent LLM model overrides (configurable model strings)
- Mock mode flags (boolean toggles for development)
- Feature flags (`peppol_enabled`, `northdata_scrape_enabled`, etc.)
- Workflow defaults (`max_iterations`, `max_timeline_days`)
- Multi-tenancy settings (default tenant, Keycloak realm)

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
| API routing | Split into 41 focused routers (238 endpoints) | **Complete** |
| Service layer | 116 modules, FastAPI `Depends()` injection via `lru_cache` singletons | **Complete** |
| Agent layer | 21 PydanticAI agents with 29 Jinja2 prompt templates | **Complete** |
| Database | ORM models (50 tables), Alembic (50 migrations), Repository pattern (incremental migration) | **Complete** |
| goAML export | STR/SAR XML generation with country profiles and XSD validation | **Complete** |
| Prompt management | DB-backed versioning with FS fallback, admin CRUD API | **Complete** |
| Error handling | Custom exception hierarchy + structured logging | **Complete** |
| Authentication | Keycloak 26 JWT with JWKS validation, 4 RBAC roles, multi-tenant RLS | **Complete** |
| Rate limiting | IP-based sliding window (600/min auth, 200/min unauth, configurable) | **Complete** |
| Configuration | pydantic-settings with env-specific validation and per-agent model overrides | **Complete** |
| Logging | Python logging to stdout | Production: structured JSON with correlation IDs |
| Distributed rate limiting | In-memory sliding window | Production: Redis-backed for multi-instance |
