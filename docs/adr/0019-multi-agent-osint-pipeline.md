---
id: 0019-multi-agent-osint-pipeline
sidebar_position: 20
title: "ADR-0019: Multi-Agent OSINT Pipeline"
---

# ADR-0019: Multi-Agent OSINT Pipeline with Country Routing

**Date:** 2026-02-20 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

European KYB compliance requires querying different official registries per country -- KBO for Belgium, ARES for Czech Republic, INPI for France, Handelsregister for Germany, KVK for the Netherlands, and so on. Each registry has an incompatible API surface, data model, and authentication scheme. A single monolithic agent cannot handle the combinatorial explosion of country-specific logic, nor can it efficiently parallelize independent investigation tasks like adverse media screening and person validation.

Additionally, OSINT data sources have widely varying costs and rate limits. NorthData offers broad European coverage but requires a paid subscription and has no data for Belgium. Country-specific registries are authoritative but limited in scope. The system needs a strategy for selecting the cheapest viable source per country while maintaining a fallback chain for resilience.

Follow-up iterations in the compliance workflow re-investigate the same company with additional documents. Re-running all OSINT agents from scratch on each iteration would exhaust API quotas and add unnecessary latency.

## Decision

We implement a 4-agent pipeline with country-based routing:

1. **Registry Agent** -- queries the country-specific provider for company data (directors, UBOs, financials, legal form). Routed via `CountryRegistryProvider` which maps ISO country codes to provider implementations.
2. **Person Validation Agent** -- validates directors and UBOs against PEP lists, sanctions databases, and adverse media. Runs in parallel with Adverse Media Agent. Depends on Registry Agent output (needs director names).
3. **Adverse Media Agent** -- screens company name across news sources, court records, and sanctions lists. Runs in parallel with Person Validation Agent.
4. **Synthesis Agent** -- aggregates findings from all three upstream agents, resolves conflicts, and produces the final investigation report with confidence scores.

Execution order: Registry (sequential) then Person Validation + Adverse Media (parallel) then Synthesis (sequential).

Country routing uses a three-tier fallback chain per country:
1. Country-specific provider (e.g., KBO API for Belgium, ARES for Czech Republic)
2. NorthData web scraper (free tier, broad European coverage)
3. NorthData MCP API (paid tier, structured data)

OSINT results are cached to MinIO at `{case_id}/iteration-{n}/osint_cache/` with a 7-day TTL. Follow-up iterations load cached results and only re-run agents whose inputs have changed (new documents uploaded, new signals discovered).

## Consequences

### Positive
- Country-specific providers yield authoritative data directly from government registries
- Parallel execution of Person Validation and Adverse Media cuts investigation time by approximately 40%
- Three-tier fallback chain ensures resilience -- if a country registry is down, investigation degrades gracefully rather than failing
- MinIO caching prevents redundant API calls on follow-up iterations, reducing cost and latency
- New countries can be added by implementing a single `RegistryProvider` class without modifying pipeline logic

### Negative
- Sequential dependency between Registry and downstream agents means the critical path includes Registry latency (typically 2-8 seconds per provider)
- Caching introduces stale data risk -- a company's directors could change within the 7-day TTL window
- Each country provider is a separate maintenance burden -- API changes require individual provider updates
- The three-tier fallback chain makes debugging harder when data discrepancies arise between tiers

### Neutral
- The 4-agent structure maps naturally to PydanticAI agent definitions, each with its own system prompt and tool set
- Mock mode (`OSINT_MOCK_MODE=true`) must maintain realistic data for all 4 agents independently
- Agent execution traces feed into evidence bundles (see ADR-0021) regardless of which tier provided the data

## Alternatives Considered

### Alternative 1: Single NorthData API-only
- Why rejected: NorthData requires a paid subscription for structured data access. Coverage is incomplete for several target countries -- Belgium has no NorthData data at all. A single-source strategy creates a vendor lock-in with no fallback when the API is unavailable or rate-limited.

### Alternative 2: Fully parallel all 4 agents
- Why rejected: The Synthesis Agent needs findings from all three upstream agents to resolve conflicts and produce a coherent report. More critically, the Person Validation Agent needs director names from the Registry Agent as input -- running them in parallel would require a separate director discovery step, adding complexity without meaningful latency reduction.

### Alternative 3: Stateless design (no caching)
- Why rejected: Follow-up iterations are a core workflow feature (up to 5 iterations per case). Without caching, each iteration would re-run all OSINT agents from scratch, consuming API quotas proportional to iteration count rather than net-new information. For a 3-iteration case, this triples OSINT costs with no additional investigative value.
