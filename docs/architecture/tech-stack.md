---
sidebar_position: 2
title: "Tech Stack"
---

# Technology Stack

## Frontend

| Technology | Version | Purpose | Maturity |
|-----------|---------|---------|----------|
| Next.js | 16 | React framework, routing, SSR capabilities | Production-ready |
| React | 19 | UI library | Production-ready |
| Tailwind CSS | v4 | Utility-first styling | Production-ready |
| shadcn/ui | latest | Component primitives (25 components installed) | Production-ready |
| CopilotKit | v1.51.4 | AI assistant integration in dashboard | PoC -- pinned at v1, v2 migration planned |
| Recharts | latest | Financial charts and analytics visualizations | Production-ready |
| Framer Motion | latest | Animations (particle background, transitions) | Production-ready |
| @uiw/react-json-view | latest | JSON data viewer for evidence display | Production-ready |
| @tanstack/react-query | v5 | Server state caching and synchronization | Production-ready |
| Axios | latest | HTTP client with typed API wrapper | Production-ready |
| TypeScript | 5.x | Type safety | Production-ready |

:::note
All frontend rendering is client-side. Next.js SSR/RSC capabilities are available but not currently leveraged -- all page components use the `"use client"` directive. The dashboard is inherently interactive (real-time pipeline visualization, CopilotKit AI chat, form-heavy workflows), making client-side rendering the natural fit. Server components may be adopted for initial data loading in future iterations.
:::

## Backend

| Technology | Version | Purpose | Maturity |
|-----------|---------|---------|----------|
| Python | 3.11+ | Runtime | Production-ready |
| FastAPI | latest | HTTP API framework | Production-ready |
| Pydantic | v2 | Data validation and serialization | Production-ready |
| pydantic-settings | latest | Configuration management (.env + env vars) | Production-ready |
| SQLAlchemy | latest (async) | Database engine, session management, and ORM models | Production-ready |
| Alembic | latest | Database migration management | Production-ready |
| asyncpg | latest | PostgreSQL async driver | Production-ready |
| uvicorn | latest | ASGI server | Production-ready |

:::note
SQLAlchemy ORM models are defined for all 7 tables in `app/db/models.py`. Alembic is configured with async support and two migrations (initial schema + portal token expiry). The current query layer uses `sqlalchemy.text()` with parameterized queries. ORM query migration is planned as a follow-up refinement.
:::

## Workflow Engine

| Technology | Version | Purpose | Maturity |
|-----------|---------|---------|----------|
| Temporal | latest | Durable workflow orchestration | Production-ready |
| temporalio (Python SDK) | >=1.9 | Workflow/activity definitions | Production-ready |
| Temporal UI | latest | Workflow monitoring dashboard | Production-ready |

Temporal was chosen over alternatives (Celery, custom state machines) for its durable execution guarantees, built-in retry policies, and signal/query pattern that maps naturally to the compliance review loop. See [ADR-0002](/docs/adr/).

## AI Layer

| Technology | Version | Purpose | Maturity |
|-----------|---------|---------|----------|
| PydanticAI | v1.60+ | Agent framework with structured outputs | Production-ready |
| AG-UI Protocol | latest | Agent-to-UI communication standard | PoC -- emerging standard |
| OpenAI GPT-4.1-mini / GPT-5.2 | latest | LLM for all 13 agents | Production-ready API |
| MCP (Model Context Protocol) | latest | Tool integration (NorthData, BrightData, Tavily) | PoC -- Anthropic protocol |

### Per-Agent Model Configuration

Each agent can be configured to use a different LLM model via environment variables:

```
REGISTRY_AGENT_MODEL=openai:gpt-5.2
SYNTHESIS_AGENT_MODEL=openai:gpt-5.2
BELGIAN_SCRAPING_AGENT_MODEL=openai:gpt-4.1-mini
```

