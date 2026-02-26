---
id: 0007-belgian-data-layer
sidebar_position: 8
title: "ADR-0007: Belgian Data Layer"
---

# ADR-0007: Belgian Data Layer, Country Routing, and PEPPOL UI

| | |
|---|---|
| **Date** | 2026-02-23 |
| **Status** | `Implemented` |
| **Deciders** | Adrian Birlogeanu |

## Context

The OSINT pipeline uses NorthData as a generic European company registry. For Belgian companies, four official government data sources provide authoritative data that NorthData does not cover:

| Source | Data |
|---|---|
| **KBO/BCE** | Company registry (status, directors, activities) |
| **Belgisch Staatsblad** | Official gazette publications (including articles of association and statutory documents with official PDFs) |
| **NBB CBSO** | Annual financial accounts |
| **checkinhoudingsplicht.be** | Tax/social debt status |

Additionally:

- The PEPPOL verification service existed as API-only with no dashboard UI.
- The inhoudingsplicht check -- critical for construction sector compliance -- was not integrated anywhere.
- The case creation country field was free-text input with no validation.

## Decision

This ADR covers seven sub-decisions:

### 1. Country routing in OSINT pipeline

When `country=BE`, the OSINT orchestrator dispatches a Belgian-specific agent instead of the NorthData registry agent. Both agents produce the same `RegistryAgentOutput` so the synthesis agent is unaware of the switch. Other countries continue to use NorthData. The router is a simple if-statement, not a framework -- extract to a dispatch pattern when adding a second country.

### 2. Unified BelgianDataService

A single `BelgianDataService` class wraps all four Belgian data sources. Both the Belgian OSINT agent and the PEPPOL verification service call this shared layer. This avoids duplicating scraping logic and ensures consistent data collection.

### 3. BrightData MCP for HTML scraping

:::note Superseded Sub-Decision
This sub-decision was superseded by **ADR-0008** (Scraping Tool Selection). The actual implementation uses a **hybrid approach** with four sources:

| Source | Actual Tool | Reason |
|---|---|---|
| KBO/BCE | KBOService (BeautifulSoup) | Existing scraper, works reliably |
| Gazette | crawl4ai | Static HTML, no bot protection. Gazette publications include articles of association, statutory modifications, and official PDF documents |
| NBB CBSO | Direct REST API (httpx) | Public REST API behind the Angular SPA |
| Inhoudingsplicht | PEPPOL pipeline (primary) | CAPTCHA blocks automated scraping |

The other six sub-decisions remain accurate.
:::

### 4. Evidence persistence per source

Each scraped data source result is SHA-256 hashed and stored in a `belgian_evidence` PostgreSQL table with source URL, timestamp, and raw data. A bundle hash combines all source hashes for tamper detection. Raw data is also archived in MinIO. This extends the existing PEPPOL evidence pattern to the OSINT investigation.

### 5. Inhoudingsplicht in PEPPOL pipeline

The inhoudingsplicht check is added as a 4th concurrent lookup in the PEPPOL verification pipeline (alongside KBO, VIES, PEPPOL Directory). Two new FAIL-severity risk flags: `SOCIAL_DEBT_DETECTED` and `TAX_DEBT_DETECTED`. The Belgian OSINT agent references the same check via `BelgianDataService`.

### 6. EEA as compliance boundary

The country dropdown uses the 30 EEA countries (EU-27 + Norway, Iceland, Liechtenstein) as the valid set. This aligns with PSD2, GDPR, and e-invoicing regulatory scope. Switzerland and UK are excluded (not in EEA).

### 7. PEPPOL UI configurable per PSP

PEPPOL features (standalone page + case detail tab) are gated by a `peppol_enabled` config flag. Default `true`. Future: per-PSP profile configuration in database.

## Consequences

### Positive

- Belgian companies get deeper, more authoritative verification than NorthData provides.
- Officers see evidence provenance (source URLs, timestamps, hashes) for audit compliance.
- PEPPOL becomes demonstrable to investors via standalone dashboard page.
- Country routing is extensible -- same pattern works for adding NL, DE, FR agents later.

### Negative

- No paid API subscriptions required for PoC, but BrightData costs scale with usage.
- UBO register access deferred (behind paid/authenticated Belgian government API).

### Neutral

- The Belgian agent produces the same `RegistryAgentOutput` as NorthData, so the rest of the pipeline is unaware of the data source.
- Country-specific agents are opt-in; the system degrades gracefully to NorthData for unsupported countries.

## Alternatives Considered

### Two independent workstreams

Build Belgian agent and PEPPOL UI separately with no shared layer. Rejected because it duplicates scraping logic (especially inhoudingsplicht) and misses the natural connection between PEPPOL debt checks and OSINT findings.

### Full country-specific agent framework

Build a `CountryAgent` base class with abstract methods. Rejected as YAGNI -- we have one country. Refactor to a framework when adding a second country-specific agent.
