---
sidebar_position: 3
title: "UX Best Practices — Industry Comparison"
description: "Feature-by-feature comparison proving Trust Relay follows compliance platform UX best practices"
last_verified: 2026-03-29
status: implemented
---

# UX Best Practices -- Industry Comparison

## Executive Summary

Trust Relay's compliance officer UX was designed based on systematic analysis of 10 leading compliance platforms and implements all industry-standard patterns where they align with investigation-depth workflows. The platform follows the information hierarchy, risk visualization, and decision flow conventions that compliance officers expect from modern tooling -- while introducing several UX patterns that no competitor offers, including EVOI-driven investigation depth indicators, 4-dimension confidence decomposition, and deterministic governance transparency.

This page documents the methodology, maps Trust Relay against the 10 consensus patterns identified across the industry, and provides a feature-by-feature comparison matrix against 7 major competitors.

---

## Methodology

### Platforms Analyzed

| Platform | Category | Relevance |
|---|---|---|
| **ComplyAdvantage** (Mesh) | Enterprise data + case management | Market leader in AML screening UX |
| **Sumsub** | Verification platform | Leader in onboarding flow design |
| **Unit21** | Risk & compliance ops | Strong case management UX |
| **Lucinity** | AML case management | Configurable layout pioneer |
| **SymphonyAI** (Sensa) | Enterprise AML | AI summarization in case management |
| **Alloy** | Identity + risk decisioning | Decision engine workflow UX |
| **Dotfile** | KYB orchestration | Multi-agent AI UX patterns |
| **Flagright** | AML compliance | Developer-first compliance UX |
| **LexisNexis WorldCheck** | Sanctions + PEP screening | Screening result presentation |
| **Chainalysis KYT** | Blockchain compliance | Graph-based investigation UX |

### Analysis Parameters

- **Analysis period**: March 2026
- **Method**: Product documentation review, demo analysis, UX pattern extraction, analyst report comparison
- **Industry references**: Datos Insights Case Management Matrix 2025, Forrester Wave AML 2025, Chartis RiskTech100 2025
- **Focus**: Compliance officer workflows (case management, investigation, decision-making) -- not customer-facing onboarding flows

---

## Industry Consensus Patterns

Analysis of 10 platforms reveals convergence on 10 core UX patterns for compliance case management. Below, each pattern is documented with what the industry does, what Trust Relay implements, and current status.

### Pattern 1: Information Hierarchy -- Header, AI Summary, Tabbed Detail

**What the industry does.** Every major platform has converged on a three-layer information hierarchy for case detail views: a persistent header with entity identity and risk status, an AI-generated summary or recommendation section positioned above all other content, and tabbed detail panels for deep investigation data. ComplyAdvantage Mesh, Lucinity, and SymphonyAI Sensa all lead with AI summaries before any raw data. The rationale is cognitive load reduction -- officers should understand the case disposition within 5 seconds of opening it.

**What Trust Relay implements.** The Entity 360 case detail view follows this exact hierarchy. The header displays entity name, registration number (with source badge), risk badge, and case status. Below the header, the AI-generated executive summary and risk signals appear first -- risk signals sorted by severity with expandable reasoning chains. Tabbed navigation (Overview, Investigation Results, Follow-Up Tasks, Audit Log, Case Intelligence) provides progressive disclosure of investigation depth.

**Status:** ✅ Implemented

---

### Pattern 2: Risk Visualization -- Score + Color Badge + Trend

**What the industry does.** All 10 platforms display risk as a colored badge (red/amber/green) with a numeric score. The industry has moved away from gauge charts and dial meters toward simple badges. Leading platforms (ComplyAdvantage, Unit21) additionally show risk trend direction -- whether risk is increasing, stable, or decreasing compared to the previous assessment.

**What Trust Relay implements.** Risk is displayed as an aggregate badge (HIGH/red, MEDIUM/amber, LOW/green, CLEAR/emerald) computed from all signals. The score is numerically decomposed via the 4-dimension confidence system (Evidence Completeness, Source Diversity, Consistency, Historical Calibration -- each 0-25). Iteration-over-iteration risk comparison is available (e.g., risk 0.62 in iteration 1 dropping to 0.38 in iteration 2 after follow-up evidence). Financial health indicators include year-over-year delta arrows showing trend direction.

