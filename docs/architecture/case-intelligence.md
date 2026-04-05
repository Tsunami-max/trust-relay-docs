---
sidebar_position: 10
title: Case Intelligence
description: AI-driven Decision Support Panel that synthesizes similar cases, applicable rules, and officer corrections into actionable intelligence
components:
  - app/agents/case_intelligence_agent.py
last_verified: 2026-03-29
status: implemented
---

# Case Intelligence

The Case Intelligence system provides **AI-driven decision support** on the Overview tab of every compliance case. It replaces raw memory data with a synthesized assessment that compares the current case against organizational precedent.

## Architecture Overview

```mermaid
graph TB
    subgraph Frontend["Frontend — Overview Tab"]
        CIC[CaseIntelligenceCard]
        AS[AssessmentSection]
        SC[SimilarCasesSection]
        RS[RulesSection]
        CS[CorrectionsSection]
        CIC --> AS
        CIC --> SC
        CIC --> RS
        CIC --> CS
    end

    subgraph API["FastAPI Backend"]
        EP["GET /api/cases/{wf}/case-intelligence"]
        BG[BackgroundTasks]
        EP --> BG
    end

    subgraph Services["Service Layer"]
        CIA[CaseIntelligenceAgent<br/>PydanticAI]
        LPS[LettaPolicyService]
        DB[(PostgreSQL<br/>cases + audit_events)]
    end

    subgraph Cache["Caching Layer"]
        IC[intelligence_cache<br/>JSONB on cases table]
    end

    CIC -->|useQuery + polling| EP
    EP -->|similar cases| LPS
    EP -->|rules| LPS
    EP -->|corrections| DB
    EP -->|cached assessment| IC
    BG -->|lazy generation| CIA
    CIA -->|structured output| IC
    LPS -->|archival search| Letta[(Letta Server)]
    LPS -->|enrichment JOIN| DB

    style CIA fill:#7c3aed,color:#fff
    style CIC fill:#2563eb,color:#fff
    style IC fill:#059669,color:#fff
```

## Four Information Streams

The endpoint aggregates four distinct information streams into a single response:

```mermaid
graph LR
    subgraph "1. AI Assessment"
        direction TB
        A1[PydanticAI Agent]
        A2[Structured Output:<br/>pattern, summary,<br/>key differences,<br/>confidence]
        A1 --> A2
    end

    subgraph "2. Similar Cases"
        direction TB
        B1[Letta Archival Search]
        B2[PostgreSQL Enrichment]
        B3[Real company names,<br/>outcomes, risk scores]
        B1 --> B2 --> B3
    end

    subgraph "3. Applicable Rules"
        direction TB
        C1[Letta learned_procedures]
        C2[Scope Filtering<br/>by country + template]
        C3[auto-learned vs<br/>officer-taught]
        C1 --> C2 --> C3
    end

    subgraph "4. Officer Corrections"
        direction TB
        D1[signal_events table]
        D2[finding_confirmed /<br/>finding_rejected]
        D3[With FindingAnalysis<br/>join]
        D1 --> D2 --> D3
    end

    style A1 fill:#7c3aed,color:#fff
    style B1 fill:#2563eb,color:#fff
    style C1 fill:#059669,color:#fff
    style D1 fill:#dc2626,color:#fff
```

## Lazy Assessment Generation

The AI assessment uses a **lazy generation** pattern to avoid blocking the API response:

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as FastAPI
    participant Cache as intelligence_cache
    participant BG as BackgroundTask
    participant Agent as PydanticAI Agent
    participant LLM as GPT-5.2

    FE->>API: GET /case-intelligence
    API->>Cache: Check intelligence_cache

    alt Cache Hit (ready)
        Cache-->>API: Cached assessment
        API-->>FE: assessment_status: "ready"
    else Cache Miss
        API->>BG: Start background generation
        API-->>FE: assessment_status: "generating"

        BG->>Agent: run_case_intelligence(deps)
        Agent->>LLM: Structured output request
        LLM-->>Agent: CaseIntelligenceResult
        Agent->>Cache: Store result + model_id + prompt_id

        Note over FE: Polls every 2s (max 15 times)
        FE->>API: GET /case-intelligence
        API->>Cache: Check intelligence_cache
        Cache-->>API: Cached assessment
        API-->>FE: assessment_status: "ready"
    else Cache Failed
        FE->>API: GET /case-intelligence?retry=true
        API->>Cache: Clear failed cache
        API->>BG: Re-trigger generation
        API-->>FE: assessment_status: "generating"
    end
