---
sidebar_position: 1
title: "Atlas — Product Overview"
description: "Atlas is an AI-powered KYC/KYB/AML compliance investigation platform with parallel OSINT modules, ontology-driven entity resolution, EBA risk scoring, declarative workflows, and knowledge graph exploration."
last_verified: 2026-04-08
status: reference
---

# Atlas — Product Overview

Atlas is an AI-powered KYC/KYB/AML compliance investigation platform. It automates due diligence by deploying specialized AI agents against target companies, reconciling discovered entities into a unified knowledge graph, scoring risk through a configurable EBA-aligned matrix, and presenting findings through an analyst-focused dashboard.

## Core Capabilities

Atlas provides six pillars of compliance automation:

1. **Parallel OSINT Investigation** -- 7 specialized AI modules execute simultaneously via Temporal, each researching a different compliance dimension. A full investigation completes in the time of its slowest module, not the sum of all modules.

2. **Ontology-Driven Entity Resolution** -- A versioned YAML schema defines entity types, attributes, relationships, and survivorship rules. Entities discovered by multiple modules are deduplicated through blocking-key matching, fuzzy scoring, and trust-weighted field resolution into canonical "golden records."

3. **EBA 5-Dimension Risk Matrix** -- Deterministic risk scoring across Customer, Geographic, Product/Service, Delivery Channel, and Transaction dimensions. Every evaluation produces four SHA-256 audit hashes for independent verification and tamper detection.

4. **Declarative Workflow Engine** -- Compliance workflows are defined as YAML schemas, compiled into parallel execution plans with topological sorting, and interpreted by a generic Temporal workflow. Supports investigation phases, human review gates with SLA escalation, automated rule evaluation, customer portal data collection, and post-decision actions.

5. **Knowledge Graph** -- Investigation entities are synced to Neo4j as a detached child workflow, enabling relationship traversal, ownership chain analysis, risk propagation across entity networks, and Cypher-powered exploration.

6. **Company Portfolio Management** -- A persistent company registry tracks all investigated entities across time, with investigation history, risk score evolution, and entity freshness monitoring.

## The 8 Investigation Modules

Atlas decomposes a KYB investigation into 7 parallel research modules plus a Summary synthesis step. Each module is an AI agent backed by a `ModuleConfig` dataclass that defines its prompts, result model, and dependencies. All 7 run concurrently as Temporal activities with no inter-module dependencies.

```mermaid
flowchart LR
    subgraph Input["Investigation Request"]
        REQ["Company Name<br/>Registration Number<br/>Country Code<br/>Website"]
    end

    subgraph Enrichment["Pre-Enrichment"]
        ENR["Data Provider<br/>Context Fetch"]
    end

    subgraph Modules["7 Parallel Modules"]
        direction TB
        CIR["CIR<br/>Corporate Identity<br/>& Registration"]
        ROA["ROA<br/>Registered &<br/>Operational Addresses"]
        MEBO["MEBO<br/>Management, Employees<br/>& Beneficial Owners"]
        FRLS["FRLS<br/>Financial, Regulatory<br/>& Licensing Status"]
        AMLRR["AMLRR<br/>Adverse Media,<br/>Litigation & Rep Risk"]
        SPEPWS["SPEPWS<br/>Sanctions, PEP &<br/>Watchlist Screening"]
        DFWO["DFWO<br/>Digital Footprint &<br/>Website Ownership"]
    end

    subgraph PostProcess["Post-Processing"]
        RECON["Entity Reconciliation"]
        RISK["Risk Scoring"]
        SYNC["Neo4j Sync"]
        SUM["Summary &<br/>Report Generation"]
    end

    REQ --> ENR --> Modules
    Modules --> RECON --> RISK --> SYNC --> SUM

    style Input fill:#1e3a5f,stroke:#38bdf8,color:#fff
    style Enrichment fill:#2d4a3e,stroke:#34d399,color:#fff
    style Modules fill:#3b1a5f,stroke:#a78bfa,color:#fff
    style PostProcess fill:#5f3a1e,stroke:#f59e0b,color:#fff
```

### Module Details