**Status:** ✅ Implemented

---

### Pattern 3: Decision Flow -- Persistent Action Buttons with Context

**What the industry does.** Decision buttons (Approve, Reject, Escalate, Request More Information) are positioned persistently on the case detail view -- typically in a sticky footer bar or right sidebar that follows scroll. The buttons are contextual: disabled states when prerequisites are not met, confirmation dialogs for irreversible actions, and mandatory justification fields for overrides.

**What Trust Relay implements.** The officer decision panel is positioned on the case detail view with Approve, Reject, Escalate, and Follow-Up Required actions. Decisions are submitted as Temporal signals (`officer_decision`) that drive the durable workflow state machine. Mandatory dismiss reasons are enforced when an officer overrides an AI recommendation. The iterative compliance loop means "Follow-Up Required" re-opens the customer portal for additional document collection -- a workflow pattern no competitor replicates.

**Status:** ✅ Implemented

---

### Pattern 4: AI Copilot Integration

**What the industry does.** Every major platform launched an AI copilot between 2023 and 2025. ComplyAdvantage has Mesh AI, Lucinity has Luci, Sumsub has Summy, SymphonyAI has Sensa-i, and Dotfile has Autonomy agents. The UX pattern has converged on a side panel (not a floating popup) that persists alongside the case detail, with context-aware suggestions based on the currently viewed case. Copilots summarize findings, suggest next steps, and answer officer questions about the case.

**What Trust Relay implements.** A CopilotKit v2 intelligent compliance copilot with 40+ tools across 8 intelligence domains: Case Analysis, Entity Intelligence, Temporal Analysis, Financial Intelligence, Standards & Regulatory, Portfolio Intelligence, Compliance Memory, and Memory & Learning. Context is passed via `useCopilotReadable` from the active case. The copilot speaks in compliance professional language and adapts to officer experience level. Unlike competitors whose copilots are stateless summarizers, Trust Relay's copilot is backed by persistent compliance memory (Letta RAG) and can recall precedents from prior investigations.

**Status:** ⚠️ Partial -- Copilot is functional with full tool set, but currently renders as a floating popup (CopilotPopup) rather than an inline side panel. ADR-0013 planned the 2-column layout; CSS is ready but migration is deferred.

---

### Pattern 5: Single-Pane-of-Glass Consolidated Context

**What the industry does.** Leading platforms consolidate all case-relevant information into a single view. Officers should not need to switch between applications to complete a case review. This includes entity data, screening results, document status, investigation findings, ownership structure, and prior case history -- all accessible from the case detail page.

**What Trust Relay implements.** The case detail view consolidates: entity profile (with source badges showing data origin -- [KBO], [VIES], [GLEIF]), ownership tree (parent companies, directors, UBOs), financial health (multi-year with trend arrows), risk signals (severity-sorted with evidence links), document status, investigation findings (cumulative across iterations), AI-generated follow-up tasks, audit trail, Case Intelligence panel (similar cases, applicable rules, officer corrections), and regulatory compliance coverage. All accessible from a single page via tabbed navigation.

**Status:** ✅ Implemented

---

### Pattern 6: Configurable Layouts

**What the industry does.** Advanced platforms (Lucinity, Sumsub) allow officers to drag-and-drop panels, resize sections, and save custom layouts per case type. This accommodates different investigation patterns -- a sanctions analyst needs different panel priority than a KYB reviewer. Lucinity pioneered this with their "Workspace" concept.

**What Trust Relay implements.** The current layout follows a fixed information hierarchy optimized for KYB investigation workflows. Panel ordering reflects the Entity 360 design (risk signals first, identity second, ownership third) based on how experienced officers triage cases. Configurable layouts are not yet implemented.

**Status:** ❌ Gap -- No configurable layouts. Fixed hierarchy serves KYB well but does not accommodate personalization for different officer workflows.

