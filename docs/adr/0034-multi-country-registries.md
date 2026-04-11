---
id: 0034-multi-country-registries
sidebar_position: 35
title: "ADR-0034: Multi-Country Registry Architecture"
---

# ADR-0034: Multi-Country Registry Architecture

**Status:** Accepted
**Date:** 2026-04-06

## Context

ADR-0019 defined the agent pipeline architecture with country routing at the agent layer. This ADR documents the service layer beneath it -- the per-country registry implementations that connect to government APIs and public data sources across 12 European countries.

Each European country operates its own company registry with incompatible APIs, data models, authentication schemes, and rate limits. Belgium's KBO uses a SOAP/XML interface, France's INPI uses OAuth2 + REST, Czech Republic's ARES uses XML with custom namespaces, the Netherlands' KVK requires API key authentication, and Romania's ANAF exposes a public REST API with no authentication but returns Romanian-language responses. Some countries (Estonia, Denmark) offer modern REST APIs; others (Slovakia) require scraping court register HTML.

A universal adapter pattern would force lowest-common-denominator normalization, losing country-specific data that is available from some registries but not others (e.g., Belgian gazette publications, French BODACC legal announcements, Czech insolvency records). The system needs per-country specialization while maintaining a consistent interface for the agent layer.

## Decision

Implement one service file per country (or per registry within a country) under `app/services/registries/`, with a country routing layer that maps ISO country codes to the appropriate service(s).

**Current registry coverage (12 countries, 21 service files):**

| Country | Services | API Type |
|---------|----------|----------|
| BE | KBO (via existing `kbo_service.py`, `nbb_service.py`) | SOAP/REST |
| CZ | ARES, Justice.cz, ISIR (insolvency) | XML REST |
| CH | Zefix | REST |
| DK | CVR (Virk) | REST |
| EE | Ariregister (e-Business Register) | REST |
| FI | YTJ (Business Information System) | REST |
| FR | INPI, INSEE, BODACC | OAuth2 REST |
| NL | KVK, KVK Jaarrekeningen (annual reports) | REST |
| NO | Brreg, Regnskapsregisteret (accounting register) | REST |
| RO | ANAF (company identity + financial), ONRC (directors via BrightData), Nomenclator | REST + scraping |
| SK | ORSR (commercial register), RUZ (financial statements) | Scraping + REST |

Each service file is self-contained: it handles its own HTTP client setup, authentication, response parsing, error handling, and data normalization. Services return Pydantic models that the registry agent consumes. A shared `financial_utils.py` provides common financial data normalization (currency conversion, accounting period detection).

**Key design choice:** per-country files rather than a generic adapter because:
- Government APIs change independently and unpredictably -- isolating changes to one file prevents regressions in other countries
- Each country has unique data available (Belgian gazette publications, Czech insolvency records, Norwegian accounting data) that a generic adapter would discard
- Testing is country-scoped -- a change to the ARES parser can be tested without running Belgian or French tests

## Consequences

### Positive
- Adding a new country is an isolated task -- create a service file, add the route, write tests -- no changes to existing countries
- Country-specific data (insolvency records, gazette publications, financial statements) is preserved and available to downstream agents
- Each service file can be independently rate-limited, circuit-broken (ADR-0032), and monitored
- 12-country coverage provides broad EU reach for the initial sales pipeline

### Negative
- 21 service files is significant maintenance surface -- government API changes require per-country updates
- No shared base class enforces a consistent interface -- each service returns its own response shape, with normalization happening in the agent layer
- Some countries have incomplete coverage (e.g., Romania directors require BrightData scraping because ONRC has no public API for directors)

### Risks
- Government API deprecation with no advance notice -- several registries (particularly Eastern European ones) have changed endpoints without versioning
- Scraping-based services (SK ORSR, RO ONRC via BrightData) are fragile against HTML structure changes
- Rate limit differences across countries could cause circuit breaker settings (ADR-0032) to be suboptimal for some registries