| Module | Full Name | What It Investigates |
|--------|-----------|---------------------|
| **CIR** | Corporate Identity & Registration | Official company registration data -- legal name, incorporation date, registration number, jurisdiction, company type, current status. Discovers directors and shareholders from registry sources. |
| **ROA** | Registered & Operational Addresses | Registered office address vs. actual operational locations. Flags virtual offices, mismatches between registered and operational addresses, multi-jurisdictional presence. |
| **MEBO** | Management, Employees & Beneficial Owners | Directors, officers, beneficial owners, ownership structures. Identifies complex ownership chains, nominee arrangements, and cross-directorship networks. |
| **FRLS** | Financial, Regulatory & Licensing Status | Financial filings, regulatory licenses, credit ratings, compliance history. Checks whether the company holds required licenses for its stated activities. |
| **AMLRR** | Adverse Media, Litigation & Reputational Risk | News media screening, court records, litigation history. Scans for negative press, fraud allegations, regulatory actions, and reputational concerns. |
| **SPEPWS** | Sanctions, PEP & Watchlist Screening | Sanctions lists (OFAC, EU, UN), Politically Exposed Persons databases, and other watchlists. Screens the company and its officers/owners against global sanctions and PEP databases. |
| **DFWO** | Digital Footprint & Website Ownership | Website WHOIS data, domain registration history, SSL certificates, social media presence. Verifies that digital presence matches claimed business identity. |
| **Summary** | Summary & Report Synthesis | Not a separate research module. This is the post-processing step that aggregates findings from all 7 modules, generates a two-stage report (structured extraction then narrative synthesis), and produces the final compliance assessment with WeasyPrint PDF export. |

Each module produces a typed Pydantic result model (e.g., `CIRModuleResult`, `ROAModuleResult`) containing structured findings, risk indicators with severity levels, data quality scores, and source attribution. Risk indicators use a unified `RiskIndicator` model with category, severity, title, description, evidence, and linked entity fields.

## Investigation Lifecycle

```mermaid
sequenceDiagram
    actor Officer as Compliance Officer
    participant API as Atlas API
    participant TW as Temporal Workflow
    participant EN as Enrichment
    participant MOD as 7 Parallel Modules
    participant REC as Reconciliation
    participant RISK as Risk Scoring
    participant NEO as Neo4j Sync

    Officer->>API: POST /investigations
    API->>API: Create DB record
    API->>TW: Start InvestigationWorkflow
    API-->>Officer: 202 Accepted

    TW->>EN: Fetch enrichment data
    EN-->>TW: Provider context

    par All modules in parallel
        TW->>MOD: CIR + ROA + MEBO + FRLS + AMLRR + SPEPWS + DFWO
    end
    MOD-->>TW: 7 ModuleOutputs

    TW->>REC: Entity reconciliation
    REC-->>TW: Golden records

    TW->>RISK: Risk scoring (EBA matrix)
    RISK-->>TW: Overall score + level

    TW->>TW: Persist results to DB

    TW->>NEO: Start Neo4j sync (detached child)

    TW-->>API: InvestigationOutput
    API-->>Officer: Investigation complete
```

### Key Design Decisions

1. **All modules run in parallel** -- no inter-module dependencies. Each module discovers entities independently, and reconciliation merges duplicates after all complete.
2. **Enrichment is optional** -- if a registration number is provided, Atlas pre-fetches data from providers (NorthData, etc.) to seed module context. Otherwise, modules discover independently.
3. **Ontology validation with feedback loops** -- LLM output is validated against the active schema. If validation fails, the agent receives feedback and retries.
4. **Neo4j sync is non-blocking** -- graph sync runs as a detached child workflow with `ParentClosePolicy.ABANDON`, so the investigation completes immediately regardless of graph sync status.

## Pre-Enrichment Pipeline

When an investigation includes a registration number and country code, Atlas runs a pre-enrichment step before launching modules. This fetches structured company data from data providers (NorthData, official registries) and distributes the enriched context to all modules. Pre-enrichment reduces redundant external lookups across modules and provides higher-quality seed data for LLM agents.

## Post-Processing Pipeline

After all 7 modules complete, four processing stages transform raw agent outputs into structured, deduplicated, risk-scored knowledge:

1. **Ontology Population** -- The `EntityPopulator` extracts typed entities (Company, Person, Address, Domain, SanctionsMatch, PEPExposure, AdverseMedia) from module outputs and persists them to the ontology tables with full provenance metadata.