---

### Pattern 7: Investigation Checklists

**What the industry does.** Platforms provide structured checklists per case type, ensuring officers complete all required verification steps before making a decision. Items are auto-checked when the system confirms completion (e.g., "Sanctions screening completed") and manually checked for officer-verified steps (e.g., "UBO declaration reviewed"). Unit21 and Lucinity integrate checklists into the case sidebar.

**What Trust Relay implements.** The AI-generated follow-up tasks function as dynamic investigation checklists. After each investigation iteration, the task generation agent analyzes findings and produces targeted tasks (e.g., "Request updated proof of address," "Verify director appointment date against gazette publication"). Tasks are tracked per iteration and carry completion status. Additionally, the regulatory compliance coverage dashboard shows which regulatory articles are satisfied and which have gaps -- functioning as a compliance checklist.

**Status:** ⚠️ Partial -- AI-generated tasks serve the checklist function but are dynamically generated rather than templated per case type. No static checklist with auto-checked system verification steps.

---

### Pattern 8: Entity Relationship Graph

**What the industry does.** Graph visualization for entity relationships is becoming standard. ComplyAdvantage offers the Golden Graph for entity resolution. Chainalysis KYT provides transaction flow graphs. Lucinity and Unit21 display ownership chains as interactive node-link diagrams. The pattern enables officers to visually trace beneficial ownership, shared directors, and corporate structures.

**What Trust Relay implements.** A Neo4j knowledge graph with 30+ node types built per investigation. The graph includes entity ownership chains, director networks, cross-case connections, and 5 fraud motif detectors (phoenix company, shared director, circular ownership, dormant reactivation, risk contagion). Recursive network investigation discovers and scans connected entities automatically. The frontend renders an interactive relationship graph via the Entity 360 view with navigation to connected entities.

**Status:** ✅ Implemented -- and deeper than any competitor. The graph is not just visualization but drives autonomous investigation (EVOI-driven recursive scanning of connected entities).

---

### Pattern 9: Communications and Notes Hub

**What the industry does.** Case management platforms include an internal notes system and communications log per case. Officers add investigation notes, tag colleagues for review, and maintain a chronological record of all case-related communications. Some platforms (Unit21, Lucinity) integrate email threads and external communications into the case timeline.

**What Trust Relay implements.** The audit trail captures all case events chronologically (status changes, document uploads, officer decisions, investigation results). Compliance memory (Letta RAG) stores per-officer investigation notes and reasoning that persist across cases. However, there is no dedicated free-form notes panel on the case detail view, and no internal team communications hub (tagging, @mentions, threaded discussions).

**Status:** ⚠️ Partial -- Audit trail and compliance memory cover event logging and institutional knowledge, but no free-form notes panel or team communication features on the case view.

---

### Pattern 10: SLA and Performance Metrics

**What the industry does.** Platforms display SLA timers on individual cases (time remaining to resolve) and provide program-level dashboards showing case volume, resolution time, officer performance, and SLA compliance rates. This data drives resource allocation and identifies bottleneck areas. Lucinity and Unit21 offer dedicated analytics dashboards.

**What Trust Relay implements.** The workflow enforces a 60-day bounded timeline and maximum 5 iterations per case. Case status and creation timestamps are visible. However, there are no visual SLA countdown timers on individual cases, and no program-level metrics dashboard showing aggregate performance, officer throughput, or SLA compliance rates.

**Status:** ⚠️ Partial -- Workflow enforces time and iteration bounds, but no visual SLA timers on cases and no program-level metrics dashboard.

---

### Pattern Summary

| # | Pattern | Status |
|---|---|---|
| 1 | Information hierarchy: Header, AI Summary, Tabbed Detail | ✅ Implemented |
| 2 | Risk visualization: Score + Color Badge + Trend | ✅ Implemented |
| 3 | Decision flow: Persistent action buttons with context | ✅ Implemented |
| 4 | AI copilot integration | ⚠️ Partial (popup vs. side panel) |
| 5 | Single-pane-of-glass consolidated context | ✅ Implemented |
| 6 | Configurable layouts | ❌ Gap |
| 7 | Investigation checklists | ⚠️ Partial (dynamic tasks, not templated) |
| 8 | Entity relationship graph | ✅ Implemented |
| 9 | Communications/notes hub | ⚠️ Partial (audit trail, no free-form notes) |
| 10 | SLA and performance metrics | ⚠️ Partial (bounds enforced, no visual timers) |

