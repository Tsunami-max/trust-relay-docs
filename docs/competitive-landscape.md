---
sidebar_position: 1
title: "Competitive Landscape & Differentiation"
---

# Competitive Landscape & Differentiation

This document provides an honest, evidence-based analysis of the KYB compliance market, Trust Relay's competitive positioning, and where both strengths and gaps exist. All claims are grounded in publicly available data and direct architectural comparison.

## Market Context

### KYB Market Size and Growth

The global Know Your Business (KYB) verification market is valued at approximately **$3.7 billion in 2024** and projected to reach **$10.6 billion by 2033**, representing a compound annual growth rate (CAGR) of roughly **18%**. This growth is driven by:

- **Regulatory escalation**: 6AMLD, FinCEN beneficial ownership rules, EU AML Package (AMLR/AMLD6), and MiCA crypto regulations all expanding KYB obligations
- **Digital payments expansion**: PSPs, neobanks, and marketplace platforms onboarding merchants at scale, each requiring KYB verification
- **Fraud sophistication**: Shell company proliferation and synthetic identity schemes forcing deeper investigation beyond surface screening

### The Perpetual KYB Shift

The industry is transitioning from **periodic review** (annual re-checks) to **perpetual KYB (pKYB)** -- continuous monitoring with event-triggered re-investigation. This shift creates demand for:

- Automated workflow orchestration (not just one-time screening)
- Tiered investigation depth (not every entity needs full due diligence)
- Cost-efficient portfolio scanning (monitoring 10,000+ entities economically)

### The PSP Pain Point

Payment Service Providers face a specific economic challenge: a portfolio of **10,000 merchants** cannot be monitored at **$0.50/entity** for full investigation depth. At that rate, comprehensive screening costs $5,000 per cycle -- unsustainable for monthly or continuous monitoring. The market needs a tiered approach where most entities are screened cheaply and only flagged entities escalate to deeper (and more expensive) investigation.

## Competitor Landscape

### Tier 1: Enterprise Data Providers

| Competitor | Strengths | What They Don't Do |
|---|---|---|
| **ComplyAdvantage** | 400M+ entity graph database, sub-500ms screening latency, $0.29/entity/month at scale, strong AML coverage, Golden Graph entity resolution | No document ingestion or conversion, no investigation workflow orchestration, no tiered investigation depth, no iterative compliance loops |
| **LSEG World-Check** (Refinitiv) | Gold-standard sanctions and PEP data, near-universal regulatory acceptance, 30+ years of curated data, 100% of top 50 banks as clients | Pure screening data provider, no workflow layer, 6-figure annual pricing, no document processing, no graph analysis |
| **Moody's/Orbis** (Bureau van Dijk) | 600M+ company profiles, Bel-first for Belgian coverage, deep beneficial ownership chains, financial statement data | Enterprise pricing (typically $50K+ annually), batch-oriented data delivery, no document processing, no real-time workflow, no investigation orchestration |
| **Dow Jones Risk & Compliance** | 17,000+ licensed news sources, premium adverse media coverage, Factiva integration, structured watchlist data | Pure data provider, enterprise pricing, no workflow, no document cross-referencing, no graph layer |

### Tier 2: Verification Platforms

| Competitor | Strengths | What They Don't Do |
|---|---|---|
| **Sumsub** | 500M+ records, biometric KYC + KYB in single platform, 50+ languages, 220+ country coverage, strong SDK for embedded verification | No iterative workflow (single-pass verification), no graph analysis, onboarding-focused (not ongoing monitoring), no document cross-referencing against OSINT |
| **Ondato / iDenfy** | Low per-verification pricing, EU-focused coverage, fast integration, biometric capabilities | Shallow verification depth (name + registry check), no investigation layer, no adverse media depth, no iterative compliance loops |

### Tier 3: Orchestration & Workflow Platforms

| Competitor | Strengths | What They Don't Do |
|---|---|---|
| **Alloy** | pKYB pioneer (launched January 2026), workflow orchestration with decision engine, 200+ data source integrations, strong US market presence | No graph analysis layer, no document cross-referencing, no Belgian OSINT depth, no AI-driven investigation synthesis |
| **Dotfile** | AI agent-based KYB (launched 2025), 1,000+ data source integrations, European focus, modern developer experience | No graph layer for entity discovery, no Belgian OSINT depth, single-pass AI (no iterative loops), no document-to-OSINT cross-referencing |

## Where Trust Relay Differentiates

The following comparison maps specific capabilities to the nearest competitor offering, identifying where Trust Relay provides unique or superior value.

