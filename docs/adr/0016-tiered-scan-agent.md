---
id: 0016-tiered-scan-agent
sidebar_position: 17
title: "ADR-0016: Tiered Scan Agent"
---

# ADR-0016: Tiered Scan Agent (Portfolio-Scale Entity Screening)

| | |
|---|---|
| **Date** | 2026-02-27 |
| **Status** | `Implemented` |
| **Deciders** | Adrian Birlogeanu |

## Context

The existing OSINT pipeline (5 LLM calls, 60-160 seconds per entity) was designed for deep per-case investigation triggered by compliance officers. As Trust Relay moves toward portfolio-scale merchant onboarding for PSPs, two problems emerge:

1. **Cost at scale**: A PSP onboarding 500 merchants per month cannot afford full OSINT investigations on every entity. At ~$0.15 per investigation (5 LLM calls), the monthly cost for 500 entities is $75 -- but the real cost is human: every investigation produces a multi-page report that a compliance officer must review. The vast majority of entities are low-risk and need only a lightweight check.

2. **Risk contagion blindness**: The per-case model treats each entity in isolation. A director who appears across multiple merchant applications, or a company whose UBO is sanctioned in a different case, is invisible unless the officer manually cross-references. The Neo4j knowledge graph (ADR-0014) stores these relationships but has no automated mechanism to surface them proactively.

Regulatory frameworks already define graduated due diligence levels. The EU's 4th and 5th Anti-Money Laundering Directives (AMLD4/5) distinguish between Simplified Due Diligence (SDD) for demonstrably low-risk entities, Customer Due Diligence (CDD) as the standard baseline, and Enhanced Due Diligence (EDD) for high-risk entities or those with complex ownership structures. A scan system should mirror this graduated approach rather than applying the same depth to every entity.

## Decision

Implement a four-tier scan agent that provides increasing levels of investigation depth, each building on the previous tier's results. The tiers are designed so that the cheapest tiers handle the highest volume, and LLM calls are reserved for the minority of entities that need them.

### Tier 0: E-VAL (Graph-Only Risk Scoring)

- **Purpose**: Pre-screen entities already in the knowledge graph before any external lookup.
- **Method**: Compute a weighted score from graph properties: number of cross-investigation appearances, co-directorship clusters, hop distance from sanctioned entities, and financial health signals from prior scans.
- **LLM calls**: 0
- **Latency**: &lt;100ms
- **Cost**: Effectively free (graph query only)
- **Output**: `EvalResult` with `eval_score` (0.0-1.0) and `above_threshold` flag.
- **Use case**: Prioritizing which entities in a portfolio need further scanning. Entities below the threshold (default 0.3) can be deferred.

### Tier 1: Lightweight Scan (SDD Equivalent)

- **Purpose**: Fast, deterministic screening against authoritative sources. Sufficient for Simplified Due Diligence on clearly low-risk entities.
- **Data sources**: KBO/BCE company registry, PEPPOL verification (including inhoudingsplicht debt checks), and local EU sanctions list matching via Jaro-Winkler fuzzy string comparison.
- **LLM calls**: 0
- **Latency**: 2-8 seconds
- **Cost**: ~1 cent (API calls only)
- **Output**: `ScanResult` with company status, directors, NACE codes, sanctions matches, PEPPOL registration, and tax/social debt flags.
- **Risk classification**: Green (clean), Amber (fuzzy sanctions match, debt detected, inactive company), Red (exact sanctions hit).

### Tier 2: Standard Scan (CDD Equivalent)

