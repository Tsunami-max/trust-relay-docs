---
sidebar_position: 1
title: "Why Trust Relay"
description: "What makes Trust Relay different from every other compliance platform on the market"
---

# Why Trust Relay

> Screening tells you whether an entity appears on a list.
> Investigation tells you whether an entity *should* be on a list.
> Trust Relay is an investigation orchestrator, not a screening provider.

Every compliance platform on the market solves a piece of the problem. Some screen against sanctions lists. Some verify documents. Some monitor transactions. None of them close the loop -- the iterative, multi-round process of collecting evidence, investigating discrepancies, requesting more information, and reaching a defensible conclusion. That is the gap Trust Relay fills.

This page is written for two audiences: investors evaluating technical depth and market positioning, and business leaders evaluating whether Trust Relay solves a real problem. Every claim is backed by either a public statistic or an architectural fact from the codebase.

---

## The Problem Nobody Solved

The compliance industry has a measurement problem: it optimizes for speed of screening while ignoring the cost of investigation. Four structural failures persist across the entire market, from Tier 1 banks to fintech startups.

### 1. The Email Chase

After OSINT findings surface issues, compliance officers manually chase documents via email. They send requests, wait for responses, reconcile what arrives against what was asked for, and repeat. The industry average for Enhanced Due Diligence turnaround is **5 to 14 business days** -- dominated not by analysis time, but by waiting for evidence to arrive and chasing missing items.

The officer's actual analytical work might take 30 minutes. The collection process takes days. And each email exchange is untracked -- there is no audit trail of what was requested, what was received, or what is still outstanding. When regulators review the case file, they see a decision but not the investigation process that led to it.

### 2. Corporate Amnesia

When experienced compliance officers leave, institutional knowledge walks out the door. The reasoning behind past decisions -- why a particular corporate structure warranted a live interview, why a specific address pattern indicates nominee arrangements, which registry discrepancies are benign in Belgian law -- disappears from the organization.

Knowledge loss costs organizations an estimated **$72 million per year** in a 30,000-employee organization. More specifically for compliance, **43% of global banks report that regulatory work goes undone due to staffing gaps** (Deloitte 2025). New officers repeat mistakes that predecessors already learned from.

### 3. The False Positive Tax

Up to **95% of AML alerts are false positives**. Global compliance spending has reached **$274 billion annually**. Yet the financial crime detection rate remains at approximately **2% of global illicit flows** (McKinsey/Interpol estimates). The industry spends more, catches less, and drowns analysts in noise.

The problem is not detection sensitivity -- it is investigation capacity. Every false positive that reaches a human analyst consumes the same investigation time as a true positive. Without a way to learn from prior investigations, each alert starts from zero.

### 4. Five Products, One Job

A typical compliance team stitches together screening tools (ComplyAdvantage), document collection (email or ad-hoc portals), case management (spreadsheets or GRC platforms), investigation tools (manual OSINT), and monitoring dashboards (separate vendor). Five products, five logins, five data silos, one job: determine whether this entity is trustworthy.

No single system collects the evidence, investigates it, presents findings, captures the decision, and loops back for more when needed. The integration burden falls on compliance teams, who become middleware between their own tools.

---

## What We Built

### 1. Close the Loop -- The Iterative Compliance Workflow

**Outcome:** What took 5-14 business days of email-based evidence chasing compresses to under 4 hours. The officer's active work drops from days to minutes -- the system handles collection, conversion, and cross-referencing automatically.

**How it works:**

```mermaid
graph TD
    A["1. Officer creates case"] --> B["2. Customer portal opens"]
    B --> C["3. Documents uploaded"]
    C --> D["4. Docling converts to Markdown"]
    D --> E["5. 13 AI agents investigate"]
    E --> F["6. Tasks generated"]
    F --> G["7. Officer reviews findings"]
    G -->|Approve| H["Case closed: APPROVED"]
    G -->|Reject| I["Case closed: REJECTED"]
    G -->|Follow-up needed| J["8. New tasks sent to customer"]
    J --> B

    style H fill:#22c55e,color:#fff
    style I fill:#ef4444,color:#fff
    style J fill:#f59e0b,color:#fff
```

A Temporal-orchestrated durable workflow manages the entire lifecycle. The nine-step process works as follows:

