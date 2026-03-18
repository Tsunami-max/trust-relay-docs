---
sidebar_position: 10
title: "Deployment Runbook"
description: "Step-by-step recipe for deploying Trust Relay on a fresh server — written for AI-assisted setup"
---

# Trust Relay — Deployment Runbook

This runbook is written so that an AI assistant (or a developer following it mechanically) can bring up a complete Trust Relay environment on a fresh server. Follow the steps in order. Do not skip sections — each step produces state that later steps depend on.

---

## Prerequisites

Install the following before starting:

| Tool | Minimum Version | Notes |
|---|---|---|
| Docker + Docker Compose | Docker 24+, Compose v2 | `docker compose` (not `docker-compose`) |
| Node.js | 18+ | Required for frontend build and `npm` |
| Python | 3.11+ | Required for backend and scripts |
| Git | Any recent version | Read access to the Trust Relay repository |

Verify all are present:

```bash
docker --version
docker compose version
node --version
python3 --version
git --version
```

---

## Step 1: Clone and Configure

### 1.1 Clone the repository

```bash
git clone <repository-url> trust-relay-workflow
cd trust-relay-workflow
```

### 1.2 Create the environment file

```bash
cp .env.example .env
```

### 1.3 Configure environment variables

Open `.env` and set the following. Every variable listed here is required — the backend will refuse to start if critical values are missing.

**Database**

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/trust_relay
```

**MinIO (object storage)**

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=trust-relay
MINIO_SECURE=false
```

**Temporal (workflow engine)**

```env
TEMPORAL_HOST=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=compliance-workflow
```

**Redis**

```env
REDIS_URL=redis://localhost:6379/0
```

**Keycloak (authentication)**

```env
KEYCLOAK_URL=http://localhost:8180
KEYCLOAK_REALM=trust-relay
KEYCLOAK_CLIENT_ID=trust-relay-backend
KEYCLOAK_CLIENT_SECRET=<from-keycloak-admin>
```

**OpenAI (AI layer)**

```env
OPENAI_API_KEY=sk-...
```

**CORS**

```env
CORS_ORIGINS=http://localhost:3001
```

**Feature flags (safe defaults for development)**

```env
OSINT_MOCK_MODE=true
CASE_INTELLIGENCE_MOCK_MODE=true
NEO4J_ENABLED=false
```

**Neo4j (optional — set `NEO4J_ENABLED=true` to activate)**

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j
```

---

## Step 2: Start Infrastructure

### 2.1 Launch all services

```bash
docker compose up -d
```

This starts: PostgreSQL 16 with pgvector, Temporal server, Temporal UI, MinIO, Redis, Keycloak, and Neo4j.

### 2.2 Wait for services to become healthy

Wait approximately 60 seconds after the first start. Then verify:

```bash
docker compose ps
```

All services should show status `healthy` or `running`. If any service shows `restarting`, check its logs:

```bash
docker compose logs <service-name> --tail=50
```

### 2.3 Verify key endpoints

```bash
# PostgreSQL
docker compose exec postgres pg_isready -U postgres

# Temporal UI
curl -s http://localhost:8080 | head -5

# MinIO
curl -s http://localhost:9000/minio/health/live

# Keycloak
curl -s http://localhost:8180/realms/master
```

All should return 200 or a valid response without connection errors.

---

## Step 3: Database Setup

### 3.1 Install backend dependencies

```bash
cd backend
pip install -e ".[dev]"
```

### 3.2 Run all Alembic migrations

```bash
cd backend
alembic upgrade head
```

This applies all migrations in sequence. As of this writing there are 25 migrations covering the core schema, all feature pillars, the RLS policies for multi-tenancy, and the Lex regulatory knowledge layer tables.

Expected output ends with something like:

```
INFO  [alembic.runtime.migration] Running upgrade 024_add_intelligence_cache -> 025_add_lex_knowledge_layer
INFO  [alembic.runtime.migration] Done.
```

### 3.3 Verify the schema

```bash
cd backend
python -c "
import asyncio
from app.db.database import get_session

async def check():
    async with get_session() as session:
        result = await session.execute(
            __import__('sqlalchemy').text(
                \"SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'\"
            )
        )
        count = result.scalar()
        print(f'Tables created: {count}')
        assert count >= 33, f'Expected 33+ tables, got {count}'
        print('Schema verification passed.')

