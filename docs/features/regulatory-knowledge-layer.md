---
title: "Lex — Regulatory Knowledge Layer"
sidebar_label: "Regulatory Knowledge Layer (Lex)"
description: "Full-text EU regulation corpus, hybrid semantic search, and zero-hallucination citation verification — integrated with investigation workflow"
---

# Lex — Regulatory Knowledge Layer

> No competitor offers a queryable regulatory text corpus integrated with an active investigation workflow. Lex is the layer that makes this possible.

The Lex module ingests, structures, indexes, and serves the full text of 34 EU regulations and national AML laws across 8 jurisdictions (EU, BE, CZ, DE, DK, EE, FI, NL). It makes these regulations queryable by the Copilot, connects them to the Regulatory Radar, enriches gap analysis with verbatim article text, and verifies that every cited article actually exists in the corpus before delivery to the officer.

This is not a standalone regulatory intelligence product. It is a knowledge layer that enriches capabilities that already exist. The Copilot gains a new intelligence domain. The Radar gains grounded text. The evidence chain gains regulatory article citations with source links. The gap analysis gains the ability to quote the exact law that a finding violates.

---

## The Problem Lex Solves

Trust Relay's Regulatory Radar already tracks 16+ EU regulations, 67 articles, and 33 scope rules — but until Lex, it was a metadata layer. It knew which articles existed and which findings mapped to them, but it did not contain the actual text of those articles.

When an officer saw "AMLR Art.28 CDD Coverage — 85%" in the compliance tab, they could not ask the Copilot "What exactly does AMLR Article 28 require for source of funds in enhanced due diligence?" and get an answer grounded in the regulation text. They had to context-switch to EUR-Lex, to Thomson Reuters, or to Google. This broke the investigation flow, introduced knowledge fragmentation, and meant the gap analysis could not explain why a requirement exists.

Lex closes this gap. The Copilot can now answer regulatory questions with verbatim article excerpts and source links — without leaving the investigation interface.

---

## What Lex Contains

| Metric | Value |
|---|---|
| Regulations indexed | 34 |
| Articles indexed | ~2,005 |
| Embedded chunks | ~2,124 |
| Embedding model | OpenAI `text-embedding-3-large` |
| Embedding dimensions | 3,072 (full precision, halfvec for HNSW index) |
| Search mode | Hybrid: semantic (pgvector cosine) + keyword (PostgreSQL FTS) via RRF |
| Citation verification | Deterministic — every cited article checked against corpus before response |

---

## Regulations Covered

### Wave 1 — Core EU Regulations (8)

| Short Name | Full Title | CELEX | Priority |
|---|---|---|---|
| AMLR | Anti-Money Laundering Regulation (EU 2024/1624) | 32024R1624 | Critical |
| AMLD6 | 6th Anti-Money Laundering Directive (EU 2024/1640) | 32024L1640 | Critical |
| EU AI Act | Artificial Intelligence Act (EU 2024/1689) | 32024R1689 | Critical |
| GDPR | General Data Protection Regulation (EU 2016/679) | 32016R0679 | High |
| DORA | Digital Operational Resilience Act (EU 2022/2554) | 32022R2554 | Medium |
| MiCA | Markets in Crypto-Assets Regulation (EU 2023/1114) | 32023R1114 | Medium |
| EU-IPR | EU Instant Payments Regulation (EU 2024/886) | 32024R0886 | High |
| PSD2 | Payment Services Directive 2 (EU 2015/2366) | 32015L2366 | Medium |

### Wave 2 — Financial Services & Digital Infrastructure (6)

| Short Name | Full Title | CELEX | Priority |
|---|---|---|---|
| NIS2 | Network and Information Security Directive (EU 2022/2555) | 32022L2555 | High |
| DSA | Digital Services Act (EU 2022/2065) | 32022R2065 | Medium |
| MiFID II | Markets in Financial Instruments Directive (2014/65/EU) | 32014L0065 | Medium |
| eIDAS 2 | European Digital Identity Framework (EU 2024/1183) | 32024R1183 | Medium |
| CRD IV | Capital Requirements Directive (2013/36/EU) | 32013L0036 | Medium |
| AMLA Reg | AMLA Establishment Regulation (EU 2024/1620) | 32024R1620 | Critical |

### Wave 3 — Sustainability, Travel Rule & Payments (6)

