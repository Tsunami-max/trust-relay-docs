---
id: 0041-pure-mailbox-detection
sidebar_position: 42
title: "ADR-0041: Pure-Mailbox Detection"
---

# ADR-0041: Pure-Mailbox Detection for Shell Companies Without Operational Footprint

**Status:** Accepted
**Date:** 2026-04-17

## Context

The shell-company detector (ADR-0038) compares the KBO/ARES sídlo postal code against establishment unit postal codes. It fires when the registered seat doesn't match any operating location -- a "mailbox + real operations elsewhere" pattern.

An empirical hunt on 2026-04-17 through Prague virtual-office addresses (Na Florenci 1055/24 -- 1,183 registered entities; Olivova 2096/4 -- 138 entities) showed that the majority of suspicious shell-pattern companies have ZERO provozovny. The virtual-office sídlo IS the entire operational footprint -- they never register establishments because they don't operate anywhere; the registration exists solely to satisfy legal form requirements.

This pattern is undetected by the existing `shell_company_indicator`, which requires at least one establishment to compare against.

## Decision

Add a second, complementary finding type: `pure_mailbox_indicator`. It fires when ALL of the following hold:

1. Active company status (not in liquidation, dissolved, or bankrupt)
2. Zero provozovny returned by the country registry
3. Company age ≥ 6 months

Severity: **MEDIUM** -- suspicious but not conclusive. Regulatory basis: **EU-AMLR Art. 28 §2(a)** ("companies without apparent business activity").

**Why MEDIUM not HIGH:** legitimate holding/investment companies, remote IT consultancies, and consulting SPVs routinely have zero provozovny. The false-positive cost is modest (officer reviews and rejects via FP suppression), while the false-negative cost is real but not catastrophic since other signals fill the gap.

**Why combine with an age threshold:** newly-registered companies (< 6 months) may not yet have set up formal provozovny even when they plan to; the age gate reduces false positives on genuine startups.

## Consequences

### Positive
- Closes a material detection gap identified empirically against Czech Prague virtual-office addresses
- Complements the existing `shell_company_indicator` (mailbox + real-ops-elsewhere)
- Regulatory defence: explicit AMLR Art. 28 §2(a) citation in every Finding
- Officer has the FP suppression tool (ADR-0040) to dismiss when legitimate

### Negative
- False positives on holding companies / SPVs / IT consultancies
- Age threshold hardcoded at 180 days (6 months); segment-specific tuning deferred
- "Zero establishments" is noisy when combined with active VAT status, which this detector does not consult

### Risks
- FP fatigue if a tenant onboards many holding structures -- consider per-tenant suppression of the category if it proves too noisy
- The algorithm can't reliably distinguish "active with no provozovny" from "inactive with lapsed provozovny" without careful `status` checking

## Follow-ups

- Cross-reference with curated virtual-office address lists for a HIGH-severity variant
- Segment-specific age thresholds (holding → 24 months; retail → 6 months)
- Cross-reference with active VAT registration -- active VAT + zero provozovny is more suspicious
