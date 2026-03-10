---
sidebar_position: 1
title: "Competitive Landscape & Differentiation"
---

# Competitive Landscape & Differentiation

This document provides an honest, evidence-based analysis of the KYB compliance market, Trust Relay's competitive positioning, and where both strengths and gaps exist. All claims are grounded in publicly available data and direct architectural comparison.

## Market Context

### KYB Market Size and Growth

The global Know Your Business (KYB) verification market is valued at approximately **$3.7 billion in 2024** and projected to reach **$10.6 billion by 2033**, representing a compound annual growth rate (CAGR) of roughly **18%**. European RegTech funding rebounded **51% year-over-year in 2025**, reaching **$1.1 billion** across 122 deals, with mega-rounds ($100M+) returning after a complete absence in 2024.

This growth is driven by:

- **Regulatory escalation**: The EU AML Package (AMLR/AMLD6) applies from July 2027, AMLA became operational in Frankfurt (July 2025) and will directly supervise 40 high-risk institutions from 2028, EU AI Act full enforcement hits August 2026, MiCA is now law across the EU
- **Unprecedented enforcement**: Global AML fines surpassed **$6 billion by July 2025**. Danske Bank (EUR 1.8B), Commerzbank (EUR 1.5B), and Coinbase Ireland (EUR 21.46M for 30M+ unchecked transactions). EMEA enforcement rose **767% year-over-year**
- **Digital payments expansion**: PSPs, neobanks, and marketplace platforms onboarding merchants at scale, each requiring KYB verification
- **Fraud sophistication**: Shell company proliferation and synthetic identity schemes forcing deeper investigation beyond surface screening

### The Perpetual KYB Shift

The industry is transitioning from **periodic review** (annual re-checks) to **perpetual KYB (pKYB)** -- continuous monitoring with event-triggered re-investigation. This shift creates demand for:

- Automated workflow orchestration (not just one-time screening)
- Tiered investigation depth (not every entity needs full due diligence)
- Cost-efficient portfolio scanning (monitoring 10,000+ entities economically)

### Regulatory Timeline — What's Coming

The regulatory environment is converging on stricter evidence requirements, creating urgency for compliance platforms that produce audit-ready evidence rather than just screening results.

| Milestone | Date | Impact |
|---|---|---|
| AMLA operational (Frankfurt) | July 2025 | Done. EU-wide AML supervision body active. |
| EU AI Act prohibited practices + AI literacy | February 2025 | Done. Organizations must train staff on AI risks. |
| **EU AI Act full enforcement (high-risk AI)** | **August 2, 2026** | **5 months away.** Penalties: EUR 35M or 7% global turnover. |
| **AMLR beneficial ownership rules transposed** | **July 10, 2026** | **4 months away.** UBO register access requirements. |
| **AMLR full application + AMLD6 transposition** | **July 10, 2027** | **16 months.** Evidence-standard CDD across all EU member states. |
| AMLA direct supervision of 40 institutions | 2028 | AMLA will directly supervise the highest-risk entities. |

The convergence of these deadlines creates a strategic window: organizations that invest in evidence-grade compliance platforms before July 2027 will be positioned when the new standards become mandatory. Organizations that wait will be retrofitting.

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
| **Sinpex** (Munich) | EUR 10M Series A (January 2026, BlackFin Capital). End-to-end KYB lifecycle: document collection, UBO identification, risk assessment, AML screening, continuous reviews. OCR + LLM document extraction. Customers include Otto Payments, KfW, Bybit. Expanding to France and Netherlands. | No iterative compliance loop (multi-round with customer portal), no knowledge graph layer, no tiered cost optimization, no compliance memory, no standards mapping, no self-hosted option |
| **Alloy** | pKYB pioneer (launched UK/Europe January 2026), workflow orchestration with decision engine, 200+ data source integrations, event-driven re-assessment, strong US market presence | No graph analysis layer, no document cross-referencing, no Belgian OSINT depth, no AI-driven investigation synthesis, no temporal entity intelligence |
| **Dotfile** | "Autonomy" multi-agent AI (September 2025): central orchestrator + specialized review agents. 80+ financial institutions, EUR 8.5M total funding, 3x YoY revenue growth. Claims 95% reduction in KYB review time. Natural-language agent builder. | Single-pass AI (no iterative loops), no customer-facing document collection portal, no graph layer for entity discovery, no Belgian OSINT depth, no document-to-OSINT cross-referencing, "self-decisioning" approach may face regulatory skepticism |
| **Condukt** (London/Porto) | $10M seed (November 2025, Lightspeed). Ex-Revolut founders. Already serving Wise, Tide, Mollie, Rakuten before public launch. Real-time data layer for perpetual KYB. | No investigation depth (monitoring focus, not investigation), no evidence chains, no knowledge graph, no Belgian regulatory depth, not self-hosted |

