---
sidebar_position: 3
title: "Portfolio Audit Mode"
description: "From single-entity investigation to portfolio-scale verification — with evidence that survives regulatory scrutiny"
---

# Portfolio Audit Mode

> You can investigate one entity in depth. But your portfolio has thousands.
> And "we screened them" is no longer an acceptable answer.

Trust Relay's core capability is the iterative compliance investigation loop — the [nine-step process](./product-overview.md) that takes a single entity from document collection through AI-powered cross-referencing to officer decision. Portfolio Audit Mode applies that same investigation depth to an entire portfolio at once.

The result is not a spreadsheet of screening hits. It is a structured, evidence-cited verification report where every finding traces back to a named source, every entity has a tamper-evident evidence pack, and cross-entity relationship analysis reveals patterns that single-entity investigation — no matter how thorough — simply cannot detect.

---

## The Problem: Screening Is Not Verification

The compliance industry solved screening years ago. Sanctions lists, PEP databases, adverse media feeds — these are fast, cheap, and widely available. A portfolio of 10,000 entities can be screened in seconds.

But screening answers a narrow question: *"Does this entity appear on a list?"*

Verification answers a harder one: *"Is this entity's compliance file complete, current, and consistent with reality?"*

That question requires cross-referencing multiple sources, detecting discrepancies between what was filed and what registries actually show, tracing ownership chains, checking whether corporate status has changed since the last review, and documenting the entire process with source citations. Today, this kind of verification happens manually — an analyst samples a few entities, searches registries by hand, compares screenshots, and writes findings in a Word document.

The result is defensible for the handful of entities that were sampled. For the other 9,950 in the portfolio? The honest answer is: nobody checked.

### Why This Is About to Get Worse

Three regulatory developments are converging:

**The AMLR (Regulation EU 2024/1624)** entered into force in July 2024 and applies directly across all EU member states from **July 10, 2027**. Articles 19-28 transform Customer Due Diligence from a document collection exercise into a time-stamped, versioned, auditable dataset with explicit data-age rules and freshness requirements. What used to be "we have a file on them" now needs to be "here is a machine-readable, source-cited, provenance-tracked evidence record — and it is current."

**AMLA's Regulatory Technical Standards** (consultation published February 9, 2026) will specify, in legally binding detail, the exact data fields and evidence standards for CDD across the EU. For the first time, there will be a uniform baseline against which compliance quality can be measured.

**The professional scepticism requirement** — from the ECB's Single Supervisory Mechanism to national authorities — increasingly demands that compliance assessments demonstrate independent questioning of evidence, not just evidence collection. Manual verification at portfolio scale cannot systematically demonstrate this scepticism.

The evidentiary bar is rising. The tools have not kept up.

---

## What You Get

### Upload a CSV. Get Back Cited Evidence.

The input is deliberately simple. A CSV file with entity identifiers — at minimum, a column of VAT numbers. The kind of extract any institution can produce from their client register in minutes.

| Column | Required | Notes |
|---|---|---|
| `entity_name` | Yes (if no VAT) | Company name as registered |
| `country_code` | Yes | ISO 3166 alpha-2 |
| `vat_number` | Yes (if no name) | Including country prefix |
| `registration_number` | Optional | National registry number |
| `lei` | Optional | Legal Entity Identifier |
| `domain` | Optional | Primary website domain |

Each entity in the CSV triggers the same [9-domain investigation](./why-trust-relay.md) that powers individual cases:

1. Corporate identity & registry
2. Registered & operational addresses
3. Management & UBOs
4. Financial, regulatory & licensing
5. Sanctions, PEP & watchlists
6. Digital footprint & web ownership
7. Adverse media & reputation
8. Relationship graph & transaction risk
9. Decision & audit pack

All investigations run in parallel, governed by the [4-tier cost optimization](./architecture/tiered-scanning.md) — clean entities resolve quickly at minimal cost, flagged entities automatically escalate to deeper investigation.

### The Independent Verification Report

The output is a structured report designed for one purpose: regulatory defensibility.

**Executive Summary** — Total entities in sample, entities verified, entities flagged, breakdown by risk category (High / Elevated / Standard / Low), date range of investigation, data sources consulted. The one-page overview that tells the reader whether the portfolio is clean or has issues — and where to look first.

**Aggregate Findings** — A findings matrix organized by investigation domain. Not just "how many flags" but *what kind* of flags, at what severity, across which domains. The patterns that matter:

- **Registry discrepancies**: Entities where corporate status changed — dissolved, struck off, in liquidation — without the institution's records reflecting it
- **UBO gaps**: Where Atlas-identified beneficial owners differ from national register entries, or where nominee and circular ownership patterns appear
- **Sanctions and PEP exposure**: Entities or connected persons with matches across international watchlists
- **Adverse media**: Material findings classified by severity and recency
- **Relationship anomalies**: Clusters sharing directors, addresses, or UBOs in ways that suggest phoenix patterns, shell structures, or concealed related-party relationships

