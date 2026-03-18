---
sidebar_position: 12
title: Prompt Management
description: Centralized prompt versioning with Jinja2 templates, DB-backed storage, admin API, and EU AI Act traceability
---

# Prompt Management

Atlas uses 20 AI agent prompts across 16 agent files. The Prompt Management system centralizes these prompts with **version control**, **DB-backed storage**, and **EU AI Act traceability** — every AI output is linked to the exact prompt version that produced it.

## Architecture Evolution

```mermaid
graph LR
    subgraph "Phase 1: Filesystem Templates"
        T1[".jinja2 files<br/>in app/prompts/templates/"]
        R1[PromptRegistry<br/>singleton, YAML frontmatter]
        A1[Agent files<br/>thin wrappers]
        T1 --> R1 --> A1
    end

    subgraph "Phase 2a: DB-Backed (Current)"
        DB[(prompt_versions<br/>PostgreSQL)]
        R2[PromptRegistry<br/>DB-first, FS fallback]
        AE[AgentExecution<br/>+ prompt_version_id FK]
        API[Admin API<br/>/api/admin/prompts]
        DB --> R2
        R2 --> AE
        API --> DB
    end

    subgraph "Phase 3: Super Admin UI (Future)"
        UI[Prompt Editor UI<br/>diff view, A/B testing]
        VH[Version History<br/>with performance metrics]
        UI --> DB
        VH --> DB
    end

    Phase1 --> Phase2a --> Phase3

    style DB fill:#2563eb,color:#fff
    style R2 fill:#7c3aed,color:#fff
    style AE fill:#059669,color:#fff
```

## Prompt Registry

The `PromptRegistry` singleton manages all 20 prompts with a layered loading strategy:

```mermaid
graph TD
    REQ[Agent requests prompt<br/>registry.render'synthesis_agent']

    REQ --> DB_CHECK{DB has active<br/>version?}
    DB_CHECK -->|Yes| DB_LOAD[Load from prompt_versions<br/>table]
    DB_CHECK -->|No| FS_CHECK{Filesystem<br/>.jinja2 exists?}
    FS_CHECK -->|Yes| FS_LOAD[Load from<br/>app/prompts/templates/]
    FS_CHECK -->|No| ERROR[PromptNotFoundError]

    DB_LOAD --> RENDER[Jinja2 render<br/>with variables]
    FS_LOAD --> RENDER

    RENDER --> HASH[SHA-256<br/>content_hash]
    HASH --> CACHE[TTL cache<br/>60s refresh]
    CACHE --> OUT[RenderedPrompt<br/>+ prompt_version_id]

    OUT --> CV[Contextvar propagation<br/>to AgentExecution]

    style DB_LOAD fill:#2563eb,color:#fff
    style FS_LOAD fill:#f59e0b,color:#000
    style CV fill:#059669,color:#fff
```

## Prompt Inventory (20 Prompts)

| # | Prompt Name | Agent | Domain |
|---|---|---|---|
| 1 | `synthesis_agent` | SynthesisAgent | Investigation analysis |
| 2 | `portal_investigation` | PortalInvestigationAgent | Customer portal scan |
| 3 | `scan_agent` | ScanAgent | Document scanning |
| 4 | `task_generator` | TaskGeneratorAgent | Follow-up task creation |
| 5 | `document_validation` | DocumentValidationAgent | Doc quality check |
| 6 | `mcc_classifier` | MccClassificationAgent | Merchant categorization |
| 7 | `inhoudingsplicht` | InhoudingspichtAgent | Belgian tax/social debt |
| 8 | `company_profile` | CompanyProfileAgent | Entity profiling |
| 9 | `financial_health` | FinancialHealthAgent | Financial analysis |
| 10 | `belgian_evidence` | BelgianEvidenceAgent | BE data collection |
| 11 | `risk_assessment` | RiskAssessmentAgent | Risk scoring |
| 12 | `finding_debugger` | FindingDebuggerAgent | Signal analysis |
| 13 | `case_intelligence` | CaseIntelligenceAgent | Decision support |
| 14 | `copilot_system` | CopilotRuntime | Copilot behavior |
| 15 | `copilot_case_analysis` | CopilotRuntime | Case-specific tools |
| 16 | `copilot_regulatory` | CopilotRuntime | Regulatory domain |
| 17 | `copilot_memory` | CopilotRuntime | Memory domain |
| 18 | `copilot_entity` | CopilotRuntime | Entity intelligence |
| 19 | `report_generator` | ReportService | KYB report |
| 20 | `regulatory_knowledge` | RegulatoryKnowledgeTool | Lex queries |

