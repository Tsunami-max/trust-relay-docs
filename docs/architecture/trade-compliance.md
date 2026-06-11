---
sidebar_position: 40
title: "Trade Compliance"
description: "Customs shipment classification, LLM extraction, cross-reference rule engine, and trade profile aggregation"
components:
  - app/services/shipment_classifier.py
  - app/services/shipment_extractor.py
  - app/services/shipment_cross_reference.py
  - app/services/trade_profile_builder.py
last_verified: 2026-06-11
status: implemented
---

# Trade Compliance

Trade compliance services for the customs fiscal-representative workflow: classifying uploaded shipping documents, extracting structured data from them, running a cross-reference rule engine against the onboarding trade profile, and aggregating the declared trade profile from onboarding responses.

## Components

| Module | Purpose |
|--------|---------|
| `shipment_classifier.py` | Classifies an uploaded shipment document into one of 10 known customs document types using a PydanticAI LLM call, and orchestrates batch classification (`ShipmentDocumentClassifier`) |
| `shipment_extractor.py` | Dispatches per-document extraction to type-specific LLM prompts, returning structured dicts matching the per-document Pydantic extraction models (`ShipmentDataExtractor`) |
| `shipment_cross_reference.py` | Executes 10 compliance rules per shipment, comparing extracted data against `fiscal_rep_data` and the declared `TradeProfile`; each rule returns a `CrossRefFinding` or `None` (`ShipmentCrossReferenceEngine`) |
| `trade_profile_builder.py` | Pure data aggregation (no AI, no external calls) — builds a `TradeProfile` from template responses collected during fiscal-rep onboarding (`TradeProfileBuilder`) |

## Sanctioned-Country Inputs

The cross-reference rules consult the shared sanctioned/high-risk country sets defined in `app/services/sanctions_constants.py` (EU Council Regulation 833/2014, UN consolidated list, OFAC SDN informational). See [Sanctions Screening](./sanctions-screening.md).

## API

`app/api/shipments.py` — create a shipment (triggers classification + extraction + cross-reference), list shipments, fetch a shipment, and record an officer decision.
