---
sidebar_position: 13
title: "Agent Registry API"
---

# Agent Registry API

Pillar 3.5 endpoints for the Agent Registry. The registry maintains manifests for all OSINT investigation agents, including their jurisdictions, capabilities, information gain domains, and tool inventories. These endpoints support the EVOI (Expected Value of Investigation) system by exposing which agents are available for a given country and risk domain. All routes are under the `/agents/` prefix.

## Endpoints Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/agents` | List all registered agent manifests |
| `GET` | `/agents/team` | Get investigation team for a jurisdiction |
| `GET` | `/agents/{name}` | Get a single agent manifest |

---

## List All Agents

```
GET /agents
```

Returns all registered agent manifests. Each manifest describes an agent's name, supported jurisdictions, information gain domains, required tools, and capabilities.

**Response** `200`

```json
[
  {
    "name": "belgian_kbo_agent",
    "display_name": "Belgian KBO Agent",
    "jurisdictions": ["BE"],
    "information_gain_domains": ["company_registration", "legal_form", "directors"],
    "tools": ["kbo_scraper"],
    "description": "Scrapes the Belgian Crossroads Bank for Enterprises"
  }
]
```

---

## Get Investigation Team

```
GET /agents/team
```

Returns the set of agents that should participate in an investigation for a given country and (optionally) risk domains. When `domains` is provided, the EVOI system selects agents whose `information_gain_domains` overlap with the requested domains. When omitted, all agents for the jurisdiction are returned.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `country` | string | Yes | ISO country code (e.g., `BE`, `NL`, `DE`) |
| `domains` | string | No | Comma-separated list of information gain domains to match |

**Response** `200`

```json
[
  {
    "name": "belgian_kbo_agent",
    "display_name": "Belgian KBO Agent",
    "jurisdictions": ["BE"],
    "information_gain_domains": ["company_registration", "legal_form", "directors"],
    "tools": ["kbo_scraper"],
    "description": "Scrapes the Belgian Crossroads Bank for Enterprises"
  },
  {
    "name": "belgian_nbb_agent",
    "display_name": "Belgian NBB Agent",
    "jurisdictions": ["BE"],
    "information_gain_domains": ["financial_health", "annual_accounts"],
    "tools": ["nbb_api"],
    "description": "Retrieves financial data from the National Bank of Belgium"
  }
]
```

---

## Get Agent Manifest

```
GET /agents/{name}
```

Returns the full manifest for a single agent by its registered name.

**Path Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Agent name as registered in the registry |

**Response** `200`

Returns the complete agent manifest object.

**Status Codes:**

- `200` -- Success
- `404` -- Agent not found
