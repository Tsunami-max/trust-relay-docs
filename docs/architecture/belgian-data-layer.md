---
sidebar_position: 33
title: "Belgian Data Layer"
description: "Belgian-specific data services: KBO/CBE registry, NBB financial data, inhoudingsplicht, and Belgian eID validation"
components:
  - app/services/belgian_data_service.py
  - app/services/belgian_evidence_service.py
  - app/services/kbo_service.py
  - app/services/nbb_service.py
  - app/services/inhoudingsplicht_service.py
  - app/services/document_validators/belgian_eid.py
last_verified: 2026-03-30
status: implemented
---

# Belgian Data Layer

Belgium-specific data services providing KBO/CBE company registry lookups, NBB financial health data, inhoudingsplicht (withholding obligation) checks, and Belgian electronic identity card validation. These services form the primary-source evidence layer for Belgian entity investigations.

## Components

| Module | Purpose |
|--------|---------|
| `kbo_service.py` | KBO/CBE registry API integration for company data, directors, establishments |
| `nbb_service.py` | National Bank of Belgium financial data retrieval |
| `belgian_data_service.py` | Aggregated Belgian data orchestration across KBO, NBB, and related sources |
| `belgian_evidence_service.py` | Evidence collection and structuring for Belgian entity investigations |
| `inhoudingsplicht_service.py` | Tax and social security withholding obligation verification |
| `document_validators/belgian_eid.py` | Belgian electronic identity card document validation |