1. Officer creates a case, selects an investigation template, and enters the subject entity details
2. A branded customer portal opens automatically -- the customer receives a link, no account required
3. The customer uploads requested documents (incorporation certificates, UBO declarations, financial statements)
4. IBM Docling converts every uploaded document to structured Markdown
5. Thirteen specialized AI agents cross-reference document content against commercial registries, adverse media, financial databases, and government publications
6. A task generation agent analyzes all findings and produces recommended follow-up actions
7. The officer reviews investigation results, discrepancies, and AI-generated task suggestions
8. If follow-up is needed, new tasks are generated and the customer portal re-opens for the next round

Up to 5 iterations within a 60-day bounded timeline. The entire state machine is enforced by Temporal -- if the system restarts mid-investigation, it resumes exactly where it left off. No lost state, no orphaned cases, no manual recovery.

**Why nobody else has it:** Every competitor is either one-shot verification (Sumsub, Onfido, Trulioo), ongoing monitoring (ComplyAdvantage, Hawk AI), or perpetual KYB (Alloy, Condukt). None orchestrate multi-round investigation with a customer-facing collection portal. Sinpex (EUR 10M Series A, January 2026, BlackFin Capital) is the closest competitor in the investigation space with OCR + LLM document extraction and lifecycle management, but lacks the iterative loop and integrated document collection. Dotfile Autonomy (September 2025) has multi-agent AI but operates single-pass. Condukt ($10M seed, Lightspeed, November 2025) already serves Wise, Mollie, and Rakuten but focuses on perpetual monitoring, not investigation depth.

Consider the current workflow at most compliance teams: officer finds a discrepancy, drafts an email asking for clarification, waits 3-5 days, receives a reply with an attachment, downloads it, opens it alongside the original finding, makes a note, realizes another document is needed, drafts another email. Trust Relay replaces that entire cycle with a structured, tracked, auditable process where the customer sees exactly what is needed and the officer sees exactly what was provided -- with AI cross-referencing happening automatically between rounds.

---

### 2. AI That Remembers -- The Learning Compliance Copilot

**Outcome:** The 50th investigation benefits from the knowledge accumulated in the first 49. Officers teach the system once -- "Belgian management companies with a single representative always need a live interview" -- and that rule applies to every future case. When officers leave, institutional compliance knowledge stays.

**How it works:** Per-officer persistent memory captures three types of signals:

| Signal Type | Example | Behavior |
|---|---|---|
| **JUDGMENT** | "This risk pattern warrants escalation" | Non-suppressible. System can add scrutiny, never remove it. |
| **PREFERENCE** | "Show me financial data before adverse media" | Adapts workflow presentation order. |
| **BEHAVIORAL** | "Officer reviews graph tab first on Belgian cases" | Optimizes information layout. |

The system progresses through maturity stages -- from cautious novice (asks before applying learned rules) to confident peer (applies established patterns with explanation). The maturity curve is deliberate: trust must be earned through demonstrated accuracy, not assumed by default.

Each officer maintains their own memory space. Organizational policies are shared as read-only baselines that individual officers cannot override downward. An officer can add stricter rules for their own workflow; they cannot weaken the organizational floor.

**Safety invariant:** The system can ADD scrutiny but NEVER suppress risk signals. This constraint is enforced deterministically at the classification layer, not by LLM judgment. A JUDGMENT-type signal that increases scrutiny is always applied; a request to reduce scrutiny on a flagged entity is structurally impossible to encode.

**Why nobody else has it:** SymphonyAI Sensa Copilot claims 70% productivity improvement but starts every investigation from zero. Sumsub Summy is stateless. Lucinity Luci summarizes findings intelligently but does not learn from officer decisions. Unit21 learns at the detection rule level (which patterns generate alerts), not at the officer judgment level (what those alerts mean in context). Dotfile Autonomy has multi-agent AI but operates single-pass with no persistent learning. Every compliance AI on the market starts from scratch on every case.

---

### 3. Documents Meet Intelligence -- Cross-Referencing at Scale

**Outcome:** Discrepancies that would take a human analyst hours to spot across multiple sources are surfaced in seconds, with severity classification and side-by-side comparison. A director listed on incorporation documents who does not appear in the commercial registry. A registered address that matches a known mail-drop. An ownership percentage in shareholder agreements that conflicts with the UBO declaration.

