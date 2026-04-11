---
id: 0020-eba-risk-matrix
sidebar_position: 21
title: "ADR-0020: EBA Risk Matrix"
---

# ADR-0020: EBA Risk Matrix with Weighted-Max Aggregation

**Date:** 2026-03-31 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

EU regulators (EBA GL/2021/02, 6AMLD, AMLR) mandate that financial institutions perform structured AML/CFT risk assessments using a risk-based approach. The assessment must be systematic, documented, and auditable. Trust Relay's initial risk scoring used a custom ARIA (Automated Risk and Intelligence Assessment) scorer that lacked regulatory alignment -- it did not map to the EBA's prescribed risk dimensions and could not demonstrate compliance during regulatory examination.

A critical design challenge is the aggregation function. A simple weighted average of risk dimensions dilutes critical signals: a company with directors on a PEP list operating from a FATF blacklist country could still score "medium" risk if other dimensions (product type, delivery channel) are clean. Regulators expect that a single critical risk factor elevates the overall assessment, not that it gets averaged away.

Additionally, different financial institutions have different risk appetites and regulatory contexts. A Belgian bank's geographic risk thresholds differ from a Dutch payment service provider's. The scoring system must be configurable per tenant without requiring code changes.

## Decision

We adopt the EBA GL/2021/02 standard as the risk assessment framework with the following structure:

**5 Risk Dimensions** with regulatory-mandated weights:
- Customer Risk (30%) -- 3 factors: entity type, ownership complexity, PEP exposure
- Geographic Risk (25%) -- 3 factors: country of incorporation, operational jurisdictions, counterparty locations
- Product/Service Risk (20%) -- 3 factors: product complexity, cash intensity, anonymity potential
- Transaction Risk (15%) -- 3 factors: volume patterns, cross-border activity, unusual structures
- Delivery Channel Risk (10%) -- 3 factors: face-to-face vs. remote, intermediary involvement, technology risk

**Weighted-max aggregation** with critical dimension floor boost:
1. Each dimension produces a score (0-100) from its 3 constituent factors
2. The overall score is computed as: `max(weighted_average, highest_dimension_score * floor_boost_factor)`
3. If any single dimension scores CRITICAL (>85), the overall score cannot fall below HIGH (70) regardless of other dimensions
4. This ensures that a FATF blacklist country (Geographic = CRITICAL) always produces at least a HIGH overall risk, even if all other dimensions are LOW

**Config-driven thresholds** stored in `risk_configurations` table:
- Each tenant can customize dimension weights, factor scoring rules, and threshold boundaries
- Default configuration ships as JSON reference data files
- Changes are audited in `risk_config_audit` table with before/after snapshots

**EU AI Act Art. 12 compliance**:
- SHA-256 hashes computed on both input data and output scores
- Hash pair stored alongside the risk assessment for reproducibility proof
- Given the same input hash, the system must produce the same output hash (determinism guarantee)

## Consequences

### Positive
- Direct regulatory alignment with EBA GL/2021/02 -- assessment structure maps 1:1 to the guideline's risk categories
- Weighted-max aggregation prevents critical risk signals from being diluted by clean dimensions
- Config-driven design allows tenant customization without code changes -- a bank can adjust geographic risk weights for their specific corridor exposure
- SHA-256 determinism proof satisfies EU AI Act Art. 12 automatic logging requirements
- Replaced ARIA scorer with a single, standards-based implementation -- reduced scoring code complexity

### Negative
- Weighted-max aggregation is more conservative than pure weighted average -- some cases will score higher than they would under a simple average, potentially increasing false-positive rates
- 15 factors across 5 dimensions require comprehensive input data -- missing data for any factor must be handled (currently defaults to medium risk, which may over-penalize data-sparse cases)
- Config-driven thresholds add operational complexity -- tenants need guidance on what constitutes a safe configuration

### Neutral
- The 5-dimension structure is fixed by EBA guidelines -- this is not a design choice but a compliance requirement
- Risk configurations are versioned -- changing thresholds does not retroactively alter past assessments
- The previous ARIA scorer code remains in the codebase but is no longer invoked by the pipeline

## Alternatives Considered

### Alternative 1: Pure weighted average
- Why rejected: A company incorporated in a FATF blacklist country with PEP directors scores Geographic=95 and Customer=90. With clean Product (20), Transaction (15), and Channel (10) dimensions, the weighted average is: (95*0.25 + 90*0.30 + 20*0.20 + 15*0.15 + 10*0.10) = 54.0 (MEDIUM). This is a regulatory failure -- such a company must score HIGH or CRITICAL. Weighted-max produces max(54.0, 95*0.85) = 80.75 (CRITICAL), which is the correct regulatory outcome.

### Alternative 2: Machine learning risk models
- Why rejected: ML models require labeled training data (historical cases with known outcomes) that Trust Relay does not yet have. More fundamentally, ML models are non-deterministic -- the same input can produce slightly different outputs across model versions or inference runs. EU AI Act Art. 12 requires automatic logging that enables reproducibility. A non-deterministic model cannot satisfy this requirement without additional infrastructure (model versioning, input/output snapshots per inference). The deterministic rule-based approach satisfies Art. 12 by construction.

### Alternative 3: Hard-coded factor trees
- Why rejected: Hard-coding scoring rules means every tenant customization requires a code change, review, test, and deployment. With 50+ potential tenants, each with different risk appetites and regulatory contexts, this creates an O(N) maintenance burden. The config-driven approach makes customization an operational task rather than a development task.