- **Purpose**: Add adverse media search and LLM-based analysis for entities that require Customer Due Diligence. Builds on Tier 1 results (uses cache when available).
- **Additional data**: Adverse media search via Tavily API, LLM resolution of ambiguous sanctions matches from Tier 1 (the 0.80-0.95 Jaro-Winkler similarity zone), and a single PydanticAI synthesis call that produces a structured risk narrative with key concerns and recommended action.
- **LLM calls**: 1-2 (synthesis always, sanctions resolution only when ambiguous matches exist)
- **Latency**: 10-20 seconds
- **Cost**: ~5-7 cents
- **Output**: `ScanResult` enriched with `adverse_media_hits`, `adverse_media_summary`, and `synthesis_summary`.

### Tier 3: Full Investigation (EDD Equivalent)

- **Purpose**: Enhanced Due Diligence via the existing OSINT pipeline. Triggered for high-risk entities that need document collection, officer review, and iterative follow-up.
- **Method**: Creates a full compliance case and starts the existing Temporal workflow (`ComplianceCaseWorkflow`). No new code -- Tier 3 reuses the entire case lifecycle including document upload portal, Docling conversion, multi-agent OSINT investigation, task generation, and officer decision loop.
- **LLM calls**: 5+ (registry agent, person validation, adverse media agent, synthesis agent, task generator)
- **Latency**: 60-160 seconds for automated pipeline; days to weeks for the full officer review loop.
- **Cost**: ~15 cents for the automated portion, plus officer time.
- **Output**: A compliance case with `workflow_id`, `portal_token`, and `portal_url` for the existing dashboard/portal flow.

### Tier mapping to regulatory framework

| Regulatory Level | Scan Tier | When Applied |
|---|---|---|
| Pre-screening | Tier 0 (E-VAL) | Portfolio prioritization, recurring monitoring |
| Simplified Due Diligence (SDD) | Tier 1 (Lightweight) | Low-risk entities, high-volume onboarding |
| Customer Due Diligence (CDD) | Tier 2 (Standard) | Default for new merchants, amber-flagged entities |
| Enhanced Due Diligence (EDD) | Tier 3 (Full Investigation) | High-risk entities, sanctions hits, PEP exposure |

### Graph-based entity discovery

After any Tier 1+ scan completes, the recursive discovery engine traverses the Neo4j graph to find connected entities (directors, UBOs, parent companies, co-directorships) up to N hops away. Each discovered entity receives an E-VAL score, and the top K entities per hop level (sorted by score descending) receive automatic Tier 1 scans. This surfaces risk contagion -- for example, a clean-looking merchant whose director is also a director of a sanctioned entity in a different case.

The discovery engine supports configurable auto-escalation: amber results can be promoted to Tier 2, and red results to Tier 3, without officer intervention. This is disabled by default and intended for high-risk portfolio segments.

### Sanctions matching: Jaro-Winkler + LLM

The sanctions screening pipeline uses a two-phase approach optimized for cost:

1. **Phase 1 (Tier 1, deterministic)**: Normalize names (NFKD decomposition, strip diacritics, remove punctuation, lowercase), then perform exact lookup against an indexed sanctions list. For non-exact matches, compute Jaro-Winkler similarity against all entries. Matches above 0.95 are treated as confirmed fuzzy hits. Matches in the 0.80-0.95 zone are flagged as `needs_llm_resolution`.

2. **Phase 2 (Tier 2, LLM-assisted)**: For the ~5% of scans that produce ambiguous matches, a PydanticAI sanctions resolver agent evaluates whether the query name and sanctioned entity are the same real-world person or organization. The LLM receives both names, the sanctions list type, and the reason for listing. It returns a structured verdict (match/no-match with confidence and reasoning).

This design keeps Tier 1 at zero LLM calls for >95% of entities while providing LLM-grade accuracy for the ambiguous minority in Tier 2.

### Portfolio batch processing

The `PortfolioService` enables PSPs to upload entity lists and run rate-limited parallel Tier 1 scans with configurable concurrency (default 20). Results are aggregated into a risk distribution summary (green/amber/red counts). Portfolio nodes and CONTAINS relationships are persisted to the graph for cross-portfolio analysis.

## Consequences

### Positive