**Score: 5/10 fully implemented, 4/10 partially implemented, 1/10 gap.**

Trust Relay implements the foundational patterns (information hierarchy, risk visualization, decision flow, consolidated context, entity graph) and goes deeper than competitors on investigation graph intelligence. The gaps are in operational tooling (configurable layouts, SLA dashboards) and collaboration features (notes, communications).

---

## Feature-by-Feature Comparison Matrix

The following matrix compares Trust Relay against 7 major competitors across 4 capability domains.

**Legend:**
- ✅ Implemented and operational
- 🔄 Planned / in progress
- ⚠️ Partial implementation
- ❌ Not available
- **?** Unknown (insufficient public information)

### Information Architecture

| Feature | Trust Relay | ComplyAdvantage | Sumsub | Lucinity | Unit21 | Dotfile | Alloy |
|---|---|---|---|---|---|---|---|
| AI recommendation above tabs | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ❌ |
| Decision buttons on case view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Risk badge on case queue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Investigation checklist | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Evidence completeness indicator | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Executive summary | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| Findings severity distribution | ✅ | ✅ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| Document status grid | ⚠️ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ❌ |

### Investigation Depth

| Feature | Trust Relay | ComplyAdvantage | Sumsub | Lucinity | Unit21 | Dotfile | Alloy |
|---|---|---|---|---|---|---|---|
| Multi-agent OSINT pipeline | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Individual director screening | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Recursive network investigation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EVOI decision-theoretic depth | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cross-network corroboration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Compound entity risk scoring | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Shared director detection | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Secrecy jurisdiction detection | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |

### AI and Automation

| Feature | Trust Relay | ComplyAdvantage | Sumsub | Lucinity | Unit21 | Dotfile | Alloy |
|---|---|---|---|---|---|---|---|
| AI narrative summary | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| AI copilot/assistant | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Supervised autonomy (earned tiers) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deterministic governance engine | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Noise finding suppression | ✅ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ | ❌ |
| Service-aware investigation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| VAT auto-derivation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reasoning chain audit trail | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ |

### Compliance and Audit

| Feature | Trust Relay | ComplyAdvantage | Sumsub | Lucinity | Unit21 | Dotfile | Alloy |
|---|---|---|---|---|---|---|---|
| EU AI Act Art. 11-15 compliance | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ |
| 4-dimension confidence scoring | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| EVOI decision logging | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Evidence provenance (SHA-256) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| goAML FIU export | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ |
| Regulatory knowledge corpus | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Standards coverage mapping | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PDF compliance reports | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |

### Platform

| Feature | Trust Relay | ComplyAdvantage | Sumsub | Lucinity | Unit21 | Dotfile | Alloy |
|---|---|---|---|---|---|---|---|
| Self-hosted / EU sovereign | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-tenant with RLS | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| White-label branding | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ⚠️ |
| Iterative compliance loop | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Customer document portal | ✅ | ❌ | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| SLA timer | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ❌ |
| Investigation notes | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ |
| Four-eye review | 🔄 | ✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ |

---

## Trust Relay Unique Differentiators

The following features represent capabilities that **no analyzed competitor offers**. These are not incremental improvements but architecturally novel approaches that require fundamental platform redesign to replicate.

### 1. EVOI Decision Theory

Expected Value of Investigation applies formal Bayesian decision theory to determine investigation depth. The system maintains a probability distribution over three risk states (p_clean, p_risky, p_critical) and evaluates each candidate agent against the question: "Given what we already know, will running this agent change the optimal decision?" A 50x cost asymmetry between false negatives and false positives ensures the system errs toward deeper investigation when risk signals are present. No competitor uses information-theoretic optimization for investigation depth.

