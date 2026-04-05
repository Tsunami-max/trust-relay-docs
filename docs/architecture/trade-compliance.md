---
sidebar_position: 40
title: "Trade Compliance"
description: "Shipment classification, cross-referencing, extraction, and trade profile analysis"
components:
  - app/services/shipment_classifier.py
  - app/services/shipment_cross_reference.py
  - app/services/shipment_extractor.py
  - app/services/trade_profile_builder.py
last_verified: 2026-03-30
status: implemented
---

# Trade Compliance

Trade compliance services for analyzing shipment data, classifying goods against sanctioned categories, cross-referencing trade patterns, and building entity trade profiles. Supports detection of dual-use goods, sanctioned trade routes, and anomalous shipping patterns.

## Components

| Module | Purpose |
|--------|---------|
| `shipment_classifier.py` | Goods classification against sanctioned and dual-use categories |
| `shipment_cross_reference.py` | Cross-referencing shipments against known risk patterns |
| `shipment_extractor.py` | Structured data extraction from shipping documents |
| `trade_profile_builder.py` | Entity trade profile construction from historical shipment data |