### Belgian-Native Players

| Competitor | Focus | How They Compare |
|---|---|---|
| **Complidata** (Flanders) | AI co-pilot for trade finance + fincrime compliance. Corporate KYC automation with UBO extraction and entity resolution. Listed on NICE Actimize marketplace. | Investigation automation within existing AML stacks, not full workflow orchestration. No iterative loops, no customer portal, no graph layer. |
| **Neterium** (Brussels) | API-driven sanctions/watchlist screening. Jetscan (counterparty) + Jetflow (transaction volume). Partnered with SAS (December 2024) and OpenSanctions (February 2025). | Pure screening API. Fast and focused but not an investigation platform. Complementary to Trust Relay (could integrate as Tier 2 data source). |
| **itsme** (Brussels) | Digital identity verification (Belfius, BNP Paribas Fortis, ING, CBC consortium). Belgium's national eID. | Identity verification, not KYB. Potential integration partner for biometric KYC within Trust Relay workflow. |

**Key observation:** There is no Belgian-native KYB investigation orchestration platform. Belgian PSPs and banks use international platforms (Sumsub, ComplyAdvantage, Fenergo) or build in-house. Trust Relay fills this gap with deep Belgian OSINT integration (5 sources) and EU-native architecture.

## Where Trust Relay Differentiates

### Platform Scale

Before examining individual capabilities, context on engineering depth: Trust Relay is not a thin orchestration wrapper. The platform comprises **65+ backend services**, **16 AI agents** (14 with formal manifests), **29 API routers**, **20 Alembic migrations**, and **11 Docker services**. The test suite includes **3,200+ backend tests** and **650+ frontend tests**. The regulatory knowledge base covers **21 regulations** with **89 articles** and **95 obligations**. **15+ external data sources** are integrated. This is not a prototype bolted on top of third-party APIs -- it is a vertically integrated compliance investigation platform.

### Top 10 Verified Differentiators

The following are the platform's deepest competitive advantages, each verified in the codebase. They are ordered by the degree to which they represent fundamentally novel capabilities that no competitor offers.

#### 1. EVOI-Driven Investigation Depth

Trust Relay is the only compliance platform that uses **Expected Value of Investigation** theory to determine optimal investigation depth. The EVOI engine maintains a Bayesian BeliefState (`p_clean`, `p_risky`, `p_critical`) for each entity and applies a **50x cost asymmetry** for false negatives (approving a truly risky entity costs 50x more than unnecessarily investigating a clean one). The system recommends approval only when `p_clean >= ~0.99`.

This is not threshold-based decisioning. It is a formal decision-theoretic framework that quantifies the expected value of each additional investigation step, eliminating both premature approval and unnecessary over-investigation. No competitor -- Dotfile, Alloy, Sinpex, ComplyAdvantage, or otherwise -- applies information-theoretic optimization to investigation depth.

*Implementation: `backend/app/services/evoi_engine.py`*

#### 2. Supervised Autonomy with Earned Trust

Automation tiers are **earned, not configured**. Three levels -- Full Review, Guided Review, Express Approval -- are granted per (officer, template, country) tuple based on demonstrated agreement rate with AI recommendations. The system tracks rolling windows and **automatically downgrades** officers whose recent decisions diverge from AI-validated patterns. A GovernanceEngine safety net prevents Express Approval in high-risk scenarios regardless of tier. Compliance Managers can override individual tier assignments.

No competitor ties automation privileges to demonstrated officer competence. Dotfile's "Autonomy" is admin-configured. Alloy's auto-decisions are rule-based. Neither learns from officer behavior.

*Implementation: `backend/app/services/automation_tier_service.py`*

#### 3. Deterministic Safety Layer (GovernanceEngine)

The GovernanceEngine provides a **3-mechanism safety architecture**:

- **Pre-execution governance**: mandatory agent execution -- certain investigation agents cannot be skipped regardless of automation tier or EVOI recommendations
- **Post-execution governance**: sanctions loss checks (did the investigation miss a sanctions hit?) and risk regression detection (did the risk score decrease without new evidence to justify it?)
- **Memory-write governance**: JUDGMENT-classified signals in compliance memory are protected from modification -- the system can ADD scrutiny but never SUPPRESS risk signals

