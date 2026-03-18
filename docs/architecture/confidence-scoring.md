---
sidebar_position: 20
title: "Confidence Scoring"
---

# Investigation Confidence Scoring (Pillar 1)

Quantified certainty for every compliance investigation — replacing binary pass/fail with a 4-dimension confidence framework.

## Business Value

Compliance officers need to understand not just *what* the AI found, but *how certain* it is. Confidence Scoring provides a 0-100 score decomposed into four independently measurable dimensions, enabling evidence-based decision-making.

## Architecture

```mermaid
graph TD
    A[Investigation Result] --> B[ConfidenceEngine]
    B --> C[Evidence Completeness 0-25]
    B --> D[Source Diversity 0-25]
    B --> E[Consistency 0-25]
    B --> F[Historical Calibration 0-25]
    C & D & E & F --> G[Overall Score 0-100]
    G --> H{Confidence Level}
    H -->|85+| I[HIGH]
    H -->|65-84| J[MEDIUM]
    H -->|40-64| K[LOW]
    H -->|0-39| L[INSUFFICIENT]
    G --> M[CalibrationService]
    M -->|Officer feedback| B
```

## Confidence Dimensions

| Dimension | Range | Measures |
|-----------|-------|----------|
| Evidence Completeness | 0-25 | Coverage of required document categories |
| Source Diversity | 0-25 | Number and variety of independent sources |
| Consistency | 0-25 | Agreement between sources on key facts |
| Historical Calibration | 0-25 | Accuracy of similar past predictions |

## Confidence Levels

| Level | Score Range | Action |
|-------|-----------|--------|
| HIGH | 85-100 | Automated approval eligible |
| MEDIUM | 65-84 | Standard review |
| LOW | 40-64 | Enhanced review recommended |
| INSUFFICIENT | 0-39 | Additional investigation required |

## Workflow Integration

Confidence scoring is invoked through the `_compute_and_store_confidence()` helper method, which was extracted from the workflow's `run` method during the codebase hardening sweep (change I6). This helper is shared between the KYC and KYB investigation paths — both call it after their respective investigation activities complete.

```python
# Shared for both KYC and KYB paths
await self._compute_and_store_confidence(
    input, investigation_result, retry_policy
)
```

The helper:
1. Checks the `confidence-score-v1` version gate (skipped for old workflow histories)
2. Calls the `compute_confidence_score` activity with a 30-second timeout
3. Appends the result to `self._state.confidence_scores`
4. Logs a `confidence_computed` audit event
5. Swallows all exceptions (confidence scoring is best-effort — a scoring failure never blocks case progression)

Prior to I6, confidence scoring was duplicated inline in both the KYC and KYB branches. Extracting it to `_compute_and_store_confidence()` eliminates the duplication and ensures both paths always score using identical logic.

## Key Components

- **`confidence_engine.py`** — Core scoring engine with dimensional computation
- **`calibration_service.py`** — Feedback loop: officer decisions calibrate future scores
- **`ConfidenceScoreCard.tsx`** — Visual breakdown in case detail view

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/confidence/scores/{case_id}` | Get confidence breakdown for a case |
| GET | `/api/confidence/calibration` | Get calibration statistics |
| POST | `/api/confidence/feedback` | Submit officer feedback for calibration |

## Configuration

- `confidence_scoring_enabled` — Feature flag (default: `true`)
- Alembic migration: `006_calibration_data`