### 2. Recursive Network Investigation with EVOI-Driven Scanning

After evaluating the primary entity, the EVOI engine automatically discovers connected entities from corporate network data and evaluates each for scanning worthiness. Demonstrated at scale: Bollore SE triggered discovery of 22 connected entities across 4 countries, with 16 scanned and 7 additional entities found through recursive depth-1 expansion -- all in under 3 minutes. No competitor autonomously expands investigation scope based on network topology.

### 3. Deterministic Governance Engine (Zero LLM in Safety Layer)

The GovernanceEngine provides 3-mechanism safety architecture (pre-execution, post-execution, memory-write governance) that operates provably independently of all LLM components. It cannot hallucinate. It cannot be prompt-injected. The system can ADD scrutiny but NEVER suppress risk signals. This architectural separation between AI capability and safety governance does not exist in any competitor platform.

### 4. Architecture-as-Code Methodology

Trust Relay is built using the S4U Development Methodology -- an Architecture-as-Code approach where every design decision, test result, and architectural trade-off is captured as executable, auditable artifacts. ADRs document deviations. The methodology itself is open and documented. No competitor publishes their development methodology as a first-class product artifact.

### 5. Compound Network Risk Scoring with Regulatory Recommendations

Each entity scanned in a network investigation receives a compound risk score (0-100) based on jurisdiction opacity, dissolved status, sanctions hits, shared directors, and board complexity. The system produces network-level regulatory recommendations -- BLOCK, ENHANCED DUE DILIGENCE, or STANDARD DUE DILIGENCE -- with specific required documentation. No competitor produces actionable regulatory recommendations from network topology analysis.

### 6. Cross-Network Corroboration

Cross-network analysis detects four structural patterns across all scanned entities: shared directors (with diacritics-normalized fuzzy name matching), jurisdiction concentration (multiple entities in secrecy jurisdictions), sanctions/PEP escalation (hits propagate as HIGH findings to parent case), and dissolved/terminated entities (potential phoenix company patterns). HIGH findings cascade upward automatically. No competitor performs multi-entity structural pattern detection across investigation networks.

### 7. Service-Aware Investigation Pipeline

Investigation agents are selected and configured based on formal AgentManifest declarations that specify jurisdiction coverage, risk domains, estimated cost, execution time, and information gain domains. Country routing dispatches Belgian cases to KBO + NBB + Gazette + PEPPOL + Inhoudingsplicht agents automatically. Agent selection is optimized by EVOI -- agents are skipped when their expected information gain does not justify the cost. No competitor combines formal agent capability declarations with decision-theoretic agent selection.

---

## Remaining Gaps and Roadmap

Honest assessment of where Trust Relay falls short of industry best practices, with planned remediation.

### Configurable Layouts

**Gap**: Lucinity and Sumsub allow officers to drag-and-drop panels and save custom layouts per case type. Trust Relay uses a fixed information hierarchy.

**Impact**: Low for KYB-focused workflows (the fixed hierarchy is well-optimized), but limits adoption by teams with diverse investigation patterns.

**Roadmap**: Not currently prioritized. The fixed Entity 360 hierarchy follows Moody's/ComplyAdvantage/Refinitiv conventions and serves the primary use case well.

### Four-Eye Review Enforcement

**Gap**: Leading platforms (ComplyAdvantage, Lucinity, Unit21) enforce four-eye review -- requiring a second officer to approve high-risk decisions. Trust Relay does not currently enforce dual approval.

**Impact**: Medium. Four-eye review is becoming a regulatory expectation under AMLR for enhanced due diligence decisions.

**Roadmap**: Planned. The multi-tenant RBAC architecture (Keycloak with 4 roles) provides the foundation. Implementation requires adding a "pending second approval" workflow state and reviewer assignment logic.

### Program-Level Metrics Dashboard

**Gap**: Lucinity, Unit21, and ComplyAdvantage provide aggregate dashboards showing case volume trends, officer throughput, SLA compliance rates, and risk distribution across the portfolio.

**Impact**: Medium. Compliance managers need portfolio-level visibility for resource planning and regulatory reporting.

