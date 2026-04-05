---
sidebar_position: 13
title: "Testing Strategy"
last_verified: 2026-03-29
status: implemented
---

# Testing Strategy

The project has substantial test coverage with 4,117+ backend tests, 59 frontend test files, and 6 E2E specs -- 4,176+ automated tests in total. This page documents the testing approach and infrastructure.

## Test Counts

| Layer | Tests | Runner | Notes |
|-------|-------|--------|-------|
| Backend | 4,117+ | pytest | 241 test files, async mode, no `@pytest.mark.asyncio` needed |
| Frontend | 59 | Jest + RTL | 59 test suites covering dashboard, portal, entity-network, memory, and utilities |
| E2E | 6 | Playwright | Cross-browser browser tests |
| **Total** | **4,176+** | | |

## Backend Testing

### Framework and Configuration

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
```

With `asyncio_mode=auto`, all async test functions are automatically detected and run with the event loop. No `@pytest.mark.asyncio` decorators are needed.

### AI Agent Testing

All 18+ PydanticAI agents are tested using the `TestModel`:

```python
import os
os.environ["ALLOW_MODEL_REQUESTS"] = "False"  # Safety net

from pydantic_ai import Agent

# TestModel returns deterministic outputs matching the Pydantic output schema
agent = Agent("test", output_type=RegistryAgentOutput, instructions=prompt)
async with agent:
    result = await agent.run("Investigate company X")
assert result.output.company_found is not None
```

**Safety mechanism:** The `ALLOW_MODEL_REQUESTS=False` environment variable is a PydanticAI safety net that prevents any real LLM API call from being made during tests. If a test accidentally configures a real model string, PydanticAI will raise an error instead of making a billable API call.

### External Service Mocking

External HTTP calls are mocked at the transport boundary using `respx` (for httpx) or direct mocks (for third-party client libraries):

```python
# Example: NBB API mock
@respx.mock
async def test_nbb_company_info():
    respx.get("https://consult.cbso.nbb.be/api/rs-consult/companies/0123456789/EN").respond(
        json={"enterpriseNumber": "0123456789", "name": "Test BV"}
    )
    service = NBBService()
    result = await service.get_company_info("0123456789")
    assert result["name"] == "Test BV"
```

### Temporal Workflow Testing

Workflow tests use Temporal's in-memory time-skipping environment:

```python
from temporalio.testing import WorkflowEnvironment

async def test_happy_path():
    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="test-queue",
            workflows=[ComplianceCaseWorkflow],
            activities=[process_documents, run_osint_investigation, ...],
        )
        async with worker:
            handle = await env.client.start_workflow(
                ComplianceCaseWorkflow.run,
                case_input,
                id="test-wf",
                task_queue="test-queue",
            )
            # Send signals, query state, assert transitions
            await handle.signal(ComplianceCaseWorkflow.signal_documents_submitted)
            status = await handle.query(ComplianceCaseWorkflow.get_status)
            assert status["status"] == "DOCUMENTS_RECEIVED"
```

Time-skipping mode allows testing the 60-day timeline timeout in milliseconds.

:::note
The project does **not** use `freezegun` or manual clock manipulation for Temporal tests. Temporal's `start_time_skipping()` provides a purpose-built time acceleration mechanism that correctly interacts with workflow timers.
:::

### Mock Mode Testing

Mock mode flags can be toggled at runtime for testing different configurations:

```python
# Test with real API (gated by environment variable)
@pytest.mark.skipif(not os.getenv("NBB_LIVE"), reason="Live NBB tests disabled")
async def test_nbb_live():
    service = NBBService()
    result = await service.get_company_info("0202239951")
    assert result["name"] is not None
```

Several test files include live-gated tests that run against real external APIs when explicitly enabled (e.g., `NBB_LIVE=1 pytest tests/test_nbb_service.py`).

## Frontend Testing

### Framework

- **Jest** for test running and assertions
- **React Testing Library** for component rendering and interaction
- **API mocks** via `jest.mock` for the API client

### What Is Tested

All dashboard components have dedicated test files with rendering, interaction, and edge case coverage. The 59 test suites include:

```
frontend/src/__tests__/
  api.test.ts                    # API client function tests
  types.test.ts                  # TypeScript type validation
  AgentCard.test.tsx             # Agent status display
  AgentPipelineView.test.tsx     # Pipeline DAG visualization
  AiBriefCard.test.tsx           # AI-generated case summary
  AnalyticsCharts.test.tsx       # Risk distribution charts
  CaseListTable.test.tsx         # Sortable case list
  CaseTimeline.test.tsx          # Iteration timeline
  CompanyProfileCard.test.tsx    # Cross-source company facts
  ConfidenceChart.test.tsx       # Confidence score radial chart
  CreateCaseDialog.test.tsx      # Case creation form
  DecisionActions.test.tsx       # Approve/reject/escalate buttons
  DiscrepancyCard.test.tsx       # Data discrepancy display
  DocumentUpload.test.tsx        # File upload drag-and-drop
  DocumentViewer.test.tsx        # Document list + preview
  EvidencePanel.test.tsx         # Belgian evidence sources
  FilterBar.test.tsx             # Case list filters
  FinancialHealthCard.test.tsx   # Financial metrics + trends
  FollowUpTaskCard.test.tsx      # Follow-up task display
  JsonViewer.test.tsx            # JSON data viewer
  PeppolResultCard.test.tsx      # PEPPOL verification results
  QuestionForm.test.tsx          # Template-driven questions
  RiskHeatmap.test.tsx           # Aggregated risk heatmap
  StatusBadge.test.tsx           # Case status badge
  StatusScreen.test.tsx          # Final status screen
  MCCCard.test.tsx               # MCC classification with risk flags
  InhoudingsplichtResultCard.test.tsx  # Social/tax debt verification
  StatsHero.test.tsx             # Dashboard stats overview
  EntityGraph.test.tsx           # Entity network 3D graph + provenance
