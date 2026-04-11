---
id: 0024-entity-matching
sidebar_position: 25
title: "ADR-0024: Entity Matching"
---

# ADR-0024: Entity Matching with Blocking Keys and Trust-Weighted Survivorship

**Date:** 2026-03-31 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Cross-investigation entity deduplication requires both algorithmic efficiency and regulatory compliance. OSINT investigations across multiple cases frequently encounter the same companies, directors, and UBOs under slightly different spellings or transliterations. Naively comparing all entities across all cases is O(n^2), which becomes untenable as the case volume grows.

When two sources disagree on a field value -- for example, KBO reports an address in Brussels while NorthData reports Antwerp -- the system needs a principled way to decide which value to keep. A simple "last write wins" strategy loses provenance information that compliance officers need for audit trails. Government registries should be trusted over web scrapers, and structured APIs over LLM-extracted data, but this hierarchy must be explicit and configurable rather than buried in ad-hoc code.

Additionally, certain fields carry regulatory significance that demands special handling. Sanctions flags and PEP designations must never be overwritten by lower-trust sources, even if those sources have more recent data. A web scraper reporting "no sanctions" should not suppress a confirmed OFAC match.

## Decision

We implement a two-stage entity matching and resolution system:

### Stage 1: Blocking Keys for Candidate Selection

Entities are grouped into candidate pairs using blocking keys composed of `jurisdiction:name_prefix` (3-character prefix). This reduces comparison space from O(n^2) to O(n) by only comparing entities within the same block. Within each block, Python's `SequenceMatcher` performs fuzzy string matching on normalized entity names with three threshold bands:

- **>0.85**: automatic match -- entities are merged without human review
- **0.70-0.85**: review queue -- entities are flagged for compliance officer confirmation
- **&lt;0.70**: distinct -- entities are treated as separate

### Stage 2: Trust-Weighted Survivorship

When matched entities have conflicting field values, the system resolves conflicts using per-provider trust scores:

| Provider | Trust Score |
|----------|------------|
| KBO (government registry) | 0.98 |
| GLEIF (global LEI registry) | 0.95 |
| Structured API (NorthData, VIES) | 0.85 |
| LLM-extracted data | 0.75 |
| Web scraping (crawl4ai, BrightData) | 0.70 |

The highest-trust value wins for each field. When the trust delta between competing values is less than 0.02, the conflict is recorded for human review rather than auto-resolved. Protected fields (sanctions status, PEP designation) require authorized sources only -- values from providers below the 0.85 trust threshold are ignored for these fields.

## Consequences

### Positive
- O(n) candidate selection via blocking keys makes deduplication feasible at scale (thousands of entities across hundreds of cases)
- Trust scores create a transparent, auditable hierarchy for conflict resolution -- compliance officers can see exactly why a particular value was chosen
- Protected field handling ensures sanctions and PEP flags are never suppressed by lower-quality sources, satisfying AML regulatory requirements
- The 0.70-0.85 review band captures ambiguous matches for human judgment rather than making incorrect automated decisions

### Negative
- The 3-character prefix blocking key can miss matches when entity names differ in their first 3 characters (e.g., "The Company" vs "Company") -- requires normalization preprocessing
- Fixed trust scores do not account for temporal freshness -- a 2-year-old KBO record (0.98) will be preferred over yesterday's NorthData record (0.85) even if the latter is more current
- The review queue for 0.70-0.85 matches adds to compliance officer workload, potentially creating a backlog

### Neutral
- Trust scores are configuration-driven and can be adjusted per deployment without code changes
- The entity matcher integrates with the graph ETL pipeline (see `graph_etl.py`) to deduplicate nodes before graph insertion
- Conflict records feed into the discrepancy resolution system, enabling compliance officers to resolve disagreements through the chatbot interface

## Alternatives Considered

### Alternative 1: Simple Fuzzy Matching Without Blocking
- Why rejected: Comparing every entity against every other entity is O(n^2). With 10,000 entities across 500 cases, this means 100 million comparisons -- computationally infeasible for real-time deduplication and unnecessary when jurisdiction alone eliminates the vast majority of non-matching pairs.

### Alternative 2: Consensus Voting (Majority Wins)
- Why rejected: Loses the source quality hierarchy. Three web scrapers reporting the same incorrect address would outvote one government registry reporting the correct address. In compliance contexts, data provenance matters more than data prevalence -- an authoritative source should always override multiple low-quality sources.

### Alternative 3: Manual Resolution of All Conflicts
- Why rejected: The volume of entity overlaps across investigations makes fully manual resolution impractical. A single investigation can surface 50-100 entities, and cross-case deduplication multiplies this. Compliance officers are already overloaded with case review; automated resolution for high-confidence matches (>0.85 similarity, >0.02 trust delta) is necessary to keep the workflow manageable.