This deterministic layer operates independently of all LLM-based components. It cannot hallucinate. It cannot be prompt-injected. It is the final safety net between AI recommendations and officer decisions.

*Implementation: `backend/app/services/governance_engine.py`*

#### 4. 14-Agent Investigation Pipeline with Formal Manifests

Each investigation agent has a formal **AgentManifest** specifying jurisdiction coverage, risk domains, estimated cost, execution time, and information gain domains. The EVOI engine uses these manifests to select which agents to run based on expected information gain relative to cost. Country routing dispatches Belgian cases to KBO + NBB + Gazette + PEPPOL + Inhoudingsplicht agents automatically.

The 16 agents (14 with manifests) span: document validation, registry lookup (country-routed), person validation, adverse media, financial health, MCC classification, sanctions resolution, Belgian deep OSINT, scan tiers, synthesis, task generation, dashboard copilot, memory administration, and scan synthesis. This is a DAG pipeline, not a linear chain -- agents execute in parallel where dependencies allow.

*Implementation: `backend/app/services/agent_manifests.py`, `backend/app/agents/`*

#### 5. Knowledge Graph with Cross-Case Pattern Detection

A Neo4j knowledge graph with **30+ node types** is built and enriched across investigations. Five fraud motif detectors run automatically:

- **Phoenix companies**: dissolved entity reappearing under new registration with same directors/address
- **Shared director networks**: single individual controlling multiple investigated entities
- **Circular ownership**: entity A owns B owns C owns A
- **Dormant reactivation**: long-inactive entity suddenly active with new transactions
- **Risk contagion**: clean entity sharing directors/addresses with flagged entities

Cross-case entity overlap detection surfaces connections that single-case investigation cannot find. The graph spans the entire case portfolio, not just individual investigations.

*Implementation: `backend/app/services/graph_service.py` (81 methods), `backend/app/services/pattern_engine.py`*

#### 6. Compliance Memory (Letta RAG)

Per-officer archival memory powered by self-hosted Letta. Investigation findings, officer decisions, and regulatory interpretations are stored as searchable memories with **safety classifications**. JUDGMENT-type signals are immutable -- they cannot be overwritten or downgraded. Semantic search surfaces relevant precedents during new investigations.

The system literally gets smarter with each case. An officer investigating a Belgian holding company structure benefits from patterns identified across all previous Belgian holding company investigations by that officer and (with appropriate access controls) across the organization.

*Implementation: `backend/app/services/letta_policy_service.py`*

#### 7. 4-Dimension Confidence Scoring

Every investigation produces a 0-100 confidence score decomposed into four independently measurable dimensions:

- **Evidence Completeness** (0-25): are all required evidence types present?
- **Source Diversity** (0-25): do findings come from multiple independent sources?
- **Consistency** (0-25): do sources agree with each other?
- **Historical Calibration** (0-25): how does this entity compare to historical baselines?

Red flag rules can **cap** individual dimensions (e.g., a sanctions hit caps overall confidence at 30 regardless of other evidence). Reasoning templates define per-investigation-type confidence expectations. A calibration feedback loop adjusts scoring based on officer override patterns.

No competitor decomposes AI confidence into actionable dimensions. Officers see not just "how confident" but "why confident" and "which dimension to address."

*Implementation: `backend/app/services/confidence_engine.py`*

#### 8. Tiered Scanning (E-VAL to Full Investigation)

Four scanning tiers enable portfolio-scale monitoring at radically different cost points:

| Tier | Name | What It Does | LLM Calls | Latency |
|---|---|---|---|---|
| 0 | E-VAL | Graph-only risk scoring | 0 | &lt;100ms |
| 1 | Lightweight | KBO + PEPPOL + sanctions | 0-1 | 2-8s |
| 2 | Standard | Tier 1 + adverse media + LLM synthesis | 1 | 10-20s |
| 3 | Full Investigation | Complete OSINT pipeline with all agents | 5+ | 60-160s |

Portfolio batch scanning processes thousands of entities through Tier 0 first, escalating only flagged entities to higher tiers. Recursive discovery expands the investigation when graph traversal reveals connected entities that also warrant scanning.

*Implementation: `backend/app/agents/scan_agent.py`*

#### 9. Full EU AI Act Architecture