```

### What Is Not Fully Tested

Page-level components (`page.tsx` files) have limited test coverage. With the extraction of custom hooks, these are now thinner -- but they still orchestrate multiple hooks and components together.

## E2E Testing

Six Playwright specs cover critical user journeys:

```
e2e/
  case-creation.spec.ts
  portal-upload.spec.ts
  decision-flow.spec.ts
  ...
```

### Playwright Patterns Learned

- `getByRole("heading", { name: "..." })` is unreliable for long names -- use `page.locator("h1").toContainText(...)`
- `waitForLoadState("networkidle")` hangs with CopilotKit dynamic imports -- avoid it
- `dispatchEvent("click")` bypasses Next.js Dev Tools overlay that intercepts `.click()`

## Coverage Targets

The project follows S4U Development Methodology coverage targets:

| Layer | Target | Actual | Status |
|-------|--------|--------|--------|
| Workflow state machine + activities | 90% | ~85% | Close |
| FastAPI endpoints | 70% | ~75% | **Met** |
| React components | 70% | ~80% | **Met** (59 test suites) |
| Docling / MinIO integration | 70% | ~70% | Met |

:::tip
Frontend remediation (Phases 5+) brought total coverage from ~40% to ~80% for React components. All dashboard components now have dedicated test files across 59 test suites.
:::

## S4U Development Methodology Compliance

The project's S4U Development Methodology mandates specific testing practices:

### No Mocking by Default

Mocking is only allowed with explicit approval comments:

```python
# MOCK APPROVED: BrightData LinkedIn API - rate limits and cost
# Approved by: engineering on 2026-02-20
# Alternative: Set BRIGHTDATA_LIVE=1 to run against real API
```

### No `time.sleep()` in Tests

All timing-sensitive tests use either:
- Temporal's `start_time_skipping()` for workflow timer tests
- `asyncio.wait_for()` with explicit timeouts for async tests

### Mock Approval Pattern

When mocking IS used, it follows the approved pattern:

```python
# MOCK APPROVED: OpenAI API - cost and rate limit concerns
# Approved by: [name] on [date]
# Alternative: Set REAL_OPENAI=1 to run against real API
@patch("app.agents.synthesis_agent.Agent")
async def test_synthesis_agent(mock_agent):
    ...
```

## Addressed Testing Gaps

### CI/CD Pipeline (Phase 6)

Tests now run automatically on every push and pull request via GitHub Actions. The CI pipeline uses PostgreSQL 16 and Redis 7 service containers, ensuring tests run against real databases -- not mocks.

### Testcontainers Integration (Phase 6)

Testcontainers is configured for PostgreSQL and available for isolated integration tests:

```python
@pytest.fixture
async def db_session():
    async with PostgresContainer("postgres:16") as pg:
        engine = create_async_engine(pg.get_connection_url())
        # Run migrations, yield session, cleanup
```

In CI, GitHub Actions service containers serve the same purpose with less overhead. Testcontainers is primarily used for local development testing.

### Frontend Component Coverage (Phase 5)

All dashboard components now have dedicated test files across 59 test suites, up from partial coverage of 16 components. Tests cover rendering, user interactions, edge cases, and accessibility.

## Future Testing Enhancements

### Testcontainers Expansion

Testcontainers is configured for PostgreSQL. The CI pipeline uses dedicated GitHub Actions service containers for all integration tests. Expanding testcontainers usage for local development would improve test isolation.

### Page-Level Integration Tests

Page components are thin after custom hook extraction. Adding integration tests that verify hook + component orchestration would increase coverage of the page-level composition layer.

## Test Organization

```
backend/tests/
  test_workflow.py          # Temporal workflow integration tests
  test_activities.py        # Activity function tests
  test_osint_agent.py       # OSINT pipeline tests
  test_osint_cache.py       # Cache/reuse logic tests
  test_belgian_agent.py     # Belgian agent tests
  test_nbb_service.py       # NBB API client tests (55+ tests)
  test_kbo_service.py       # KBO scraper tests
  test_mcc_classifier.py    # MCC classification tests
  test_peppol_*.py          # PEPPOL service tests
  test_northdata_*.py       # NorthData scraping tests
  test_cases.py             # API endpoint tests
  test_portal.py            # Portal endpoint tests
  ...
```