2. **Entity Reconciliation** -- The `EntityMatcher` generates blocking keys for efficient candidate generation, then applies fuzzy scoring with configurable thresholds. The `SurvivorshipResolver` merges duplicates using trust-weighted field resolution into canonical golden records.

3. **Risk Scoring** -- Two-layer scoring: rule-based aggregation from module risk levels and indicators, plus structured EBA matrix evaluation across 5 dimensions with per-factor weights and SHA-256 audit hashes.

4. **Neo4j Graph Sync** -- All entities and relationships are synced to the knowledge graph as a detached child workflow, enabling relationship traversal, ownership chain analysis, and cross-investigation entity linking.

## Product Areas

Atlas organizes its interface into 7 major areas, each corresponding to a section of the left navigation.

```mermaid
flowchart TD
    subgraph Dashboard["Dashboard"]
        D1["Investigation stats"]
        D2["Recent activity"]
        D3["Risk overview"]
    end

    subgraph Investigations["Investigations"]
        I1["Investigation list"]
        I2["Investigation detail"]
        I3["Module results & transcripts"]
        I4["Report generation & PDF export"]
    end

    subgraph Companies["Companies"]
        C1["Company registry & portfolio"]
        C2["Company detail & timeline"]
        C3["Ownership chains"]
        C4["Investigation history"]
    end

    subgraph RiskCenter["Risk Center"]
        R1["Portfolio risk dashboard"]
        R2["Risk by category / jurisdiction"]
        R3["Risk timeline evolution"]
        R4["Risk network graph"]
    end

    subgraph Graph["Graph Explorer"]
        G1["Entity search"]
        G2["Relationship traversal"]
        G3["Ownership chains"]
        G4["Common connections"]
    end

    subgraph Studio["Compliance Studio"]
        S1["Workflow builder & schemas"]
        S2["Source & mapping configuration"]
        S3["Risk matrix editor"]
        S4["Evaluation studio"]
    end

    subgraph Settings["Settings"]
        ST1["MCP server management"]
        ST2["Agent & prompt configuration"]
        ST3["Ontology schema versioning"]
        ST4["Reference data management"]
    end

    style Dashboard fill:#1e3a5f,stroke:#38bdf8,color:#fff
    style Investigations fill:#3b1a5f,stroke:#a78bfa,color:#fff
    style Companies fill:#2d4a3e,stroke:#34d399,color:#fff
    style RiskCenter fill:#5f3a1e,stroke:#f59e0b,color:#fff
    style Graph fill:#4a1a3b,stroke:#ec4899,color:#fff
    style Studio fill:#1a3b4a,stroke:#06b6d4,color:#fff
    style Settings fill:#3b3b1a,stroke:#eab308,color:#fff
```

### Dashboard

The landing page provides operational overview: active investigation count and status breakdown, recent investigation activity feed, portfolio risk statistics, and a quick-start investigation form.

### Investigations

The investigation domain covers the full lifecycle: creating investigations with company details and module selection, monitoring progress, reviewing per-module results with LLM transcripts, exploring discovered entities against the ontology, and generating PDF compliance reports.

### Companies

The company registry maintains a persistent portfolio of all investigated entities. Each company has a detail page with timeline, ownership chain visualization, entity graph, and historical investigation results. Jurisdiction badges, risk level tags, and data freshness indicators surface key information at the list level.

### Risk Center

A multi-view risk analysis workspace with five perspectives: portfolio-level risk distribution (pie/spider charts), category-level breakdown (bar charts), jurisdiction-level aggregation, risk score evolution timeline, and entity-level risk network graph showing risk propagation through ownership chains.

### Graph Explorer

Entity relationship visualization powered by Cytoscape.js with three layout engines (force-directed, hierarchical, compound). Supports entity search, ownership chain drill-down, shared address/director discovery, common connections between entities, and risk network overlay.

### Compliance Studio

A unified workspace for compliance configuration:

| Tab | Purpose |
|-----|---------|
| **Sources** | Data provider configuration and testing |
| **Mappings** | Source-to-ontology field mapping designer |
| **Matrices** | Risk matrix schema CRUD with versioning |
| **Risk Inputs** | Configure risk scoring input fields |
| **Evaluations** | Run and review risk evaluations |
| **Workflows** | Workflow schema management, visual builder, and AI-powered schema generation |