| Capability | Trust Relay | Nearest Competitor | Gap Assessment |
|---|---|---|---|
| **Iterative compliance loop** | Temporal-orchestrated multi-round review with officer decisions driving next iteration. Up to 5 iterations with 60-day timeline. Customer portal collects additional documents per round. | Dotfile: single-pass AI agent. Alloy: decision engine with rules, no iterative document collection. | **Unique.** No competitor offers durable, multi-round compliance workflows with customer-facing document collection loops. |
| **4-tier cost optimization** | Tier 0: $0 (cache). Tier 1: ~$0.01 (registry lookup). Tier 2: ~$0.05 (adverse media). Tier 3: ~$0.50 (full investigation with graph). | ComplyAdvantage: flat $0.29/entity/month screening. Alloy: per-API-call pricing across integrations. | **Novel.** The tiered escalation model is architecturally unique -- entities only consume expensive resources when risk signals warrant it. |
| **Belgian deep OSINT** | 5 integrated sources: KBO/BCE (company registry), NBB CBSO (financial statements + CSV parsing), Belgian Gazette (publication full-text via crawl4ai), PEPPOL (e-invoicing + inhoudingsplicht), Inhoudingsplicht (social/tax debt). | Moody's Bel-first: comprehensive Belgian company data but behind commercial license. ComplyAdvantage: Belgian entity coverage but no registry-depth data. | **Unmatched depth** for Belgian compliance at this price point. No competitor integrates all 5 Belgian public sources with automated financial ratio computation. |
| **Graph entity discovery** | Neo4j knowledge graph with recursive N-hop traversal, E-VAL scoring for entity risk propagation, ontology-driven entity resolution across documents and registries. | ComplyAdvantage Golden Graph: 400M entity resolution graph. Moody's Orbis: ownership chain traversal. | **Architecturally comparable, smaller dataset.** Trust Relay's graph is case-scoped (built per investigation), not a pre-computed global graph. Trade-off: deeper per-case analysis vs. broader entity coverage. |
| **Document cross-referencing** | Docling converts uploaded PDFs to Markdown, then AI agents compare extracted data against OSINT findings (registry data, adverse media, financial statements). Discrepancies flagged automatically. | No competitor combines document ingestion with OSINT cross-referencing in a single workflow. Sumsub does document verification (authenticity) but not content-to-OSINT comparison. | **Unique combination.** Document content extraction + OSINT comparison in an automated pipeline is not available from any competitor. |
| **Customer portal** | Branded, token-authenticated document collection portal. Per-iteration document requirements. Follow-up task responses collected inline. No SDK integration required. | Sumsub: SDK-based verification flow embedded in client application. Dotfile: API-driven document collection. | **Different approach.** Trust Relay's portal serves compliance workflows (ongoing document collection across iterations). Sumsub's SDK serves onboarding (one-time verification). |
| **AI investigation synthesis** | 13 PydanticAI agents in a DAG pipeline: document validation, registry lookup, person validation, adverse media search, financial health analysis, MCC classification, synthesis, and task generation. | Dotfile: AI agent for KYB decisions. ComplyAdvantage: ML-based entity resolution and risk scoring. | **More comprehensive pipeline.** Trust Relay runs a multi-agent investigation rather than single-model scoring. Trade-off: higher latency per investigation vs. sub-second screening. |
| **[Portfolio verification with cited evidence](./portfolio-audit-mode.md)** | Batch CSV upload triggers 9-domain investigation across entire portfolio. Output: aggregated Independent Verification Report + individual Trust Capsules (SHA-256 hashed, source-cited). Cross-entity knowledge graph reveals relationship patterns across the batch. | ComplyAdvantage: batch screening with risk scores. Moody's: batch entity data delivery. Neither produces cited-evidence verification reports or cross-entity relationship analysis. | **Unique.** No competitor produces tamper-evident, source-cited evidence packs at portfolio scale with cross-entity graph analysis. Existing tools screen portfolios; Trust Relay investigates them. |

## Where Competitors Are Stronger

Honest assessment of gaps where established competitors hold significant advantages.

### Data Breadth

- **ComplyAdvantage**: 400M+ entities in a pre-computed graph vs. Trust Relay's Belgian-focused registry data
- **Moody's Orbis**: 600M+ company profiles with global financial data
- **Trust Relay gap**: Currently deep in Belgium, with EEA routing architecture in place but country-specific scrapers not yet implemented beyond Belgium

### Sanctions and Watchlist Quality

- **LSEG World-Check**: Regulatory gold standard, accepted by virtually all financial regulators
- **Dow Jones**: 17,000+ licensed news sources for adverse media
- **Trust Relay gap**: Sanctions matching uses Jaro-Winkler string similarity + LLM analysis against OpenSanctions data. This is not regulatory-grade. Production deployment would require integration with a licensed sanctions data provider (World-Check, Dow Jones, or ComplyAdvantage API) as a data source within the tier pipeline.

