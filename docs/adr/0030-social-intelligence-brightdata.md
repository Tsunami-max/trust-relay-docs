---
id: 0030-social-intelligence-brightdata
sidebar_position: 31
title: "ADR-0030: Social Intelligence via BrightData"
---

# ADR-0030: Social Intelligence via BrightData MCP Expansion

**Status:** Accepted
**Date:** 2026-04-05
**Context:** BrightData MCP exposes 34 tools but Trust Relay used only 3 (9% utilization). Romania had no dedicated registry agent.

## Decision

1. Add a dedicated `social_intelligence_agent` (Phase 3) that runs in parallel with person_validation and adverse_media. The agent has access to all 34 BrightData MCP tools via a single SSE connection. LLM-driven tool selection adapts to each company's profile and country.

2. Add full Romanian registry support via ANAF PlatitorTvaRest v9 (company identity, free public API) combined with BrightData scraping of ListaFirme.ro for directors/shareholders.

## Alternatives Considered

**Approach B: Distribute tools across existing agents** -- Add LinkedIn company profiles to person_validation, reviews to adverse_media, financial data to verification_checks. Rejected: creates multiple MCP connections, muddies agent responsibilities, harder to test.

**Approach C: Pre-processing enrichment layer** -- Run all BrightData queries before the OSINT agents start. Rejected: adds sequential dependency, doesn't fit the parallel pipeline architecture.

## Rationale

- Single MCP connection is more efficient than multiple connections spread across agents
- Clean separation: person_validation focuses on individual LinkedIn profiles, social_intelligence covers company-level social presence and reputation
- LLM-driven tool selection adapts per company (skips Google Maps for pure software companies, includes Yahoo Finance for public companies)
- For Romania: no official ONRC API exists for directors -- BrightData scraping of public aggregators is the pragmatic workaround

## Consequences

- Pipeline adds ~30-60s for social intelligence (runs in parallel, minimal wall-clock impact)
- BrightData token cost increases with more tool calls per investigation (~8-10 tools per case)
- Synthesis agent receives new signal types (reputation, social mentions, financial signals)
- Confidence engine gains 5 new source types for scoring diversity
- Romania becomes the 10th country with a dedicated registry provider

## Components

| Component | File | Purpose |
|-----------|------|---------|
| Social Intelligence Agent | `app/agents/social_intelligence_agent.py` | All 34 BrightData MCP tools |
| ANAF Company Service | `app/services/registries/ro_anaf_company_service.py` | Romanian company identity |
| ANAF Financial Service | `app/services/registries/ro_anaf_service.py` | Romanian financial statements (existing) |
| RO ONRC Service | `app/services/registries/ro_onrc_service.py` | Directors via BrightData scraping |
| RO Nomenclator | `app/services/registries/ro_nomenclator.py` | Legal form code lookups |
