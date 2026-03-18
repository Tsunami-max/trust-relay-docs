---
sidebar_position: 7
title: VLAIO Development Project
description: Intelligent Ingestion of Compliance Procedures and Automated Workflow Orchestration — Atlas Project
---

# VLAIO Development Project

**Intelligent Ingestion of Compliance Procedures and Automated Workflow Orchestration**

This development project builds a fundamentally new capability into the Atlas platform: the ability to **analyze, interpret, and transform unstructured compliance documents into executable digital workflows** — orchestrated through a durable, auditable workflow engine with human review gates and knowledge graph context.

## Innovation Thesis

```mermaid
graph TB
    subgraph "What Exists Today"
        A1["Static Workflow Tools<br/><i>Manual rule configuration</i><br/>⚠️ Time-consuming, error-prone"]
        A2["AI Assistants<br/><i>Generic regulatory summaries</i><br/>⚠️ No executable output"]
    end

    subgraph "What Atlas Delivers"
        B1["📄 Compliance Document"]
        B2["🧠 Semantic Interpretation<br/><i>NLU for regulatory texts</i>"]
        B3["🔀 CPIR<br/><i>Intermediate Representation</i>"]
        B4["⚙️ Temporal Workflow<br/><i>Executable, auditable</i>"]
        B5["🔍 Knowledge Graph Context<br/><i>Entity-aware path selection</i>"]
        B6["✅ Human Review Gates<br/><i>Officer validates ambiguities</i>"]

        B1 --> B2 --> B3 --> B4
        B5 --> B4
        B6 --> B4
    end

    subgraph "Result"
        C1["Automated Compliance Process<br/>with complete audit trail"]
    end

    B4 --> C1

    style B2 fill:#7c3aed,color:#fff
    style B3 fill:#2563eb,color:#fff
    style B4 fill:#059669,color:#fff
    style C1 fill:#f59e0b,color:#000
```

**No player in the market** — neither LexisNexis, Moody's, ComplyAdvantage, Dotfile, nor Vespia — currently offers an end-to-end system that automatically ingests compliance documents, interprets them, and converts them into orchestrated workflows with complete audit trails and human review gates.

## Work Package Architecture

```mermaid
gantt
    title VLAIO Project Timeline (12 Months)
    dateFormat  YYYY-MM
    axisFormat  %b %Y

    section WP1: Regulatory Analysis
    Regulatory corpus construction    :wp1a, 2026-04, 2M
    RAG pipeline + chunking           :wp1b, 2026-05, 2M
    Extraction models                 :wp1c, 2026-06, 2M
    Validation layer                  :wp1d, 2026-07, 1M
    M1: 85% extraction accuracy       :milestone, m1, 2026-08, 0d

    section WP2: Workflow Generation
    CPIR design                       :wp2a, 2026-06, 2M
    Code generator                    :wp2b, 2026-08, 3M
    Formal verification               :wp2c, 2026-09, 2M
    Human review gates                :wp2d, 2026-10, 1M
    M2: Working prototype             :milestone, m2, 2026-11, 0d

    section WP3: Graph Integration
    Procedural ontologies             :wp3a, 2026-09, 2M
    Real-time graph queries           :wp3b, 2026-10, 2M
    Dynamic path determination        :wp3c, 2026-11, 2M
    M3: Context-aware orchestration   :milestone, m3, 2027-01, 0d

    section WP4: Validation
    Pilot testing (2 customers)       :wp4a, 2026-12, 3M
    Performance optimization          :wp4b, 2027-01, 2M
    Documentation                     :wp4c, 2027-02, 1M
    M4: Market-ready                  :milestone, m4, 2027-03, 0d
```

## WP1: Regulatory Document Analysis Engine

**Objective:** AI-driven extraction of structured compliance logic from unstructured documents.

