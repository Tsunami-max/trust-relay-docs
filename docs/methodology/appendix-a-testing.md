---
sidebar_position: 10
title: "Appendix A: Testing Standard"
description: "This appendix is the comprehensive testing reference for projects developed under the S4U Development Methodology."
---


This appendix is the comprehensive testing reference for projects developed under the S4U Development Methodology. It distills the proven testing principles from the Golden Standard v6, adds domain-specific patterns for Temporal workflow orchestration and async Python services, and defines the coverage targets and evidence requirements that apply across all projects.

For the hub document, see [methodology.md](overview).

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [PoC vs Production Mode](#2-poc-vs-production-mode)
3. [Coverage Targets](#3-coverage-targets)
4. [No Mocking by Default](#4-no-mocking-by-default)
5. [Testcontainers Fixtures](#5-testcontainers-fixtures)
6. [Temporal Workflow Testing](#6-temporal-workflow-testing)
7. [Async Python Testing Patterns](#7-async-python-testing-patterns)
8. [HTTP Boundary Mocking](#8-http-boundary-mocking)
9. [Security Tests](#9-security-tests)
10. [API Contract Alignment](#10-api-contract-alignment)
11. [Evidence Requirements](#11-evidence-requirements)
12. [Frontend Testing](#12-frontend-testing)
13. [Quick Reference](#13-quick-reference)

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

The distinction: the bad test verifies that a function was called. The good test verifies that a user with the correct attributes was created and persisted in a real database. If the implementation breaks, the good test fails. The bad test might still pass.

### Principle 3: Real Services Always (No Mocking by Default)

Mocking and in-memory databases are **forbidden** unless explicitly approved. The full policy is in [Section 4](#4-no-mocking-by-default).

### Principle 4: Deterministic Tests Only

Tests must produce identical results on every run. Non-determinism in tests destroys confidence in the test suite and wastes developer time investigating phantom failures.

**Forbidden:**

- `time.sleep()` — creates timing-dependent tests that are slow and flaky
- Reliance on wall-clock time — use controlled time mechanisms
- Uncontrolled random inputs without seeding
- Tests that depend on execution order

**For Temporal workflows**, use the SDK's built-in time-skipping environment instead of clock-manipulation libraries. See [Section 6](#6-temporal-workflow-testing) for the correct pattern.

**For cache/TTL testing and non-Temporal time-dependent logic:**

```python
# Use a controllable clock abstraction appropriate to your domain.
# The key requirement: time must be deterministic and test-controlled.
# Temporal provides start_time_skipping(). For other contexts,
# use the framework's native time control or inject a clock dependency.
```

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

Configure pytest to skip slow tests by default:

```ini
# pytest.ini or pyproject.toml [tool.pytest.ini_options]
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
```

```bash
# Normal development: fast tests only
pytest tests/ -v

# CI or explicit: include slow tests
RUN_SLOW_TESTS=1 pytest tests/ -v
```

---

## 2. PoC vs Production Mode

The methodology supports two quality modes. The mode is declared in the project's `CLAUDE.md` and governs coverage thresholds, required test types, and workflow expectations.

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

**Workflow:**

```text
1. Implement feature (explore freely)
2. Get it working (manual testing acceptable during development)
3. Write tests for what you built
4. Verify: pytest --cov=app --cov-fail-under=70
5. Commit & PR
```

### Production Mode

Use for: user-facing features, bug fixes, refactoring, anything that ships to users.

**Required:**

- 90% line coverage minimum
- 85% failure branch coverage
- Security tests for auth/data endpoints (see [Section 9](#9-security-tests))
- Real services in integration tests
- E2E tests for user-facing applications

**Bug fix workflow** (TDD strongly encouraged):

```text
1. Write failing test that reproduces the bug
2. Run test — confirm it fails (RED)
3. Fix the bug
4. Run test — confirm it passes (GREEN)
5. Refactor if needed
6. Commit with test evidence
```

**New feature workflow:**

```text
1. If requirements are clear: TDD approach
2. If exploring: test-after approach
3. Either way: 90% coverage before merge
```

---

## 3. Coverage Targets

### By Mode

| Mode | Line Coverage | Failure Branch Coverage | Real Integration Ratio |
|------|--------------|------------------------|----------------------|
| PoC | 70% | -- | -- |
| Production | 90% | 85% | 80% |

**Failure branch coverage**: percentage of error/exception paths that have dedicated tests. A function with 3 failure modes needs at least 2-3 tested in Production mode.

**Real integration ratio**: percentage of integration tests that use real services (via testcontainers) vs mocks. In Production mode, at least 80% of integration tests must run against real databases, queues, and object stores.

### By Layer (PoC Mode Overrides)

Projects may override per-layer targets in their `CLAUDE.md`. Example from Trust Relay:

| Layer | Target | Rationale |
|-------|--------|-----------|
| Workflow state machine + activities | **90%** | Core business logic; errors here are compliance failures |
| FastAPI endpoints | 70% | Standard CRUD; less risk |
| React components | 70% | UI logic; caught by manual testing |
| Docling / MinIO integration | 70% | Infrastructure integration; stable once working |

The pattern: critical business logic layers get elevated coverage targets even in PoC mode. If a bug in a layer would cause compliance, financial, or data integrity failures, that layer gets Production-grade coverage regardless of overall project mode.

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

Mocking and in-memory databases are **forbidden** unless explicitly approved. The pain of refactoring tests when migrating from mocks to real services far exceeds the convenience of quick test setup. Mocked tests provide false confidence: they verify that your code interacts correctly with a mock, not that it works with the real service.

### What Is Forbidden (Without Approval)

- `unittest.mock.Mock()` for services
- `MagicMock` for database or API clients
- SQLite as PostgreSQL substitute
- In-memory databases (H2, SQLite `:memory:`)
- `localStorage`/`IndexedDB` mocks in frontend tests
- `fakeredis`, `moto`, or similar fake services

### When Mocking Is Allowed

Mocking is permitted in these cases, with documented justification:

| Allowed Mock Target | Rationale |
|---------------------|-----------|
| Third-party APIs with rate limits or costs (Stripe, OpenAI, etc.) | Economic and practical constraint |
| Services that cannot run in containers (proprietary systems) | Technical impossibility |
| Pure functions with no I/O (unit tests) | No external dependency to mock — this is standard unit testing |

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

Files using mocks without the approval comment are flagged during code review.

---

## 5. Testcontainers Fixtures

Testcontainers provide ephemeral, real instances of infrastructure services. They start real Docker containers, run tests against them, and tear them down. This is the standard approach for all integration tests.

### Prerequisites

- Docker must be running on the development machine
- Python package: `testcontainers` (add to dev dependencies)

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

    # Create tables (use your project's Base.metadata)
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
    # Create a test bucket
    client.create_bucket(Bucket="test-bucket")
    yield client
```

### Session vs Function Scope

Use `scope="session"` for container fixtures — containers are expensive to start (2-5 seconds each). Use `scope="function"` (default) for session/client fixtures so each test gets a clean state.

```python
# Container: starts once per test session
@pytest.fixture(scope="session")
def postgres_container(): ...

# Session: new per test, rolls back for isolation
@pytest.fixture  # scope="function" is the default
async def db_session(postgres_container): ...
```

---

## 6. Temporal Workflow Testing

Temporal workflows require specialized testing patterns. The Temporal Python SDK provides a built-in testing environment that runs an in-memory Temporal server with time-skipping capabilities.

### The Correct Pattern: `WorkflowEnvironment.start_time_skipping()`

```python
import pytest
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker
from temporalio.client import Client

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
    # Start the workflow
    handle = await temporal_env.client.start_workflow(
        ComplianceCaseWorkflow.run,
        args=["case-123", "company-456"],
        id="test-workflow-1",
        task_queue="test-queue",
    )

    # Signal: documents submitted
    await handle.signal(ComplianceCaseWorkflow.documents_submitted, {
        "files": ["invoice.pdf", "registration.pdf"],
    })

    # Query: check status after processing
    status = await handle.query(ComplianceCaseWorkflow.get_status)
    assert status["state"] == "REVIEW_PENDING"
    assert status["iteration"] == 1

    # Signal: officer approves
    await handle.signal(ComplianceCaseWorkflow.officer_decision, {
        "decision": "APPROVED",
        "notes": "All documents verified.",
    })

    # Wait for workflow completion
    result = await handle.result()
    assert result["final_status"] == "APPROVED"
```

### What NOT to Use

**Do not use `freezegun`** for Temporal workflow tests. Temporal manages its own internal clock for timers, retries, and workflow deadlines. External clock manipulation (freezegun, `unittest.mock.patch("time.time")`, manual `datetime` stubbing) does not affect Temporal's internal timers and produces incorrect test behavior.

**Do not use `time.sleep()`** to wait for workflow state transitions. The time-skipping environment handles timer advancement automatically. If you need to wait for a specific state, query the workflow in a loop with a short async sleep:

```python
import asyncio

async def wait_for_status(handle, expected_status, timeout=10.0):
    """Wait for workflow to reach a specific status."""
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        status = await handle.query(ComplianceCaseWorkflow.get_status)
        if status["state"] == expected_status:
            return status
        await asyncio.sleep(0.1)  # Short poll interval, not a delay
    raise TimeoutError(f"Workflow did not reach {expected_status} within {timeout}s")
```

### Testing Signals and Queries

Temporal workflows communicate via signals (inbound events) and queries (state inspection). Test them explicitly:

```python
async def test_workflow_follow_up_loop(temporal_env, temporal_worker):
    """Test that follow-up creates a new iteration."""
    handle = await temporal_env.client.start_workflow(
        ComplianceCaseWorkflow.run,
        args=["case-789", "company-012"],
        id="test-workflow-follow-up",
        task_queue="test-queue",
    )

    # First iteration: submit docs, wait for review
    await handle.signal(ComplianceCaseWorkflow.documents_submitted, {
        "files": ["partial-doc.pdf"],
    })

    status = await wait_for_status(handle, "REVIEW_PENDING")
    assert status["iteration"] == 1

    # Officer requests follow-up
    await handle.signal(ComplianceCaseWorkflow.officer_decision, {
        "decision": "FOLLOW_UP_REQUIRED",
        "notes": "Missing bank statement.",
        "required_documents": ["bank_statement"],
    })

    # Workflow should loop back to AWAITING_DOCUMENTS
    status = await wait_for_status(handle, "AWAITING_DOCUMENTS")
    assert status["iteration"] == 2
```

---

## 7. Async Python Testing Patterns

### pytest-asyncio Configuration

Set `asyncio_mode=auto` in your pytest configuration. This eliminates the need for `@pytest.mark.asyncio` decorators on every async test function.

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
```

With this setting, all `async def test_*` functions are automatically recognized as async tests:

```python
# No decorator needed — asyncio_mode=auto handles it
async def test_create_case(db_session):
    case = await case_service.create(db_session, company_name="Test Corp")
    assert case.id is not None
```

### asyncpg Compatibility: CAST Syntax

When using asyncpg with SQLAlchemy, never use PostgreSQL's `::` cast syntax in parameterized queries. asyncpg does not support the `::` cast operator with bound parameters.

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

This applies to all `::type` casts in parameterized SQL: `::jsonb`, `::uuid`, `::integer`, `::text[]`, etc. Always use `CAST(:param AS type)` instead.

### Async Fixture Patterns

```python
@pytest.fixture
async def case_with_documents(db_session, s3_client):
    """Create a case with uploaded documents for testing."""
    case = await case_service.create(db_session, company_name="Test Corp")

    # Upload a test document to MinIO
    s3_client.put_object(
        Bucket="test-bucket",
        Key=f"{case.id}/iteration-1/invoice.pdf",
        Body=b"%PDF-1.4 test content",
    )

    await case_service.update_status(db_session, case.id, "DOCUMENTS_RECEIVED")
    await db_session.commit()

    yield case

    # Cleanup happens via session rollback (db) and container teardown (MinIO)
```

---

## 8. HTTP Boundary Mocking

For services that call external HTTP APIs (OSINT engines, third-party enrichment services, AI providers), mock at the HTTP transport boundary using `respx` (for `httpx`) or `responses` (for `requests`). Never mock the activity or service function itself — only the HTTP call it makes.

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

    # Verify the activity processed the response correctly
    assert result.risk_score == 0.3
    assert len(result.findings) == 1
    assert result.findings[0].source == "commercial_register"
```

### Why This Pattern

The activity function `run_osint_investigation` contains real business logic: it assembles the request, calls the API, parses the response, applies business rules, and returns a structured result. By mocking only the HTTP wire, you test all of that logic. If you mocked the activity function itself, you would test nothing.

### respx vs httpx.MockTransport

Both work. `respx` is preferred for its declarative API:

```python
# respx: declarative, context-managed
with respx.mock:
    respx.get("https://api.example.com/data").mock(
        return_value=httpx.Response(200, json={"key": "value"})
    )
    # tests run here

# httpx.MockTransport: lower-level, useful for complex routing
def handler(request):
    if request.url.path == "/data":
        return httpx.Response(200, json={"key": "value"})
    return httpx.Response(404)

transport = httpx.MockTransport(handler)
client = httpx.AsyncClient(transport=transport)
```

---

## 9. Security Tests

Security tests are required in Production mode for any application handling user data or implementing multi-tenancy. In PoC mode, security tests are strongly recommended for authentication and tenant isolation endpoints but not enforced.

### Authentication Enforcement

Every protected endpoint must be tested without credentials to verify it returns 401:

```python
async def test_endpoint_requires_auth(client):
    """Verify that unauthenticated requests are rejected."""
    response = await client.get("/api/cases")
    assert response.status_code == 401
```

### Tenant Isolation

Multi-tenant applications must verify that users from one tenant cannot access another tenant's data:

```python
async def test_tenant_isolation(client, tenant_a_token, tenant_b_case):
    """Verify that Tenant A cannot access Tenant B's case."""
    response = await client.get(
        f"/api/cases/{tenant_b_case.id}",
        headers={"Authorization": f"Bearer {tenant_a_token}"},
    )
    assert response.status_code in (403, 404)
    # 403 = explicitly denied; 404 = filtered by RLS (both are acceptable)
```

### PII Leak Prevention

Sensitive data must never appear in log output:

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

For PostgreSQL RLS-protected tables, verify that the policy enforcement works at the database level:

```python
async def test_rls_prevents_cross_tenant_access(db_session_tenant_a, tenant_b_case_id):
    """Verify that RLS prevents Tenant A from querying Tenant B's data."""
    result = await db_session_tenant_a.execute(
        text("SELECT * FROM cases WHERE id = :id"),
        {"id": tenant_b_case_id},
    )
    rows = result.fetchall()
    assert len(rows) == 0  # RLS filters the row — it's invisible, not forbidden
```

---

## 10. API Contract Alignment

In full-stack applications with a Python backend (Pydantic models) and a TypeScript frontend (interface definitions), the two type systems must stay aligned. A mismatch between backend response shapes and frontend type definitions causes runtime errors that are invisible to both the backend tests and the frontend tests individually.

### The Problem

```python
# Backend (Python) — added a new field
class CaseResponse(BaseModel):
    id: str
    status: str
    risk_score: float  # New field added in latest sprint
```

```typescript
// Frontend (TypeScript) — not updated
interface CaseResponse {
  id: string;
  status: string;
  // risk_score is missing — frontend code accessing it gets undefined
}
```

### The Practice

1. **Pydantic models are the source of truth.** The backend defines the API contract via Pydantic response models. FastAPI generates an OpenAPI schema from these models automatically.

2. **TypeScript interfaces must mirror Pydantic models.** When a Pydantic model changes, the corresponding TypeScript interface must be updated in the same PR.

3. **Review gate.** During code review, any PR that modifies a Pydantic response model must include the corresponding TypeScript type update. Reviewers check for this explicitly.

4. **OpenAPI as alignment mechanism.** FastAPI's auto-generated `/docs` endpoint provides the canonical API contract. Use it to verify alignment:

```bash
# Export the OpenAPI schema
curl http://localhost:8002/openapi.json > openapi.json

# Compare against frontend types (manual or via tooling)
```

This is a process discipline, not an automated tool. The methodology does not prescribe a specific type generation tool because the right choice depends on your stack and build system. What it does prescribe: Pydantic and TypeScript types must match, and code review enforces this.

---

## 11. Evidence Requirements

Every implementation response that includes code changes must include actual test output. This is not optional — it is how the methodology verifies that work is complete.

### Minimum Evidence (Both Modes)

```markdown
## Test Results

```
$ pytest tests/test_feature.py -v
PASSED tests/test_feature.py::test_create_feature
PASSED tests/test_feature.py::test_feature_validation
PASSED tests/test_feature.py::test_feature_error_handling
=== 3 passed in 1.25s ===
```

## Coverage

```
$ pytest --cov=app.feature --cov-report=term-missing
Name                    Stmts   Miss  Cover   Missing
-----------------------------------------------------
app/feature.py             50      5    90%   42-44, 67-68
-----------------------------------------------------
TOTAL                      50      5    90%
```
```

### Production Mode Additional Evidence

Production mode also requires evidence of failure path coverage and security test results when applicable:

```markdown
## Security Tests

```
$ pytest tests/security/ -v
PASSED tests/security/test_auth.py::test_endpoint_requires_auth
PASSED tests/security/test_auth.py::test_tenant_isolation
PASSED tests/security/test_auth.py::test_pii_not_in_logs
=== 3 passed in 2.10s ===
```
```

### What Constitutes Valid Evidence

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

### Patterns

```typescript
// Component test: verify rendering and interaction
import { render, screen, fireEvent } from "@testing-library/react";
import { CaseList } from "@/components/dashboard/CaseList";

// Mock the API module (not individual fetch calls)
jest.mock("@/lib/api", () => ({
  getCases: jest.fn().mockResolvedValue([
    { id: "case-1", company_name: "Test Corp", status: "REVIEW_PENDING" },
  ]),
}));

test("renders case list with status badges", async () => {
  render(<CaseList />);

  expect(await screen.findByText("Test Corp")).toBeInTheDocument();
  expect(screen.getByText("REVIEW_PENDING")).toBeInTheDocument();
});

test("clicking a case navigates to detail view", async () => {
  const mockRouter = { push: jest.fn() };
  render(<CaseList router={mockRouter} />);

  const caseRow = await screen.findByText("Test Corp");
  fireEvent.click(caseRow);

  expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/case-1");
});
```

### Frontend Mock Policy

The no-mocking principle applies differently to frontend tests. API calls from the frontend are inherently crossing a network boundary to the backend — they are external I/O. Mocking the API client module (not the fetch implementation) is the standard pattern:

```typescript
// Acceptable: mock the typed API client
jest.mock("@/lib/api");

// Not acceptable: mock fetch/axios globally
jest.mock("axios"); // Too broad — hides real integration issues
```

For E2E tests (Production mode), use a real backend instance. Frontend E2E tests with mocked backends provide limited value.

---

## 13. Quick Reference

### Commands

```bash
# Run all tests
pytest tests/ -v

# Run single file
pytest tests/test_workflow.py -v

# Run single test
pytest tests/test_workflow.py::test_happy_path -v

# Coverage (PoC threshold)
pytest --cov=app --cov-fail-under=70 --cov-report=term-missing

# Coverage (Production threshold)
pytest --cov=app --cov-fail-under=90 --cov-report=term-missing

# Include slow tests
RUN_SLOW_TESTS=1 pytest tests/ -v

# Frontend tests
npm test
npm run test:watch
```

### Coverage Targets Summary

| Mode | Line | Failure Branch | Real Integration |
|------|------|---------------|-----------------|
| PoC | 70% | -- | -- |
| Production | 90% | 85% | 80% |

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

---

**End of Appendix A: Testing Standard**