asyncio.run(check())
"
```

### 3.4 Seed demo data

```bash
cd backend
python scripts/seed_showcase.py
```

This creates: demo tenants, demo officers with Keycloak accounts, sample cases with documents, portfolio standards, and example investigation results. Required for the showcase environment.

### 3.5 Seed regulatory radar data

```bash
cd backend
python scripts/seed_missing_regulations.py
```

This seeds the 16 EU regulations tracked by the Regulatory Radar (67 articles, 33 scope rules, 106 article entries with correct article numbers). This script is idempotent — safe to re-run.

---

## Step 4: Lex Regulatory Corpus

The Lex module ingests, structures, and indexes the full text of EU regulations. This step populates the vector store and connects Lex to the Regulatory Radar. Without this step, the Copilot cannot answer regulatory questions and the Radar pills will not show "Full text."

### 4.1 Start the backend temporarily

Open a second terminal and start the backend:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

Wait for the startup message: `Application startup complete.`

### 4.2 Obtain an auth token

```bash
TOKEN=$(curl -s -X POST http://localhost:8180/realms/trust-relay/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=trust-relay-frontend" \
  -d "username=admin@trustworks.be" \
  -d "password=admin123" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token acquired: ${TOKEN:0:20}..."
```

### 4.3 Ingest all 24 EU regulations

```bash
curl -s -X POST http://localhost:8002/api/v1/lex/ingest-all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

This is a long-running operation. Expect 5–15 minutes depending on network speed. The pipeline fetches each regulation from EUR-Lex CELLAR, parses article structure, chunks the text, generates embeddings via OpenAI `text-embedding-3-large`, and indexes into pgvector.

**Alternatively, run via Python directly (no HTTP boundary):**

```bash
cd backend
python -c "
import asyncio
from app.services.lex.ingest import LexIngestionService
from app.db.database import get_session

async def main():
    async with get_session() as session:
        svc = LexIngestionService(session)
        result = await svc.ingest_all()
        print(f'Ingested: {result.regulations_count} regulations, '
              f'{result.articles_count} articles, '
              f'{result.chunks_count} chunks')

asyncio.run(main())
"
```

### 4.4 Verify corpus statistics

```bash
curl -s http://localhost:8002/api/v1/lex/stats \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Expected output:

```json
{
  "regulations_count": 24,
  "articles_count": 2005,
  "chunks_count": 2124,
  "embedding_model": "text-embedding-3-large",
  "dimensions": 3072
}
```

If the counts are lower, the ingestion may have encountered rate limits or network errors. Re-run `ingest-all` — the pipeline is idempotent (upserts on content hash).

### 4.5 Bridge Regulatory Radar to Lex

```bash
curl -s -X POST http://localhost:8002/api/v1/lex/bridge-radar \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

This creates links between the Regulatory Radar articles and their corresponding Lex article records. Expected output:

```json
{
  "radar_articles_total": 106,
  "linked": 106,
  "coverage_pct": 100.0
}
```

### 4.6 Verify bridge coverage

```bash
curl -s http://localhost:8002/api/v1/lex/radar-coverage \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Confirm `coverage_pct` is `100.0`. If not, re-run `bridge-radar`.

### 4.7 Stop the temporary backend

Press Ctrl-C in the backend terminal. The full backend will be started properly in Step 5.

---

## Step 5: Start Backend Services

### 5.1 Start the FastAPI backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

The `--reload` flag enables hot-reload during development. Remove it for production deployments.

Verify startup:

```bash
curl -s http://localhost:8002/health | python3 -m json.tool
```

### 5.2 Start the Temporal worker

Open a second terminal. The Temporal worker must run as a separate process from FastAPI:

```bash
cd backend
python -m app.worker
```

Expected output: `Worker started. Listening on task queue: compliance-workflow`

Both processes must remain running. In production, manage both with `systemd`, `supervisor`, or the provided `docker-compose` service definitions.

---

## Step 6: Start the Frontend

```bash
cd frontend
npm install
PORT=3001 npm run dev
```

Wait for: `ready - started server on 0.0.0.0:3001`.

The frontend will not start on port 3000 — port 3000 is reserved for other applications on this machine. Always use port 3001.

---

## Step 7: Verify the Deployment

Work through each check in order. A failure at any step indicates a misconfiguration that must be resolved before proceeding.

### 7.1 Backend API docs

```
http://localhost:8002/docs
```

The Swagger UI should load showing all API routes. Verify the route count is 100+.

### 7.2 Frontend dashboard

```
http://localhost:3001
```

You should see the Keycloak login page. Log in with: `admin@trustworks.be` / `admin123`.

### 7.3 Keycloak admin console

```
http://localhost:8180
```

Admin credentials: `admin` / `admin`. Verify the `trust-relay` realm exists and contains users.

### 7.4 Temporal UI

```
http://localhost:8080
```

No auth required in development. Verify the `default` namespace is visible.

### 7.5 MinIO console

```
http://localhost:9001
```

Login: `minioadmin` / `minioadmin`. Verify the `trust-relay` bucket exists.

### 7.6 Create a test case and portal token

In the dashboard, create a new KYB case for a Belgian entity (KBO number: `0448.787.844`). After creation, the system returns a `portal_url`. Open that URL in an incognito window to verify the customer portal loads correctly.

### 7.7 Test the Copilot

In any open case in the dashboard, open the Copilot chat panel and ask:

```
What does AMLR Article 28 require for enhanced due diligence?
```

The Copilot should respond with a grounded answer citing the specific article text, not a generic description. If it responds with "I don't have access to the full regulation text," the Lex ingestion did not complete successfully — return to Step 4.

### 7.8 Verify Regulatory Radar text coverage

Navigate to a case's Regulatory Radar tab. Each regulation pill should show a "Full text" badge indicating the Lex corpus is linked. If pills show "Metadata only," the bridge step (Step 4.5) needs to be re-run.

### 7.9 Verify Portfolio Standards

Navigate to Dashboard → Portfolio Standards. Verify that 20 compliance standards are tracked with coverage indicators.

### 7.10 Lex Admin page

```
http://localhost:3001/dashboard/admin/lex
```

All 24 regulations should be visible with their article counts, last ingestion date, and link counts.

---

## Port Reference

| Service | Port | Notes |
|---|---|---|
| Frontend (Next.js) | 3001 | Never use 3000 — reserved |
| Backend (FastAPI) | 8002 | Never use 8000 — reserved |
| Keycloak | 8180 | Admin: admin/admin |
| Temporal server | 7233 | Internal gRPC — not browser |
| Temporal UI | 8080 | No auth in dev |
| PostgreSQL | 5432 | Internal — no browser |
| MinIO API | 9000 | S3-compatible endpoint |
| MinIO Console | 9001 | Login: minioadmin/minioadmin |
| Redis | 6379 | Internal — no browser |
| Neo4j HTTP | 7474 | Browser at http://localhost:7474 |
| Neo4j Bolt | 7687 | Internal bolt:// protocol |

---

## Troubleshooting

### pgvector extension error during migration

**Symptom:** `ERROR: could not open extension control file "pgvector.control"`

**Cause:** The PostgreSQL image does not have the pgvector extension installed.

**Fix:** Ensure you are using the `pgvector/pgvector:pg16` image in `docker-compose.yml`. Do not use the plain `postgres:16` image.

```yaml
# docker-compose.yml — correct image
postgres:
  image: pgvector/pgvector:pg16
```

### HNSW index creation fails with dimension error

**Symptom:** `ERROR: halfvec cannot have more than 2000 dimensions`

**Cause:** The pgvector version does not support HNSW at 3072 dimensions directly.

**Fix:** Migration 025 already applies the `halfvec` cast for the HNSW index. If this error appears, ensure you are running the latest migration:

```bash
alembic upgrade head
alembic current  # should show head
```

### Portal shows a blank page

**Symptom:** Customer portal URL loads but shows no content.

**Cause:** The backend is not running, or CORS is blocking the request.

**Fix steps:**
1. Verify the backend is running: `curl http://localhost:8002/health`
2. Check `CORS_ORIGINS` in `.env` includes `http://localhost:3001`
3. Check the browser console for CORS errors
4. Restart the backend after any `.env` changes

### Copilot shows "Regulatory knowledge unavailable"

**Symptom:** Copilot responds to regulatory questions with a fallback message rather than article citations.

**Cause:** The Lex service failed to initialize, usually because the corpus tables are empty or the vector store has no indexed chunks.

**Fix:** Restart the backend process. The Lex service initializes lazily on first request — a restart forces re-initialization and clears any cached error state. If the problem persists, re-run Step 4 (Lex ingestion).

### Alembic reports "Target database is not up to date"

**Symptom:** `alembic upgrade head` fails with a revision mismatch.

**Cause:** A previous partial migration left the database in an inconsistent state.

**Fix:**
```bash
alembic history --verbose   # show all revisions
alembic current             # show current DB revision
alembic upgrade head        # resume from current
```

If the database is empty and you want a clean start:
```bash
alembic downgrade base      # drop all schema
alembic upgrade head        # rebuild from scratch
```

### Keycloak login loop

**Symptom:** Login redirects back to the Keycloak login page repeatedly.

**Cause:** The frontend `NEXTAUTH_URL` or `KEYCLOAK_URL` environment variable is misconfigured, or Keycloak realm is missing the frontend client redirect URI.

**Fix:**
1. In Keycloak admin (`http://localhost:8180`), navigate to `trust-relay` realm → Clients → `trust-relay-frontend` → Settings
2. Verify Valid redirect URIs includes `http://localhost:3001/*`
3. Verify Web origins includes `http://localhost:3001`
4. Restart the frontend after any env changes