**How it works:** Customer-uploaded documents are converted to structured Markdown via IBM Docling. Thirteen specialized AI agents then compare every verifiable claim -- company name, address, directors, ownership percentages, legal form, registration numbers -- against structured data from commercial registries, financial databases, adverse media sources, and government publications.

Discrepancy severity is classified automatically:

- **CRITICAL:** Registration number or VAT number mismatch
- **HIGH:** Company name, legal status, or country discrepancy
- **MEDIUM:** Address or director list differences
- **LOW:** Legal form variations, language-specific address formatting

**Why nobody else has it:** Sumsub verifies document *authenticity* (is this a real document?) but not document *content* against OSINT (does what this document says match public records?). No competitor combines document ingestion with investigative cross-referencing in a single automated pipeline.

---

### 4. See the Network -- Case-Scoped Knowledge Graph

**Outcome:** Hidden connections that screening tools miss -- shared directors across shell companies, mail-drop addresses serving multiple entities, phoenix patterns where dissolved companies reappear under new names, nominee structures obscuring beneficial ownership -- become visible in an interactive graph with full provenance.

**How it works:** A Neo4j knowledge graph is built per investigation with entity resolution across documents and registries. N-hop traversal exposes connections that flat, tabular data cannot reveal. Every node and edge carries provenance metadata: which source, which document, which timestamp, which agent produced the finding.

```mermaid
graph TD
    Company[Acme Trading Ltd] -->|DIRECTOR| Person[John Smith]
    Person -->|DIRECTOR| Shell[GlobalTrade Holdings]
    Shell -->|REGISTERED_AT| Address[123 Mailbox Lane]
    Company -->|REGISTERED_AT| Address
    Address -->|FLAGGED| Risk[Shared Mail-Drop Address]
```

This is not a global entity graph with 400 million records. It is a focused, per-case investigation graph that finds connections *specific to the entity under review*. The trade-off is intentional: depth over breadth.

Every entity, relationship, and risk flag in the graph traces back to a specific source -- a specific document page, a specific registry query, a specific adverse media article. When an auditor asks "why did you flag this connection?", the answer is not "the AI said so" but "KBO registry query on 2026-02-15 returned director X for both companies, cross-referenced against uploaded shareholder agreement page 3."

---

### 5. Pay for What You Need -- 4-Tier Cost Optimization

**Outcome:** A PSP monitoring 10,000 merchants pays approximately **$220 per scan cycle** versus **$2,900 per month** for flat-rate screening. Projected savings of 92-96% at portfolio scale, depending on risk distribution.

**How it works:**

| Tier | Cost | What Happens | Typical Distribution |
|---|---|---|---|
| Tier 0 | $0.00 | Cache hit from prior scan | ~20% |
| Tier 1 | ~$0.01 | Registry lookup, basic checks | ~70% |
| Tier 2 | ~$0.05 | Adverse media, enhanced screening | ~7% |
| Tier 3 | ~$0.50 | Full investigation with graph + document collection | ~3% |

Entities only consume expensive investigation resources when risk signals from cheaper tiers warrant escalation. A clean entity costs one cent. A flagged entity gets a full investigation.

*Note: Cost projections are based on a modeled 90/7/3 tier distribution across non-cached entities. Actual savings depend on portfolio risk profile. Infrastructure costs (Temporal, Neo4j, AI inference) are not included in per-entity figures. A high-risk portfolio with 15% Tier 3 escalation would see different economics.*

The economic logic is simple: most entities in a PSP portfolio are legitimate businesses that pass basic registry checks. Only a small percentage show risk signals that warrant expensive investigation. Flat-rate screening charges the same price for a clean bakery and a flagged shell company. Tiered scanning charges one cent for the bakery and fifty cents for the shell company.

These economics are what make [Portfolio Audit Mode](./portfolio-audit-mode.md) possible. When a full portfolio of 10,000 entities can be investigated for ~$220 per cycle instead of $5,000, regular portfolio-wide verification becomes economically feasible — not just for annual reviews, but for continuous monitoring. And because the investigation runs at full depth (not just screening), it produces cited evidence and cross-entity relationship analysis, not just a list of screening hits.

---

### 6. Entity 360 -- Temporal Intelligence That Reveals What Changed