Trust Relay is designed as a **high-risk AI system under Annex III** from day one -- not retrofitting compliance after the fact. The architecture includes:

- **Tool audit with SHA-256 hashing**: every tool invocation is logged with input/output hashes, model identification, and timestamps via the `@audited_tool` decorator
- **Evidence bundles**: per-agent capture of all inputs, outputs, and chain of thought, stored in MinIO with content hashes
- **Immutable audit log**: append-only `audit_events` table that cannot be modified
- **Mandatory dismiss reasons**: officers must provide justification when overriding AI recommendations
- **Human oversight (Art. 14)**: the "AI suggests, officer decides" architecture is structural, not optional

This satisfies Art. 11 (technical documentation), Art. 12 (automatic logging), Art. 13 (transparency), Art. 14 (human oversight), and Art. 15 (accuracy and robustness monitoring). Competitors are 12-18 months behind on structural EU AI Act compliance.

*Implementation: `backend/app/services/tool_audit_service.py`*

#### 10. White-Label Multi-Tenant Architecture

Full multi-tenant isolation with:

- **WCAG-validated branding**: automated palette extraction from logo upload via ColorThief, with WCAG AA contrast ratio validation (4.5:1 minimum)
- **Row-Level Security**: PostgreSQL RLS policies on **22 tenant-scoped tables**, enforced via GUC (`app.current_tenant`), safe-by-default (unset GUC returns zero rows)
- **Per-tenant isolation**: separate Keycloak realms, Letta agent instances, and MinIO buckets per tenant

This enables Trust Relay to serve as a white-label platform for PSPs, banks, and compliance service providers who need to offer branded compliance portals to their own customers.

*Implementation: `backend/app/services/branding_service.py`, `backend/alembic/versions/017_row_level_security.py`*

### Full Capability Comparison

The following table maps all major capabilities to the nearest competitor offering.

