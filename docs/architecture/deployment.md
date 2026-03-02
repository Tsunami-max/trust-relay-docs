---
sidebar_position: 12
title: "Deployment"
---

# Deployment

The application runs locally via Docker Compose with 9 services. This page documents the current setup and the production deployment roadmap.

## Docker Compose Architecture

```mermaid
graph TB
    subgraph compose["Docker Compose"]
        FE["frontend<br/>Next.js (3001)"]
        BE["backend<br/>FastAPI (8002)"]
        WK["worker<br/>Temporal Worker"]
        TM["temporal<br/>Server (7233)"]
        TU["temporal-ui<br/>Dashboard (8080)"]
        PG["postgres<br/>PostgreSQL 16 (5432)"]
        MN["minio<br/>S3 Storage (9000/9001)"]
        RD["redis<br/>Cache (6379)"]
    end

    FE --> BE
    BE --> TM
    WK --> TM
    BE --> PG
    WK --> PG
    BE --> MN
    WK --> MN
    WK --> RD
    TM --> PG
```

## Service Configuration

| Service | Image | Ports | Depends On | Health Check |
|---------|-------|-------|-----------|--------------|
| `frontend` | `./frontend` (multi-stage build) | 3001 | backend (service_healthy) | HTTP GET /api/health |
| `backend` | `./backend` (multi-stage build) | 8002 | temporal, postgres, minio (service_healthy) | HTTP GET /health |
| `worker` | `./backend` (multi-stage build) | -- (no ports) | temporal, postgres, minio (service_healthy) | Process check |
| `temporal` | `temporalio/auto-setup:latest` | 7233 | postgres (service_healthy) | TCP port 7233 |
| `temporal-ui` | `temporalio/ui:latest` | 8080 | temporal (service_healthy) | HTTP GET / |
| `postgres` | `postgres:16` | 5432 | -- | `pg_isready` |
| `neo4j` | `neo4j:2026-community` | 7474, 7687 | -- | `cypher-shell` |
| `minio` | `minio/minio:latest` | 9000, 9001 | -- | `mc ready local` |
| `redis` | `redis:8-alpine` | 6379 | -- | `redis-cli ping` |

## Port Assignments

| Port | Service | Notes |
|------|---------|-------|
| 3001 | Frontend (Next.js) | Ports 3000 reserved for other applications |
| 8002 | Backend (FastAPI) | Port 8000 reserved for other applications |
| 7233 | Temporal Server | gRPC endpoint |
| 7474 | Neo4j Browser | Web UI for graph exploration |
| 7687 | Neo4j Bolt | Bolt protocol for driver connections |
| 8080 | Temporal UI | Web dashboard for workflow monitoring |
| 5432 | PostgreSQL | Shared between Temporal internal DB and application DB |
| 9000 | MinIO API | S3-compatible endpoint |
| 9001 | MinIO Console | Web UI for storage management |
| 6379 | Redis | Cache for PEPPOL and inhoudingsplicht results |

:::warning
Ports 3000 and 8000 are intentionally avoided. These are reserved for other applications running on the same development machine.
:::

## Startup

### Docker Compose (Full Stack)

```bash
docker-compose up -d
```

This starts all 8 services. The database schema is automatically initialized via the `init_db.sql` script mounted into PostgreSQL's `docker-entrypoint-initdb.d`.

### Development Mode (Recommended)

For active development, run the infrastructure in Docker and the application locally:

```bash
# Start infrastructure only
docker-compose up -d postgres temporal temporal-ui minio redis

# Start backend (in one terminal)
./start-server.sh
# Equivalent to: cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload

# Start worker (in another terminal)
cd backend && python -m app.worker

# Start frontend (in another terminal)
./start-client.sh
# Equivalent to: cd frontend && npm run dev
```

### Database Initialization

The schema is defined in `scripts/init_db.sql`:

```bash
# Manual initialization (if not using docker-compose mount)
psql -U temporal -h localhost -f scripts/init_db.sql
```

The SQL file is idempotent -- it uses `CREATE TABLE IF NOT EXISTS` and `DO $$ ... END $$` blocks for safe re-execution.

### Seed Data

Demo data can be loaded for investor presentations:

```bash
cd backend && python scripts/seed_demo.py
# Creates 3 demo cases: Acme Trading, Globex Corp, NovaPay
```

## Environment Variables

### Backend (.env)