### Global Coverage

- **Sumsub**: 220+ countries with localized verification flows
- **ComplyAdvantage**: Global entity graph with multi-jurisdictional coverage
- **Trust Relay gap**: Currently Belgium + EEA country routing. The architecture supports country expansion (the KBO/NBB/Gazette pattern can be replicated per country), but each country requires building country-specific scrapers and integrations.

### Regulatory Acceptance

- **All major competitors**: Production-proven with regulatory track records, SOC 2 / ISO 27001 certifications, published audit reports
- **Trust Relay gap**: Proof of Concept stage. No production deployment history, no regulatory audit trail, no compliance certifications. This is the single largest gap for enterprise sales.

### Identity Verification

- **Sumsub**: Biometric KYC (facial recognition, liveness detection, document authenticity)
- **Ondato/iDenfy**: Biometric verification with EU focus
- **Trust Relay gap**: No biometric KYC layer. Trust Relay verifies businesses, not individuals' identities. Production deployment would require a biometric KYC partner (Sumsub, Onfido, or similar) for individual identity verification within the workflow.

### Adverse Media Depth

- **Dow Jones**: 17,000+ licensed, structured news sources with historical archives
- **ComplyAdvantage**: Curated adverse media with entity-linked articles
- **Trust Relay gap**: Adverse media search uses Tavily web search API, which provides broad but unlicensed web coverage. Results are not structured or curated. For regulated use cases, integrating a licensed adverse media feed would be necessary.

### Pricing at Scale

- **Ondato/iDenfy**: Sub-$0.10 per basic verification
- **ComplyAdvantage**: Volume discounts to $0.29/entity/month at scale
- **Trust Relay gap**: The 4-tier model is theoretically cheaper for portfolio monitoring, but this has not been validated at production scale. Infrastructure costs (Temporal, Neo4j, AI model inference) at 100K+ entities are not yet benchmarked.

## Strategic Positioning

### "Investigation Orchestrator, Not Screening Provider"

Trust Relay's strategic position is as the **workflow and investigation layer** that sits between raw data providers and compliance officers. The key insight:

> Screening tells you whether an entity appears on a list.
> Investigation tells you whether an entity should be on a list.

Trust Relay does not compete with ComplyAdvantage on entity data breadth or with World-Check on sanctions data quality. Instead, it **orchestrates** the investigation workflow that uses those data sources, adds document cross-referencing, builds entity graphs, and manages the iterative compliance loop.

### Integration Strategy

The architecture is designed to **integrate premium data sources** within the tier pipeline rather than replace them:

```
Tier 0: Cache lookup (free)
  └─ Hit? → Return cached result
  └─ Miss? → Escalate to Tier 1

Tier 1: Registry lookup ($0.01)
  └─ KBO/NBB/Gazette (Belgian sources, self-hosted)
  └─ OpenSanctions (open data, self-hosted)
  └─ Clean? → Done
  └─ Flags? → Escalate to Tier 2

Tier 2: Enhanced screening ($0.05)
  └─ Tavily adverse media search
  └─ [Future: ComplyAdvantage API screening]
  └─ [Future: Dow Jones adverse media feed]
  └─ Clean? → Done
  └─ Flags? → Escalate to Tier 3

Tier 3: Full investigation ($0.50)
  └─ Document collection via customer portal
  └─ 13-agent OSINT pipeline
  └─ Neo4j graph analysis
  └─ Officer review with iterative loops
  └─ [Future: World-Check sanctions verification]
```

### What Trust Relay Owns

Four layers where the platform provides defensible value:

1. **The workflow layer**: Temporal-orchestrated iterative compliance loops with durable state, customer portal, and officer decision management. No competitor offers this combination.
2. **The graph layer**: Case-scoped knowledge graphs with ontology-driven entity resolution and N-hop risk propagation. Architecturally comparable to enterprise solutions but focused on per-investigation depth. In [Portfolio Audit Mode](./portfolio-audit-mode.md), the graph spans the entire batch — revealing cross-entity patterns (shared directors, address overlaps, phoenix structures) that single-entity investigation cannot detect.
3. **The evidence layer**: Trust Capsules with SHA-256 content hashes, timestamped source citations, and deterministic rule versions. No competitor produces tamper-evident, source-cited evidence packs at portfolio scale. Portfolio Audit Mode aggregates these into structured Independent Verification Reports designed for regulatory defensibility.
4. **The Belgian depth**: Five integrated Belgian public data sources with automated financial ratio computation, gazette full-text analysis, and PEPPOL e-invoicing verification. Replicable pattern for country expansion.

### Country Expansion Playbook

The Belgian implementation establishes a repeatable pattern for adding country-specific depth:

1. **Identify public registries**: Each EU country has a company register (KBO equivalent), financial filing repository (NBB equivalent), and official gazette
2. **Build country scraper module**: Following the `BelgianDataService` pattern -- a service class wrapping multiple source-specific scrapers with mock/real modes
3. **Wire into country routing**: The `_dispatch_registry_agent()` function in `osint_agent.py` routes by country code -- adding a new country is a single routing entry
4. **Add evidence chain**: Following the `BelgianEvidenceService` pattern for SHA-256 hashing and provenance tracking

Estimated effort per country: 2-4 weeks for registry + financial data + gazette integration.

## Portfolio Economics

The 4-tier model creates a fundamentally different cost structure compared to flat-rate screening. The following comparison assumes a PSP portfolio where **90% of entities pass Tier 1**, **7% require Tier 2**, and **3% escalate to Tier 3**.

### Cost Comparison: Trust Relay vs. Flat-Rate Screening

| Portfolio Size | Trust Relay (Tiered) | ComplyAdvantage (Flat $0.29/mo) | Savings |
|---|---|---|---|
| 1,000 entities | ~$12/cycle | ~$290/month | 96% |
| 10,000 entities | ~$120/cycle | ~$2,900/month | 96% |
| 100,000 entities | ~$1,200/cycle | ~$29,000/month | 96% |

### Trust Relay Cost Breakdown (10,000 entity portfolio)

| Tier | Entities | Cost/Entity | Subtotal |
|---|---|---|---|
| Tier 0 (cache) | ~2,000 (20% repeat) | $0.00 | $0.00 |
| Tier 1 (registry) | ~7,200 (90% of non-cached) | $0.01 | $72.00 |
| Tier 2 (adverse media) | ~560 (7% of non-cached) | $0.05 | $28.00 |
| Tier 3 (full investigation) | ~240 (3% of non-cached) | $0.50 | $120.00 |
| **Total** | **10,000** | | **~$220.00** |

### Important Caveats

- **Trust Relay costs are per-cycle**, not per-month. A PSP running weekly scans would multiply by 4 for monthly comparison. Even at weekly cadence, 10,000 entities costs ~$880/month vs. $2,900/month.
- **ComplyAdvantage pricing includes continuous monitoring** in their per-entity/month rate. Trust Relay's tiered model requires explicit scan triggers.
- **Infrastructure costs are not included** in Trust Relay's per-entity figures. Temporal, Neo4j, PostgreSQL, and AI model inference have fixed infrastructure costs that become significant at scale.
- **The 90/7/3 distribution is assumed**, not measured. Actual tier distribution depends on portfolio risk profile. A high-risk PSP portfolio might see 70/15/15, changing the economics substantially.

### Break-Even Analysis

Trust Relay's tiered model is economically advantageous when:

- The majority of entities (&gt;80%) pass at Tier 0 or Tier 1
- Full investigation is needed for &lt;10% of the portfolio
- The PSP needs investigation depth (not just screening) for flagged entities

The model is **less advantageous** when:

- Every entity requires Tier 2+ screening (e.g., high-risk sectors)
- Continuous monitoring is required (ComplyAdvantage's flat rate includes this)
- The portfolio is small (&lt;500 entities) where infrastructure costs dominate

## Summary

Trust Relay occupies a specific position in the KYB market: **deep investigation orchestration with cost-efficient portfolio scanning**. It is not a replacement for enterprise data providers (ComplyAdvantage, World-Check, Moody's) but rather a workflow layer that can integrate those providers within a tiered investigation pipeline.

The strongest differentiation points are:

1. **Iterative compliance loops** -- no competitor offers Temporal-orchestrated multi-round investigation workflows
2. **4-tier cost optimization** -- novel economic model for portfolio-scale KYB monitoring
3. **Document-to-OSINT cross-referencing** -- unique combination of document ingestion and investigative comparison
4. **[Portfolio-scale cited-evidence verification](./portfolio-audit-mode.md)** -- batch investigation with tamper-evident Trust Capsules, cross-entity relationship graphs, and structured reports built for the AMLR evidence standards
5. **Belgian regulatory depth** -- unmatched integration of Belgian public data sources with a replicable country expansion pattern

The most significant gaps are:

1. **PoC maturity** -- no production deployment, no regulatory certifications
2. **Data breadth** -- Belgian-focused vs. global entity coverage
3. **Sanctions quality** -- web-based matching vs. regulatory-grade licensed data
4. **Identity verification** -- no biometric KYC layer

The strategic path forward is to **own the workflow and graph layers** while integrating premium data providers (ComplyAdvantage, World-Check, Dow Jones) as pluggable data sources within the tiered pipeline.
