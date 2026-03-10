---
id: 0014-neo4j-knowledge-graph
sidebar_position: 15
title: "ADR-0014: Neo4j Knowledge Graph"
---

# ADR-0014: Neo4j Knowledge Graph (CQRS Read Layer)

| | |
|---|---|
| **Date** | 2026-02-25 |
| **Status** | `Implemented` |
| **Deciders** | Adrian Birlogeanu |

## Context

As the number of compliance cases grows, cross-case analysis becomes critical for fraud detection. Questions like "Does this director appear in other cases?" or "Are any of this company's UBOs under sanction across our portfolio?" require traversing entity relationships that span multiple cases.

PostgreSQL can answer these questions with multi-table JOINs, but:
- The queries are complex and slow as the dataset grows
- Relationship traversal (e.g., "find all companies within 3 hops of this person") maps poorly to relational SQL
- Adding new relationship types requires schema changes and query rewrites

The OSINT pipeline already produces richly structured entity data (companies, directors, UBOs, findings, evidence, sanctions, establishments, financial metrics) that naturally forms a graph.

## Decision

Add Neo4j as a **read-only knowledge graph** using a CQRS (Command Query Responsibility Segregation) pattern:

- **PostgreSQL remains the write store**: All case data, audit events, and evidence continue to be written to PostgreSQL. No write paths are modified.
- **Neo4j is populated asynchronously via ETL**: When a case reaches a terminal state (APPROVED/REJECTED), a `GraphETL` service reads case data from PostgreSQL and OSINT results from MinIO, then creates nodes and relationships in Neo4j.
- **Graph operations are optional**: All graph operations are guarded by `neo4j_enabled`. When `False`, every method is a silent no-op. The system functions identically without Neo4j.

### Node types

Company, Person, Finding, Evidence, SanctionMatch, Establishment, FinancialMetric

### Key relationships

HAS_DIRECTOR, HAS_UBO, HAS_ESTABLISHMENT, HAS_FINDING, HAS_EVIDENCE, SANCTIONED, FILED_FINANCIALS, BASED_ON, CONTAGION_FROM

### API endpoints

Four query endpoints under `/api/graph/`: co-directorships, entity-network, risk-propagation, fraud-patterns.

### Agent integration

The synthesis agent receives a graph query tool for cross-case context during risk assessment.

## Consequences

### Positive

- **Cross-case entity analysis**: Co-directorship clusters, sanctioned persons across cases, and risk contagion paths become first-class queries
- **Performance**: Graph traversal queries (N hops) run in milliseconds vs. seconds for equivalent SQL JOINs
- **Non-invasive**: Existing PostgreSQL code is untouched; Neo4j is additive only
- **Graceful degradation**: System works identically when Neo4j is unavailable

### Negative

- **Operational complexity**: Another database to run, back up, and monitor
- **Eventual consistency**: Graph data lags behind PostgreSQL by the ETL delay (seconds to minutes)
- **No transactions across stores**: Cannot atomically write to both PostgreSQL and Neo4j

### Neutral

- Neo4j Community Edition is sufficient (no enterprise features needed for PoC)
- Docker Compose adds one service; production deployment adds one more managed database

## Alternatives Considered

1. **PostgreSQL recursive CTEs**: Could handle graph-like queries but with poor performance and complex SQL
2. **Apache AGE (PostgreSQL extension)**: Graph extension for PostgreSQL, but less mature ecosystem and tooling than Neo4j
3. **In-memory graph (NetworkX)**: Simple but no persistence, no scalability, no Cypher query language
4. **Skip graph entirely**: Delay cross-case analysis to a future phase. Rejected because the data model is already graph-shaped and the value for fraud detection is high.