| Capability | Trust Relay | Nearest Competitor | Gap Assessment |
|---|---|---|---|
| **EVOI decision optimization** | Bayesian belief states (p_clean/p_risky/p_critical) with 50x false-negative cost asymmetry. Quantifies expected value of additional investigation. Recommends approval only at p_clean >= ~0.99. | No competitor uses information-theoretic decision optimization. Dotfile and Alloy use threshold-based decisioning. | **Unique.** Mathematical framework for when to stop investigating. Eliminates both premature approval and unnecessary over-investigation. |
| **Supervised autonomy (3-tier)** | Full Review -> Guided Review -> Express Approval, earned per (officer, template, country). Rolling window downgrade, GovernanceEngine safety net. Compliance Manager override. | Dotfile Autonomy: "self-decisioning" (no tiered earn model). Alloy: rule-based auto-decisions. Neither ties automation to demonstrated officer competence. | **Unique model.** Autonomy earned through demonstrated competence, not configured by admin. Safety net prevents automation in high-risk scenarios. |
| **Deterministic safety layer** | 3-mechanism GovernanceEngine: pre-execution (mandatory agents), post-execution (sanctions loss, risk regression), memory-write (JUDGMENT protection). Can ADD scrutiny, never SUPPRESS risk. | No competitor separates deterministic governance from AI layer with this depth. Alloy has configurable rules but not safety-classified memory protection. | **Unique architecture.** The only platform where the safety layer is provably independent of all LLM components. |
| **14-agent investigation pipeline** | Formal AgentManifest with jurisdiction, cost, time, information gain domains. Country-routed: BE gets KBO + NBB + Gazette + PEPPOL + Inhoudingsplicht. EVOI-driven agent selection. | Dotfile: multi-agent but without formal manifests or cost optimization. ComplyAdvantage: ML-based entity resolution, not multi-agent investigation. | **More comprehensive and formalized.** No competitor combines formal agent manifests with decision-theoretic agent selection. |
| **Knowledge graph + cross-case patterns** | Neo4j with 30+ node types, 5 fraud motif detectors (phoenix, shared director, circular, dormant, contagion), cross-case entity overlap. 81-method graph service. | ComplyAdvantage Golden Graph: 400M entity resolution graph. No competitor detects cross-case patterns within customer investigation data. | **Unique combination.** Deeper per-case analysis with cross-portfolio pattern detection. Trade-off: smaller dataset than pre-computed global graphs. |
| **Compliance memory (Letta RAG)** | Per-officer archival memory, safety-classified signals (JUDGMENT protected), semantic search for precedents. System learns from every case. | Lucinity Luci: stateless summarization. No competitor maintains per-officer compliance memory with safety classifications. | **Unique.** Institutional memory that accumulates investigative intelligence over time. |
| **4-dimension confidence scoring** | Evidence Completeness, Source Diversity, Consistency, Historical Calibration (0-25 each). Red flag caps. Calibration feedback loop. Reasoning template integration. | No competitor decomposes confidence into independently measurable dimensions. Dotfile produces pass/fail. ComplyAdvantage produces risk scores without decomposition. | **Unique.** Transparent, decomposed certainty measurement. Officers know *which dimension* to address to increase confidence. |
| **4-tier scanning (E-VAL to Full)** | Tier 0: graph-only, 0 LLM, &lt;100ms. Tier 1: lightweight. Tier 2: standard. Tier 3: full investigation. Portfolio batch + recursive discovery. | ComplyAdvantage: flat-rate screening. Alloy: per-API-call pricing. No competitor offers graph-only risk scoring at sub-100ms. | **Novel economic model.** Entities only consume expensive resources when risk signals warrant escalation. |
| **EU AI Act Art. 11-15 compliance** | Tool audit with SHA-256 hashing, evidence bundles, chain of thought capture, immutable audit log, mandatory dismiss reasons, human oversight architecture. Designed as high-risk AI from day one. | Competitors are retrofitting. Lucinity and SymphonyAI have partial logging. No competitor has structural Art. 12-14 compliance. | **Structural advantage.** Built for Art. 11-15 from day one vs. competitors retrofitting 12-18 months behind. |
| **White-label multi-tenant** | WCAG-validated branding from logo upload (ColorThief), RLS on 22 tables, per-tenant Keycloak/Letta/MinIO. Safe-by-default (unset GUC = zero rows). | Sumsub: SDK-based white-label. No competitor offers full RLS isolation with WCAG-validated branding and per-tenant AI memory. | **Deeper isolation.** Database-level RLS + per-tenant AI instances goes beyond application-level tenant filtering. |
| **Iterative compliance loop** | Temporal-orchestrated multi-round review with officer decisions driving next iteration. Up to 5 iterations with 60-day timeline. Customer portal collects additional documents per round. | Dotfile: single-pass AI agent. Alloy: decision engine with rules, no iterative document collection. | **Unique.** No competitor offers durable, multi-round compliance workflows with customer-facing document collection loops. |
| **Belgian deep OSINT** | 5 integrated sources: KBO/BCE (company registry), NBB CBSO (financial statements + CSV parsing), Belgian Gazette (publication full-text via crawl4ai), PEPPOL (e-invoicing + inhoudingsplicht), Inhoudingsplicht (social/tax debt). | Moody's Bel-first: comprehensive Belgian company data but behind commercial license. ComplyAdvantage: Belgian entity coverage but no registry-depth data. | **Unmatched depth** for Belgian compliance at this price point. No competitor integrates all 5 Belgian public sources with automated financial ratio computation. |
| **Document cross-referencing** | Docling converts uploaded PDFs to Markdown, then AI agents compare extracted data against OSINT findings (registry data, adverse media, financial statements). Discrepancies flagged automatically. | No competitor combines document ingestion with OSINT cross-referencing in a single workflow. Sumsub does document verification (authenticity) but not content-to-OSINT comparison. | **Unique combination.** Document content extraction + OSINT comparison in an automated pipeline is not available from any competitor. |
| **Entity 360 -- bi-temporal intelligence** | Every entity in the knowledge graph carries valid time (when a fact was true) and system time (when the system learned it). Officers see how entities changed over time on an interactive timeline. | No competitor offers bi-temporal entity views. ComplyAdvantage shows current state. Moody's Orbis shows ownership history but not temporal entity evolution. | **Unique.** Temporal patterns (recent restructuring, rapid director changes) carry investigative meaning that static snapshots miss. |
| **Regulatory Radar** | Living knowledge base: 21 regulations, 89 articles, 95 obligations. Change tracking, retroactive impact analysis, compliance calendar with portfolio impact assessment. | No competitor offers a structured regulatory change tracking system integrated with investigation data. Manual regulatory monitoring is industry norm. | **Unique.** Transforms compliance from reactive to proactive. No competitor connects regulatory change tracking to case-level impact analysis. |
| **Intelligent compliance copilot** | 37 tools across 8 intelligence domains: case analysis, entity networks, temporal patterns, financial trends, regulatory standards, portfolio insights, compliance memory, and learning. Adaptive to officer experience level. | Lucinity Luci: summarizes findings. SymphonyAI Sensa: productivity improvement claims. Sumsub Summy: stateless. | **Architecturally unique.** No competitor combines domain-specific tools, institutional memory, proactive guidance, and adaptive experience levels. Others are chatbots; this is a domain expert. |
| **Customer portal** | Branded, token-authenticated document collection portal. Per-iteration document requirements. Follow-up task responses collected inline. No SDK integration required. | Sumsub: SDK-based verification flow embedded in client application. Dotfile: API-driven document collection. | **Different approach.** Trust Relay's portal serves compliance workflows (ongoing document collection across iterations). Sumsub's SDK serves onboarding (one-time verification). |
| **[Portfolio verification with cited evidence](./portfolio-audit-mode.md)** | Batch CSV upload triggers 9-domain investigation across entire portfolio. Output: aggregated Independent Verification Report + individual Trust Capsules (SHA-256 hashed, source-cited). Cross-entity knowledge graph reveals relationship patterns across the batch. | ComplyAdvantage: batch screening with risk scores. Moody's: batch entity data delivery. Neither produces cited-evidence verification reports or cross-entity relationship analysis. | **Unique.** No competitor produces tamper-evident, source-cited evidence packs at portfolio scale with cross-entity graph analysis. Existing tools screen portfolios; Trust Relay investigates them. |

