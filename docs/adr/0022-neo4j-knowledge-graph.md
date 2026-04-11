---
id: 0022-neo4j-knowledge-graph
sidebar_position: 23
title: "ADR-0022: Neo4j Knowledge Graph"
---

# ADR-0022: Neo4j Knowledge Graph with 20-Step ETL Pipeline

**Date:** 2026-02-25 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Trust Relay stores case data in PostgreSQL, where each case is an isolated row with its own findings, directors, UBOs, and risk assessment. This per-case isolation is correct for transactional integrity but creates a blind spot: fraud networks, shell company structures, and director overlaps span multiple cases. A director who appears in 3 rejected cases is a critical risk signal that is invisible when each case is examined independently.

Detecting cross-case patterns requires traversing relationships: "Find all companies that share a director with Company X, then find all companies that share an address with those companies." In SQL, this is a multi-hop JOIN that scales poorly -- each hop adds a JOIN, and the query planner cannot efficiently optimize variable-depth traversals. For a 3-hop query across 10,000 cases with 50,000 director relationships, PostgreSQL recursive CTEs exhibit O(n^3) worst-case behavior.

Graph databases are purpose-built for this access pattern. Neo4j's Cypher query language expresses multi-hop traversals naturally, and its storage engine is optimized for relationship-heavy queries. However, adding Neo4j as a required dependency would complicate single-machine development setups and small deployments that do not need cross-case intelligence.

## Decision

We implement an optional Neo4j knowledge graph populated by a 20-step sequential ETL pipeline (`graph_etl.py`) that runs as a post-processing step when a case reaches a terminal state (APPROVED, REJECTED, or ESCALATED).

**Graph schema -- nodes:**
- `Company` -- enterprise number, name, legal form, jurisdiction, incorporation date
- `Director` -- name, birth date (when available), nationality, role (director, UBO, authorized representative)
- `UBO` -- name, ownership percentage, control type (direct, indirect)
- `Address` -- street, city, postal code, country (normalized and geocoded)
- `RegulatoryFinding` -- finding type, severity, source, date discovered

**Graph schema -- relationships:**
- `(:Company)-[:HAS_DIRECTOR]->(:Director)` -- with role, start date, end date
- `(:Company)-[:HAS_UBO]->(:UBO)` -- with ownership percentage, control chain
- `(:Company)-[:LOCATED_AT]->(:Address)` -- with address type (registered, operational)
- `(:Director)-[:ALSO_DIRECTOR_OF]->(:Company)` -- cross-case link, auto-derived
- `(:Company)-[:SHARES_ADDRESS_WITH]->(:Company)` -- cross-case link, auto-derived
- `(:Company)-[:HAS_FINDING]->(:RegulatoryFinding)` -- with case reference

**Temporal validity:** All relationships carry `valid_from` and `valid_to` properties, enabling point-in-time queries ("Who were the directors of Company X on 2025-06-15?").

**Standards references:** Node and relationship properties reference applicable standards:
- GLEIF LEI-CDF v3.1 for legal entity identification
- ISO 20275 for legal entity forms
- EU-AMLR for beneficial ownership thresholds
- BODS 0.4 for ownership and control structures

**20-step ETL pipeline** (`graph_etl.py`):
Steps 1-5: Extract and normalize company data from case findings
Steps 6-10: Extract and deduplicate directors and UBOs (using entity matcher with blocking keys)
Steps 11-14: Extract and geocode addresses
Steps 15-17: Create cross-case relationships (shared directors, shared addresses)
Steps 18-19: Compute derived properties (network centrality, cluster membership)
Step 20: Update graph metadata (last ETL run, case count, relationship statistics)

**Optional deployment:** Neo4j is disabled by default (`neo4j_enabled=False` in configuration). The ETL pipeline checks this flag before execution and silently skips when disabled. The Network Intelligence Hub in the frontend gracefully degrades -- it shows a message indicating that graph features require Neo4j rather than crashing.

## Consequences

### Positive
- Cross-case pattern detection becomes a first-class capability -- "Show me all companies connected to rejected cases within 2 hops" is a single Cypher query
- Temporal validity on relationships enables historical investigation -- regulators can ask about the state of a network at any past date
- Standards-referenced properties ensure interoperability with other compliance systems and regulatory reporting formats
- Optional deployment means single-machine dev setups and small customers are not burdened with Neo4j infrastructure
- The 20-step sequential pipeline is deterministic and idempotent -- re-running it on the same case produces the same graph state

### Negative
- Neo4j adds operational complexity for deployments that use it -- backup, monitoring, version upgrades, and memory tuning
- The ETL pipeline runs post-completion, so graph data is not available during active investigation (only after case reaches terminal state)
- Entity deduplication across cases is heuristic-based (name similarity + date of birth matching) -- false positives (merging distinct people with similar names) and false negatives (missing matches due to name variants) are possible
- 20 sequential steps mean ETL takes 5-15 seconds per case, which is acceptable for post-processing but would be too slow for real-time updates

### Neutral
- The graph schema is additive -- it never modifies PostgreSQL data, only reads from it
- Graph data can be fully reconstructed from PostgreSQL at any time by re-running the ETL pipeline across all terminal cases
- The Network Intelligence Hub (22 frontend components) depends on graph endpoints but degrades gracefully when Neo4j is disabled

## Alternatives Considered

### Alternative 1: PostgreSQL recursive CTEs for network analysis
- Why rejected: Recursive CTEs can express multi-hop traversals but with poor performance characteristics. A 3-hop traversal across 10,000 companies with 50,000 relationships produces intermediate result sets that grow exponentially. Testing showed a 3-hop "shared director" query taking 12 seconds in PostgreSQL vs. 50ms in Neo4j. Additionally, SQL lacks native graph algorithms (PageRank, community detection, shortest path) that are available as Neo4j procedures.

### Alternative 2: Real-time graph population during investigation
- Why rejected: Populating the graph during active investigation adds 2-5 seconds of latency to each case state transition. Since officers do not use the Network Intelligence Hub during active investigation (they use it during review or for strategic analysis), there is no benefit to real-time updates. Post-processing on case completion avoids impacting the critical investigation path.

### Alternative 3: Mandatory Neo4j deployment
- Why rejected: Many Trust Relay deployments -- especially development environments, demos, and small financial institutions -- do not need cross-case network analysis. Requiring Neo4j for all deployments increases infrastructure cost and operational complexity without proportional benefit. The optional deployment model lets customers adopt graph features when they have enough cases to make cross-case analysis valuable (typically 50+ completed cases).
