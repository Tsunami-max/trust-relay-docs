---
id: 0038-shell-company-detection
sidebar_position: 39
title: "ADR-0038: Shell Company Detection"
---

# ADR-0038: Shell Company Detection via Establishment Address Comparison

**Status:** Accepted
**Date:** 2026-04-14

## Context

Shell companies use mailbox registrations -- a legal seat at an accountant's or notary's address -- while all actual operations occur elsewhere. This is a documented red flag under EU anti-money-laundering regulation (EU-AMLR Art. 28 §2(a): geographic risk factors and unusual business structures).

Trust Relay already fetched establishment units from KBO (BE) and ARES RŽP (CZ) during the registry agent pass, storing them in `InvestigationResult.establishments`. The data was available but unused -- no signal was derived from the geographic relationship between the registered address and the operating addresses.

A fully automated detector was needed that runs on every investigation after registry data is merged, never blocks the pipeline if it fails, returns a structured `Finding` that flows through the existing evidence bundle and risk matrix, and supports multiple countries without per-country code changes.

## Decision

Introduce a typed `EstablishmentUnit` Pydantic model in the shared package, add an `establishments` field to `InvestigationResult`, implement a pure-function detector in `shell_company_detector.py`, and wire it into `run_investigation` in `osint_agent.py` using the guard-and-swallow pattern (ADR-0009).

**Key design choices:**

1. **Pure function, not a class** -- `detect_shell_company_pattern(registered_address, establishments, country)` is stateless and returns `Optional[Finding]`. No constructor, no DI, minimal mocking surface.

2. **Country-keyed regex dict** -- `_POSTAL_CODE_REGEXES` holds per-country patterns (BE: 4-digit; CZ: 5-digit with optional internal space). Adding a country is a one-line change; the signature and call site are unchanged.

3. **Postal code normalization before comparison** -- CZ "110 00" and ARES "11000" both normalize to "11000" before the set-membership check; BE does a simple `.strip()`.

4. **Unknown country returns `None`** -- a safe default that produces no false positives for unsupported regions.

5. **Guard-and-swallow at call site (ADR-0009)** -- the detector runs inside `try/except Exception`; a parsing failure logs a warning instead of raising.

6. **Detection separated from mutation** -- `findings` is only appended when a finding exists, avoiding an empty `findings` key if the detector fails partway.

**Regulatory basis:** EU-AMLR Art. 28 §2(a) -- unusual business structures where the registered address differs from all operating locations.

## Consequences

### Positive
- Every BE or CZ investigation automatically receives a HIGH-severity finding when the registered postal code is absent from all establishment addresses -- no officer configuration
- The `Finding` is fully structured and flows directly into the evidence bundle (ADR-0021), risk matrix (ADR-0020), and cross-reference discrepancy panel
- Pure-function design makes unit testing trivial -- no async, no I/O, no fixtures beyond address dicts
- The `regulatory_basis` field provides an EU AI Act Art. 13 transparency anchor

### Negative
- Postal-code extraction is regex-only; a malformed address silently yields `None` even when a real mismatch exists
- No cross-reference against commercial domiciliation registries -- legitimate fiduciary/business-center domiciliation still produces a finding
- Single-country-per-case architecture -- cross-border structural mismatches (e.g. a CZ subsidiary at a BE holding address) are not detected

### Risks
- False positives in legal domiciliation cases (common for Belgian SMEs) -- officers must be trained to distinguish domiciliation from shell structures
- The detector cannot distinguish a legitimate holding company from a shell -- a holding with zero establishments returns `None`, but one remote establishment triggers the finding