### Intelligence Stack -- Quick Comparison Matrix

The following matrix summarizes the intelligence capabilities that represent Trust Relay's deepest competitive moat. These features require architectural foundations that cannot be retrofitted in months.

| Intelligence Capability | Trust Relay | Sinpex | Dotfile | Condukt | Alloy | ComplyAdvantage | Unit21 | Lucinity |
|---|---|---|---|---|---|---|---|---|
| EVOI decision optimization | Yes | No | No | No | No | No | No | No |
| Supervised autonomy (earned tiers) | Yes | No | No | No | No | No | No | No |
| GovernanceEngine (3-mechanism safety) | Yes | No | No | No | No | No | No | No |
| 14-agent formal manifests + EVOI selection | Yes | No | Partial | No | No | No | No | No |
| Cross-case pattern detection (5 motifs) | Yes | No | No | No | No | Partial | No | No |
| Compliance memory (Letta, per-officer) | Yes | No | No | No | No | No | No | No |
| 4-dim confidence scoring | Yes | No | No | No | No | No | No | No |
| Tiered scanning (E-VAL to Full, 4 tiers) | Yes | No | No | No | No | No | No | No |
| EU AI Act Art. 11-15 (structural) | Yes | No | No | No | No | No | No | Partial |
| White-label multi-tenant (RLS, 22 tables) | Yes | No | No | No | No | No | No | No |
| Deterministic red flags (no LLM) | Yes | No | No | No | Partial | No | Partial | No |
| Regulatory Radar (21 regs, 89 articles) | Yes | No | No | No | No | No | No | No |
| EU AI Act Art. 14 human oversight | Yes | No | Partial | No | Partial | No | No | Partial |
| Mandatory dismiss reasons | Yes | No | No | No | No | No | No | No |
| Full evidence provenance (SHA-256) | Yes | No | No | No | No | No | No | No |

"Partial" indicates limited or tangential capability. Competitor assessments based on publicly available product documentation as of early 2026.

**Why this matters:** These capabilities are not features that can be added as plugins. They require deep architectural integration -- EVOI depends on calibrated belief models and formal agent manifests, supervised autonomy requires per-officer competence tracking with governance safety nets, the GovernanceEngine must be provably independent of all LLM components, cross-case detection requires a unified entity graph across all investigations, confidence scoring threads through every agent output, and multi-tenant RLS requires database-level policy enforcement on every tenant-scoped table. Competitors would need to fundamentally redesign their investigation pipelines to replicate this stack.

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
Tier 0: E-VAL — graph-only risk scoring ($0, 0 LLM calls, &lt;100ms)
  └─ Neo4j graph traversal + entity risk propagation
  └─ Clean? → Done
  └─ Flags? → Escalate to Tier 1

Tier 1: Lightweight scan ($0.01, 0-1 LLM calls, 2-8s)
  └─ KBO/NBB/Gazette (Belgian sources, self-hosted)
  └─ PEPPOL + Inhoudingsplicht
  └─ OpenSanctions (open data, self-hosted)
  └─ Clean? → Done
  └─ Flags? → Escalate to Tier 2

