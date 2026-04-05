---
title: "Sprint W12 — Mar 14–21, 2026"
sidebar_label: "W12 (Mar 14–21)"
---

# Sprint W12 Release Notes

**Period:** Saturday March 14 – Friday March 21, 2026
**Commits:** 473 (226 features, 171 fixes)
**Dev effort:** ~87h (1 architect + Claude Opus) — highest intensity sprint to date

---

## Business Impact

The platform expanded from a single compliance vertical into a multi-vertical, multi-tenant SaaS product. Three independent compliance use cases — PSP merchant KYB, precious metals tax compliance, and customs fiscal representation — now run on the same platform with full tenant isolation. Automated goAML reporting for five EU countries removes weeks of manual SAR preparation from a compliance team's annual workload.

## Key Deliverables

### Precious Metals Compliance Module (Goud999)
A complete tax compliance module for precious metals dealers: FIFO transaction register, gain/loss calculator, 6-factor risk classification, and a tax capsule ready for submission. iDIN identity verification is integrated for Dutch customer identification. This is a self-contained compliance product within the platform — 33 tests ship with it.

### Customs Fiscal Representation (Toogi)
Jurisdiction-conditional document requirements, officer document upload, and service-scoped compliance templates for customs fiscal representatives. The system presents only the document checklist applicable to the jurisdiction, eliminating confusion for officers managing multi-country client portfolios.

### Multi-Tenant Isolation
Every graph endpoint, ETL pipeline, and graph service operation is now scoped to a tenant. Data from one client organisation is structurally inaccessible to another — not just by access control, but by query design. The platform is production-ready for a multi-enterprise deployment.

### goAML Export — 5 EU Countries
SAR-ready goAML XML exports are generated automatically for Belgium, Germany, France, Luxembourg, and the Netherlands. What previously required a compliance officer to hand-craft an XML file from case notes is now a one-click export at the end of any investigation that warrants reporting.

### Lex Regulatory Knowledge Base
Seven national AML laws (BE, CZ, DE, DK, EE, FI, NL) have been ingested and indexed. The AI can now cite specific legislative articles when explaining a risk finding, giving officers the regulatory basis they need to defend a decision at audit or in court.

## Metrics

| Metric | Value |
|--------|-------|
| Commits | 473 |
| Features shipped | 226 |
| Fixes | 171 |
| Dev effort | ~87h |
| Compliance verticals | 3 (KYB, precious metals, customs) |
| goAML countries covered | 5 |
| AML laws ingested | 7 |
| Precious metals module tests | 33 |

## What We Learned

Platform expansion is dramatically cheaper when the core investigation loop is correctly abstracted — adding a new compliance vertical (Goud999, Toogi) required only vertical-specific configuration, not a separate codebase, validating the multi-tenant architecture investment from W9.