```

## Cache Invalidation

The intelligence cache is automatically cleared when new data arrives that could change the assessment:

```mermaid
graph TD
    INV[intelligence_cache = NULL]

    D1[Officer Decision<br/>approve / reject / follow-up] -->|case_decisions.py<br/>submit_decision| INV
    D2[Finding Feedback<br/>confirm / reject finding] -->|case_decisions.py<br/>submit_finding_feedback| INV
    D3[New Documents<br/>iteration starts] -->|activities.py<br/>process_documents| INV
    D4[Manual Re-analyze<br/>officer clicks refresh] -->|?retry=true| INV

    INV -->|Next GET request| RG[Re-generates assessment<br/>via BackgroundTask]

    style INV fill:#dc2626,color:#fff
    style RG fill:#7c3aed,color:#fff
```

## Similar Cases Enrichment

The similar cases pipeline uses a two-stage approach — Letta for semantic similarity, PostgreSQL for enrichment:

```mermaid
graph TB
    subgraph "Stage 1: Similarity Search"
        L1[Letta archival_memory.search]
        L2[Extract case_ids from<br/>passage metadata]
        L3[Build similarity_score map]
        L1 --> L2 --> L3
    end

    subgraph "Stage 2: PostgreSQL Enrichment"
        P1[Query cases table<br/>by case_ids]
        P2[Query audit_events<br/>for outcomes]
        P3[Extract risk_score from<br/>confidence_score JSONB]
        P1 --> P2 --> P3
    end

    subgraph "Fallback"
        F1[No Letta results?]
        F2[Query by country +<br/>template_id instead]
        F1 --> F2
    end

    L3 --> P1
    L3 -.->|guard-and-swallow| F1
    F2 --> P2

    P3 --> OUT[Top 5 similar cases<br/>sorted by similarity]

    style L1 fill:#7c3aed,color:#fff
    style P1 fill:#2563eb,color:#fff
    style F1 fill:#f59e0b,color:#fff
```

## Structured Output

The PydanticAI agent produces a validated structured output:

```python
class CaseIntelligenceResult(BaseModel):
    summary: str           # 2-4 sentence assessment
    pattern: Literal["approved", "rejected", "mixed", "insufficient"]
    key_differences: list[str]  # Max 3
    assessment_confidence: float  # 0-1
    similar_count: int
    approved_count: int
```

**Key constraint:** The agent is instructed to **never recommend a decision** — it only surfaces evidence and patterns. This satisfies EU AI Act Article 14 (human oversight for high-risk AI systems).

## EU AI Act Compliance (Art. 12)

Every cached assessment includes traceability metadata:

| Field | Purpose |
|-------|---------|
| `model_id` | Which LLM produced the assessment (e.g., `openai:gpt-5.2`) |
| `prompt_id` | Which prompt version was used (e.g., `case_intelligence_v1`) |
| `generated_at` | ISO timestamp of generation |

This ensures every AI-driven assessment is fully traceable, retrievable, and auditable — a non-negotiable architectural constraint.

## Frontend Component

The `CaseIntelligenceCard` uses **progressive disclosure** — collapsed by default with a summary line:

```
🧠 Case Intelligence · 4 similar cases · 3 approved · AI learning (85%)
```

When expanded, four sections render sequentially:

1. **AI Assessment** — pattern badge, summary prose, key differences, refresh button
2. **Similar Cases** — clickable rows with company name, outcome badge, deep links
3. **Rules Applied** — collapsible rules with auto-learned vs officer-taught distinction
4. **Your Corrections** — finding confirmations/rejections (hidden when empty)

## API Endpoint

```
GET /api/cases/{workflow_id}/case-intelligence
GET /api/cases/{workflow_id}/case-intelligence?retry=true
```

See [Case Intelligence API](/docs/api/case-intelligence) for the full response schema.
