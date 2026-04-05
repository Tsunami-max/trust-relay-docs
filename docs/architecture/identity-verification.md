---
sidebar_position: 41
title: "Identity Verification"
description: "KYC identity verification, eID integration, screening, and power of attorney classification"
components:
  - app/services/identity_verification.py
  - app/services/eid_easy_service.py
  - app/services/kyc_screening.py
  - app/services/poa_classifier.py
last_verified: 2026-03-30
status: implemented
---

# Identity Verification

Identity verification services for KYC compliance covering document-based identity checks, eID Easy integration for electronic identity verification, person screening against watchlists, and power of attorney document classification.

## Components

| Module | Purpose |
|--------|---------|
| `identity_verification.py` | Core identity verification orchestration |
| `eid_easy_service.py` | eID Easy API integration for electronic identity verification |
| `kyc_screening.py` | KYC screening against PEP lists and adverse media |
| `poa_classifier.py` | Power of attorney document classification and validation |