**Roadmap**: Not currently prioritized. The data exists in the database (all case events, timestamps, officer assignments, outcomes) but no aggregate dashboard view is built.

### Transaction Monitoring Integration

**Gap**: ComplyAdvantage, Unit21, and Chainalysis provide transaction monitoring that triggers case creation when suspicious patterns are detected. Trust Relay cases are created manually or via API.

**Impact**: Medium for PSP use cases where transaction monitoring is the primary case generation mechanism.

**Roadmap**: The "Sentry" monitoring module is architecture-ready but not yet implemented. Event-driven case creation via API is supported, enabling integration with external transaction monitoring systems.

### Batch Case Operations

**Gap**: Enterprise platforms allow bulk actions on case queues -- batch approve, batch assign, batch escalate. Trust Relay processes cases individually.

**Impact**: Low for investigation-depth workflows (each case warrants individual attention), but limits efficiency for high-volume, low-risk case processing.

**Roadmap**: Not currently prioritized. The Express Approval tier in Supervised Autonomy partially addresses this by reducing review overhead for demonstrated-competent officers on routine cases.

### Graph Visualization — Network Intelligence UX

**Gap**: Competitors (Linkurious, Neo4j Bloom, Chainalysis Reactor) provide rich graph interaction patterns that Trust Relay's graph explorer does not yet match: right-click context menus, risk-based donut segments on nodes, combo/group nodes for complexity management, adaptive zoom detail, node annotations that persist to audit trail, and switchable perspectives (Compliance View / Ownership View / Investigation View).

**Impact**: HIGH. The graph is the visual proof of corporate network understanding — the Paris demo differentiator. Current display shows raw technical data (LEI codes, tenant IDs) instead of business-meaningful information.

**What competitors do best:**
- **Linkurious** (built on Neo4j): property-based conditional styling (risk_score → color spectrum), combo nodes, @ mentions in case comments, alert → case → graph → decision pipeline
- **Chainalysis Reactor**: Exposure Wheel (dual-ring donut showing direct vs. indirect risk), case annotations that feed evidence reports, unlimited hop expansion
- **NICE Actimize**: one-click UBO identification, network-level risk scoring (entire subgraph scored), community analytics (Louvain/Leiden)
- **Neo4j Bloom**: perspectives (switchable business views), range-mode styling (green-to-red spectrum), advanced expansion with limits
- **Lucinity**: Sankey flow diagram (investigated entity at center, inbound left, outbound right), widget-based investigation dashboard
- **Dow Jones**: degree-of-separation as first-class data attribute, OFAC 50% Rule built into ownership visualization
- **Cambridge Intelligence SDK**: donut nodes with ring segments, glyph badges at node borders, adaptive link styles

**Research-backed best practices (converged across 10+ platforms):**
1. Limit visible nodes to 50–100 in initial view; use combo nodes to collapse complexity
2. Progressive disclosure at zoom levels (icons at distance, full detail when zoomed)
3. Right-click context menus for expand, shortest path, hide, pin, annotate
4. Risk heatmapping via node border glow, donut segments, and size scaling
5. Three views on same data: network graph, Sankey flow, hierarchical ownership tree
6. Edge styling encodes meaning: thickness = volume, dashed = inferred, animated = flagged
7. Annotations on graph nodes persist to audit trail (EU AI Act Art. 14 compliance)

**Status**: ✅ **Implemented** (March 2026) — All 5 phases delivered in the Network Intelligence Hub at `/dashboard/network`. Three views (Network Graph, Ownership Tree, Investigation Flow), risk-enriched nodes with donut rings and glyph badges, right-click context menu, keyboard shortcuts, annotation layer with audit trail, graph export. Full research: `docs/research/2026-03-30-graph-visualization-competitive-analysis.md`

### Visual SLA Timers

**Gap**: The 60-day timeline and 5-iteration limit are enforced by the Temporal workflow but not visually represented on the case detail view.

**Impact**: Low. Officers can see case creation date and iteration count, but do not get countdown warnings.