```mermaid
graph TB
    subgraph Input["Input Documents"]
        D1["AML/CFT Policies"]
        D2["KYC Procedures"]
        D3["Sanctions Protocols"]
        D4["EU Directive Texts"]
    end

    subgraph Pipeline["Extraction Pipeline"]
        R1["Regulatory Chunker<br/><i>hierarchy-aware, cross-ref resolution</i>"]
        R2["Conditional Logic Extractor<br/><i>'if X, unless Y, except Z'</i>"]
        R3["Temporal Obligation Parser<br/><i>deadlines, refresh cycles</i>"]
        R4["Escalation Criteria Detector<br/><i>threshold triggers, chains</i>"]
        R5["Jurisdiction Variation Mapper<br/><i>BE vs NL vs DE rules</i>"]
    end

    subgraph Validation["Validation Layer"]
        V1["Deterministic Hallucination<br/>Detection"]
        V2["Completeness Checker<br/><i>missing branches, dead ends</i>"]
        V3["Cross-Reference Resolver<br/><i>links between regulations</i>"]
    end

    subgraph Output["Structured Output"]
        O1["Procedure Tree<br/><i>conditional steps, decision points</i>"]
    end

    D1 & D2 & D3 & D4 --> R1
    R1 --> R2 & R3 & R4 & R5
    R2 & R3 & R4 & R5 --> V1 & V2 & V3
    V1 & V2 & V3 --> O1

    style R1 fill:#7c3aed,color:#fff
    style V1 fill:#dc2626,color:#fff
    style O1 fill:#059669,color:#fff
```

**Foundation already built:** The [Lex Regulatory Knowledge Layer](/docs/architecture/lex-regulatory-knowledge) provides the ingestion infrastructure — EUR-Lex CELLAR fetcher, hierarchy-aware parser, context-prefixed chunker, PgVector hybrid search. WP1 extends this from *reference text* to *procedure extraction*.

**Milestone M1 (Month 4):** ≥85% accuracy on an annotated test corpus of 3+ compliance document categories.

## WP2: Workflow Generation and Formal Verification

**Objective:** Translation of extracted procedure logic into executable, verifiable Temporal workflows.

```mermaid
graph LR
    subgraph "Extraction (WP1)"
        PT[Procedure Tree]
    end

    subgraph "CPIR"
        IR["Compliance Procedure<br/>Intermediate Representation"]
        IR1["Steps + Conditions"]
        IR2["Decision Points"]
        IR3["Escalation Rules"]
        IR4["Temporal Obligations"]
        IR --> IR1 & IR2 & IR3 & IR4
    end

    subgraph "Generation"
        CG["Code Generator"]
        TW["Temporal Workflow<br/>Definition"]
        AT["Audit Trail<br/>Integration"]
        RL["Retry Logic +<br/>Compensation"]
        CG --> TW & AT & RL
    end

    subgraph "Verification"
        FV["Formal Verification"]
        FV1["Completeness:<br/>all paths terminate"]
        FV2["Conformity:<br/>matches source procedure"]
        FV3["Safety:<br/>no risk suppression"]
        FV --> FV1 & FV2 & FV3
    end

    subgraph "Review"
        HG["Human Review Gates<br/><i>ambiguities + gaps</i>"]
    end

    PT --> IR
    IR --> CG
    TW --> FV
    FV --> HG
    HG -->|"Officer resolves<br/>ambiguities"| TW

    style IR fill:#2563eb,color:#fff
    style CG fill:#7c3aed,color:#fff
    style FV fill:#dc2626,color:#fff
    style HG fill:#059669,color:#fff
```

**Foundation already built:** Atlas's [Temporal workflow engine](/docs/architecture/temporal-workflows), [editable workflow templates](/docs/architecture/platform-foundation), and the [Governance Engine](/docs/architecture/agentic-os)'s deterministic safety checks provide the execution platform. WP2 adds *generation* on top of *execution*.

**Milestone M2 (Month 8):** Working prototype converting a compliance document into an executable workflow.

## WP3: Knowledge Graph Integration

**Objective:** Context-aware workflow execution via the Neo4j knowledge graph.

```mermaid
graph TB
    subgraph "Procedural Ontology Extension"
        PO1["Procedure Nodes<br/><i>which procedure applies</i>"]
        PO2["Step Nodes<br/><i>individual actions</i>"]
        PO3["Condition Edges<br/><i>if/unless/when</i>"]
        PO4["Jurisdiction Variants<br/><i>BE vs NL vs DE</i>"]
        PO5["Entity-Type Mappings<br/><i>BV vs GmbH vs SRL</i>"]
    end

    subgraph "Runtime Graph Queries"
        GQ1["Entity Risk Profile<br/><i>from prior investigations</i>"]
        GQ2["Relationship Networks<br/><i>shared directors, ownership</i>"]
        GQ3["Historical Outcomes<br/><i>similar entity patterns</i>"]
    end

    subgraph "Dynamic Path Selection"
        DP["Workflow selects procedure path<br/>based on graph context"]
    end

    subgraph "Feedback Loop"
        FB["Results synchronized<br/>back to knowledge graph"]
    end

    PO1 & PO2 & PO3 & PO4 & PO5 --> DP
    GQ1 & GQ2 & GQ3 --> DP
    DP --> FB
    FB -->|"future reference"| GQ1

    style DP fill:#7c3aed,color:#fff
    style FB fill:#059669,color:#fff
```