### Settings

Platform configuration covering LLM providers and model selection, MCP server management with health checks, agent prompt templates, per-agent tool and model overrides, ontology schema versioning, business segments, data provider credentials, reference datasets, and pipeline configuration.

## Version History

Atlas has shipped 16 milestones across 83 development phases with 105+ Flyway database migrations.

| Version | Milestone | Key Capabilities |
|---------|-----------|-----------------|
| **v1.0** | Foundation | FastAPI backend, 7 OSINT modules, Temporal orchestration, basic investigation pipeline |
| **v1.5** | Entity Resolution | Ontology schema v1, entity population from module outputs, basic deduplication |
| **v2.0** | Knowledge Graph | Neo4j integration, graph sync as detached child workflow, Cytoscape.js explorer |
| **v2.5** | Risk Engine | EBA 5-dimension risk matrix, deterministic scoring with SHA-256 hashes, reference data registry |
| **v3.0** | Workflow Studio | YAML schema compiler, DynamicComplianceWorkflow, review gates with SLA escalation |
| **v3.2** | MCP Resilience | Circuit breakers (PyBreaker), retry with backoff (Tenacity), tool availability tracking |
| **v3.5** | Ontology v3 | Trust entities, document tracking, survivorship strategies, field-level lineage |
| **v3.8** | Portfolio Management | Company registry, batch risk re-evaluation, portfolio-level analytics |
| **v4.0** | Workflow Builder | AI-powered schema generation from regulatory documents, semantic validation |
| **v4.2** | Multi-Tenant | Keycloak RBAC integration, tenant-aware reference data resolution, role-based task routing |
| **v4.3** | Report Generation | Two-stage report pipeline (extraction + synthesis), WeasyPrint PDF export, quality scoring |
| **v4.4** | Mutation Queue | Field-level mutation pipeline with provenance tracking, conflict detection, merge strategies |
| **v4.5** | Observability | Self-hosted Langfuse with ClickHouse backend, full LLM tracing, cost tracking |
| **v4.6** | Dynamic Risk Categories | Configurable risk categories, per-tenant risk customization, category-level analytics |

**Current version: v4.6 (Dynamic Risk Categories)**

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, asyncpg |
| **AI Framework** | LangChain 1.2 + LangGraph 1.0 |
| **Workflow Engine** | Temporal (2 workers: investigation + workflow engine) |
| **Database** | PostgreSQL 15, Neo4j 5.18, Redis 7 |
| **Object Storage** | MinIO |
| **LLM Gateway** | OpenRouter (multi-provider routing) |
| **Frontend** | React 18, Blueprint.js v5, Vite, TypeScript |
| **State Management** | Zustand + TanStack React Query v5 |
| **Graph Visualization** | Cytoscape.js (3 layout engines) |
| **Authentication** | Keycloak 26 (JWT/OIDC, RBAC) |
| **Observability** | Langfuse 3 (self-hosted with ClickHouse) |
| **PDF Generation** | WeasyPrint |
| **Migrations** | Flyway 10 (105+ SQL migrations) |

## Reading Guide

- **[System Architecture](./architecture)** -- deep dive into layered architecture, domain organization, deployment topology, data flow, and architectural decisions
- **[Technology Stack](./tech-stack)** -- complete dependency inventory across backend, frontend, and infrastructure
- **[Investigation Pipeline](./investigation-pipeline)** -- detailed walkthrough of every investigation stage from request to report
- **[Ontology & Entity Resolution](./ontology-system)** -- entity schema, matching, reconciliation, and survivorship rules
- **[Risk Engine](./risk-engine)** -- EBA matrix dimensions, scoring pipeline, determinism proofs, and portfolio risk
- **[Workflow Engine](./workflow-engine)** -- YAML schema authoring, compilation, execution engine, and task routing
- **[Frontend Architecture](./frontend)** -- React SPA structure, page hierarchy, state management, and visualization
- **[Graph Database](./graph-database)** -- Neo4j integration, sync pipeline, Cypher queries, and parity checks
- **[API Reference](./api-reference)** -- complete endpoint inventory across all 30+ domain routers
