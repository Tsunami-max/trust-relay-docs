---
title: "Lex — Regulatory Knowledge Layer"
sidebar_label: "Regulatory Knowledge Layer (Lex)"
description: "Full-text EU regulation corpus, hybrid semantic search, and zero-hallucination citation verification — integrated with investigation workflow"
---

# Lex — Regulatory Knowledge Layer

> No competitor offers a queryable regulatory text corpus integrated with an active investigation workflow. Lex is the layer that makes this possible.

The Lex module ingests, structures, indexes, and serves the full text of EU and Belgian national regulations. It makes these regulations queryable by the Copilot, connects them to the Regulatory Radar, enriches gap analysis with verbatim article text, and verifies that every cited article actually exists in the corpus before delivery to the officer.

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
| Regulations indexed | 24 |
| Articles indexed | ~2,005 |
| Embedded chunks | ~2,124 |
| Embedding model | OpenAI `text-embedding-3-large` |
| Embedding dimensions | 3,072 (full precision, halfvec for HNSW index) |
| Search mode | Hybrid: semantic (pgvector cosine) + keyword (PostgreSQL FTS) via RRF |
| Citation verification | Deterministic — every cited article checked against corpus before response |

---

## Regulations Covered

### EU Direct Regulations (Phase 1)

| Short Name | Full Title | CELEX | Key Articles |
|---|---|---|---|
| AMLR | Anti-Money Laundering Regulation (EU 2024/1624) | 32024R1624 | Art. 15–73: CDD, EDD, beneficial ownership, reporting |
| AMLD6 | 6th Anti-Money Laundering Directive (EU 2024/1640) | 32024L1640 | Art. 1–80: institutional framework, FIU, supervision |
| EU AI Act | Artificial Intelligence Act (EU 2024/1689) | 32024R1689 | Art. 6–15, 50, Annex III: high-risk systems, transparency |
| GDPR | General Data Protection Regulation (EU 2016/679) | 32016R0679 | Art. 5–6, 9, 13–14, 17, 22, 25, 30, 35 |
| DORA | Digital Operational Resilience Act (EU 2022/2554) | 32022R2554 | Art. 5–15: ICT risk, incident reporting, testing |
| MiCA | Markets in Crypto-Assets Regulation (EU 2023/1114) | 32023R1114 | Art. 59–92: AML provisions for CASPs |
| EU IPR | EU Instant Payments Regulation (EU 2024/886) | 32024R0886 | Art. 5c–5g: Verification of Payee |
| PSD2 | Payment Services Directive 2 (EU 2015/2366) | 32015L2366 | Art. 97–98 (SCA), Art. 65–67 (AISP/PISP) |

### Belgian National Legislation (Phase 1)

| Short Name | Full Title | Source | Key Provisions |
|---|---|---|---|
| WitWas | Belgian AML Law, 18 September 2017 | Justel/Belgisch Staatsblad | Art. 7–46 (CDD), Art. 47–65 (CTIF-CFI reporting) |
| WVV/CSA | Belgian Companies & Associations Code | Justel | Art. 5:1–5:164 (BV/SRL), UBO register obligations |
| UBO KB | UBO Register Royal Decree, 30 July 2018 | Justel | Full text: UBO declaration obligations |

### Additional Regulations (Phases 2+)

| Short Name | Status |
|---|---|
| AMLA Technical Standards | In scope — Phase 2 (AMLA consultations started Feb 2026) |
| CSDDD (EU 2024/1760) | In scope — Phase 2 (supply chain due diligence) |
| PSD3/PSR | In scope — Phase 2 (when adopted) |
| Dutch Wwft | In scope — Netherlands expansion |
| German GwG | In scope — Germany expansion |

---

## Architecture

### Ingestion Pipeline (5 Stages)

```
Source (EUR-Lex CELLAR / Justel)
    │
    ▼ Stage 1: Fetch
    │  EURLexFetcher — CELLAR REST API, content negotiation (XHTML → Formex fallback)
    │  BelgianLegislationFetcher — Justel ELI URL construction + HTML scraping
    │  SHA-256 hash of raw content for change detection
    │
    ▼ Stage 2: Parse
    │  EURegulationParser — extracts article hierarchy from EUR-Lex HTML class conventions
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

- All 24 regulations with article counts and last ingestion timestamp
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

Runs `ingest` for all 24 configured regulations in parallel (rate-limited). Long-running — expect 5–15 minutes. Returns a summary with counts per regulation and any errors encountered.

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
| Source traceability | Every article includes the EUR-Lex ELI URI for independent verification |

These constraints satisfy EU AI Act Art. 12 (automatic logging), Art. 13 (transparency), and the AML directive requirements for documented risk-based methodology.
