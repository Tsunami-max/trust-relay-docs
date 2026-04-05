---
sidebar_position: 37
title: "Entity Resolution"
description: "Entity matching, survivorship rules, company profile building, and GLEIF LEI resolution"
components:
  - app/services/entity_matcher.py
  - app/services/survivorship.py
  - app/services/company_profile_service.py
  - app/services/gleif_service.py
last_verified: 2026-03-30
status: implemented
---

# Entity Resolution

Entity resolution pipeline that matches, merges, and enriches entity records from multiple data sources. Implements survivorship rules to determine which source wins for each field, builds unified company profiles, and resolves Legal Entity Identifiers (LEI) via GLEIF.

## Components

| Module | Purpose |
|--------|---------|
| `entity_matcher.py` | Multi-source entity matching with configurable similarity thresholds |
| `survivorship.py` | Survivorship rules determining field-level source priority in merged records |
| `company_profile_service.py` | Unified company profile construction from merged entity data |
| `gleif_service.py` | GLEIF API integration for LEI lookup and validation |
