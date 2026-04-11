---
id: 0025-network-intelligence-hub
sidebar_position: 26
title: "ADR-0025: Network Intelligence Hub"
---

# ADR-0025: Network Intelligence Hub with ReactFlow Three-Perspective Visualization

**Date:** 2026-03-30 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

AML/CFT investigations require visualizing entity networks to surface beneficial ownership chains, transaction flows, and regulatory flags across cases. Compliance officers need to answer three distinct investigative questions: who owns what (ownership hierarchy), who connects to whom (network relationships), and what happened when (investigation timeline). Static PDF reports and tabular data cannot convey multi-hop relationships, and investigators frequently miss indirect connections that are only visible in a graph layout.

The existing case detail dashboard presents investigation results as structured text and tables. While sufficient for single-entity review, it fails when the investigation reveals a web of 20+ related entities with cross-ownership, shared directors, and layered shell company structures. Officers reported spending significant time mentally reconstructing network topology from flat data.

The visualization must embed natively in the Next.js dashboard -- not in a separate tool or window -- so officers can reference network context while reviewing case details, evidence, and audit logs without losing their place.

## Decision

We build a Network Intelligence Hub using ReactFlow (xyflow) with three perspective tabs, each offering a distinct graph layout optimized for its investigative purpose:

### 1. Network Graph (Force-Directed Layout)
- BFS (breadth-first search) subgraph isolation starting from the investigation target entity
- Force-directed layout with configurable repulsion and link distance for readable node spacing
- Risk glyph badges on nodes: sanctions (red shield), PEP (purple crown), adverse media (orange warning)
- Edge types encode relationship semantics: ownership (solid), directorship (dashed), transaction (dotted)
- Click-to-expand for lazy loading of second-hop and third-hop connections

### 2. Ownership Tree (Hierarchical Layout)
- Top-down hierarchical layout showing ultimate beneficial ownership chains
- OFAC 50% rule edge coloring: edges are colored by cumulative ownership percentage, with red highlighting when indirect ownership exceeds the 50% threshold
- Collapsible subtrees for complex corporate structures
- UBO nodes highlighted with distinct styling when they cross the 25% beneficial ownership threshold (EU AMLD)

### 3. Investigation Flow (Temporal Layout)
- Left-to-right temporal sequencing of case events and investigation milestones
- Nodes represent investigation activities (document upload, OSINT query, officer decision)
- Edges encode causal relationships between investigation steps

The hub comprises 22 React components with a shared TypeScript type system. Custom `RiskEnrichedNode` and `IntelligentEdge` component types extend ReactFlow's base types with compliance-specific data (risk scores, evidence references, source provenance).

## Consequences

### Positive
- Three perspectives address three distinct investigative workflows without forcing officers to switch between tools
- ReactFlow provides built-in zoom, pan, minimap, and keyboard navigation, reducing custom interaction code
- Risk glyph badges surface sanctions/PEP/adverse media flags directly in the graph, eliminating the need to cross-reference separate lists
- OFAC 50% rule visualization makes indirect ownership threshold violations immediately visible, which is the most commonly missed finding in manual reviews
- BFS subgraph isolation prevents rendering the entire entity graph, keeping the visualization focused and performant

### Negative
- 22 components represent a significant frontend surface area to maintain -- changes to the graph data model ripple across multiple components
- ReactFlow's bundle size (~150KB gzipped) adds to initial page load for the dashboard route
- Force-directed layout is non-deterministic -- the same graph renders differently each time, which can confuse officers comparing screenshots across sessions
- Complex corporate structures with 50+ nodes still produce cluttered visualizations despite force-directed spacing

### Neutral
- The hub loads graph data from the Neo4j-backed `/api/graph/` endpoints, creating a runtime dependency on the graph ETL pipeline having processed the case
- All three perspectives share the same underlying graph data but apply different layout algorithms and visual encodings
- The component architecture follows the same shadcn/ui + Tailwind pattern as the rest of the dashboard

## Alternatives Considered

### Alternative 1: D3.js Force Graph
- Why rejected: D3.js provides a lower-level API that requires significantly more boilerplate to achieve the same result. Zoom, pan, minimap, and node interaction all need manual implementation. ReactFlow provides these out of the box with a React-idiomatic component model, reducing development time by an estimated 60% for equivalent functionality.

### Alternative 2: Neo4j Browser / Bloom Visualization
- Why rejected: Neo4j Browser and Bloom are standalone tools that cannot be embedded in the Next.js dashboard. They require a direct Neo4j connection (which is optional in our deployment), offer no custom node types for compliance-specific risk glyphs, and cannot integrate with the case detail tabs, evidence panel, and audit log that officers need during review.

### Alternative 3: Static SVG/PDF Export
- Why rejected: Static visualizations lose all interactivity -- officers cannot drill down into entities, expand subgraphs, filter by risk type, or toggle between perspectives. For networks with more than 15 entities, static layouts become unreadable. Real-time investigation requires real-time interaction with the graph.
