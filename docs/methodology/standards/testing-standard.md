---
sidebar_position: 1
title: "Testing Standard"
description: "Comprehensive testing reference: no-mocking by default, testcontainers, Temporal workflow testing, coverage targets, and evidence requirements"
---

# Testing Standard

This is the comprehensive testing reference for projects developed under the S4U Development Methodology. It distills the proven testing principles from the Golden Standard v6, adds domain-specific patterns for Temporal workflow orchestration and async Python services, and defines the coverage targets and evidence requirements that apply across all projects.

For the methodology overview, see the [S4U Development Methodology](../overview).

---

## 1. Core Principles

Five principles govern all testing decisions. They apply in both PoC and Production mode, with thresholds adjusted per mode.

### Principle 1: Tests Must Exist Before Merge

Every pull request must include tests covering the changed code. No code merges without passing tests.

```bash
# Pre-merge verification (both modes)
pytest tests/ -v
pytest --cov=app --cov-report=term-missing
```

The coverage threshold depends on the mode (see [Section 3](#3-coverage-targets)), but the requirement that tests exist is absolute. A PR with zero tests for new functionality is never mergeable.

### Principle 2: Tests Must Catch Real Bugs

Tests must verify observable behavior, not implementation details. A test that passes regardless of whether the code works correctly has negative value — it provides false confidence.

**Bad** — proves nothing:

```python
def test_user_service(mock_service):
    mock_service.create.assert_called()  # What did it create? Was it correct?
```

**Good** — verifies behavior:

```python
def test_user_service_creates_user(db_session):
    result = user_service.create(email="test@example.com")

    assert result.id is not None
    assert result.email == "test@example.com"

    # Verify the user was actually persisted
    persisted = db_session.query(User).filter_by(email="test@example.com").first()
    assert persisted is not None
    assert persisted.id == result.id
```

The distinction: the bad test verifies that a function was called. The good test verifies that a user with the correct attributes was created and persisted in a real database.

### Principle 3: Real Services Always (No Mocking by Default)

Mocking and in-memory databases are **forbidden** unless explicitly approved. The full policy is in [Section 4](#4-no-mocking-by-default).

### Principle 4: Deterministic Tests Only

Tests must produce identical results on every run. Non-determinism in tests destroys confidence in the test suite.

**Forbidden:**

- `time.sleep()` — creates timing-dependent tests that are slow and flaky
- Reliance on wall-clock time — use controlled time mechanisms
- Uncontrolled random inputs without seeding
- Tests that depend on execution order

**For Temporal workflows**, use the SDK's built-in time-skipping environment instead of clock-manipulation libraries. See [Section 6](#6-temporal-workflow-testing) for the correct pattern.

### Principle 5: Fast by Default

The default test suite must complete quickly. Slow tests are opt-in.

```python
import os
import pytest

# Default: runs in every test suite execution (<30s)
def test_validation():
    assert User(email="test@example.com").is_valid()

# Opt-in slow test: only runs when explicitly requested
@pytest.mark.slow
@pytest.mark.skipif(not os.getenv("RUN_SLOW_TESTS"), reason="Slow test")
def test_full_pipeline():
    """End-to-end pipeline test requiring all services."""
    ...
```

```bash
# Normal development: fast tests only
pytest tests/ -v

# CI or explicit: include slow tests
RUN_SLOW_TESTS=1 pytest tests/ -v
```

---

## 2. PoC vs Production Mode

The methodology supports two quality modes. The mode is declared in the project's `CLAUDE.md`.

### PoC Mode

Use for: exploratory work, prototypes, proof-of-concept features, early-stage development.

**Allowed:**

- Write code first, tests after (test-after workflow)
- Skip edge case tests initially
- Use simpler assertions
- Skip E2E tests

**Still required:**

- Tests must exist before PR merge
- 70% coverage minimum (may be overridden higher for critical layers)
- All tests must pass (`pytest` exit code 0)
- No `time.sleep()` in tests
- No mocking without approval (Principle 3 applies in full)

### Production Mode

Use for: user-facing features, bug fixes, refactoring, anything that ships to users.

**Required:**

- 90% line coverage minimum
- 85% failure branch coverage
- Security tests for auth/data endpoints (see [Section 9](#9-security-tests))
- Real services in integration tests
- E2E tests for user-facing applications

---

## 3. Coverage Targets

### By Mode

| Mode | Line Coverage | Failure Branch Coverage | Real Integration Ratio |
|------|--------------|------------------------|----------------------|
| PoC | 70% | -- | -- |
| Production | 90% | 85% | 80% |

**Failure branch coverage**: percentage of error/exception paths that have dedicated tests.

**Real integration ratio**: percentage of integration tests that use real services (via testcontainers) vs mocks.

### By Layer (PoC Mode Overrides)

Projects may override per-layer targets in their `CLAUDE.md`:

| Layer | Target | Rationale |
|-------|--------|-----------|
| Workflow state machine + activities | **90%** | Core business logic; errors here are compliance failures |
| FastAPI endpoints | 70% | Standard CRUD; less risk |
| React components | 70% | UI logic; caught by manual testing |
| Docling / MinIO integration | 70% | Infrastructure integration; stable once working |

### Verification Commands

```bash
# Overall coverage gate
pytest --cov=app --cov-fail-under=70 --cov-report=term-missing

# Per-module coverage (for layer-specific targets)
pytest --cov=app.workflows --cov-fail-under=90 --cov-report=term-missing
pytest --cov=app.api --cov-fail-under=70 --cov-report=term-missing
```

---

## 4. No Mocking by Default

### The Rule

Mocking and in-memory databases are **forbidden** unless explicitly approved. The pain of refactoring tests when migrating from mocks to real services far exceeds the convenience of quick test setup.

### What Is Forbidden (Without Approval)

- `unittest.mock.Mock()` for services
- `MagicMock` for database or API clients
- SQLite as PostgreSQL substitute
- In-memory databases (H2, SQLite `:memory:`)
- `localStorage`/`IndexedDB` mocks in frontend tests
- `fakeredis`, `moto`, or similar fake services

### When Mocking Is Allowed

| Allowed Mock Target | Rationale |
|---------------------|-----------|
| Third-party APIs with rate limits or costs (Stripe, OpenAI, etc.) | Economic and practical constraint |
| Services that cannot run in containers (proprietary systems) | Technical impossibility |
| Pure functions with no I/O (unit tests) | No external dependency to mock |

### Approval Process

Every use of mocking requires a structured comment in the test file:

```python
# MOCK APPROVED: OpenAI API - cost and rate limit concerns
# Approved by: [name] on [date]
# Alternative: Set REAL_OPENAI=1 to run against real API
@pytest.fixture
def mock_openai():
    """Mocked OpenAI client for cost-sensitive tests."""
    with respx.mock:
        respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(200, json={"choices": [...]})
        )
        yield
```

The approval comment must include:

1. **What** is being mocked and **why** (the `MOCK APPROVED:` line)
2. **Who** approved and **when** (the `Approved by:` line)
3. **How** to run against the real service when needed (the `Alternative:` line)

---

## 5. Testcontainers Fixtures

Testcontainers provide ephemeral, real instances of infrastructure services.

### PostgreSQL Fixture

```python
# conftest.py
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


@pytest.fixture(scope="session")
def postgres_container():
    """Start a real PostgreSQL instance for the test session."""
    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="session")
def db_url(postgres_container):
    """Async database URL from the running container."""
    sync_url = postgres_container.get_connection_url()
    # Convert psycopg2 URL to asyncpg URL
    return sync_url.replace("psycopg2", "asyncpg")


@pytest.fixture
async def db_session(db_url):
    """Per-test async database session with automatic rollback."""
    engine = create_async_engine(db_url)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()

    await engine.dispose()
```

### MinIO (S3-Compatible) Fixture

```python
# conftest.py
import pytest
import boto3
from testcontainers.minio import MinioContainer


@pytest.fixture(scope="session")
def minio_container():
    """Start a real MinIO instance for the test session."""
    with MinioContainer() as minio:
        yield minio


@pytest.fixture
def s3_client(minio_container):
    """S3 client configured to talk to the test MinIO instance."""
    config = minio_container.get_config()
    client = boto3.client(
        "s3",
        endpoint_url=config["endpoint"],
        aws_access_key_id=config["access_key"],
        aws_secret_access_key=config["secret_key"],
    )
    client.create_bucket(Bucket="test-bucket")
    yield client
```

### Session vs Function Scope

Use `scope="session"` for container fixtures — containers are expensive to start (2-5 seconds each). Use `scope="function"` (default) for session/client fixtures so each test gets a clean state.

---

## 6. Temporal Workflow Testing

Temporal workflows require specialized testing patterns. The Temporal Python SDK provides a built-in testing environment with time-skipping capabilities.

### The Correct Pattern: `WorkflowEnvironment.start_time_skipping()`

```python
import pytest
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from app.workflows.compliance_case import ComplianceCaseWorkflow
from app.workflows.activities import (
    process_documents,
    run_osint_investigation,
    generate_follow_up_tasks,
)


@pytest.fixture
async def temporal_env():
    """In-memory Temporal server with automatic time-skipping."""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        yield env


@pytest.fixture
async def temporal_worker(temporal_env):
    """Worker registered with the workflow and all activities."""
    async with Worker(
        temporal_env.client,
        task_queue="test-queue",
        workflows=[ComplianceCaseWorkflow],
        activities=[
            process_documents,
            run_osint_investigation,
            generate_follow_up_tasks,
        ],
    ) as worker:
        yield worker


async def test_workflow_happy_path(temporal_env, temporal_worker):
    """Test the full compliance workflow from creation to approval."""
    handle = await temporal_env.client.start_workflow(
        ComplianceCaseWorkflow.run,
        args=["case-123", "company-456"],
        id="test-workflow-1",
        task_queue="test-queue",
    )

    await handle.signal(ComplianceCaseWorkflow.documents_submitted, {
        "files": ["invoice.pdf", "registration.pdf"],
    })

    status = await handle.query(ComplianceCaseWorkflow.get_status)
    assert status["state"] == "REVIEW_PENDING"

    await handle.signal(ComplianceCaseWorkflow.officer_decision, {
        "decision": "APPROVED",
        "notes": "All documents verified.",
    })

    result = await handle.result()
    assert result["final_status"] == "APPROVED"
```

:::warning What NOT to Use
**Do not use `freezegun`** for Temporal workflow tests. Temporal manages its own internal clock. External clock manipulation does not affect Temporal's internal timers and produces incorrect test behavior.

**Do not use `time.sleep()`** to wait for workflow state transitions. The time-skipping environment handles timer advancement automatically.
:::

---

## 7. Async Python Testing Patterns

### pytest-asyncio Configuration

Set `asyncio_mode=auto` in your pytest configuration:

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
```

With this setting, all `async def test_*` functions are automatically recognized as async tests — no `@pytest.mark.asyncio` decorator needed.

### asyncpg Compatibility: CAST Syntax

When using asyncpg with SQLAlchemy, never use PostgreSQL's `::` cast syntax in parameterized queries.

**Forbidden:**

```python
# This will raise asyncpg.exceptions.InvalidSQLStatementError
await session.execute(
    text("INSERT INTO cases (metadata) VALUES (:data::jsonb)"),
    {"data": json.dumps({"key": "value"})},
)
```

**Correct:**

```python
# Use CAST() function instead
await session.execute(
    text("INSERT INTO cases (metadata) VALUES (CAST(:data AS jsonb))"),
    {"data": json.dumps({"key": "value"})},
)
```

This applies to all `::type` casts in parameterized SQL: `::jsonb`, `::uuid`, `::integer`, `::text[]`, etc.

---

## 8. HTTP Boundary Mocking

For services that call external HTTP APIs, mock at the HTTP transport boundary using `respx` (for `httpx`) or `responses` (for `requests`). Never mock the activity or service function itself — only the HTTP call it makes.

### The Pattern: Mock the Wire, Not the Function

```python
import httpx
import respx
import pytest

from app.workflows.activities import run_osint_investigation


# MOCK APPROVED: OSINT API - external service, not available in test environment
# Approved by: [architect] on [date]
# Alternative: Set OSINT_MOCK_MODE=false with real OSINT engine running
@pytest.fixture
def mock_osint_api():
    """Mock the OSINT API HTTP boundary."""
    with respx.mock:
        respx.post("https://osint-engine.example.com/api/investigate").mock(
            return_value=httpx.Response(
                200,
                json={
                    "findings": [
                        {
                            "source": "commercial_register",
                            "entity": "Test Corp BV",
                            "status": "active",
                            "confidence": 0.95,
                        }
                    ],
                    "risk_score": 0.3,
                },
            )
        )
        yield


async def test_osint_investigation_processes_findings(mock_osint_api, db_session):
    """Test that the activity correctly processes OSINT API response."""
    result = await run_osint_investigation(
        case_id="case-123",
        company_name="Test Corp BV",
        documents_markdown=["# Invoice\nAmount: EUR 10,000"],
    )

    assert result.risk_score == 0.3
    assert len(result.findings) == 1
    assert result.findings[0].source == "commercial_register"
```

The activity function contains real business logic: it assembles the request, calls the API, parses the response, applies business rules, and returns a structured result. By mocking only the HTTP wire, you test all of that logic.

---

## 9. Security Tests

Security tests are required in Production mode for any application handling user data or implementing multi-tenancy.

### Authentication Enforcement

```python
async def test_endpoint_requires_auth(client):
    """Verify that unauthenticated requests are rejected."""
    response = await client.get("/api/cases")
    assert response.status_code == 401
```

### Tenant Isolation

```python
async def test_tenant_isolation(client, tenant_a_token, tenant_b_case):
    """Verify that Tenant A cannot access Tenant B's case."""
    response = await client.get(
        f"/api/cases/{tenant_b_case.id}",
        headers={"Authorization": f"Bearer {tenant_a_token}"},
    )
    assert response.status_code in (403, 404)
```

### PII Leak Prevention

```python
def test_pii_not_in_logs(caplog):
    """Verify that PII is redacted from log output."""
    with caplog.at_level("DEBUG"):
        user = UserService.create(
            email="private@example.com",
            national_id="85.07.15-123.45",
        )

    log_text = caplog.text
    assert "85.07.15-123.45" not in log_text
    assert "private@example.com" not in log_text
```

### Row-Level Security Verification

```python
async def test_rls_prevents_cross_tenant_access(db_session_tenant_a, tenant_b_case_id):
    """Verify that RLS prevents Tenant A from querying Tenant B's data."""
    result = await db_session_tenant_a.execute(
        text("SELECT * FROM cases WHERE id = :id"),
        {"id": tenant_b_case_id},
    )
    rows = result.fetchall()
    assert len(rows) == 0  # RLS filters the row — invisible, not forbidden
```

---

## 10. API Contract Alignment

In full-stack applications with a Python backend (Pydantic models) and a TypeScript frontend (interface definitions), the two type systems must stay aligned.

1. **Pydantic models are the source of truth.** The backend defines the API contract via Pydantic response models. FastAPI generates an OpenAPI schema from these models automatically.

2. **TypeScript interfaces must mirror Pydantic models.** When a Pydantic model changes, the corresponding TypeScript interface must be updated in the same PR.

3. **Review gate.** During code review, any PR that modifies a Pydantic response model must include the corresponding TypeScript type update.

---

## 11. Evidence Requirements

Every implementation response that includes code changes must include actual test output.

### Minimum Evidence (Both Modes)

- Actual pytest output (copy-pasted, not paraphrased)
- Coverage report with line-level detail (`term-missing` format)
- All tests passing (exit code 0)
- Coverage meeting the applicable threshold

**Not valid evidence:**

- "Tests should pass" or "I believe this works"
- Screenshots of green checkmarks without detail
- Coverage reports that exclude the changed files

---

## 12. Frontend Testing

### Stack

- **Test runner:** Jest
- **Component testing:** React Testing Library
- **API mocking:** `jest.mock` for API client modules

### Frontend Mock Policy

The no-mocking principle applies differently to frontend tests. API calls from the frontend are inherently crossing a network boundary — they are external I/O. Mocking the API client module (not the fetch implementation) is the standard pattern:

```typescript
// Acceptable: mock the typed API client
jest.mock("@/lib/api");

// Not acceptable: mock fetch/axios globally
jest.mock("axios"); // Too broad — hides real integration issues
```

---

## 13. Quick Reference

### Commands

```bash
# Run all tests
pytest tests/ -v

# Coverage (PoC threshold)
pytest --cov=app --cov-fail-under=70 --cov-report=term-missing

# Coverage (Production threshold)
pytest --cov=app --cov-fail-under=90 --cov-report=term-missing

# Include slow tests
RUN_SLOW_TESTS=1 pytest tests/ -v

# Frontend tests
npm test
```

### Forbidden List (Without `MOCK APPROVED` Comment)

| Forbidden | Use Instead |
|-----------|-------------|
| `unittest.mock.Mock()` for services | Testcontainers |
| `MagicMock` for DB/API clients | Testcontainers |
| SQLite as PostgreSQL substitute | `PostgresContainer` |
| In-memory databases | `PostgresContainer` |
| `fakeredis` | `RedisContainer` |
| `moto` (AWS mock) | `MinioContainer` or `LocalStackContainer` |
| `time.sleep()` in tests | `start_time_skipping()` / async polling |
| `freezegun` for Temporal tests | `WorkflowEnvironment.start_time_skipping()` |
| `::jsonb` cast with asyncpg | `CAST(:param AS jsonb)` |

### Mock Approval Template

```python
# MOCK APPROVED: [Service Name] - [reason]
# Approved by: [name] on [YYYY-MM-DD]
# Alternative: [how to run against real service]
```
