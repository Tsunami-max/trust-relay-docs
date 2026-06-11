---
id: 0048-financial-analysis-agent
sidebar_position: 49
title: "ADR-0048: Financial Analysis Agent"
---

# ADR-0048: Financial Analysis Agent

**Status:** Accepted
**Date:** 2026-04-22
**Supersedes:** none
**Superseded by:** none

## Context

Compliance officers evaluating corporate customers need to form a view
on the target's financial health as part of EDD. Until 2026-04-22 the
pipeline produced a ``financial_health_report`` (line items + ratios
from NBB CBSO, BODACC, or sbírka listin) and a single categorical
label ("stable" / "filings_only"). Officers were left to interpret
the raw numbers themselves — which is exactly the kind of high-effort,
inconsistent judgement regulatory supervisors expect automated systems
to reduce.

AMLR Art. 28(2)(d) (enhanced due diligence) and the EBA risk-factor
guidelines require that financial risk signals be weighed during
onboarding and ongoing monitoring. Without a structured analytic layer
the platform was exporting "here's what the registry said" rather than
"here's what it means" — the latter is what a supervisor expects.

## Decision

Introduce a dedicated **Financial Analysis Agent** that runs after the
registry/NorthData step and before the investigation synthesis step.
It ingests a ``financial_health_report`` and the target's NACE codes
and produces a ``FinancialAnalysisReport`` plus a list of typed
``Finding`` objects that flow into the standard findings array.

The agent composes five orthogonal analytic stages:

1. **Ratio extraction** (``ratios.py``) — liquidity, leverage,
   efficiency, profitability, coverage. Pure arithmetic on FHR line
   items.
2. **Distress prediction** (``distress_models.py``) — **three**
   orthogonal models drawn from the peer-reviewed literature:
   - Altman (1968) Z, Altman (1983) Z′, Altman (1995) Z″ — three
     variants for public manufacturers, private manufacturers, and
     service/non-manufacturers respectively.
   - Ohlson (1980) O-score — logistic regression on nine accounting
     ratios.
   - Zmijewski (1984) — simpler three-ratio logistic.
   Each model emits a ``DistressVerdict`` or ``None`` when inputs are
   insufficient. Disagreement across models is itself surfaced as a
   finding.
3. **Trend analysis** (``trend_analysis.py``) — year-over-year signals
   on revenue, equity, cash, working capital. Flags inversions and
   step-changes.
4. **Anomaly detection** (``anomaly_detection.py``) — statistical
   outliers vs. the entity's own history.
5. **Peer benchmarking** (``peer_benchmarks.py``) — ratio comparison
   against a NACE-code cohort.

Findings are emitted with severity (``critical / high / medium / low /
verified``) and mapped to canonical regulatory citations (AMLR,
EBA guidelines, CNB vyhlášky for CZ entities) so an officer can
defend the decision during an inspection.

## Architectural constraints

**Deterministic-by-design.** None of the five stages calls an LLM.
Every output carries its source FHR fields and the formula that
produced it; the audit trail can replay the computation byte-identically
from stored inputs. This is non-negotiable for EU AI Act Art. 12
(automatic logging) and Annex IV technical documentation.

**Decoupled from the synthesis agent.** The Financial Analysis Agent
does not narrate — it produces typed structure. A later synthesis
step (the PydanticAI agent fleet) is free to quote the structured
output back in natural language, but only the raw report is load-bearing
for the decision record.

**Degrades gracefully.** When the FHR has only metadata (no line
items), the analyzer returns a report with
``going_concern_risk="insufficient_data"`` and an empty findings list
rather than raising. The pipeline treats absence of data as a known
state, not as an error — consistent with ADR-0046 (NBB CBSO honest
data-gap surfacing).

## Why these specific distress models

- **Five models, not one.** No single bankruptcy-prediction model is
  robust across industries, sizes, and accounting regimes. Running
  three orthogonal families (Altman, Ohlson, Zmijewski) and
  surfacing agreement/disagreement gives officers a calibration
  signal rather than a single false-precision number.
- **All peer-reviewed, all deterministic.** Every formula has a citation
  trail (Altman 1968, 1983, 1995; Ohlson 1980; Zmijewski 1984).
  Regulators ask "why did you decide the target was distressed?" —
  pointing at a 1968 *Journal of Finance* paper is a stronger answer
  than pointing at an LLM.
- **No commercial ML models.** Paid distress-prediction APIs (Moody's
  RiskCalc, CreditModel) are out of scope for the PoC — they add
  licence cost and audit complexity without adding explanatory power.

## Consequences

- **Pipeline position.** New stage inserted between registry/NorthData
  and synthesis. Downstream consumers (risk matrix, chatbot, PDF
  conclusion) already consume typed ``Finding`` objects, so the
  integration cost is zero beyond wiring the new agent in.
- **UI surface.** Financial Analysis findings are rendered in the
  officer dashboard tile (Overview tab) and as a dedicated panel on
  the case detail page.
- **Chatbot integration.** The chatbot's read tools expose the
  ``FinancialAnalysisReport`` structure so officers can ask "what
  was the Altman Z score on the 2024 filing?" and get a factual
  answer with the exact formula quoted.
- **Test coverage.** 34 unit tests across
  ``tests/test_financial_analyzer.py``,
  ``tests/test_distress_models.py``,
  ``tests/test_peer_benchmarks.py``.

## Alternatives considered

**Single-model approach (Altman Z only).** Simpler, but brittle —
private-company FHRs don't always have the inputs Altman Z-1968
needs, and a single number offers no calibration signal.

**LLM-narrated verdicts instead of typed structure.** Rejected. An
LLM cannot be replayed byte-identically, and an officer cannot cite
"the language model said so" when defending a decision to a
supervisor.

**Defer to OSINT synthesis agent.** Rejected. That agent's job is
natural-language narrative construction, not numeric analysis. Mixing
the two obscures provenance and violates the EU AI Act Art. 12
logging requirement (every numeric output must have a reproducible
source).

## References

- AMLR Art. 28(2)(d) — enhanced due diligence
- EBA/GL/2023/03 — risk-factor guidelines §4.9 (financial indicators)
- Altman, E. I. (1968). *Financial Ratios, Discriminant Analysis and
  the Prediction of Corporate Bankruptcy*, Journal of Finance
- Ohlson, J. A. (1980). *Financial Ratios and the Probabilistic
  Prediction of Bankruptcy*, Journal of Accounting Research
- Zmijewski, M. E. (1984). *Methodological Issues Related to the
  Estimation of Financial Distress Prediction Models*
- Related: ADR-0020 (EBA risk matrix), ADR-0029 (cost-optimized model
  tiers), ADR-0046 (NBB CBSO honest data-gap surfacing)
