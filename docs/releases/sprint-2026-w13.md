---
title: "Sprint W13 — Mar 21–28, 2026"
sidebar_label: "W13 (Mar 21–28)"
---

# Sprint W13 Release Notes

**Period:** Saturday March 21 – Friday March 28, 2026
**Commits:** 79 (41 features, 26 fixes)
**Dev effort:** ~14h (1 architect + Claude Opus)

---

## Business Impact

Investigation quality took a step-change improvement. Seven automated verification tools now run as part of every investigation — sanctions, Interpol, FATF, email security, consumer reviews, and more — producing findings that previously required manual research across separate systems. Financial data from four additional countries means officers get a complete financial picture for Norwegian, Romanian, Slovak, and Dutch entities without leaving the platform.

## Key Deliverables

### 7 Automated Verification Tools
OpenSanctions screening, FATF jurisdiction risk, email security (DMARC/SPF), Wayback Machine availability history, consumer review sentiment, Interpol red notice check, and virtual office detection now run automatically on every investigation. Each tool produces structured findings with source attribution — every flag is traceable to the external source that triggered it.

### Financial Data from 4 More Countries
Country-specific financial scrapers for Norway (Brreg), Romania (ANAF), Slovakia (RUZ), and the Netherlands (KvK) extend the platform's financial intelligence coverage. Officers investigating cross-border entities get domestic-source financial data rather than relying solely on self-reported information.

### Website Auto-Discovery
The platform now discovers a company's web presence automatically via Tavily before running web-based checks. Officers no longer need to manually enter a URL — the investigation starts from registry data alone and resolves the digital footprint as part of the pipeline.

### Super-Admin Tenant Impersonation
Platform administrators can impersonate any tenant for support and debugging — with a full audit trail. Every impersonation session is logged so there is no ambiguity about who accessed what data and when.

### S4U Development Methodology Published
The methodology that built this platform — the subagent-driven development workflow, quality gates, and AI collaboration patterns — is now documented in Docusaurus and publicly accessible. This sprint is notable not just for what it added to the product but for externalising the practice that produced it.

## Metrics

| Metric | Value |
|--------|-------|
| Commits | 79 |
| Features shipped | 41 |
| Fixes | 26 |
| Dev effort | ~14h |
| Automated verification tools | 7 |
| New country financial scrapers | 4 |
| National AML regulation PDFs fetched | 5 (DK, NL, BE, CZ, DE) |

## What We Learned

At 14 hours of effort, this sprint delivered 7 verification tools and 4 country integrations — evidence that the marginal cost of adding intelligence sources drops sharply once the pipeline architecture is stable. The platform is shifting from construction to compounding.