**Entity-Level Detail** — For each flagged entity: a one-page summary with risk classification and source citations, linking to the full Trust Capsule.

**Evidence Annexes** — Individual Trust Capsules for every entity in the sample. Each is a self-contained, tamper-evident evidence pack containing all investigation findings with SHA-256 content hashes, timestamped source citations, and the deterministic rule version that produced each finding. When someone asks "how did you verify this entity?", the Trust Capsule provides a complete, verifiable answer — not a dashboard screenshot, not a risk score, not an email from an analyst.

**Methodology Statement** — Investigation framework, data sources consulted, rule engine version, evidence integrity approach. The section that demonstrates the verification was systematic and reproducible, not ad-hoc.

Delivery formats: print-ready PDF with co-branding options, machine-readable JSON for integration into existing platforms, individual Trust Capsules as separate PDFs, and a complete ZIP archive.

---

## Why Portfolio Mode Finds What Single-Entity Investigation Cannot

This is where it gets interesting.

When Trust Relay investigates entities one at a time, each investigation builds its own knowledge graph — a map of the entity's directors, addresses, ownership chains, and connections. That graph is deep but scoped to one entity.

When Portfolio Audit Mode processes a batch, the knowledge graph operates **across the entire portfolio**. Entity resolution runs not just against public registries, but against every other entity in the batch. The system is looking for the connections that only become visible when you see the full picture:

- **Three apparently unrelated merchants** in the portfolio share a director who was appointed to all three within the same month
- **Five entities** list the same registered agent at a mail-drop address that also appears in an adverse media article about shell company networks
- **A beneficial owner** appearing in one entity's ownership chain also appears — undeclared — in another entity's structure, suggesting concealed related-party relationships
- **A dissolved company** in the portfolio was replaced by a new entity at the same address with the same director — the phoenix pattern that flat-file review misses

These cross-entity patterns are exactly what regulators look for in portfolio reviews. They are also exactly what manual sampling, no matter how diligent, cannot detect systematically across thousands of entities.

Every relationship in the graph traces back to a specific source — a specific registry query, a specific document, a specific adverse media article, with timestamps and content hashes. The finding is not "the AI flagged this." The finding is "KBO registry query on 2026-03-15 returned Director X for Company A and Company B; NBB filing dated 2025-12-31 shows Company B as financially distressed; Gazette publication on 2025-08-20 announced Company C's dissolution at the same registered address."

---

## The Economics: Why This Is Feasible Now

Before Trust Relay's [4-tier cost optimization](./architecture/tiered-scanning.md), portfolio-scale verification was economically impossible. Investigating every entity at full depth — $0.50 per entity or more — means $5,000 per cycle for a 10,000-entity portfolio. Unsustainable for regular review.

The tiered model changes the equation. Most entities in a portfolio are legitimate businesses that pass basic registry checks. Only a small percentage show risk signals warranting deeper investigation:

| Tier | What Happens | Cost | Typical Distribution |
|---|---|---|---|
| Tier 0 | Cache hit from prior scan | $0.00 | ~20% |
| Tier 1 | Registry lookup, basic checks | ~$0.01 | ~70% of non-cached |
| Tier 2 | Adverse media, enhanced screening | ~$0.05 | ~7% of non-cached |
| Tier 3 | Full investigation with graph analysis | ~$0.50 | ~3% of non-cached |

For a typical 10,000-entity portfolio:

| | Trust Relay (Tiered) | Flat-Rate Screening ($0.29/entity) | Manual Sampling |
|---|---|---|---|
| **Cost per cycle** | ~$220 | ~$2,900 | Weeks of analyst time |
| **Entities verified** | All 10,000 | All 10,000 (screened, not investigated) | 50-200 sampled |
| **Evidence format** | SHA-256 hashed Trust Capsules | Risk scores, screening alerts | Word documents, screenshots |
| **Cross-entity analysis** | Full relationship graph | None | None at scale |

The economics make regular portfolio verification feasible — not just for annual reviews, but for continuous monitoring. And unlike flat-rate screening, which charges the same for a clean bakery and a flagged shell company, tiered scanning puts investigation budget where risk signals actually exist.

*Caveats: Cost projections assume a 90/7/3 tier distribution across non-cached entities. Actual savings depend on portfolio risk profile. Infrastructure costs (Temporal, Neo4j, AI inference) are not included in per-entity figures. See [Competitive Landscape](./competitive-landscape.md) for detailed break-even analysis.*

---

## How It Fits Into the Platform

Portfolio Audit Mode is not a separate product. It is the same investigation capability that powers individual cases, applied at batch scale:

| Individual Case | Portfolio Audit Mode |
|---|---|
| Officer creates a case for one entity | CSV upload triggers cases for hundreds or thousands |
| 17+ agents investigate one entity | Same 17+ agents investigate each entity in the batch |
| Knowledge graph scoped to one entity | Knowledge graph spans the entire portfolio |
| Officer reviews findings, makes a decision | Aggregated report highlights where attention is needed |
| Trust Capsule for one entity | Trust Capsule for every entity, plus aggregate analysis |
| Compliance memory learns from the decision | Patterns from batch findings feed institutional knowledge |

The investigation pipeline, the evidence format, the knowledge graph, the cost model — all the same infrastructure described in [Why Trust Relay](./why-trust-relay.md) and the [Architecture Overview](./architecture/overview.md). Portfolio Audit Mode adds the aggregation, reporting, and cross-entity analysis layer on top.

---

## What Nobody Else Provides

Every major compliance platform — Harmoney, Cascade, Moody's/Kompany, ComplyAdvantage, Sumsub — serves institutions' internal CDD workflows. They help the institution *do* its compliance. That is valuable. But it produces dashboards, risk scores, and workflow status updates.

None of them produce what the new regulatory reality demands at portfolio scale:

- **Evidence-cited verification reports** where every finding traces to a named source with timestamps and content hashes
- **Cross-entity relationship analysis** revealing patterns across the portfolio, not just within individual files
- **Tamper-evident evidence packs** with SHA-256 integrity guarantees and deterministic, reproducible rule versions
- **Aggregate findings matrices** organized by investigation domain with severity distribution across the entire sample

The gap is structural. Screening platforms are built to answer "is this entity on a list?" Investigation platforms are built to answer "is this entity's compliance file consistent with reality?" Portfolio Audit Mode is built to answer that second question across an entire portfolio — with evidence that survives scrutiny.

For a detailed comparison of how each competitor's capabilities map against Trust Relay's, see the [Competitive Landscape](./competitive-landscape.md).

---

## The User Experience

### Upload

CSV upload with an intelligent column mapping wizard. Drop the file, map columns to entity fields, review the data preview. The system validates inputs before processing begins — malformed VAT numbers, missing required fields, and duplicate entries are flagged before any investigation resources are consumed.

### Progress

Real-time batch investigation status: entities queued, in progress, complete, and flagged. The same pipeline visualization from individual cases — showing which agents are running and where findings emerge — but at portfolio scale, with aggregate progress metrics and automatic highlighting of entities that need attention.

### Report Builder

Preview the aggregated report. Include or exclude sections. Add your organization's branding (co-branding with your firm's identity). Select report language — English, French, or Dutch. The report is designed to be attached directly to regulatory deliverables without reformatting.

### Export

Download the complete package: PDF report, JSON data export, individual Trust Capsules, all in a single ZIP archive. The JSON export is structured for ingestion into existing audit or compliance platforms — the investigation data does not have to stay inside Trust Relay to be useful.

---

## Timeline and Availability

| Phase | When | What |
|---|---|---|
| Design & specification | March 2026 | Architecture finalized |
| Development | April-May 2026 | Built on existing Atlas investigation infrastructure |
| Pilot | June 2026 | First engagement with pilot partner |
| General availability | July 2026 | Ahead of H2 2026 review cycles |

The core investigation capability, Trust Capsule generation, 17+ agent pipeline, knowledge graph, and 4-tier cost optimization already exist in production. Portfolio Audit Mode is primarily an aggregation, reporting, and cross-entity analysis layer on top of proven infrastructure — not a ground-up build.

**Pricing** uses an Annual Engagement License — a flat annual fee per engagement scope, removing per-verification friction:

| Tier | Scope | Designed For |
|---|---|---|
| **Pilot** | Up to 50 entities | Initial proof-of-concept |
| **Standard** | Up to 200 entities | Typical sampling requirements |
| **Enterprise** | Unlimited entities | Full portfolio review or continuous monitoring |

---

## What Comes Next

The AMLR applies from July 2027. AMLA's RTS will be finalized by late 2026. As these standards crystallize, the evidentiary bar for compliance verification will rise across the EU — from what institutions hold in their files to what can be independently demonstrated with cited, time-stamped evidence.

The organizations that invest in portfolio-scale cited-evidence verification *before* the regulatory deadline will be the ones best positioned when it arrives.

---

**Continue reading:**

- [Why Trust Relay](./why-trust-relay.md) — The full competitive positioning and the six capabilities that make it possible
- [Product Overview](./product-overview.md) — How the platform works end-to-end, in plain language
- [4-Tier Cost Optimization](./architecture/tiered-scanning.md) — The economics behind portfolio-scale verification
- [Competitive Landscape](./competitive-landscape.md) — Honest comparison with every major competitor
