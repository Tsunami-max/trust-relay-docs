---
id: 0012-hybrid-scraping
sidebar_position: 13
title: "ADR-0012: Hybrid Scraping"
---

# ADR-0012: Hybrid Scraping Tool Selection

| | |
|---|---|
| **Date** | 2026-01-15 |
| **Status** | `Implemented` |
| **Deciders** | Adrian Birlogeanu |

## Context

Belgian OSINT investigation requires data from multiple sources (KBO, Gazette, NBB, Notary, Inhoudingsplicht), each with different access patterns.

## Decision

Use hybrid scraping strategy -- choose the best tool per data source rather than one-size-fits-all.

## Tool Selection

| Source | Tool | Rationale |
|--------|------|-----------|
| KBO (Crossroads Bank) | Custom scraper | Structured HTML, stable format |
| Belgian Gazette | crawl4ai | Dynamic content, JS rendering |
| NBB (National Bank) | REST API | Official API available |
| Notary directory | BrightData MCP | Anti-bot protection |
| Inhoudingsplicht | crawl4ai + PEPPOL | Semi-structured government pages |

## Consequences

- Multiple scraping dependencies to maintain
- Per-source error handling required
- Mock mode for each source in development
