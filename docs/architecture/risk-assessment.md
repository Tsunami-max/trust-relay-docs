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
last_verified: 2026-03-31
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
| `eba_risk_matrix.py` | EBA/GL/2021/02 risk factor implementation (5 dimensions, 15 factors, SHA-256 determinism proof) |
| `red_flag_engine.py` | Deterministic red flag detection based on jurisdiction-specific rules |
| `precious_metals_risk_engine.py` | Sector-specific risk engine for precious metals dealers |
| `risk_config_service.py` | Versioned risk configuration management — load, activate, audit |
| `app/api/risk_config.py` | 9 REST endpoints at `/api/risk-config/` |

## EBA Risk Matrix

The EBA risk matrix implements EBA/GL/2021/02 (Guidelines on risk factors) as a scored 5-dimension matrix. The overall score is a `weighted_max` aggregate: a weighted average of dimension scores with a floor boost applied when any single dimension exceeds 80, consistent with EBA guidance that a critical risk factor should dominate the assessment.

**5 dimensions:**

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Customer | 0.30 | `ownership_complexity`, `pep_exposure`, `sanctions_exposure`, `adverse_media`, `business_profile` |
| Geographic | 0.25 | `jurisdiction_risk`, `operational_geography`, `ubo_geography` |
| Product/Service | 0.20 | `product_complexity`, `regulatory_status` |
| Delivery Channel | 0.10 | `non_face_to_face`, `digital_presence` |
| Transaction | 0.15 | `financial_profile`, `transaction_patterns` |

**Risk levels:**

| Level | Score Range |
|-------|-------------|
| Critical | 90+ |
| High | 70–89 |
| Medium | 40–69 |
| Low | 20–39 |
| Clear | 0–19 |

**SHA-256 audit trail:** `EBARiskResult` carries an `input_hash` and `output_hash` so auditors can verify stored results without re-running the scorer. The matrix version (`eba_standard_v1`) is captured in every result, satisfying 5-year AML retention requirements.

## Unified Risk Configuration

Risk scoring configuration is managed via the `RiskConfigService` and exposed through the `/api/risk-config/` REST API. Configurations are versioned: tenants can create new versions, preview their impact, and activate a version explicitly. Activating a new version records the change in `risk_config_audit`.

### Database Tables

| Table | Purpose |
|-------|---------|
| `risk_configurations` | Versioned risk config records — scoring model, reference dataset overrides, activation status. RLS-enforced per tenant. |
| `risk_config_audit` | Immutable audit log for config activations and deactivations. RLS-enforced per tenant. |

Both tables have `FORCE ROW LEVEL SECURITY` and are covered by standard tenant isolation policies.

### API Endpoints (`/api/risk-config/`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/risk-config/` | List all risk config versions for the current tenant |
| `GET` | `/api/risk-config/active` | Get the currently active configuration |
| `GET` | `/api/risk-config/{id}` | Get a specific configuration version |
| `POST` | `/api/risk-config/` | Create a new configuration version |
| `PUT` | `/api/risk-config/{id}` | Update a draft configuration |
| `POST` | `/api/risk-config/{id}/activate` | Activate a configuration version |
| `POST` | `/api/risk-config/{id}/deactivate` | Deactivate a configuration version |
| `GET` | `/api/risk-config/audit` | List configuration audit log |
| `DELETE` | `/api/risk-config/{id}` | Delete a draft configuration version |

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
