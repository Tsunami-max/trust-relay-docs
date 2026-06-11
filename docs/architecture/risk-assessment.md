---
sidebar_position: 36
title: "Risk Assessment"
description: "EBA risk matrix, configurable risk scoring, red flag detection, and sector-specific risk engines"
components:
  - app/services/risk_engine.py
  - app/services/risk_matrix_service.py
  - app/services/eba_risk_matrix.py
  - app/services/red_flag_engine.py
  - app/services/precious_metals_risk_engine.py
  - app/services/risk_config_service.py
  - app/api/risk_config.py
last_verified: 2026-06-11
status: implemented
---

# Risk Assessment

Multi-layered risk assessment built exclusively on the EBA (European Banking Authority) risk factor matrix, deterministic red flag detection, a configurable risk scoring system with versioned configurations, and sector-specific risk engines. The risk engine produces quantified risk scores with full traceability to individual risk factors.

As of 2026-03-31 the system is **EBA-only**: the ARIA risk matrix has been removed and `EBA_RISK_MATRIX_ENABLED` flag eliminated. EBA scoring is always active.

## Components

| Module | Purpose |
|--------|---------|
| `risk_engine.py` | Core risk scoring engine aggregating multiple risk signals |
| `risk_matrix_service.py` | Configurable risk matrix management and evaluation |
| `eba_risk_matrix.py` | EBA/GL/2021/02 risk factor implementation (7 dimensions, 20 factors, SHA-256 determinism proof) |
| `red_flag_engine.py` | Deterministic red flag detection based on jurisdiction-specific rules |
| `precious_metals_risk_engine.py` | Sector-specific risk engine for precious metals dealers |
| `risk_config_service.py` | Versioned risk configuration management — load, activate, audit |
| `app/api/risk_config.py` | REST endpoints at `/api/risk-config/` |

## EBA Risk Matrix

The EBA risk matrix implements EBA/GL/2021/02 (Guidelines on risk factors) as a scored 7-dimension matrix. The overall score is a `weighted_max` aggregate: a weighted average of dimension scores with a floor boost (`FLOOR_BOOST_FACTOR = 0.60`) applied when any single dimension exceeds the critical threshold (`CRITICAL_DIMENSION_THRESHOLD = 80`), consistent with EBA guidance that a critical risk factor should dominate the assessment.

**7 dimensions** (weights from `eba_standard_v1.yaml`, `EBA_WEIGHTS` in `eba_risk_matrix.py`):

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Customer | 0.25 | `ownership_complexity`, `pep_exposure`, `sanctions_exposure`, `adverse_media`, `business_profile` |
| Geographic | 0.20 | `jurisdiction_risk`, `operational_geography`, `ubo_geography` |
| Product/Service | 0.15 | `product_complexity`, `regulatory_status` |
| Delivery Channel | 0.08 | `non_face_to_face`, `digital_presence` |
| Transaction | 0.12 | `financial_profile`, `transaction_patterns` |
| Network/Association | 0.10 | `network_risk`, `shared_address_risk`, `subsidiary_opacity` |
| Temporal/Historical | 0.10 | `company_age`, `filing_regularity`, `adverse_history` |

**Risk levels:**

| Level | Score Range |
|-------|-------------|
| Critical | 90+ |
| High | 70–89 |
| Medium | 40–69 |
| Low | 20–39 |
| Clear | 0–19 |

**SHA-256 audit trail:** `EBARiskResult` carries an `input_hash` and `output_hash` so auditors can verify stored results without re-running the scorer. The matrix version (`eba_standard_v1`) is captured in every result, satisfying 5-year AML retention requirements.

### `_unwrap_score` helper (2026-04-13)

`eba_risk_matrix.py` now defines a module-level `_unwrap_score(entry)`
helper that mirrors `ReferenceDataService.get_risk_score` so the four
inline `ref_datasets[...].get(key)` lookups in `_score_business_profile`
and `_score_product_service_dimension` correctly unwrap three supported
shapes: a plain numeric, `{"score": N, …}`, or
`{"risk_score": N, …}`. Previously the fast path returned the whole
entry dict which blew up with
`TypeError: float() argument must be a string or a real number, not
'dict'` and sent the `reassess_risk` activity into a Temporal retry
loop. Commit `dc5f1d4a`.

## Unified Risk Configuration

Risk scoring configuration is managed via the `RiskConfigService` and exposed through the `/api/risk-config/` REST API. Configurations are versioned: tenants can create new versions, preview their impact, and activate a version explicitly. Activating a new version records the change in `risk_config_audit`.

### Database Tables

| Table | Purpose |
|-------|---------|
| `risk_configurations` | Versioned risk config records — scoring model, reference dataset overrides, activation status. RLS-enforced per tenant. |
| `risk_config_audit` | Immutable audit log for config activations and deactivations. RLS-enforced per tenant. |