| Short Name | Full Title | CELEX | Priority |
|---|---|---|---|
| TFR | Transfer of Funds / Travel Rule Regulation (EU 2023/1113) | 32023R1113 | High |
| CSDDD | Corporate Sustainability Due Diligence Directive (EU 2024/1760) | 32024L1760 | Medium |
| CSRD | Corporate Sustainability Reporting Directive (EU 2022/2464) | 32022L2464 | Medium |
| Whistleblower | Whistleblower Protection Directive (EU 2019/1937) | 32019L1937 | Medium |
| EMD2 | Electronic Money Directive (2009/110/EC) | 32009L0110 | Medium |
| SEPA | SEPA Credit Transfer & Direct Debit Regulation (EU 260/2012) | 32012R0260 | Medium |

### Wave 4 — Fiscal Representatives & Taxation (4)

| Short Name | Full Title | CELEX | Priority |
|---|---|---|---|
| VAT Directive | Common System of Value Added Tax (2006/112/EC) | 32006L0112 | High |
| DAC | Administrative Cooperation in Taxation (2011/16/EU) | 32011L0016 | Medium |
| DAC7 | Digital Platform Reporting Directive (EU 2021/514) | 32021L0514 | High |
| AMLD5 | 5th Anti-Money Laundering Directive (EU 2018/843) | 32018L0843 | High |

### Wave 5 — Customs & Trade Compliance (3)

The Union Customs Code trilogy — critical for KYB entities that act as importer/exporter or hold AEO status.

| Short Name | Full Title | CELEX | Priority |
|---|---|---|---|
| UCC | Union Customs Code (EU 952/2013) | 32013R0952 | Critical |
| UCC-DA | UCC Delegated Act — detailed rules (EU 2015/2446) | 32015R2446 | High |
| UCC-IA | UCC Implementing Act — implementation rules (EU 2015/2447) | 32015R2447 | High |

### Wave 6 — National AML Regulations (4)

National transpositions of AMLD into domestic law. Each uses a jurisdiction-specific fetcher to retrieve from the national official gazette or supervisory authority.

| Short Name | Full Title | Jurisdiction | Fetcher | Source |
|---|---|---|---|---|
| EE-AML | Estonian Money Laundering and Terrorist Financing Prevention Act | EE | `riigi_teataja` | Riigi Teataja (official gazette) |
| FI-AML | Finnish Act on Preventing Money Laundering and Terrorist Financing (444/2017) | FI | `pdf` | Fin-FSA English translation |
| NL-Wwft | Dutch Wet ter voorkoming van witwassen en financieren van terrorisme | NL | `bwb` | wetten.overheid.nl |
| DK-AML | Danish Act on Measures to Prevent Money Laundering (Hvidvaskloven) | DK | `pdf` | Finanstilsynet English translation |

### Wave 7 — National AML Regulations (3)

Additional national AML laws from PDF publications on official supervisory authority websites.

| Short Name | Full Title | Jurisdiction | Fetcher | Source |
|---|---|---|---|---|
| BE-AML | Belgian Law of 18 September 2017 on Prevention of Money Laundering | BE | `pdf` | NBB English coordination |
| CZ-AML | Czech Act No. 253/2008 on Measures against Legitimisation of Proceeds of Crime | CZ | `pdf` | FAU English translation |
| DE-GwG | German Geldwaschegesetz (GwG) — Anti-Money Laundering Act | DE | `html` | Gesetze-im-Internet (official) |

### Not Yet Implemented

| Short Name | Status |
|---|---|
| PSD3/PSR | In scope — when adopted |
| AMLA Technical Standards | In scope — AMLA consultations started Feb 2026 |
| WVV/CSA (Belgian Companies Code) | In scope — Belgian expansion |
| UBO KB (Belgian UBO Royal Decree) | In scope — Belgian expansion |

---

## Architecture

### Ingestion Pipeline (5 Stages)

```
Sources (EUR-Lex CELLAR / National Gazettes / Authority PDFs / HTML)
    │
    ▼ Stage 1: Fetch (multi-source)
    │  EURLexFetcher — CELLAR REST API, content negotiation (XHTML → Formex fallback)
    │  RiigiTeataja fetcher — Estonian Riigi Teataja (EE-AML)
    │  BWB fetcher — Dutch wetten.overheid.nl (NL-Wwft)
    │  PDF fetcher — downloads PDF, extracts text via pypdf (FI-AML, DK-AML, BE-AML, CZ-AML)
    │  HTML fetcher — scrapes official HTML pages (DE-GwG)
    │  SHA-256 hash of raw content for change detection
    │
    ▼ Stage 2: Parse
    │  EURegulationParser — extracts article hierarchy from HTML class conventions
    │  Handles: titles, chapters, sections, articles, paragraphs, sub-points, annexes, recitals
    │  Cross-reference detection: internal (Art. 28(1)(a)) and external (Directive 2024/1640)
    │
    ▼ Stage 3: Chunk
    │  Hierarchy-aware chunking — never splits across article boundaries
    │  Context envelope attached to every chunk (regulation name, article number, hierarchy path)
    │
    ▼ Stage 4: Embed
    │  OpenAI text-embedding-3-large at 3072 dimensions
    │  Batch processing with rate-limit-aware retry
    │
    ▼ Stage 5: Index
       pgvector upsert — HNSW index via halfvec cast (handles >2000 dim limit)
       Full-text search index (PostgreSQL tsvector) for keyword component
       Linker: connects indexed articles to Regulatory Radar article records
```