All agents default to `openai:gpt-5.2` except the Belgian scraping agent which uses `gpt-4.1-mini` for cost efficiency. In test mode, all agents use PydanticAI's `TestModel`.

## Data Layer

| Technology | Version | Purpose | Maturity |
|-----------|---------|---------|----------|
| PostgreSQL | 16 | Relational data (cases, audit events, evidence, MCC, PEPPOL) | Production-ready |
| Neo4j | 2026 (Community) | Knowledge graph for cross-case entity analytics | Production-ready |
| MinIO | latest | S3-compatible object storage for documents | Production-ready |
| Redis | 8 (Alpine) | Cache layer (PEPPOL, inhoudingsplicht results) | Production-ready |

### Database Schema (7 tables)

| Table | Purpose |
|-------|---------|
| `cases` | Case metadata, status, portal tokens |
| `audit_events` | Timestamped event log per case |
| `mcc_classifications` | MCC code assignments with confidence and officer overrides |
| `peppol_verifications` | PEPPOL directory lookup results |
| `peppol_api_keys` | API key management for PEPPOL service |
| `belgian_evidence` | SHA-256 hashed evidence from Belgian official sources |
| `agent_executions` | Agent pipeline execution tracking for observability |

## Scraping and Data Acquisition

| Technology | Purpose | Used For |
|-----------|---------|----------|
| crawl4ai | Async web crawler with stealth mode | Belgian Gazette, Inhoudingsplicht |
| BrightData MCP | Commercial scraping with bot protection bypass | Crunchbase enrichment, LinkedIn validation |
| httpx | Async HTTP client | NBB CBSO REST API (direct, no scraping needed) |
| KBO scraper | Custom HTML parser | Belgian company registry |

:::tip
Each data source uses the scraping tool best suited to its protection level. See the [OSINT Pipeline](/docs/architecture/osint-pipeline) page for the full allocation table and rationale.
:::

## Testing

| Technology | Purpose | Scope |
|-----------|---------|-------|
| pytest | Backend test runner | 943+ tests |
| Testcontainers | Isolated database containers for integration tests | PostgreSQL integration tests |
| respx | HTTP mock library for httpx | OSINT and scraping service tests |
| PydanticAI TestModel | Deterministic AI agent testing | All 13 agents |
| Jest | Frontend test runner | 228+ tests |
| React Testing Library | Component testing | 27 dashboard components + portal components |
| Playwright | End-to-end browser testing | 6 E2E specs |

### Test Safety Mechanisms

- `ALLOW_MODEL_REQUESTS=False` environment variable prevents accidental real LLM calls in tests
- PydanticAI `TestModel` returns deterministic outputs matching agent output schemas
- `asyncio_mode=auto` in pytest.ini eliminates need for `@pytest.mark.asyncio` decorators
- Temporal `WorkflowEnvironment.start_time_skipping()` for workflow tests without real timers

## Infrastructure

| Technology | Purpose | Port |
|-----------|---------|------|
| Docker Compose | Local development orchestration | -- |
| Next.js dev server | Frontend development | 3001 |
| uvicorn | Backend development | 8002 |
| Temporal Server | Workflow execution | 7233 |
| Temporal UI | Workflow monitoring | 8080 |
| PostgreSQL | Database | 5432 |
| MinIO API | Object storage | 9000 |
| MinIO Console | Storage management UI | 9001 |
| Redis | Cache | 6379 |

:::tip Infrastructure Improvements (Phase 6)
- GitHub Actions CI pipeline with 4 jobs (backend-tests, frontend-tests, lint, build)
- Docker Compose health checks with `condition: service_healthy` dependencies
- Multi-stage Docker builds for backend and frontend
- Testcontainers integration for isolated PostgreSQL in tests
:::

:::tip Production Readiness
Log aggregation (structured JSON logging with correlation IDs) and HTTPS termination (via reverse proxy) are planned for the production deployment phase. See [Deployment](/docs/architecture/deployment) for the full production roadmap.
:::