Tier 2: Standard scan ($0.05, 1 LLM call, 10-20s)
  └─ Tier 1 + Tavily adverse media search
  └─ LLM synthesis of findings
  └─ [Future: ComplyAdvantage API screening]
  └─ [Future: Dow Jones adverse media feed]
  └─ Clean? → Done
  └─ Flags? → Escalate to Tier 3

Tier 3: Full investigation ($0.50, 5+ LLM calls, 60-160s)
  └─ Document collection via customer portal
  └─ 16-agent OSINT pipeline (14 with formal manifests)
  └─ Neo4j graph analysis + cross-case pattern detection
  └─ EVOI-driven investigation depth optimization
  └─ Officer review with iterative loops
  └─ [Future: World-Check sanctions verification]
```

### What Trust Relay Owns

Eight layers where the platform provides defensible value:

1. **The decision optimization layer**: EVOI engine with Bayesian belief states and 50x cost asymmetry, determining mathematically when to stop investigating. No competitor applies formal decision theory to compliance investigation depth.
2. **The safety layer**: GovernanceEngine with 3-mechanism deterministic governance (pre-execution, post-execution, memory-write) that operates provably independently of all LLM components. The system can ADD scrutiny but never SUPPRESS risk signals.
3. **The autonomy layer**: Supervised autonomy with 3 tiers earned per (officer, template, country) based on demonstrated competence. Rolling window downgrade and GovernanceEngine safety net ensure automation never exceeds earned trust.
4. **The workflow layer**: Temporal-orchestrated iterative compliance loops with durable state, customer portal, and officer decision management. No competitor offers this combination.
5. **The graph and temporal intelligence layer**: Case-scoped knowledge graphs with bi-temporal entity tracking, 5 fraud motif detectors, and cross-case pattern detection. In [Portfolio Audit Mode](./portfolio-audit-mode.md), the graph spans the entire batch -- revealing cross-entity patterns (shared directors, address overlaps, phoenix structures) that single-entity investigation cannot detect.
6. **The intelligence layer**: 16 AI agents with formal manifests, EVOI-driven agent selection, compliance memory (Letta RAG), and an adaptive copilot with 37 tools across 8 domains. No competitor has a domain-expert copilot that learns from officer decisions.
7. **The evidence layer**: Trust Capsules with SHA-256 content hashes, timestamped source citations, and deterministic rule versions. Tool audit logging satisfies EU AI Act Art. 11-15. No competitor produces tamper-evident, source-cited evidence packs at portfolio scale.
8. **The Belgian depth**: Five integrated Belgian public data sources with automated financial ratio computation, gazette full-text analysis, and PEPPOL e-invoicing verification. Replicable pattern for country expansion.

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
| Tier 0 — E-VAL (graph-only) | ~2,000 (20% repeat) | $0.00 | $0.00 |
| Tier 1 — Lightweight (registry) | ~7,200 (90% of non-cached) | $0.01 | $72.00 |
| Tier 2 — Standard (adverse media) | ~560 (7% of non-cached) | $0.05 | $28.00 |
| Tier 3 — Full investigation | ~240 (3% of non-cached) | $0.50 | $120.00 |
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

Trust Relay occupies a specific position in the KYB market: **deep investigation orchestration with decision-theoretic optimization, earned autonomy, deterministic safety, and regulatory-grade evidence chains**. It is not a replacement for enterprise data providers (ComplyAdvantage, World-Check, Moody's) but rather a workflow and intelligence layer that can integrate those providers within a tiered investigation pipeline.

The market window is open but narrowing. Sinpex (EUR 10M), Dotfile (EUR 8.5M), and Condukt ($10M) are all moving toward investigation orchestration with significant funding. Trust Relay has 12-18 months before the category is crowded. The advantage: Trust Relay is architecturally further ahead on investigation depth, evidence chains, safety architecture, and regulatory compliance.

### Top 10 Differentiators (all verified in codebase)

1. **EVOI-driven investigation depth** -- Bayesian belief states with 50x false-negative cost asymmetry. Mathematical framework for when to stop investigating. No competitor uses formal decision-theoretic investigation optimization. (`evoi_engine.py`)
2. **Supervised autonomy with earned trust** -- 3-tier automation earned per (officer, template, country) through demonstrated competence. Rolling window downgrade. GovernanceEngine safety net. No competitor ties automation to officer track record. (`automation_tier_service.py`)
3. **Deterministic safety layer** -- 3-mechanism GovernanceEngine: pre-execution, post-execution, memory-write governance. Can ADD scrutiny, never SUPPRESS risk. Provably independent of all LLM components. (`governance_engine.py`)
4. **14-agent investigation pipeline** -- formal AgentManifest with jurisdiction, cost, and information gain domains. EVOI-driven agent selection. Country-routed: Belgian cases get 5 specialized agents. (`agent_manifests.py`)
5. **Knowledge graph with cross-case patterns** -- Neo4j with 30+ node types, 5 fraud motif detectors, cross-case entity overlap. 81-method graph service. (`graph_service.py`, `pattern_engine.py`)
6. **Compliance memory (Letta RAG)** -- per-officer archival memory, JUDGMENT-protected signals, semantic search for precedents. The system gets smarter with each case. (`letta_policy_service.py`)
7. **4-dimension confidence scoring** -- Evidence Completeness, Source Diversity, Consistency, Historical Calibration (0-25 each). Red flag caps. Calibration feedback loop. (`confidence_engine.py`)
8. **Tiered scanning** -- E-VAL (graph-only, 0 LLM, &lt;100ms) through Full Investigation (5+ LLM, 60-160s). Portfolio batch + recursive discovery. (`scan_agent.py`)
9. **Full EU AI Act architecture** -- tool audit with SHA-256 hashing, evidence bundles, chain of thought capture, immutable audit log. High-risk AI system (Annex III) from day one. (`tool_audit_service.py`)
10. **White-label multi-tenant** -- WCAG-validated branding from logo upload, RLS on 22 tables, per-tenant Keycloak/Letta/MinIO. (`branding_service.py`)

### Additional Differentiators

11. **Iterative compliance loops** -- Temporal-orchestrated multi-round investigation with customer-facing document collection portal
12. **Document-to-OSINT cross-referencing** -- document ingestion + investigative comparison in a single automated pipeline
13. **[Portfolio-scale cited-evidence verification](./portfolio-audit-mode.md)** -- batch investigation with tamper-evident Trust Capsules and cross-entity relationship graphs
14. **Entity 360 with bi-temporal intelligence** -- valid time + system time dimensions on every entity
15. **Regulatory Radar** -- 21 regulations, 89 articles, 95 obligations with change tracking and retroactive impact analysis
16. **Intelligent compliance copilot** -- 37 tools across 8 domains, adaptive to officer experience, backed by persistent compliance memory
17. **Self-hosted EU-native architecture** -- as EU Data Act, DORA, and AI Act converge, self-hosted deployment is becoming a competitive moat
18. **Belgian regulatory depth** -- the only platform integrating all 5 Belgian public data sources. No Belgian-native KYB investigation platform exists

### Platform Scale

| Metric | Count |
|---|---|
| Backend services | 65+ |
| AI agents (with formal manifests) | 16 (14) |
| API routers | 29 |
| Backend tests | 3,200+ |
| Frontend tests | 650+ |
| Alembic migrations | 20 |
| Docker services | 11 |
| External data sources integrated | 15+ |
| Regulations in knowledge base | 21 |
| Regulatory articles | 89 |
| Regulatory obligations | 95 |
| Graph service methods | 81 |
| RLS-protected tables | 22 |

### Most Significant Gaps

1. **PoC maturity** -- no production deployment, no regulatory certifications
2. **Data breadth** -- Belgian-focused vs. global entity coverage
3. **Sanctions quality** -- web-based matching vs. regulatory-grade licensed data
4. **Identity verification** -- no biometric KYC layer
5. **Market traction** -- Condukt already serves Wise, Mollie, Rakuten before public launch; Sinpex has Otto Payments, KfW, Bybit

### Strategic Path Forward

The strategy is to **own the workflow, graph, intelligence, and safety layers** while integrating premium data providers (ComplyAdvantage, World-Check, Dow Jones, Neterium) as pluggable data sources within the tiered pipeline. The "AI suggests, officer decides" model -- enforced by the GovernanceEngine's deterministic safety layer -- is the safest regulatory position as Dotfile's "self-decisioning" approach may face resistance from AMLA and national supervisors who expect human-in-the-loop for AML decisions.

The EVOI + Supervised Autonomy + GovernanceEngine triad represents the deepest moat: no competitor can replicate formal decision-theoretic optimization, earned trust automation, and provably independent safety governance without fundamental architectural redesign. This is not a feature gap -- it is an architecture gap.