### VectorStore Protocol

The vector store is abstracted behind a `VectorStore` protocol interface. The implementation today is `PgVectorStore` (pgvector on the existing PostgreSQL instance — no additional infrastructure required). The interface is designed for future migration to Qdrant or Weaviate without changing the service layer.

```
VectorStore (protocol)
  └── PgVectorStore (current implementation)
       ├── Semantic search: pgvector cosine similarity, HNSW index
       ├── Keyword search: PostgreSQL tsvector + GIN index
       └── Hybrid fusion: Reciprocal Rank Fusion (RRF)
```

### Data Model (5 Tables)

| Table | Purpose |
|---|---|
| `lex_regulations` | Master regulation registry — one row per regulation |
| `lex_articles` | Individual article records with hierarchy and cross-references |
| `lex_chunks` | Embedding-ready chunks with context envelopes |
| `lex_radar_links` | Junction table linking Regulatory Radar articles to Lex articles |
| `lex_ingestion_log` | Append-only audit trail for all ingestion operations |

### Multi-Tenancy

The regulatory corpus itself (article text, embeddings) is a **shared resource**. EU regulations are public law and identical for all tenants — applying per-tenant RLS to the corpus would duplicate storage and add no security benefit. This decision is documented in ADR-0016.

Tenant-specific integration — which regulations a tenant tracks, how their Radar links to Lex, their ingestion history — is scoped to their tenant context via RLS on the `lex_radar_links` and `lex_ingestion_log` tables.

See [ADR-0016](../adr/index.md) for the full decision record.

---

## Citation Verifier

Every Lex response goes through a deterministic citation verification step before it reaches the officer. The CitationVerifier checks:

1. Every article number cited by the Copilot exists in the corpus for the named regulation
2. Every verbatim excerpt is a substring match against the stored article text (not just approximate)
3. The article's source URL is resolvable in the ingestion log

If a citation fails verification, it is removed from the response and replaced with a fallback message. No hallucinated article references reach the officer.

This is a hard architectural constraint, not a soft guideline. The EU AI Act (Art. 12–13) and GDPR (Art. 22) require that AI outputs affecting regulated decisions be accurate and auditable. A compliance officer relying on a fabricated article citation to justify a risk assessment would create regulatory liability. The CitationVerifier prevents this at the infrastructure level.

---

## Integration Points

### Copilot (Case Detail, Regulatory Radar, Portfolio Standards)

The Lex service is exposed to the Copilot as a `regulatory_knowledge` tool domain alongside the existing 40+ investigation tools. When the officer asks a regulatory question — in any context (case detail, radar tab, portfolio view, or standalone) — the Copilot routes to this domain and retrieves hybrid search results from Lex.

Context-awareness: when the question is asked during an active investigation, the Copilot can connect the regulatory requirement to the entity's specific situation. For example: "AMLR Art.28(1) applies to this case because the entity is classified as EDD due to [specific risk signal from investigation]."

### Regulatory Timeline (Inline Article Text)

In the Regulatory Radar timeline view, expanding an article node now shows the full article text inline — pulled from the Lex corpus. Previously this expanded to an external EUR-Lex link. Officers no longer need to leave the interface to read the regulation.

### Compliance Tab (Gap Analysis)

Each gap item in the Compliance tab links to at least one Lex article. The gap analysis can display the actual article text alongside the coverage indicator, explaining what the regulation requires and why the current evidence does not satisfy it.

### Portfolio Health (Standards Tracking)

Portfolio Standards tracks 20 compliance standards across the portfolio. Each standard maps to one or more Lex articles. The standard's tooltip and detail view now show the verbatim regulatory text driving the standard, with a source link to EUR-Lex.

### Radar-Lex Bridge