- **Cost optimization**: A 500-entity portfolio costs ~$5 at Tier 1 vs. ~$75 at full OSINT. Only the 5-10% flagged entities need Tier 2+, reducing total cost by 80-90%.
- **Regulatory alignment**: The four tiers map directly to SDD/CDD/EDD, making it straightforward to document compliance procedures for auditors.
- **No duplication for Tier 3**: Reusing the existing Temporal workflow means Tier 3 inherits all existing features (document portal, iterative review, audit trail, evidence persistence) with zero additional code.
- **Risk contagion detection**: Graph-based discovery surfaces hidden relationships that per-case investigation misses. A sanctioned director shared across 3 merchant applications is detected automatically.
- **Incremental deepening**: Each tier builds on the previous tier's cached results. Escalating from Tier 1 to Tier 2 does not repeat the KBO/PEPPOL lookups.
- **Deterministic at scale**: Tier 0 and Tier 1 produce identical results for identical inputs (no LLM variability), which is important for audit consistency across large portfolios.

### Negative

- **Graph dependency for Tier 0**: E-VAL scoring requires Neo4j to be populated. New entities with no graph history always score 0.0 and must rely on Tier 1 for initial screening.
- **Sanctions list maintenance**: The local sanctions list must be kept current. Stale data means missed matches. An automated refresh mechanism is deferred to production hardening.
- **Jaro-Winkler limitations**: String similarity is a blunt instrument for name matching across scripts and transliterations (e.g., Arabic/Cyrillic names). The LLM resolution in Tier 2 mitigates this, but Tier 1 may produce false negatives for non-Latin names.

### Neutral

- Tier 0 and Tier 1 add no new external dependencies beyond KBO and PEPPOL, which are already integrated.
- The scan agent runs in the FastAPI process (not the Temporal worker), except for Tier 3 which delegates to the existing Temporal workflow.
- Scan results are persisted to Neo4j as `ScanResult` nodes linked to `Company` nodes, making them queryable for historical trend analysis.

## Alternatives Considered

### Single-tier full investigation for all entities

Apply the existing OSINT pipeline to every entity. Rejected because the cost ($0.15/entity) and latency (60-160s) are prohibitive at portfolio scale. A PSP scanning 500 merchants would wait hours and spend $75, with 450+ reports that show "low risk" and waste officer attention.

### Two tiers only (lightweight + full)

Skip the intermediate Tier 2 (Standard/CDD). Rejected because the jump from zero LLM calls to 5 LLM calls is too large. Many amber-flagged entities need only an adverse media check and a brief synthesis -- not a full document collection loop. Tier 2 fills this gap at 1/10th the cost of Tier 3.

### External sanctions screening API (e.g., Dow Jones, Refinitiv)

Use a commercial sanctions screening service instead of local Jaro-Winkler matching. Rejected for PoC because these services charge per-query fees ($0.01-0.10) that compound at portfolio scale, and they introduce a vendor dependency. The local matcher with LLM resolution provides comparable accuracy for the PoC. Production may add a commercial API as a secondary source.

### Separate Temporal workflow for Tier 2

Run Tier 2 scans as a lightweight Temporal workflow instead of inline in the FastAPI process. Rejected because Tier 2 completes in 10-20 seconds with 1-2 LLM calls -- well within HTTP request timeout. Adding Temporal overhead (workflow registration, task queue, worker polling) would increase latency and operational complexity for no durability benefit. Tier 3 uses Temporal because the investigation spans days to weeks with human-in-the-loop steps.

### Embedding-based sanctions matching instead of Jaro-Winkler

Use sentence embeddings (e.g., via OpenAI or a local model) for semantic name matching. Rejected because embedding inference adds latency and cost to every Tier 1 scan, defeating the zero-LLM design goal. Jaro-Winkler is sufficient for Latin-script name variants, and the LLM resolution in Tier 2 handles the remaining ambiguity.
