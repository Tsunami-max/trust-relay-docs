---
sidebar_position: 3
title: "Evidence Over Claims"
description: "No implementation is considered complete until fresh verification output confirms the claim — 'it should work now' is not evidence"
---

# Evidence Over Claims

**What:** No implementation is considered complete until fresh verification output (test results, coverage report, runtime behavior) confirms the claim. The statement "it should work now" is treated as semantically equivalent to "I have not verified it."

**Why:** Large language models produce plausible output with high confidence regardless of correctness. This is not a bug — it is a structural property of how they work. A model that generates syntactically correct Python with proper type annotations, reasonable variable names, and coherent docstrings will produce code that *looks* correct to a human reviewer even when it contains subtle logical errors, off-by-one mistakes, or incorrect API usage patterns.

The failure mode is not that AI generates obviously broken code. Obviously broken code is caught immediately. The failure mode is code that passes visual review but fails at runtime — an async function that is called without `await`, a database query that uses the wrong column name but happens to match another column's type, a Temporal activity that catches and silently swallows an exception that should propagate.

Human code review catches some of these errors. But code review is a probabilistic defense: reviewers see what they look for, and the categories of AI errors do not always match the categories that experienced developers habitually check for. Automated verification (tests, linters, type checkers) is a deterministic defense. It catches errors regardless of whether the reviewer thought to look for them.

The methodology therefore mandates verification at multiple levels:

1. **Tests must run and pass.** Not "the tests exist." Not "the tests should pass." The actual test output must be present in the session before a task is marked complete.
2. **Coverage must meet thresholds.** 90% for workflow state machine and activities (the system's correctness-critical core), 70% for all other layers. These thresholds are enforced by tooling, not by discipline.
3. **Linting must pass.** Post-edit hooks run linters automatically. Code that introduces lint errors is flagged before it reaches review.

**Evidence:** Trust Relay has 3,769 backend test functions across 225 test files, plus 59 frontend test files. This test density — approximately 1 test function per 38 lines of production code — is a structural outcome of the evidence-over-claims principle: every feature implementation includes test implementation as a non-optional deliverable. The testing standard prohibits mocking by default (real PostgreSQL via testcontainers, real MinIO, real Temporal test server). When mocking is necessary (third-party APIs with rate limits or costs), each mock requires an explicit `MOCK APPROVED` comment documenting the reason, the approver, and the alternative for running against real services. Trust Relay has 241 such documented mock approvals across 232 test files. These are not arbitrary bureaucracy — they are an audit trail proving that every deviation from real-service testing was a conscious, justified decision. See the [Evidence appendix](../evidence/trust-relay-metrics) for the full testing metrics.

The 3-layer quality gate system implements this principle at the tooling level:

- **Layer 1 (post-edit):** Linters run automatically after file edits. Immediate feedback.
- **Layer 2 (stop verification):** When the AI signals task completion, a verification prompt fires asking for proof of completion. This catches the "it should work now" failure mode directly.
- **Layer 3 (pre-push):** Blocking gate before code reaches the remote. Tests must pass, coverage must meet thresholds.

**How:** The Superpowers `verification-before-completion` skill governs the completion gate. Before marking any task complete, the skill requires:

1. Fresh test output (not from a previous run — timestamps must be recent)
2. Coverage report showing threshold compliance
3. Linter output showing zero new warnings
4. For UI changes: screenshot or description of visual verification

The Stop hook (configured in `.claude/settings.json`) reinforces this at the infrastructure level. When Claude attempts to conclude a response with implementation claims, the hook prompt asks: "Have you shown the test output? Have you verified the change works?" This is a structural safeguard against the AI's tendency to declare victory prematurely.

For the full testing standard, see the [Testing Standard](../standards/testing-standard). For quality gate architecture, see [Quality Gates](../infrastructure/quality-gates).
