---
sidebar_position: 3
title: "Portfolio Audit Mode"
description: "Batch portfolio verification with evidence-cited regulatory reports — built for the new EU AML reality"
---

# Atlas Portfolio Audit Mode

> Single-entity investigation tells you whether one business is trustworthy.
> Portfolio Audit Mode tells you whether an entire portfolio is clean.

Trust Relay's core capability — the iterative compliance investigation loop — works on individual cases. But regulated financial institutions do not have one merchant. They have thousands. And the entities who assess those institutions — auditors, compliance reviewers, supervisory authorities — need to verify not one file, but a representative sample of the entire portfolio.

Portfolio Audit Mode extends the Atlas 9-domain investigation framework from single-entity cases to batch portfolio verification, producing structured, evidence-cited reports that meet the evidentiary standards emerging from the EU's new Anti-Money Laundering Regulation (AMLR).

---

## The Regulatory Shift

Three regulatory developments are converging to change how compliance verification works across the EU:

### AMLR — Regulation (EU) 2024/1624

The Anti-Money Laundering Regulation entered into force on July 9, 2024 and will apply directly across all EU member states from **July 10, 2027**. Unlike the existing AML Directives (which required national transposition), the AMLR is a Regulation — it applies uniformly, without national variation.

Articles 19-28 transform Customer Due Diligence from a document-based obligation into a **time-stamped, versioned, auditable dataset** with explicit data-age rules, trigger logic, and failure-handling mechanisms. Article 22 defines exact identity schemas for natural persons, legal entities, trustees, and beneficial owners. Article 26 mandates periodic refresh cycles — one year for high-risk relationships, five years for standard.

This is not a minor update. It changes what CDD evidence *is*: from a collection of documents in a folder to a structured, machine-readable dataset with provenance and freshness requirements.

### AMLA's Regulatory Technical Standards

The Anti-Money Laundering Authority (AMLA) published draft Regulatory Technical Standards under Article 28(1) for consultation on **February 9, 2026** (consultation deadline: May 8, 2026). These RTS will specify, in legally binding detail, the exact data fields, verification requirements, and evidence standards for standard CDD, simplified CDD, and enhanced CDD.

When finalized, every obliged entity in the EU will need to structure their CDD data to a common standard. This creates, for the first time, a uniform baseline against which compliance quality can be measured, compared, and independently verified.

### The Professional Scepticism Requirement

Supervisory frameworks across the EU — from the ECB's Single Supervisory Mechanism to national competent authorities like the NBB, BaFin, and ACPR — increasingly require that compliance assessments demonstrate **professional scepticism**: not merely collecting evidence, but independently questioning whether that evidence is complete, current, and consistent with reality.

Manual verification — searching registries by hand, comparing screenshots, writing Word documents — cannot systematically demonstrate this scepticism at portfolio scale. The evidentiary bar is rising, and the tools have not kept up.

---

## What Portfolio Audit Mode Does

### Input: A CSV of Entity Identifiers

The input is deliberately simple. A CSV file with one or more of the following columns per entity:

| Column | Required | Notes |
|---|---|---|
| `entity_name` | Yes (if no VAT) | Company name as registered |
| `country_code` | Yes | ISO 3166 alpha-2 |
| `vat_number` | Yes (if no name) | Including country prefix |
| `registration_number` | Optional | National registry number |
| `lei` | Optional | Legal Entity Identifier |
| `domain` | Optional | Primary website domain |

Minimum viable input: a column of VAT numbers. Extracting this from any client register takes minutes.

### Processing: 9-Domain Investigation at Scale

Each row triggers a standard Atlas 9-domain investigation:

1. **Corporate identity & registry** — Is the entity actually registered? Is it active? Does the name match?
2. **Registered & operational addresses** — Do addresses match registry records? Are they real?
3. **Management & UBOs** — Who controls the entity? Do beneficial owners match official declarations?
4. **Financial, regulatory & licensing** — Are required filings current? Is the entity properly licensed?
5. **Sanctions, PEP & watchlists** — Any matches against international sanctions lists, PEP databases, or watchlists?
6. **Digital footprint & web ownership** — Does the entity have a real online presence?
7. **Adverse media & reputation** — Any negative press, legal proceedings, or regulatory actions?
8. **Relationship graph & transaction risk** — Are there hidden connections: shared directors, overlapping addresses, phoenix patterns?
9. **Decision & audit pack** — All findings packaged with SHA-256 content hashes and timestamped source citations.