## Database Model

```mermaid
erDiagram
    prompt_versions ||--o{ agent_executions : "traced by"

    prompt_versions {
        int id PK "auto-increment"
        varchar name "e.g. synthesis_agent"
        varchar agent "e.g. SynthesisAgent"
        text description
        int version_number "append-only"
        varchar status "active|draft|archived"
        text template_body "Jinja2 template"
        jsonb variables "expected vars list"
        varchar content_hash "SHA-256"
        varchar created_by "officer sub"
        timestamptz created_at
        timestamptz status_changed_at
    }

    agent_executions {
        uuid id PK
        int prompt_version_id FK "NEW — traceability"
        varchar agent_name
        varchar model_id
        text input_summary
        text output_summary
        float duration_ms
        uuid tenant_id FK
        timestamptz created_at
    }
```

**Key constraints:**
- `UNIQUE(name, version_number)` — no duplicate versions
- Partial unique index: only one `active` version per prompt name
- `status IN ('active', 'draft', 'archived')` — check constraint
- **Immutable rows** — once created, template_body never changes (append-only pattern)

## EU AI Act Traceability

Every AI agent execution now links to the exact prompt version that produced it:

```mermaid
sequenceDiagram
    participant Agent as PydanticAI Agent
    participant Reg as PromptRegistry
    participant DB as prompt_versions
    participant CV as Contextvar
    participant AE as AgentExecution

    Agent->>Reg: registry.render("synthesis_agent", vars)
    Reg->>DB: SELECT ... WHERE name='synthesis_agent' AND status='active'
    DB-->>Reg: PromptVersion(id=42, v3, hash=a3f8b2...)
    Reg->>CV: Set prompt_version_id = 42
    Reg-->>Agent: RenderedPrompt(text, version_id=42, hash)

    Note over Agent: Agent runs with rendered prompt

    Agent->>AE: Record execution
    AE->>CV: Read prompt_version_id
    AE->>DB: INSERT agent_executions(prompt_version_id=42, ...)

    Note over AE: Auditor can trace:<br/>execution → prompt v3 → template body
```

This satisfies **EU AI Act Article 12** (automatic logging) — every AI output is traceable to the exact prompt text, model, and input that produced it.

## Admin API

```
GET    /api/admin/prompts                    # List all prompts with active versions
GET    /api/admin/prompts/{name}             # Get prompt with version history
GET    /api/admin/prompts/{name}/versions    # List all versions
POST   /api/admin/prompts/{name}/versions    # Create new version (draft)
PUT    /api/admin/prompts/{name}/activate    # Activate a version (deactivates previous)
PUT    /api/admin/prompts/{name}/archive     # Archive a version
```

**Authorization:** `admin` or `compliance_manager` roles only.

## Jinja2 Template Format

Templates use Jinja2 with YAML frontmatter:

```jinja2
---
name: synthesis_agent
version: 3
agent: SynthesisAgent
description: Main synthesis prompt for investigation analysis
variables:
  - company_name
  - country
  - risk_context
  - regulatory_context
---
You are a compliance investigation analyst for {{ company_name }}.
Country: {{ country }}

{% if risk_context %}
Risk context from prior investigations:
{{ risk_context }}
{% endif %}

{% if regulatory_context %}
Applicable regulations:
{{ regulatory_context | truncate_items(5) }}
{% endif %}
```

**Custom Jinja2 filters:** `truncate_items(n)`, `format_date`, `join_bullets` — domain-specific formatting for compliance prompts.

## Parity Testing

Every prompt migration from inline strings to templates includes a **parity test** that proves zero behavioral change:

```python
def test_synthesis_agent_prompt_parity():
    """Template renders identically to the original inline prompt."""
    original = _get_original_inline_prompt()
    rendered = registry.render("synthesis_agent", test_vars)
    assert rendered.text.strip() == original.strip()
```

20 parity tests — one per prompt — ensure the migration is invisible to the AI agents.