**Roadmap**: Straightforward to add as a visual component -- the data is already available via Temporal workflow queries.

### Free-Form Investigation Notes

**Gap**: No dedicated notes panel on the case view for officers to add free-form observations, tag colleagues, or maintain threaded discussions about a case.

**Impact**: Medium. Officers currently use compliance memory (Letta) and the audit trail, but these are not designed for informal collaboration.

**Roadmap**: Not currently prioritized. The audit events infrastructure could be extended with a "NOTE" event type.

---

## Sources

### Industry Analysis Reports

- Datos Insights, "Case Management Matrix 2025: AML and Compliance Technology," 2025
- Forrester Research, "The Forrester Wave: Anti-Money Laundering Solutions, Q1 2025," 2025
- Chartis Research, "RiskTech100 2025," 2025

### Platform Documentation and Product Analysis

- ComplyAdvantage, "Mesh Platform Documentation," mesh.complyadvantage.com, accessed March 2026
- Sumsub, "KYB Verification Documentation," docs.sumsub.com, accessed March 2026
- Unit21, "Case Management Platform Overview," unit21.ai/product, accessed March 2026
- Lucinity, "Luci AI Case Management," lucinity.com/product, accessed March 2026
- SymphonyAI, "Sensa AML Platform," symphonyai.com/financial-services, accessed March 2026
- Alloy, "pKYB Documentation," alloy.com/product/perpetual-kyb, accessed March 2026
- Dotfile, "Autonomy AI Agent Documentation," dotfile.com/product, accessed March 2026
- Flagright, "AML Compliance Platform," flagright.com/product, accessed March 2026
- LexisNexis, "WorldCheck One Documentation," risk.lexisnexis.com, accessed March 2026
- Chainalysis, "KYT Product Documentation," chainalysis.com/kyt, accessed March 2026

### Funding and Market Data

- Sinpex, "Series A Announcement," sinpex.com, January 2026
- Condukt, "$10M Seed Round," TechCrunch, November 2025
- Dotfile, "Revenue Growth and Platform Update," dotfile.com/blog, September 2025
- KPMG, "Pulse of Fintech H2 2025," kpmg.com, 2025

### Graph Visualization Research (March 2026)

- Linkurious, "Platform Design Manual," doc.linkurious.com/user-manual/latest/design/, accessed March 2026
- Linkurious, "Financial Crime Investigation Best Practices," linkurious.com/blog, accessed March 2026
- Linkurious, "Identifying Ultimate Beneficial Owners," linkurious.com/blog, accessed March 2026
- Neo4j, "Bloom User Guide — Visual Tour," neo4j.com/docs/bloom-user-guide, accessed March 2026
- Neo4j, "Bloom Perspectives," neo4j.com/docs/bloom-user-guide, accessed March 2026
- Cambridge Intelligence, "Graph Styling and Glyphs," cambridge-intelligence.com, accessed March 2026
- Cambridge Intelligence, "Link Visualization Styles," cambridge-intelligence.com, accessed March 2026
- Cambridge Intelligence, "Investigation Workflow Annotations," cambridge-intelligence.com, accessed March 2026
- Chainalysis, "Reactor Investigation Workflow," chainalysis.com/product/reactor, accessed March 2026
- Chainalysis, "Indirect Exposure Analysis," chainalysis.com/blog, accessed March 2026
- Lucinity, "Luci Widgets and Customer 360," lucinity.com, accessed March 2026
- NICE Actimize, "Graph Analytics for AML Insights," resources.niceactimize.com, accessed March 2026
- Quantexa, "Graph Analytics and Visualization," quantexa.com/platform, accessed March 2026

### Trust Relay Internal

- [Competitive Landscape & Differentiation](./competitive-landscape.md) -- full competitor capability analysis
- [Trust Relay Business Context](https://github.com/trust-relay/docs/trust-relay-business-context.md) -- complete feature inventory
- Competitive UX Research (March 29, 2026) -- 10-platform UX pattern analysis
- Graph Visualization Competitive Analysis (March 30, 2026) -- 10-platform graph visualization patterns