The `bridge-radar` operation creates links between the 106 Regulatory Radar article entries and their corresponding Lex article records. This enables the Radar pills to show "Full text" status and allows the radar enrichment API to return article text alongside the radar metadata.

Target coverage: 100% (106/106 articles linked). Current status after bridge: 100%.

### Lex Admin Page

`/dashboard/admin/lex` — accessible to Compliance Managers and System Administrators. Shows:

- All 34 regulations with article counts and last ingestion timestamp
- Per-regulation re-ingest button (for updates when regulations are amended)
- Bridge status and coverage percentage
- Ingestion log with error details for failed operations
- Corpus health: total chunks, average chunk size, embedding model in use

---

## API Reference

All endpoints are under `/api/v1/lex/`. All require a valid Bearer token.

### Search

```http
POST /api/v1/lex/search
Content-Type: application/json

{
  "query": "enhanced due diligence source of funds",
  "regulations": ["AMLR", "WitWas"],
  "top_k": 5,
  "include_text": true
}
```

Returns the top-k most relevant chunks with regulation name, article number, hierarchy path, verbatim text, and relevance score.

### Article lookup

```http
GET /api/v1/lex/article/{regulation_short_name}/{article_number}
```

Example: `GET /api/v1/lex/article/AMLR/28`

Returns the full article record including text, hierarchy path, cross-references, and the EUR-Lex source URL.

### Ingest a single regulation

```http
POST /api/v1/lex/ingest/{short_name}
```

Example: `POST /api/v1/lex/ingest/AMLR`

Triggers a fresh fetch + parse + chunk + embed + index cycle for the named regulation. Upserts on content hash — unchanged articles are not re-embedded. Restricted to Compliance Manager role and above.

### Ingest all regulations

```http
POST /api/v1/lex/ingest-all
```

Runs `ingest` for all 34 configured regulations in parallel (rate-limited). Long-running — expect 5–15 minutes. Returns a summary with counts per regulation and any errors encountered.

### Corpus statistics

```http
GET /api/v1/lex/stats
```

Returns: regulations count, articles count, chunks count, embedding model, dimensions, last ingestion timestamp.

### Regulation list

```http
GET /api/v1/lex/regulations
```

Returns all indexed regulations with their metadata: CELEX number, title, jurisdiction, article count, chunk count, status, source URL.

### Bridge Radar to Lex

```http
POST /api/v1/lex/bridge-radar
```

Creates or refreshes `lex_radar_links` entries connecting Regulatory Radar articles to Lex article records. Idempotent. Returns coverage statistics.

### Radar coverage

```http
GET /api/v1/lex/radar-coverage
```

Returns: total radar articles, linked count, unlinked count, coverage percentage. Unlinked entries include the radar article ID and title for manual investigation.

### Radar enrichment for a specific article

```http
GET /api/v1/lex/radar-enrichment/{radar_article_id}
```

Returns the full Lex article text for a specific Regulatory Radar article, along with the link type (primary, related, implements) and source URL. Used by the Radar UI to display inline article text.

---

## ADR Reference

**ADR-0016** documents the decision to use a shared regulatory corpus (no per-tenant RLS on corpus tables) with tenant-scoped integration tables. The key reasoning:

- EU regulations are public law, identical for all tenants. Duplicating the corpus per tenant wastes storage and adds zero security benefit.
- The risk profile of regulatory text is low — there is no sensitive business data in the corpus.
- Tenant-specific data (which regulations they track, their link mappings, their ingestion history) remains fully tenant-scoped.

The ADR also covers the decision to use pgvector on the existing PostgreSQL instance rather than a dedicated vector database (Qdrant/Weaviate), with the VectorStore protocol providing a migration path if query volume or feature requirements outgrow pgvector.

---

## Regulatory Obligations

Because Lex serves text that compliance officers use to justify risk assessments and regulatory decisions, the following architectural constraints are non-negotiable:

| Constraint | Implementation |
|---|---|
| Zero hallucinated citations | CitationVerifier runs on every response before delivery |
| Full input provenance | Every Lex response records which chunks were retrieved and at what similarity score |
| Immutable audit trail | `lex_ingestion_log` is append-only; ingestion operations are never deleted |
| Content integrity | SHA-256 hash stored at fetch time; change detection alerts on update |
| Source traceability | Every article includes a source URL (EUR-Lex ELI, national gazette, or authority PDF) for independent verification |

These constraints satisfy EU AI Act Art. 12 (automatic logging), Art. 13 (transparency), and the AML directive requirements for documented risk-based methodology.
