---
sidebar_position: 3
title: "Data Flow"
---

# Data Flow

Trust Relay operates as an iterative compliance loop. A single case may go through multiple iterations, each time collecting new documents or responses from the customer and re-evaluating the investigation findings.

## The 8-Step Compliance Loop

```mermaid
sequenceDiagram
    participant Officer as Compliance Officer
    participant Dashboard as Officer Dashboard
    participant API as FastAPI Backend
    participant Temporal as Temporal Workflow
    participant Portal as Customer Portal
    participant Customer as End Customer
    participant Docling as Docling (PDF to MD)
    participant Agents as AI Agents (x7)
    participant Storage as MinIO + PostgreSQL

    Note over Officer,Storage: Step 1 - Case Creation
    Officer->>Dashboard: Create new case
    Dashboard->>API: POST /api/cases
    API->>Temporal: Start ComplianceCaseWorkflow
    API->>Storage: Persist case record
    API-->>Dashboard: Return portal_url + portal_token
    Note right of API: Concurrent pre-enrichment runs here:<br/>VIES + NorthData + Crunchbase<br/>(asyncio.gather, 10s timeout)

    Note over Officer,Storage: Step 2 - Customer Document Upload
    Officer->>Customer: Send portal link
    Customer->>Portal: Open branded portal
    Portal->>API: GET /api/portal/{token}
    API-->>Portal: Return required docs + questions
    Customer->>Portal: Upload documents + answer questions
    Portal->>API: POST /api/portal/{token}/upload
    API->>Storage: Store files in MinIO
    Portal->>API: POST /api/portal/{token}/submit
    API->>Temporal: Signal documents_submitted

    Note over Officer,Storage: Step 3 - Document Processing
    Temporal->>Docling: Activity process_documents
    Docling->>Storage: Convert PDF/DOCX to Markdown
    Note right of Docling: Stored at:<br/>{case_id}/iteration-{n}/{file}.md

    Note over Officer,Storage: Step 4 - Document Validation
    Temporal->>Agents: Activity validate_documents
    Agents->>Storage: Read converted markdown
    Agents-->>Temporal: Validation results (pass/fail per doc)
    Note right of Agents: If required docs fail validation,<br/>auto-generates re-upload tasks<br/>and loops back to Step 2

    Note over Officer,Storage: Step 5 - OSINT Investigation
    Temporal->>Agents: Activity run_osint_investigation
    Note right of Agents: 4 agents run in pipeline:<br/>1. Registry Agent (sequential)<br/>2. Person Validation (parallel)<br/>3. Adverse Media (parallel)<br/>4. Synthesis Agent (sequential)
    Agents->>Storage: Cache agent outputs for reuse
    Agents-->>Temporal: Investigation result + risk score

    Note over Officer,Storage: Step 6 - Classification + Task Generation
    Temporal->>Agents: Activity classify_mcc
    Agents-->>Temporal: MCC code + risk tier
    Temporal->>Agents: Activity generate_follow_up_tasks
    Agents-->>Temporal: AI-suggested follow-up tasks

    Note over Officer,Storage: Step 7 - Officer Review
    Dashboard->>API: GET /api/cases/{id}
    API->>Temporal: Query get_status
    Temporal-->>API: Full case state
    API-->>Dashboard: Investigation results + tasks + risk score

    Note over Officer,Storage: Step 8 - Decision
    Officer->>Dashboard: Approve / Reject / Escalate / Follow-up
    Dashboard->>API: POST /api/cases/{id}/decision
    API->>Temporal: Signal officer_decision

    alt Approved / Rejected / Escalated
        Temporal-->>Storage: Persist final status
        Note right of Temporal: Workflow completes
    else Follow-up Required
        Temporal->>Temporal: Increment iteration
        Note right of Temporal: Loop back to Step 2
    end
```

## Step-by-Step Detail

### Step 1: Case Creation

**Endpoint:** `POST /api/cases`

The officer provides company name, registration number, country, and template selection. The backend:

1. Generates a unique `case_id` and cryptographic `portal_token`
2. Persists the case record to PostgreSQL
3. Starts a `ComplianceCaseWorkflow` in Temporal
4. Runs concurrent pre-enrichment (VIES, NorthData, Crunchbase) via `asyncio.gather` with a 10-second timeout
5. Returns the `portal_url` for the customer

### Step 2: Customer Document Upload

**Endpoints:** `GET /api/portal/{token}`, `POST /api/portal/{token}/upload`, `POST /api/portal/{token}/submit`

The customer opens the branded portal, sees the required document list (driven by the workflow template), uploads files, answers questions, and submits. On submit, the backend sends a `documents_submitted` signal to the Temporal workflow.

### Step 3: Document Processing (Docling)

**Activity:** `process_documents`

Downloads uploaded files from MinIO, converts them to Markdown using IBM Docling, and stores the Markdown back to MinIO alongside the originals. This normalizes PDFs, DOCX, and images into a text format that AI agents can process.

### Step 4: Document Validation

**Activity:** `validate_documents`

An AI agent validates each converted document against its requirement specification. For example, it checks that a file uploaded as "Certificate of Incorporation" actually contains incorporation details. If required documents fail validation, the workflow auto-generates re-upload tasks and loops back to Step 2 without requiring officer intervention.

### Step 5: OSINT Investigation

**Activity:** `run_osint_investigation`

The multi-agent OSINT pipeline runs four agents in a DAG pattern. See [OSINT Pipeline](/docs/architecture/osint-pipeline) for full details. Evidence is collected cumulatively across all iterations.

### Step 6: MCC Classification + Task Generation

**Activities:** `classify_mcc`, `generate_follow_up_tasks`

The MCC classifier assigns a Merchant Category Code based on OSINT findings and company data. The task generator suggests follow-up actions for the officer based on the investigation results and any prior follow-up history.

### Step 7: Officer Review

**Endpoint:** `GET /api/cases/{id}` (triggers Temporal query)

The dashboard displays investigation results, risk score, AI-generated tasks, MCC classification, and the full audit trail. The officer reviews all evidence in a tabbed interface.

### Step 8: Decision

**Endpoint:** `POST /api/cases/{id}/decision`

The officer selects one of four decisions:

| Decision | Effect |
|----------|--------|
| **Approve** | Workflow completes with APPROVED status |
| **Reject** | Workflow completes with REJECTED status |
| **Escalate** | Workflow completes with ESCALATED status (for senior review) |
| **Follow-up** | Workflow loops back to Step 2 with new tasks for the customer |

## Data Organization in MinIO

```
{case_id}/
  iteration-1/
    req_incorporation_cert/
      company_cert.pdf
      company_cert.pdf.md
    req_ubo_declaration/
      ubo_form.pdf
      ubo_form.pdf.md
  iteration-2/
    followup_0/
      additional_doc.pdf
      additional_doc.pdf.md
    task_responses.json
  website_scrape.md
  company_profile.json
  osint_cache/
    registry_output.json
    person_validation_output.json
    adverse_media_output.json
    metadata.json
```

## OSINT Cache Reuse

On iteration 2+, the system checks for cached agent outputs from the previous iteration. If the cache exists and `force_full_investigation` is not set, it skips the three expensive agents (Registry, Person Validation, Adverse Media) and only re-runs Synthesis with the new documents and customer responses. This reduces follow-up investigation time from minutes to seconds.

## Customer Response Threading

When the officer requests follow-up, the customer can respond with text answers alongside document uploads. These responses are stored as `task_responses.json` in the iteration's MinIO prefix. The task generator and synthesis agents both receive prior tasks and customer responses, enabling them to assess whether previously flagged concerns have been addressed.
