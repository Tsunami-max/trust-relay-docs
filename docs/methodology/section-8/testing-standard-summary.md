---
sidebar_position: 0
title: "Testing Standard (Summary)"
description: "The testing standard governs how tests are written, what counts as a valid test, and what quality thresholds apply."
---


The testing standard governs how tests are written, what counts as a valid test, and what quality thresholds apply. It is the enforcement mechanism behind the "evidence over claims" principle (Section 2.3).

**Key Principles:**

1. **No mocking by default.** Mocking and in-memory databases are forbidden unless explicitly approved with a documented `MOCK APPROVED` comment that states the reason, the approver, the date, and the alternative for running against real services. Use testcontainers for PostgreSQL, MinIO, Redis, and Temporal.

2. **Deterministic tests only.** No `time.sleep()` in tests. For time-dependent behavior, use Temporal's `WorkflowEnvironment.start_time_skipping()` (not `freezegun`). Tests must produce the same result regardless of execution timing.

3. **Evidence requirements.** Every implementation response must include actual test output — `pytest` results and coverage report with timestamps. The statement "tests should pass" is not evidence.

4. **Fast by default.** Tests that require more than 30 seconds are marked with `@pytest.mark.slow` and excluded from the default test run. Long-running integration tests are opt-in, not mandatory for every commit.

**PoC vs Production Mode:**

| Dimension | PoC Mode | Production Mode |
|---|---|---|
| Test timing | Code first, tests after | TDD encouraged |
| Edge case tests | Skip initially | Required |
| E2E tests | Skip | Required for user-facing apps |
| Security tests | Deferred | Required for auth/data endpoints |
| Failure branch coverage | Not measured | 85% minimum |

**Coverage Targets:**

| Layer | PoC | Production |
|---|---|---|
| Workflow state machine + activities | 90% | 90% |
| FastAPI endpoints | 70% | 90% |
| React components | 70% | 90% |
| Integration layers (Docling, MinIO) | 70% | 90% |
| Line coverage (overall) | 70% | 90% |
| Failure branch coverage | -- | 85% |
| Real integration ratio | -- | 80% |

**Evidence:** Trust Relay has 3,769 backend test functions across 225 test files, 241 documented mock approvals across 232 test files, and 82 files using testcontainers with 290 total references. See [appendix-f-evidence.md](../appendix-f-evidence) for the full testing metrics.

Full specification: [appendix-a-testing.md](../appendix-a-testing)

---
