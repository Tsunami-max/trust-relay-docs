---
sidebar_position: 35
title: "Sanctions Screening"
description: "Sanctions list management, feed ingestion, and entity matching for AML compliance"
components:
  - app/services/sanctions_constants.py
  - app/services/sanctions_feed_service.py
  - app/services/sanctions_matcher_service.py
last_verified: 2026-03-30
status: implemented
---

# Sanctions Screening

Sanctions screening infrastructure for matching entities against international sanctions lists. Covers feed ingestion from OpenSanctions and other sources, normalized matching with configurable thresholds, and structured result output for compliance decisions.

## Components

| Module | Purpose |
|--------|---------|
| `sanctions_constants.py` | Sanctions list identifiers, matching thresholds, and configuration constants |
| `sanctions_feed_service.py` | Ingestion and update of sanctions list data feeds |
| `sanctions_matcher_service.py` | Entity matching against sanctions lists with fuzzy and exact matching |