**Outcome:** Officers see not just what a company looks like today, but how it got there. A director appointed three days ago. An address changed last month. An ownership restructuring completed just before the application. These temporal patterns carry investigative meaning that a static snapshot misses — and Trust Relay surfaces them automatically.

**How it works:** The knowledge graph operates with a bi-temporal model: valid time (when a fact was true in the real world) and system time (when Trust Relay first learned about it). Every entity relationship carries both dimensions. The Entity 360 view presents this as an interactive timeline, with each change linked to its source — a registry filing, a gazette publication, a document upload, a financial statement.

An officer reviewing a Belgian BVBA sees: "Director Marc Dupont appointed 2026-01-15 (source: KBO/BCE). Previous director Pieter Janssens resigned 2025-12-20 (source: Belgian Gazette). Registered address changed from Antwerp to Brussels 2025-11-30 (source: KBO/BCE). Company legal form changed from VOF to BVBA 2024-06-01."

The AI copilot interprets these patterns: "Three significant corporate changes in the last 90 days — director change, address change, and legal form conversion. This pattern is consistent with corporate restructuring, possibly to obscure prior history. Consider requesting explanation for the timing of these changes."

**Why nobody else has it:** Screening platforms check the current state of a company. Registry databases show what was filed. Neither reconstructs the temporal narrative — the sequence of changes and what it means. Trust Relay's bi-temporal graph is architecturally unique: it tracks not just the facts, but when facts changed, creating an investigation timeline that tells a story.

---

### 7. Standards Mapping -- Every Finding Traced to Regulation

**Outcome:** When a regulator asks "how do you demonstrate compliance with AMLR Article 19?", the answer is not a PowerPoint slide — it is a structured list of investigation findings with timestamps, sources, and evidence citations, assembled automatically during every investigation.

**How it works:** Each investigation finding is automatically mapped to the regulatory articles it satisfies. The mapping covers three regulatory frameworks: the Anti-Money Laundering Regulation (AMLR, applicable from July 2027), the Anti-Money Laundering Directive (AMLD6), and the EU AI Act (high-risk system requirements, enforceable August 2026).

An address verification maps to AMLR Article 19(1) on CDD identity verification. A beneficial ownership check maps to AMLD6 Article 30. The AI system's human oversight architecture maps to EU AI Act Article 14. The officer sees a standards coverage dashboard: which articles are covered by findings, which have gaps, and what additional evidence would close those gaps.

The AI copilot uses this mapping proactively: "This investigation covers 8 of 12 AMLR CDD requirements for enhanced due diligence. The remaining gaps are: source of funds verification, purpose of business relationship, and ongoing monitoring plan. Consider adding follow-up tasks to address these before approval."

**Why nobody else has it:** Compliance platforms produce findings. Regulatory compliance teams produce gap analyses. Nobody produces both simultaneously. Trust Relay's standards mapping turns every investigation into a regulatory readiness assessment — not as an afterthought, but as a structural property of the investigation itself.

---

### 8. Intelligent Compliance Copilot -- 37 Tools, 8 Domains

**Outcome:** One compliance officer becomes as productive as ten. Not because the AI makes decisions — the officer always has final authority — but because the AI handles the cognitive overhead of connecting evidence across sources, remembering institutional knowledge, and surfacing the questions the officer should be asking but does not know to ask.

**How it works:** The copilot is not a generic LLM answering questions about compliance. It is a specialized agent with 37 tools that can query the knowledge graph, analyze financial trends, check standards coverage, retrieve entity timelines, compare investigation iterations, access compliance memory, and synthesize multi-source evidence. The tools span 8 intelligence domains:

| Domain | What It Does | Example |
|---|---|---|
| **Case Analysis** | Compare iterations, summarize findings, highlight changes | "Risk dropped from 0.42 to 0.28 after the customer provided updated address proof" |
| **Entity Intelligence** | Traverse knowledge graph, find cross-entity connections | "This director also appears in another case — Borealis Capital, which was escalated for fraud indicators" |
| **Temporal Analysis** | Surface how entities changed over time | "Three corporate changes in the last 90 days — unusual for an established company" |
| **Financial Intelligence** | Analyze trends across filing years | "Revenue grew 15% but profit margins compressed — operating costs outpaced growth" |
| **Standards & Regulatory** | Map findings to regulatory articles, identify gaps | "8 of 12 AMLR CDD requirements covered. Remaining gaps: source of funds, monitoring plan" |
| **Portfolio Intelligence** | Cross-case patterns, portfolio-level insights | "Belgian BVBAs have a 23% higher escalation rate in your portfolio — consider enhanced scrutiny" |
| **Compliance Memory** | Recall institutional knowledge, apply learned rules | "Based on a rule you taught: Belgian management companies with sole directors require live interview" |
| **Memory & Learning** | Track what the system has learned, show maturity progression | "System has learned 3 procedures and processed 47 decision signals from your reviews" |

The suggestions adapt to the officer's experience level. A novice officer gets guided prompts: "Review the 2 high-severity discrepancies before making a decision." An experienced officer gets strategic insights: "This entity pattern matches 3 prior escalations — check the knowledge graph for cross-entity connections."

**Why nobody else has it:** Every compliance AI on the market is either a search tool (query data, get answers), a summarizer (read documents, produce summaries), or a chatbot (answer questions from a knowledge base). None of them combine domain-specific tools, institutional memory, proactive guidance, and adaptive experience levels in a single copilot. The 37-tool architecture means the copilot can perform actual investigation tasks — not just talk about them.

---

### 9. Your Data, Your Infrastructure -- EU-Native Architecture

**Outcome:** When regulators ask "show me exactly why you approved this merchant," the answer is a tamper-evident evidence pack with SHA-256 content hashes, timestamped source citations, and deterministic rule versions. Not a screenshot of a dashboard. Not a PDF export from a SaaS vendor's portal.

**How it works:** The entire platform is self-hosted via Docker Compose. All data -- documents, investigation results, audit logs, knowledge graphs, learned compliance patterns -- stays within customer infrastructure. The codebase is open source and auditable.

Built for compliance with:

