---
sidebar_position: 22
title: "Verification Tools"
description: "Seven point-in-time verification tools for sanctions, jurisdiction, email security, web presence, and reputation checks"
components:
  - app/services/verification/opensanctions.py
  - app/services/verification/opensanctions_bulk.py
  - app/services/verification/jurisdiction_risk.py
  - app/services/verification/email_security.py
  - app/services/verification/wayback_history.py
  - app/services/verification/consumer_reviews.py
  - app/services/verification/interpol_notices.py
  - app/services/verification/virtual_office.py
  - app/services/verification/models.py
tests:
  - tests/test_verification_tools.py
last_verified: 2026-03-29
status: implemented
---

# Verification Tools

Trust Relay includes seven verification tools that perform targeted, point-in-time checks during OSINT investigation. Three are deterministic tools that always run as part of the standard pipeline. Four are LLM-available tools that the AI agent can invoke when the investigation context warrants it.

All seven tools return a `VerificationResult`:

```python
class VerificationResult(BaseModel):
    tool: str                   # tool identifier, e.g. "open_sanctions"
    status: str                 # "clear", "hit", "warning", "error", "unknown"
    summary: str                # human-readable one-line summary
    details: dict               # structured tool-specific data
    source_url: str | None      # canonical source URL for evidence attribution
    confidence: float           # 0.0–1.0 confidence in the result
```

The `VerificationResult` feeds into the confidence scoring engine (Pillar 1) and the findings list presented to the officer.

---

## Always-Run (Deterministic) Tools

These three tools execute for every entity regardless of EVOI score or agent selection, because their checks are low-cost and the compliance value is unconditional.

### 1. OpenSanctions

**File**: `backend/app/services/verification/open_sanctions.py`

OpenSanctions maintains a consolidated dataset of sanctioned entities, politically exposed persons (PEPs), and wanted individuals sourced from 300+ official lists worldwide.

| Metric | Value |
|---|---|
| Total entities | ~831,000 |
| Sanctioned entities | ~71,000 |
| PEPs | ~700,000 |
| Wanted persons | ~64,000 |
| Data source | Local bulk download (Parquet/JSON), refreshed on schedule |
| Storage | PostgreSQL with `pg_trgm` extension for fuzzy text search |

#### Matching Strategy

The tool uses a **dual matching strategy** to balance precision and recall:

1. **Trigram similarity** (`pg_trgm` `similarity()` function) — catches name variations, transliterations, and misspellings. Threshold: 0.7 similarity score.
2. **Substring containment** — detects cases where the query name is contained within a longer entity name (e.g., searching "Bolloré" matches "Bolloré Transport & Logistics SA"). Threshold: 0.8 containment ratio.

A match on either strategy is returned as a hit. Results are ranked by combined score and capped at the top 10 matches to avoid overwhelming the investigation result.

#### Auto-Refresh Schedule

| Dataset | Refresh Frequency |
|---|---|
| Sanctions lists | Daily (00:00 UTC) |
| PEPs | Weekly (Sunday 01:00 UTC) |

Refresh is handled by a background Temporal schedule activity that downloads the latest bulk export, loads it into a staging table, and atomically swaps it with the live table.

#### Diacritics Normalization

Before matching, both the query name and stored entity names are normalized using Unicode NFKD decomposition to strip diacritical marks. This ensures "Müller" matches "Muller" and "François" matches "Francois". Director names from NorthData are also normalized before being passed to the tool, enabling fuzzy matching across transliterated name variants.

---

### 2. Jurisdiction Risk

**File**: `backend/app/services/verification/jurisdiction_risk.py`

A static lookup that classifies a country's risk level based on authoritative financial crime watchlists.

| List | Source | Update Frequency |
|---|---|---|
| FATF Grey List | Financial Action Task Force (FATF) | Quarterly (FATF plenary sessions) |
| FATF Black List | High-Risk Jurisdictions subject to a Call for Action | Quarterly |
| EU High-Risk Third Countries | European Commission Delegated Regulation | Periodic Commission updates |

Risk classification output:

| Classification | Meaning |
|---|---|
| `LOW` | Not on any watchlist |
| `MEDIUM` | EU high-risk but not FATF listed |
| `HIGH` | FATF Grey List |
| `CRITICAL` | FATF Black List |

The tool evaluates jurisdiction risk for: (1) the entity's country of incorporation, (2) the registered address country, and (3) each director's nationality where known. The highest classification across all evaluated countries determines the finding severity.

This tool is entirely deterministic — no API calls, no LLM inference. The watchlist data is hardcoded as a module-level dictionary and updated by the engineering team when official lists change.

---

### 3. Email Security

**File**: `backend/app/services/verification/email_security.py`

Validates the email security posture of the entity's declared domain by checking three DNS record types using `dnspython`.

| Record | Check | Pass Condition |
|---|---|---|
| **SPF** | `TXT` record at apex domain | Record exists and contains `v=spf1` |
| **DKIM** | `TXT` record at `default._domainkey.{domain}` | Record exists and contains `v=DKIM1` |
| **DMARC** | `TXT` record at `_dmarc.{domain}` | Record exists and contains `v=DMARC1` |