All investigations run in parallel per entity, governed by the existing Expected Value of Information (EVoI) planner that allocates query budget based on entity risk signals. Clean entities resolve quickly and cheaply; flagged entities receive deeper investigation automatically.

### Output: The Independent Verification Report

The output is a structured report designed for regulatory defensibility:

**Section A — Executive Summary**
Total entities in sample, entities verified, entities flagged, breakdown by risk category (High / Elevated / Standard / Low), date range of investigation, data sources consulted.

**Section B — Aggregate Findings**
A findings matrix organized by investigation domain. For each domain: how many entities had findings, severity distribution, and the top recurring finding types. Key domains highlighted:

- **Registry & Identity**: Entities where corporate status changed (dissolved, struck off, liquidation) or where registration data conflicts
- **UBO Discrepancies**: Where Atlas-identified UBOs differ from national register entries, or where nominee/circular ownership patterns appear
- **Sanctions & PEP Hits**: Entities or connected persons with matches
- **Adverse Media**: Material findings classified by severity
- **Relationship Graph Anomalies**: Clusters sharing directors, addresses, or UBOs suggesting phoenix patterns, shell structures, or concealed relationships

**Section C — Entity-Level Detail**
For each flagged entity: a one-page summary of key findings with risk classification and source citations, linking to the full Trust Capsule for that entity.

**Section D — Evidence Annexes**
Individual Trust Capsules (PDF/JSON) for every entity in the sample. Each contains: entity identity verification, all investigation findings with source citations, SHA-256 content hashes, timestamps, and the deterministic rule version that produced each finding.

**Section E — Methodology Statement**
Atlas investigation framework description, data sources consulted, rule engine version, evidence integrity approach, and a statement that all findings are deterministic and traceable to named sources.

### Delivery Formats

- **PDF** — Print-ready, with co-branding options
- **JSON** — Machine-readable export of all findings for integration into existing audit or compliance platforms
- **Individual Trust Capsules** — Separate PDF per entity
- **ZIP archive** — Complete package

---

## The Evidence Standard: Trust Capsules

The Trust Capsule is the atomic unit of evidence in Trust Relay. Each capsule is a self-contained, tamper-evident evidence pack for a single entity, containing:

- Every finding from the 9-domain investigation, with the specific source cited
- SHA-256 content hashes ensuring integrity — if a single character changes, the hash changes
- Timestamps recording when each source was consulted
- The deterministic rule version that produced each finding (so results are reproducible)
- Source URLs and access dates for every piece of evidence

This is not a dashboard screenshot or a summary email. It is a structured, defensible evidence artifact designed to survive regulatory scrutiny. When a regulator asks "how did you reach this conclusion?", the Trust Capsule provides a complete, verifiable answer.

Existing compliance platforms produce workflow status updates, risk scores, and screening results. They do not produce evidence packs with cryptographic integrity guarantees and full source provenance. This difference matters when the evidentiary bar rises — and the AMLR is raising it.

---

## Why This Matters Now

### The Gap Between Screening and Verification

The compliance industry has spent two decades building better screening tools. Sanctions screening is fast, cheap, and comprehensive. Entity screening against commercial registries is a solved problem. But screening answers a narrow question: "Does this entity appear on a list?"

Verification answers a harder question: "Is this entity's compliance file complete, current, and consistent with reality?" That question requires cross-referencing multiple sources, detecting discrepancies, tracing ownership chains, and documenting the entire process with source citations.

No major compliance platform — not Harmoney, not Cascade, not Moody's/Kompany, not Sumsub, not ComplyAdvantage — produces the kind of cited, hash-stamped evidence pack that the AMLR's evidentiary standards demand at portfolio scale. They serve institutions' internal CDD workflows. They do not produce the independent verification artifacts that the new regulatory reality requires.