```bash
# Required
DATABASE_URL=postgresql+asyncpg://temporal:temporal@localhost:5432/trustrelay
TEMPORAL_HOST=localhost
TEMPORAL_PORT=7233
MINIO_ENDPOINT=localhost:9000

# AI (required for real agent execution)
OPENAI_API_KEY=sk-...
LLM_API_KEY=sk-...

# External services (optional, mock mode works without these)
BRIGHTDATA_API_TOKEN=...
TAVILY_API_KEY=...
NORTHDATA_API_KEY=...

# Mock modes (all default to true for development)
OSINT_MOCK_MODE=true
MCC_MOCK_MODE=true
TASK_GENERATOR_MOCK_MODE=true
DOC_VALIDATION_MOCK_MODE=true
BELGIAN_MOCK_MODE=true
PEPPOL_MOCK_MODE=true
BRIGHTDATA_MOCK_MODE=true
TAVILY_MOCK_MODE=true
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8002
```

## Persistent Volumes

Docker Compose uses named volumes for data persistence:

| Volume | Mounted At | Purpose |
|--------|-----------|---------|
| `postgres_data` | `/var/lib/postgresql/data` | Database files |
| `minio_data` | `/data` | Uploaded documents and evidence |
| `redis_data` | `/data` | Cache persistence |

## CI/CD Pipeline (GitHub Actions)

The project has a GitHub Actions CI pipeline (`.github/workflows/ci.yml`) that runs on every push and pull request to `master`:

```mermaid
graph LR
    BT["Backend Tests<br/>(pytest + coverage)"] --> Build
    FT["Frontend Tests<br/>(Jest)"] --> Build
    LN["Lint<br/>(ruff + eslint)"] --> Build
    Build["Docker Build<br/>(compose build)"]
```

### 4 CI Jobs

| Job | What It Does | Key Details |
|-----|-------------|-------------|
| **backend-tests** | Runs pytest with coverage | PostgreSQL 16 + Redis 8 service containers, `--cov-fail-under=70` |
| **frontend-tests** | Runs Jest | `npm test -- --watchAll=false --ci` |
| **lint** | Ruff (backend) + ESLint (frontend) | Runs in parallel with tests |
| **build** | Docker Compose build | Runs after all 3 previous jobs pass |

The pipeline uses concurrency groups (`ci-${{ github.ref }}`) to cancel superseded runs automatically. All mock modes are enabled in CI to avoid external API calls.

## Docker Health Checks

All services have `HEALTHCHECK` directives with `condition: service_healthy` dependencies:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
    interval: 10s
    timeout: 5s
    retries: 5
  depends_on:
    postgres:
      condition: service_healthy
    temporal:
      condition: service_healthy
    minio:
      condition: service_healthy
```

This ensures services only start after their dependencies are healthy, eliminating race conditions during startup.

## Multi-Stage Docker Builds

Both backend and frontend use multi-stage Dockerfiles:

- **Backend:** `python:3.11-slim` base, installs only production dependencies, copies built wheel
- **Frontend:** Build stage with `npm run build`, production stage with standalone Next.js output

This reduces image sizes and eliminates development dependencies from production containers.

## Testcontainers

20 integration tests use Testcontainers for isolated PostgreSQL instances per test run. macOS Docker Desktop is automatically detected via `~/.docker/run/docker.sock`:

```python
@pytest.fixture
async def integration_db():
    async with PostgresContainer("postgres:16") as pg:
        engine = create_async_engine(pg.get_connection_url())
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with async_sessionmaker(engine)() as session:
            yield session
```

In CI, GitHub Actions service containers serve the same purpose with less overhead. Testcontainers is primarily used for local development testing where Docker Desktop provides the container runtime.

## Production Infrastructure Enhancements

The following enhancements are planned for the production deployment phase:

- **Log aggregation**: Structured JSON logging with correlation IDs, forwarded to a log aggregation service (ELK, Datadog, or similar)
- **HTTPS termination**: TLS termination at the load balancer or reverse proxy layer

## Production Deployment Roadmap

| Phase | Infrastructure | Status |
|-------|---------------|--------|
| **Phase 1** | GitHub Actions CI (test + lint + build) | **Done** |
| **Phase 2** | Multi-stage Docker builds, health checks | **Done** |
| **Phase 3** | Kubernetes deployment (Helm charts) | Planned |
| **Phase 4** | TLS termination, load balancer, DNS | Planned |
| **Phase 5** | Log aggregation, APM, alerting | Planned |
| **Phase 6** | Temporal Cloud (managed) or self-hosted Temporal cluster | Planned |

### Temporal Cloud Option

For production, Temporal Cloud eliminates the operational burden of running and scaling the Temporal server. The only change required is updating the connection configuration:

```python
# From self-hosted:
temporal_host: str = "localhost"
temporal_port: int = 7233

# To Temporal Cloud:
temporal_host: str = "your-namespace.tmprl.cloud"
temporal_port: int = 7233
# + mTLS certificate configuration
```