Both tables have `FORCE ROW LEVEL SECURITY` and are covered by standard tenant isolation policies.

### API Endpoints (`/api/risk-config/`)

Defined in `app/api/risk_config.py`. All mutating endpoints require the `super_admin` role; `GET /active` and `POST /recalculate/{case_id}` are open to any authenticated officer.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/risk-config/active` | Get the currently active configuration (no super_admin gate) |
| `GET` | `/api/risk-config/versions` | List all config versions for the current tenant (paginated) |
| `GET` | `/api/risk-config/versions/{config_id}` | Get a specific configuration version |
| `POST` | `/api/risk-config/versions` | Create a new draft by cloning the active config |
| `PUT` | `/api/risk-config/versions/{config_id}` | Update a draft configuration (validated) |
| `POST` | `/api/risk-config/versions/{config_id}/activate` | Activate a draft (archives the prior active version) |
| `GET` | `/api/risk-config/versions/{id_a}/diff/{id_b}` | Recursive diff between two versions |
| `GET` | `/api/risk-config/audit` | List configuration audit log |
| `POST` | `/api/risk-config/recalculate/{case_id}` | Recalculate a case's risk under the active config |
| `POST` | `/api/risk-config/batch-reevaluate` | Start a `BatchRiskReEvaluationWorkflow` for all active cases |

### Stale Configuration Detection

When a case was scored under an older configuration version, the case detail page shows a **stale config banner** with a **Recalculate** button. Clicking it re-scores the case under the currently active configuration and updates the stored risk score without requiring a full re-investigation.

## Admin UI — Risk Configuration Page

The `/admin/risk-configuration` admin page provides a three-tab interface for managing the active scoring model:

| Tab | Purpose |
|-----|---------|
| **Scoring Model** | View and edit the active EBA dimension weights, factor thresholds, and risk level boundaries |
| **Reference Datasets** | Inspect and override reference dataset values (FATF lists, PEP tiers, industry risk classifications) used by the EBA matrix |
| **Versions** | Browse all configuration versions, compare diffs, and activate a version |

The old `/admin/reference-data` page now redirects to `/admin/risk-configuration`.

## Recent Fixes (2026-04-06)

### Delivery Channel Fix

The `delivery_channel` dimension weight was incorrectly set to 0 in some configurations, causing the EBA matrix to produce inflated scores. It now carries the EBA-standard weight of 0.08 (8%) in `EBA_WEIGHTS`. The `non_face_to_face` factor contributes a positive score (`5.0` of its `15`-point factor maximum) for cases onboarded through the digital portal, reflecting EBA guidance that non-face-to-face identification carries inherent risk; the `digital_presence` factor is scored separately (20-point maximum).

### PEP Detection Fix

False PEP escalations were occurring when the screening agent found common-name matches without sufficient confidence. The fix tightens the PEP matching threshold: a PEP finding only elevates risk when the match confidence exceeds 0.7 (previously any match triggered escalation). Clean screening results now correctly produce `VERIFIED` severity in the structured summary.

### MCC-Aware License Verification

The verification checks pipeline now includes regulatory license verification that is MCC-aware. The MCC code (assigned by the MCC classifier agent earlier in the pipeline) determines the business vertical, which in turn determines which regulatory licenses are required. Missing licenses produce a `hit` finding with `PSD2 Art. 11 / CRR Art. 8` regulatory basis.

### Segment Risk Calibration

EBA **dimension** weights can be overridden per regulatory segment via `apply_risk_calibration(weights, calibration)` in `eba_risk_matrix.py`. The `RiskCalibration` model carries five dimension multipliers (`customer_weight_multiplier`, `geographic_weight_multiplier`, `product_weight_multiplier`, `channel_weight_multiplier`, `transaction_weight_multiplier`); calibration operates at the dimension level, not on individual factors. After multiplication the weights are re-normalised to sum to 1.0. Examples from `config/segments/`: CZ Banking applies `geographic_weight_multiplier = 1.2`; BE precious metals applies `customer_weight_multiplier = 1.5` and `transaction_weight_multiplier = 1.4`. Segment calibration is applied during the `post_osint` risk reassessment checkpoint.

### Risk Config 403 Fix

The `/api/risk-config/recalculate/{case_id}` endpoint was gated behind `super_admin` role, preventing compliance officers from recalculating risk scores when configurations changed. The gate has been removed -- any authenticated user with tenant access can trigger recalculation (see the `# No super_admin check` comment in `recalculate_case_risk`). The endpoint accepts either a `case_id` (UUID) or a `workflow_id` (`wf_xxx`), inserts a new `risk_assessments` row (preserving history), and updates the case's `additional_data`.
