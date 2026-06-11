---
sidebar_position: 45
title: "Financial Analysis Agent"
description: "Deterministic financial health analysis — ratios, distress models, trend signals, peer benchmarks"
components:
  - app/agents/financial_analysis_agent.py
  - app/services/financial_analysis/analyzer.py
  - app/services/financial_analysis/ratios.py
  - app/services/financial_analysis/distress_models.py
  - app/services/financial_analysis/trend_analysis.py
  - app/services/financial_analysis/anomaly_detection.py
  - app/services/financial_analysis/peer_benchmarks.py
tests:
  - tests/test_financial_analyzer.py
  - tests/test_distress_models.py
  - tests/test_peer_benchmarks.py
last_verified: 2026-06-11
status: implemented
---

# Financial Analysis Agent

A dedicated pipeline stage that turns a raw `financial_health_report` (line items from NBB CBSO, BODACC, sbírka listin, etc.) into a structured `FinancialAnalysisReport` plus a list of typed `Finding` objects. Runs **after** the registry/NorthData fallback and **before** the synthesis agent. See [ADR-0048](../adr/0048-financial-analysis-agent) for the full architectural rationale.

## Why this exists

Compliance officers need more than raw balance-sheet numbers — they need a view. Until this layer existed, the platform exported "here is what the registry said" and left interpretation to the officer. AMLR Art. 28(2)(d) and the EBA risk-factor guidelines expect automated EDD to actually *weigh* financial signals, not just relay them.

## The five analytic stages

Every stage is pure Python, deterministic, and byte-identically replayable from stored inputs — an EU AI Act Art. 12 requirement.

### 1. Ratio extraction (`ratios.py`)

Liquidity, leverage, efficiency, profitability, coverage. Pure arithmetic over FHR line items. No thresholds applied here — the downstream stages consume the ratios.

### 2. Distress prediction (`distress_models.py`)

**Five models across three orthogonal families**, drawn from the peer-reviewed literature:

| Model | Reference | Use case | Distress threshold |
|---|---|---|---|
| Altman Z | Altman (1968), *J. Finance* | Public manufacturers | Z < 1.81 |
| Altman Z′ | Altman (1983) | Private manufacturers | Z′ < 1.23 |
| Altman Z″ | Altman (1995) | Service / non-manufacturer / emerging markets | Z″ < 1.1 |
| Ohlson O | Ohlson (1980), *J. Acct. Research* | Logistic regression on 9 ratios | O > 0.5 |
| Zmijewski | Zmijewski (1984) | Simpler 3-ratio logistic | Z > 0.5 |

**Why five models, not one.** No single bankruptcy-prediction model is robust across industries, sizes, and accounting regimes. Running three orthogonal families and surfacing agreement/disagreement gives officers a calibration signal rather than a single false-precision number. When models disagree, the disagreement itself becomes a finding.

### 3. Trend analysis (`trend_analysis.py`)

Year-over-year signals on revenue, equity, cash, working capital. Flags inversions (equity turning negative) and step-changes (>50% shifts year over year).

### 4. Anomaly detection (`anomaly_detection.py`)

Statistical outliers vs. the entity's own history. Distinct from peer benchmarks (which compare against industry); anomaly detection compares against the entity's own baseline.

### 5. Peer benchmarking (`peer_benchmarks.py`)

Ratio comparison against a NACE-code cohort. Surfaces entities that deviate meaningfully from industry norms — a common indicator of mis-reported financials or business-model divergence.

## Output shape

```python
FinancialAnalysisReport(
    going_concern_risk: Literal["low", "medium", "high", "critical", "insufficient_data"],
    ratios: FinancialRatios,
    distress: DistressScores,          # All 5 models, each with verdict or None
    trends: TrendSignals,
    anomalies: list[Anomaly],
    peer_comparison: PeerComparison,
    findings: list[FinancialFinding],   # Typed, severity-tagged, citation-linked
)
```

Each finding carries a canonical regulatory citation (AMLR article, EBA guideline, CNB vyhláška for CZ entities) so an officer can defend the decision during an inspection.

## Graceful degradation

When the FHR has only metadata (no line items) — e.g., the NBB CBSO CSV endpoint is degraded (see [ADR-0046](../adr/0046-nbb-cbso-csv-endpoint-degradation)) — the analyzer returns a report with `going_concern_risk="insufficient_data"` and an empty findings list. The pipeline treats absence-of-data as a known state, not an error.

## Chatbot integration

The chatbot's read tools expose the `FinancialAnalysisReport` structure, so officers can ask questions like *"what was the Altman Z-score on the 2024 filing?"* and get a factual answer with the exact formula quoted — not an LLM-hallucinated number.

## Why deterministic, not LLM

An LLM cannot be replayed byte-identically. An officer cannot cite "the language model said so" when defending a decision to a supervisor. All numeric verdicts stay in code where they're auditable; a future LLM-narrated layer on top is possible (e.g. industry-context reasoning about why a ratio deviation matters for a specific NACE code) but will never touch the numbers.

## References

- [ADR-0048](../adr/0048-financial-analysis-agent) — architectural decision
- AMLR Art. 28(2)(d) — enhanced due diligence
- EBA/GL/2023/03 §4.9 — financial indicator guidelines
- Altman, Ohlson, Zmijewski — see ADR-0048 for full citations