### Relationship Intelligence at Scale

When Portfolio Audit Mode processes a batch of entities, the knowledge graph does not treat each entity in isolation. It maps relationships *across* the entire portfolio: shared directors, overlapping addresses, common UBOs, and cross-ownership patterns.

This means a batch investigation can reveal things that individual investigations cannot: that three apparently unrelated merchants in the portfolio share a director who was recently appointed to all three, or that five entities list the same registered agent at a mail-drop address, or that a UBO appearing in one entity's ownership chain also appears — undeclared — in another.

These cross-entity patterns are invisible in single-entity verification. They are the kind of finding that regulators specifically look for, and that manual review at portfolio scale simply cannot detect systematically.

### The Cost Equation

Trust Relay's 4-tier cost optimization means portfolio verification does not have to be prohibitively expensive. Clean entities — those where all 9 domains return no findings — are resolved at minimal cost (projected **$0.01 per entity** at scale). Only entities with flagged findings escalate to deeper investigation (approximately **$0.50 per entity** for full investigation).

For a typical portfolio of 10,000 entities where 85-90% are clean, this means:
- 8,500-9,000 clean entities at $0.01 = **$85-90**
- 1,000-1,500 flagged entities at $0.50 = **$500-750**
- **Total: $585-840** for a full portfolio scan

Compare this to flat-rate screening at $0.50 per entity ($5,000) or manual investigation of a representative sample (weeks of analyst time at consultant rates). The economics make regular portfolio verification feasible — not just for annual reviews, but for continuous monitoring.

---

## User Interface

Portfolio Audit Mode adds a dedicated section to the Atlas dashboard:

### Upload
CSV upload with an intelligent column mapping wizard. Drop your file, map columns to Atlas fields, and the system validates the data before processing begins.

### Progress
Real-time batch investigation status: entities queued, in progress, complete, and flagged. The same pipeline visualization from individual cases — but at portfolio scale, showing aggregate progress and highlighting entities that need attention.

### Report Builder
Preview the aggregated report with options to include or exclude sections, add organization branding (co-branding with your firm's identity), and select report language (English, French, Dutch).

### Export
Download the complete report package — PDF, JSON, individual Trust Capsules, all in a single ZIP archive.

---

## Pricing Model

Portfolio Audit Mode uses an **Annual Engagement License** — a flat annual fee that includes unlimited verifications for entities within the engagement scope during the license period. This removes per-verification friction and makes costs predictable.

| Tier | Scope | Designed For |
|---|---|---|
| **Pilot** | Up to 50 entities per engagement | Initial proof-of-concept |
| **Standard** | Up to 200 entities per engagement | Typical sampling requirements |
| **Enterprise** | Unlimited entities | Full portfolio review or continuous monitoring |

---

## Timeline

| Phase | Timeline | Milestone |
|---|---|---|
| Design & specification | March 2026 | Architecture finalized |
| Development | April-May 2026 | Built on existing Atlas investigation infrastructure |
| Pilot | June 2026 | First engagement with pilot partner |
| General availability | July 2026 | Ahead of H2 2026 review cycles |

The core investigation capability, Trust Capsule generation, and 4-tier cost optimization already exist in production. Portfolio Audit Mode is primarily an **aggregation, reporting, and packaging layer** on top of proven infrastructure — not a ground-up build.

---

## What Comes Next

The AMLR applies from July 2027. The AMLA's RTS will be finalized by late 2026. As these standards crystallize, Trust Relay will evolve to meet the new requirements — structured evidence formats, standardized verification criteria, and the ability to demonstrate compliance quality at the level of rigor the regulation demands.

The organizations that invest in cited-evidence, portfolio-scale verification *before* the regulatory deadline will be the ones best positioned when it arrives. Portfolio Audit Mode is the first step.

---

**Ready to explore?**

- [Product Overview](./product-overview.md) — How Trust Relay works end-to-end
- [Why Trust Relay](./why-trust-relay.md) — Competitive positioning and market analysis
- [Architecture Overview](./architecture/overview.md) — Technical deep dive
- [4-Tier Cost Optimization](./architecture/tiered-scanning.md) — How the cost model works