- **EU AI Act Article 13** -- Explainability requirements for high-risk AI systems
- **EU AI Act Article 14** -- Human oversight requirements (Trust Relay's "AI suggests, officer decides" architecture)
- **AMLA** -- Auditable decision logs with full provenance chains
- **AMLR** -- Evidence standards for compliance documentation
- **GDPR** -- Data residency through self-hosted deployment
- **EU Data Act** (enforceable September 2025) -- Data sovereignty beyond personal data
- **DORA** (January 2025) -- Digital operational resilience for financial entities

**Why this matters now:** EU AI Act high-risk system requirements become enforceable **August 2, 2026** -- five months away. Non-compliance penalties reach up to **EUR 35 million or 7% of global annual turnover**. The AMLR applies directly from **July 10, 2027**. AMLA became operational in Frankfurt in July 2025 and will directly supervise 40 high-risk institutions from 2028.

The enforcement environment has already shifted. In 2025 alone: Danske Bank EUR 1.8B, Commerzbank EUR 1.5B (sanctions), Coinbase Ireland EUR 21.46M (30M+ unchecked transactions). EMEA enforcement rose 767% year-over-year. Global AML fines surpassed $6 billion by July 2025.

The convergence of EU Data Act, DORA, AMLR, and AI Act is creating a regulatory environment where self-hosted, auditable, evidence-grade platforms are not a preference but a requirement. US-based SaaS vendors face a structural disadvantage: the US CLOUD Act directly conflicts with EU data sovereignty requirements.

The regulatory timing creates a strategic window. Established SaaS vendors will spend 12-18 months retrofitting explainability and data residency into architectures that were not designed for it. Trust Relay starts with these requirements as foundational constraints, not afterthoughts.

---

## The Market

| Metric | Value | Source |
|---|---|---|
| KYB market size (2024) | $3.7 billion | Market research consensus |
| KYB market projected (2033) | $10.6 billion | 18% CAGR |
| EU RegTech funding (2025) | $1.1 billion, +51% YoY | RegTech Analyst |
| Global compliance spending | $274 billion annually | Industry estimates |
| Global AML fines (2025, by July) | $6 billion+ | ComplyAdvantage |
| EMEA enforcement increase (2025) | 767% year-over-year | Fenergo |
| AML false positive rate | Up to 95% | Industry benchmark |
| Financial crime detection rate | ~2% of global illicit flows | McKinsey / Interpol |
| Banks with compliance staffing gaps | 43% | Deloitte 2025 |
| EU AI Act full enforcement | August 2, 2026 (5 months) | EU AI Act text |
| AMLR full application | July 10, 2027 (16 months) | AMLR text |
| EU AI Act maximum fine | EUR 35M or 7% global turnover | EU AI Act text |

The market is large, growing fast, and structurally inefficient. Spending increases year over year while detection rates remain flat. The gap is not in screening technology -- it is in investigation orchestration.

Three converging forces create the opportunity:

1. **Regulatory escalation.** The EU AML Package (AMLR/AMLD6), EU AI Act, MiCA for crypto, and FinCEN beneficial ownership rules are all expanding KYB obligations simultaneously. Compliance is no longer optional for any financial services entity.

2. **The perpetual KYB shift.** The industry is transitioning from periodic review (annual re-checks) to perpetual KYB -- continuous monitoring with event-triggered re-investigation. This demands automated workflow orchestration, not just faster screening.

3. **Digital payments explosion.** PSPs, neobanks, and marketplace platforms onboard merchants at scale, each requiring KYB verification. A PSP with 10,000 merchants cannot afford $0.50 per entity for monthly comprehensive screening. The market needs tiered investigation depth where cost scales with risk, not with portfolio size.

---

## Competitive Matrix

| Capability | Trust Relay | Sinpex | Dotfile | Condukt | Alloy | ComplyAdvantage | Unit21 | Lucinity |
|---|---|---|---|---|---|---|---|---|
| Iterative compliance loop | Yes | No | No | No | No | No | No | No |
| Customer document portal | Yes | Unknown | No | No | No | No | No | No |
| Officer-adaptive memory | Yes | No | No | No | No | No | Partial | No |
| Safety invariant (no risk suppression) | Yes | No | No | N/A | N/A | N/A | No | N/A |
| Multi-agent OSINT pipeline (37 tools) | Yes | No | Yes (Autonomy) | No | No | No | No | Partial |
| Document-to-OSINT cross-referencing | Yes | Partial | No | No | No | No | No | No |
| Knowledge graph with provenance | Yes | No | No | No | No | No | No | No |
| Entity 360 (bi-temporal intelligence) | Yes | No | No | No | No | No | No | No |
| Regulatory standards mapping | Yes | No | No | No | No | No | No | No |
| Intelligent copilot (8 domains) | Yes | No | No | No | No | No | No | Partial |
| Financial trend analysis | Yes | No | No | No | No | Partial | No | No |
| Portfolio verification with cited evidence | Yes | No | No | No | No | No | No | No |
| Self-hosted / EU data sovereign | Yes | No | No | No | Partial | No | No | No |
| Perpetual KYB | Partial | Partial | No | Yes | Yes | Yes | No | No |
| Open source | Yes | No | No | No | No | No | No | No |
| EU AI Act ready | Yes | Medium | Low | Low | Medium | Low | Low | Medium |
| Tiered cost optimization | Yes | No | No | No | No | No | No | No |

"Partial" indicates limited capability. "N/A" indicates the capability is not applicable to that vendor's product category. Competitor assessments based on publicly available product documentation as of early 2026.

The pattern in this matrix is clear: Trust Relay is the only platform that combines investigation orchestration, adaptive learning, document cross-referencing, and EU-native deployment in a single system. Competitors excel in individual dimensions -- ComplyAdvantage in entity data breadth, Sumsub in verification speed, Lucinity in summarization quality -- but none integrate the full investigation lifecycle.

For a deeper analysis of each competitor's strengths and weaknesses, including pricing comparisons and gap assessments, see the [Competitive Landscape](./competitive-landscape.md).

---

## What We Don't Do (Yet)

Transparency about current limitations.

**Global sanctions screening.** Trust Relay uses OpenSanctions for sanctions matching -- open data with Jaro-Winkler string similarity and LLM analysis. This is adequate for proof of concept but not production-grade for Tier 1 banks that require World-Check or Dow Jones data. The architecture supports plugging in licensed sanctions providers as a data source within the tier pipeline.

**Biometric KYC.** Trust Relay verifies businesses, not individual identities. There is no facial recognition, liveness detection, or document authenticity verification. Production deployment would integrate a biometric KYC partner (Sumsub, Onfido, or similar) for individual identity verification within the workflow.

**400M+ entity database.** Trust Relay investigates deeply, not broadly. ComplyAdvantage and Moody's Orbis have pre-computed global entity graphs with hundreds of millions of records. Trust Relay builds focused, case-scoped graphs per investigation. The trade-off is intentional but real -- broad entity coverage requires data licensing partnerships.

**Production deployment history.** Trust Relay is at proof-of-concept stage. There are no production customers, no SOC 2 certification, no regulatory audit trail. What does exist: 2,632+ automated tests (2,071 backend + 561 frontend), 38 service modules, 95 API endpoints, 37 AI agent tools, 14 architectural decision records, and a codebase that demonstrates engineering discipline typically associated with later-stage products.

**Global geographic coverage.** Currently deep in Belgium with EEA country routing architecture in place. The Belgian implementation (KBO, NBB, Gazette, PEPPOL, Inhoudingsplicht) establishes a repeatable pattern -- each new country requires 2-4 weeks to build country-specific registry scrapers and wire them into the routing layer. The architecture is designed for expansion, but today, deep OSINT coverage outside Belgium is limited. Thirty EEA countries are supported for basic entity creation and routing; five Belgian data sources are fully integrated.

We state these gaps openly because credibility in compliance is earned through honesty, not marketing claims. In a regulated industry, overpromising is worse than underdelivering.

---

## The Engineering Behind the Claims

Numbers that demonstrate execution maturity, not just vision:

| Metric | Value |
|---|---|
| Automated tests | 2,632+ (2,071 backend + 561 frontend) |
| Backend service modules | 38 |
| AI agent tools | 37 (across dashboard, synthesis, task generator, memory admin agents) |
| AI agents in investigation pipeline | 13 |
| API endpoints | 95 |
| Pydantic model files | 14 |
| Architectural Decision Records | 14 |
| Database migrations | 4 (Alembic-managed) |
| Belgian OSINT data sources | 5 (KBO, NBB, Gazette, PEPPOL, Inhoudingsplicht) |
| External data integrations | 7+ (NorthData, BrightData, Tavily, VIES, OpenSanctions, Crunchbase, crawl4ai) |
| Copilot intelligence domains | 8 (case, entity, temporal, financial, standards, portfolio, memory, learning) |
| Workflow states in state machine | 11 |
| Maximum investigation iterations | 5 per case |
| Maximum case timeline | 60 days |

The codebase follows documented engineering standards (Golden Standard v6) with explicit rules about test quality, coverage thresholds (90% for workflow layer, 70% for API and UI), and architectural decisions recorded before implementation. No mocking by default -- tests run against real databases via testcontainers. Temporal workflow tests use the official time-skipping test server.

---

## Recognition

- **FinTech Belgium** -- Member
- **imec.istart 2025** -- Launch program participant
- **VLAIO** -- Innovation funding recipient
- **PXL-Digital** -- Research collaboration partner

---

## The Bottom Line

Trust Relay exists because compliance investigation -- the actual work of determining whether an entity is trustworthy -- has been ignored by the technology market. Screening got faster. Monitoring got smarter. But the investigation workflow between "alert fired" and "decision made" is still manual, repetitive, and institutionally fragile.

We built the system that closes that gap: durable investigation workflows, adaptive AI that accumulates institutional knowledge, document-to-OSINT cross-referencing, knowledge graphs with temporal intelligence, regulatory standards mapping, an intelligent copilot that makes one officer as productive as ten, and tiered cost economics. Self-hosted, open source, EU-native.

The result is not incremental improvement. It is a fundamentally different approach to compliance. The officer is not drowning in browser tabs and email threads. The officer is reviewing structured evidence, guided by an AI that remembers what the team has learned, surfaces connections across entities, maps findings to regulatory requirements, and handles the evidence chase automatically. The officer focuses on judgment. The system handles everything else.

The problems are real. The market is large. The timing is right. The engineering is demonstrably solid.

---

## Next Steps

For the technical architecture behind everything described on this page, see the [Architecture Overview](./architecture/overview.md).

For a detailed, evidence-based competitor analysis with pricing models and gap assessments, see the [Competitive Landscape](./competitive-landscape.md).
