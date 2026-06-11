---
id: 0042-cz-regulatory-professional-registries
sidebar_position: 43
title: "ADR-0042: CZ Regulatory & Professional Registries"
---

# ADR-0042: Czech Regulatory + Professional Registry Coverage

**Status:** Accepted
**Date:** 2026-04-17

## Context

The CZ investigation pipeline queries ARES (commercial register), Justice.cz (sbírka listin document collection), and ISIR (insolvency). Four additional source types were identified as material gaps during Komerční banka demo preparation:

1. **CNB regulated-entity register** -- licensed banks, insurers, securities dealers. Critical evidence for any financial-institution customer.
2. **Czech debarment** -- entities barred from public contracts per § 123 Act No. 134/2016 Coll. An adverse regulatory signal.
3. **KDP ČR** -- Chamber of Tax Advisors. Relevant only for professional-services customers, but needed for those.
4. **Docling financial extraction** -- sbírka listin PDFs are downloaded today but not parsed; structured financials would feed the risk matrix.

Live APIs for the first three are unreliable (CNB JERRS returns InternalServerError on a regular basis), HTML-only with no structured endpoint (MMR debarment), or non-existent (KDP).

## Decision

Ship **curated JSON lookup tables** bundled with the service for sources #1–#3, with a clear extension point for live sync, and wire the existing `DoclingService` into `_collect_cz` for #4.

**Architecture per source:**

- **CNB (`cz_cnb_service.py`)** -- `lookup_cnb_entity(ico)` reads `data/cz_cnb_entities.json` (~30 major regulated entities). Returns license type, date, supervisor, status. Manual quarterly refresh.
- **Debarment (`cz_debarment_service.py`)** -- `lookup_debarment(ico)` reads `data/cz_debarment_list.json` (initially empty). Extension point: MMR scraper.
- **KDP (`cz_kdp_service.py`)** -- `lookup_kdp_entity(ico)` reads `data/cz_kdp_entities.json`. Extension point: KDP directory scraper.
- **Docling (`document_evidence_collector.py`)** -- after each sbírka listin PDF is uploaded to MinIO, Docling converts it to Markdown and uploads the `.md` alongside; `RetrievedDocument.extracted_text_key` now points to the markdown artifact so downstream consumers read text without re-fetching.

**Why curated lookups instead of live APIs:** CNB JERRS's Oracle ADF app returns 500 for 30%+ of requests; MMR debarment has no structured endpoint and changes its HTML without notice; KDP offers no machine-readable access. Curated JSON is ACID-simple, ships in-repo, survives restarts, and refreshes independently of code. The live-sync path is preserved -- each service is `async` to allow a drop-in replacement.

**Trade-offs:** staleness (mitigated by a documented quarterly refresh cadence in each file's `_update_policy`), completeness (graceful `None` for unknown IČOs -- no false positives, only missed hits), and provenance (`_source` and `_license` metadata on every file).

## Consequences

### Positive
- For the Komerční banka demo, the CNB finding fires as VERIFIED ("Banking license per Act No. 21/1992 Coll., licensed since 1990-11-05") -- a strong regulatory-trust signal
- A debarment clean-check posts as a VERIFIED finding -- evidence for the compliance file
- Financial statements from sbírka listin are now extractable text via Docling, feeding cross-reference and risk scoring
- Each new service is in-process, sub-millisecond, with no external dependency

### Negative
- Manual refresh burden for the curated files
- False negatives when a newly-licensed entity isn't yet in the curated list
- Docling extraction runs per-PDF (~5–30s cold, synchronous in `asyncio.to_thread`) -- acceptable since sbírka listin documents are rare per case

### Risks
- Stale CNB data could miss recent license revocations (an AML risk-inversion) -- mitigated by quarterly audit and VERIFIED (not HIGH) severity, so it's evidence not decision
- Debarment list growth must not degrade performance -- the linear scan is O(n) but n ≈ low hundreds

## Follow-ups

- MMR debarment scraper with a quarterly cron
- KDP directory scraper
- CNB JERRS live-sync once the Oracle ADF app stabilises or CNB publishes a proper JSON endpoint
- Post parsed financials (assets, equity, revenue, profit) into `FinancialHealthReport` rather than storing only raw markdown