A domain with none of these records is associated with a higher likelihood of domain spoofing and phishing, which is a risk indicator for shell companies and fraudulent operators. A MEDIUM severity finding is generated when all three are missing; LOW when one or two are present.

The tool also checks whether the domain is a free provider (Gmail, Outlook, Yahoo, etc.). A regulated business using a free email domain generates a LOW severity finding.

---

## LLM-Available Tools

These four tools are registered in the AI agent's tool manifest but are invoked selectively by the LLM based on investigation context. They are more expensive (latency or rate limits) and are reserved for cases where they add clear investigative value.

### 4. Wayback Machine

**File**: `backend/app/services/verification/wayback_machine.py`

Queries the Internet Archive CDX (Capture/Display/Access) API to retrieve the capture history of the entity's website.

**API**: `https://web.archive.org/cdx/search/cdx?url={domain}&output=json&limit=100&fl=timestamp,statuscode`

| Output field | Description |
|---|---|
| `first_capture` | Date of the earliest recorded capture |
| `last_capture` | Date of the most recent capture |
| `capture_count` | Total number of captures in the archive |
| `domain_age_years` | Derived from first_capture date |

A domain registered very recently (< 6 months) with no Wayback captures is a strong indicator of a newly-created entity — a risk pattern in KYB investigations. The tool generates a HIGH severity finding for domains under 3 months old and MEDIUM for domains under 12 months.

The tool is invoked by the LLM agent when the investigation includes a business website and the registry data shows a recently incorporated company.

---

### 5. Consumer Reviews

**File**: `backend/app/services/verification/consumer_reviews.py`

Searches Trustpilot for consumer reviews of the entity to assess public reputation and detect complaint patterns.

**API**: Trustpilot public search API (`https://www.trustpilot.com/search?query={company_name}`)

| Output field | Description |
|---|---|
| `trustpilot_score` | Star rating (1–5) |
| `review_count` | Number of reviews |
| `trust_level` | Trustpilot's own classification (Excellent/Great/Average/Poor/Bad) |
| `top_complaints` | Common complaint themes extracted from recent reviews |

A very low score (< 2.0) or a high volume of fraud-related complaints generates a MEDIUM severity finding. The tool is invoked when the entity operates in a consumer-facing sector (retail, financial services, property).

---

### 6. Interpol Red Notices

**File**: `backend/app/services/verification/interpol_notices.py`

Queries the public Interpol API for Red Notices (international wanted persons alerts) matching director names associated with the entity.

**API**: `https://ws-public.interpol.int/notices/v1/red?name={surname}&forename={forename}&resultPerPage=20`

| Output field | Description |
|---|---|
| `notices_found` | Number of matching Red Notices |
| `matched_names` | List of matched person names with notice IDs |
| `nationalities` | Nationalities listed in matched notices |
| `charges` | Summary of alleged offences |

A Red Notice match generates a CRITICAL severity finding and immediately sets `p_critical` in the EVOI belief state, triggering full pipeline execution regardless of other EVOI scores.

The tool is invoked when person validation surfaces names of natural persons who are directors or UBOs, particularly for high-risk jurisdictions.

:::caution Interpol public API limitations
The public Interpol API returns only unclassified notices and may not reflect the full Interpol database. A "clear" result does not constitute a comprehensive Interpol check. Compliance officers should treat this tool as an initial screening layer.
:::

---

### 7. Virtual Office Detection

**File**: `backend/app/services/verification/virtual_office.py`

Detects whether the entity's registered address is associated with a virtual office, mail forwarding, or co-working provider — a common characteristic of shell companies.

Detection uses two approaches:

1. **Pattern matching** against a curated list of known virtual office and registered agent providers. The list includes major providers (Regus, WeWork, IWG, Spaces, HQ) as well as national registered agent companies for BE, NL, LU, UK, IE, and CY.
2. **Address normalization** — the registered address is compared against the provider list after stripping floor/unit references. A match on street name and postal code is sufficient to flag the address.

| Finding severity | Condition |
|---|---|
| HIGH | Address exactly matches a known virtual office provider |
| MEDIUM | Address pattern matches a co-working provider |
| LOW | Address is a PO Box or c/o address |

The tool is invoked when the entity's registered address is in a jurisdiction known for high shell company density (LU, CY, MT, BVI, Cayman) or when the address matches a co-working space postcode cluster.

---

## Tool Registry

All verification tools are registered in `backend/app/services/verification/__init__.py` and exposed via the `VerificationToolRegistry`:

```python
ALWAYS_RUN_TOOLS = [
    OpenSanctionsTool(),
    JurisdictionRiskTool(),
    EmailSecurityTool(),
]

LLM_AVAILABLE_TOOLS = [
    WaybackMachineTool(),
    ConsumerReviewsTool(),
    InterpolNoticesTool(),
    VirtualOfficeTool(),
]
```

The registry is consumed by the OSINT agent to assemble the tool manifest passed to the LLM on each investigation run.

---

## Evidence Attribution

Every `VerificationResult` includes a `source_url` pointing to the canonical source (e.g., the specific OpenSanctions entity page, the Wayback Machine capture, or the Interpol notice URL). This URL is stored in the `tool_audit_events` table alongside the full result payload, creating a complete evidence chain for regulatory audit purposes.