**Foundation already built:** Atlas's [Neo4j knowledge graph](/docs/architecture/knowledge-graph) with 18 node types, 5 structural motif detectors, bi-temporal entity tracking, and the [EVOI engine](/docs/architecture/evoi-engine) for depth optimization. WP3 adds *procedural reasoning* to *entity intelligence*.

**Milestone M3 (Month 10):** Dynamic procedure path selection based on entity data from the knowledge graph.

## Technical Challenges (R&D)

| Challenge | Why It's Hard | Atlas Advantage |
|---|---|---|
| **Semantic interpretation of regulatory text** | Nested conditionals, implicit obligations, jurisdiction-dependent variations | Lex pipeline + 8 EU regulations already parsed |
| **Correct workflow generation** | Ambiguities, incomplete specs, implicit knowledge — errors cause regulatory violations | Temporal engine + formal verification + human review gates |
| **Context-aware graph orchestration** | Real-time graph queries during execution with latency constraints | Neo4j + EVOI depth optimization already operational |
| **Hallucination mitigation** | LLMs fabricate procedure steps that don't exist in the source | CitationVerifier (deterministic, no LLM) already deployed |

## Regulatory Alignment

This project directly addresses upcoming regulatory deadlines:

```mermaid
timeline
    title Regulatory Deadlines Driving the Project
    August 2026 : EU AI Act high-risk enforcement
                : EUR 35M / 7% turnover penalties
    July 2027   : AMLR full application
                : CDD becomes structured dataset
                : AMLD6 member state transposition
    2028        : AMLA direct supervision
                : 40 high-risk institutions
                : CSDDD transposition
```

## From Atlas Foundation to VLAIO Innovation

```mermaid
graph TB
    subgraph "Existing Atlas Foundation"
        F1["18+ AI Agents<br/>8-column pipeline DAG"]
        F2["Temporal Workflow Engine<br/>durable, resumable"]
        F3["Neo4j Knowledge Graph<br/>18 node types, 5 motifs"]
        F4["Lex Regulatory Corpus<br/>8 EU regulations"]
        F5["Governance Engine<br/>deterministic, zero LLM"]
        F6["Evidence Architecture<br/>SHA-256, Trust Capsules"]
        F7["Prompt Management<br/>20 versioned prompts"]
        F8["Case Intelligence<br/>decision support"]
    end

    subgraph "VLAIO Innovation Layer"
        V1["WP1: Procedure Extraction<br/>from unstructured documents"]
        V2["WP2: Workflow Generation<br/>+ formal verification"]
        V3["WP3: Graph-Driven<br/>context-aware orchestration"]
        V4["WP4: Pilot Validation<br/>2+ customers"]
    end

    subgraph "Market Result"
        MR["First-to-market:<br/>Document → Executable Workflow<br/>with full audit trail"]
    end

    F4 -->|"Pipeline infrastructure"| V1
    F2 -->|"Execution platform"| V2
    F5 -->|"Safety constraints"| V2
    F3 -->|"Entity context"| V3
    F8 -->|"Historical patterns"| V3
    F6 -->|"Evidence format"| V4
    F1 -->|"Investigation agents"| V4

    V1 & V2 & V3 & V4 --> MR

    style MR fill:#059669,color:#fff
    style V1 fill:#7c3aed,color:#fff
    style V2 fill:#2563eb,color:#fff
    style V3 fill:#f59e0b,color:#000
```

## Economic Impact in Flanders

**Direct employment** — specialized developers and researchers during the project, structural growth post-completion.

**Revenue growth** — Atlas evolves from point-investigation tool to full compliance orchestration platform, increasing revenue per customer substantially.

**Export potential** — European regulatory harmonisation creates a pan-European market. First-mover from Flanders.

**Ecosystem strengthening** — demonstrates Flanders as a competitive location for advanced AI in financial services.

**Societal impact** — strengthens the financial supervisory system, improves working conditions for compliance professionals, promotes European digital sovereignty.
