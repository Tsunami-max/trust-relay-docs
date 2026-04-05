---
sidebar_position: 34
title: "PEPPOL Verification"
description: "PEPPOL directory verification, VAT (VIES) validation, and EORI number checks for EU trade compliance"
components:
  - app/services/peppol_directory_service.py
  - app/services/peppol_persistence_service.py
  - app/services/peppol_verification_service.py
  - app/services/vies_service.py
  - app/services/eori_service.py
last_verified: 2026-03-30
status: implemented
---

# PEPPOL Verification

PEPPOL (Pan-European Public Procurement On-Line) directory verification combined with EU VAT validation (VIES) and EORI number checks. These services verify that entities are legitimate participants in European trade networks.

## Components

| Module | Purpose |
|--------|---------|
| `peppol_directory_service.py` | PEPPOL directory lookups for registered participants |
| `peppol_persistence_service.py` | Caching and persistence of PEPPOL verification results |
| `peppol_verification_service.py` | Orchestrated PEPPOL verification workflow |
| `vies_service.py` | EU VAT Information Exchange System validation |
| `eori_service.py` | Economic Operators Registration and Identification number verification |
